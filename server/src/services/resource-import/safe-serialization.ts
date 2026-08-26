export type ResourceImportSanitizationOptions = {
  sensitiveKeys?: readonly string[];
  secretValues?: readonly (string | null | undefined)[];
};

const normalizeResourceImportKey = (key: string) => key.toLowerCase().replace(/[^a-z0-9]/g, '');

const getKnownSecretValues = (options: ResourceImportSanitizationOptions = {}) => [
  ...new Set(
    (options.secretValues ?? [])
      .filter((value): value is string => typeof value === 'string' && value.length > 0 && value !== '***')
      .flatMap((value) => [value, encodeURIComponent(value)])
  )
].sort((left, right) => right.length - left.length);

const redactKnownSecretValues = (value: string, options: ResourceImportSanitizationOptions = {}) =>
  getKnownSecretValues(options).reduce((safeValue, secret) => safeValue.split(secret).join('***'), value);

export const isSensitiveResourceImportKey = (
  key: string,
  options: ResourceImportSanitizationOptions = {}
): boolean => {
  const normalized = normalizeResourceImportKey(key);
  const explicitSensitiveKeys = (options.sensitiveKeys ?? []).map(normalizeResourceImportKey);
  if (explicitSensitiveKeys.includes(normalized)) return true;

  return [
    'key',
    'apikey',
    'appkey',
    'accesskey',
    'token',
    'accesstoken',
    'secret',
    'signature',
    'sign',
    'authorization',
    'cookie',
    'setcookie',
    'session',
    'sessionid',
    'csrf',
    'xsrf',
    'password',
    'credential'
  ].some((name) => normalized === name || normalized.endsWith(name));
};

const redactLooseQueryValues = (value: string, options: ResourceImportSanitizationOptions) => value.replace(
  /([?&]([^=&\s]+)=)([^&#\s]*)/gu,
  (match, prefix: string, key: string) => isSensitiveResourceImportKey(key, options) ? `${prefix}***` : match
);

export const sanitizeResourceImportUrl = (
  value: string,
  options: ResourceImportSanitizationOptions = {}
): string => {
  try {
    const url = new URL(value);
    url.searchParams.forEach((item, key) => {
      if (isSensitiveResourceImportKey(key, options)) {
        url.searchParams.set(key, '***');
        return;
      }
      const redactedValue = redactKnownSecretValues(item, options);
      if (redactedValue !== item) url.searchParams.set(key, redactedValue);
    });
    return redactKnownSecretValues(url.toString(), options);
  } catch {
    return redactLooseQueryValues(redactKnownSecretValues(value, options), options);
  }
};

export const sanitizeResourceImportValue = (
  value: unknown,
  options: ResourceImportSanitizationOptions = {}
): unknown => {
  if (typeof value === 'string') {
    const redactedValue = redactKnownSecretValues(value, options);
    return /^https?:\/\//iu.test(redactedValue)
      ? sanitizeResourceImportUrl(redactedValue, options)
      : redactedValue;
  }
  if (Array.isArray(value)) return value.map((item) => sanitizeResourceImportValue(item, options));
  if (!value || typeof value !== 'object') return value;

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, item]) => [
      key,
      isSensitiveResourceImportKey(key, options) ? '***' : sanitizeResourceImportValue(item, options)
    ])
  );
};

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const sanitizeResourceImportError = (
  value: string,
  options: ResourceImportSanitizationOptions = {}
): string => {
  const withSafeUrls = value.replace(
    /https?:\/\/[^\s'"）)]+/giu,
    (url) => sanitizeResourceImportUrl(url, options)
  );
  const withKnownAssignments = (options.sensitiveKeys ?? []).reduce(
    (safeValue, key) => safeValue.replace(
      new RegExp(`(${escapeRegExp(key)}\\s*[=:]\\s*['"]?)[^\\s,;:'"]+`, 'giu'),
      '$1***'
    ),
    withSafeUrls
  );
  return redactKnownSecretValues(withKnownAssignments.replace(
    /((?:api[_-]?key|app[_-]?key|access[_-]?key|access[_-]?token|token|secret|signature|sign|authorization|cookie|set[_-]?cookie|session(?:[_-]?id)?|csrf|xsrf|password|credential)\s*[=:]\s*['"]?)[^\s,;:'"]+/giu,
    '$1***'
  ), options);
};

export const restoreRedactedResourceImportUrl = (
  incoming: string,
  existing: string,
  options: ResourceImportSanitizationOptions = {}
): string => {
  try {
    const incomingUrl = new URL(incoming);
    const existingUrl = new URL(existing);
    incomingUrl.searchParams.forEach((value, key) => {
      const existingValue = existingUrl.searchParams.get(key);
      if (value === '***' && isSensitiveResourceImportKey(key, options) && existingValue !== null) {
        incomingUrl.searchParams.set(key, existingValue);
      }
    });
    return incomingUrl.toString();
  } catch {
    return incoming;
  }
};

export const buildSafeRequestSnapshot = (
  method: string,
  endpointUrl: string,
  dataPath: string,
  params: Record<string, unknown>,
  sourceName: string | null,
  options: ResourceImportSanitizationOptions = {}
) => ({
  method,
  endpointUrl: sanitizeResourceImportUrl(endpointUrl, options),
  dataPath,
  params: sanitizeResourceImportValue(params, options) as Record<string, unknown>,
  sourceName
});
