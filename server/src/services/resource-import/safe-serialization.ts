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

const isKnownSecretValue = (value: string, options: ResourceImportSanitizationOptions = {}) =>
  getKnownSecretValues(options).includes(value);

const MIN_PATH_SECRET_LENGTH = 8;

const redactKnownSecretPathSegments = (
  url: URL,
  options: ResourceImportSanitizationOptions
) => {
  const pathSecrets = getKnownSecretValues(options).filter((secret) => secret.length >= MIN_PATH_SECRET_LENGTH);
  if (pathSecrets.length === 0) return;

  let changed = false;
  const safeSegments = url.pathname.split('/').map((segment) => {
    let decodedSegment = segment;
    try {
      decodedSegment = decodeURIComponent(segment);
    } catch {
      return segment;
    }
    if (!pathSecrets.includes(decodedSegment)) return segment;
    changed = true;
    return '***';
  });
  if (changed) url.pathname = safeSegments.join('/');
};

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const redactBoundedKnownSecretValues = (
  value: string,
  options: ResourceImportSanitizationOptions = {}
) => getKnownSecretValues(options)
  .filter((secret) => secret.length >= 4)
  .reduce(
    (safeValue, secret) => safeValue.replace(
      new RegExp(`(^|[^\\p{L}\\p{N}_])${escapeRegExp(secret)}(?=$|[^\\p{L}\\p{N}_])`, 'gu'),
      '$1***'
    ),
    value
  );

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
    redactKnownSecretPathSegments(url, options);
    url.searchParams.forEach((_item, key) => {
      if (isSensitiveResourceImportKey(key, options)) {
        url.searchParams.set(key, '***');
      }
    });
    return url.toString();
  } catch {
    return redactLooseQueryValues(value, options);
  }
};

export const sanitizeResourceImportValue = (
  value: unknown,
  options: ResourceImportSanitizationOptions = {}
): unknown => {
  if (typeof value === 'string') {
    if (isKnownSecretValue(value, options)) return '***';
    return /^https?:\/\//iu.test(value)
      ? sanitizeResourceImportUrl(value, options)
      : value;
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

export const sanitizeResourceImportError = (
  value: string,
  options: ResourceImportSanitizationOptions = {}
): string => {
  const safeUrls: string[] = [];
  const withUrlPlaceholders = value.replace(
    /https?:\/\/[^\s'"）)]+/giu,
    (url) => {
      const index = safeUrls.push(sanitizeResourceImportUrl(url, options)) - 1;
      return `\uE000${index}\uE001`;
    }
  );
  const withKnownAssignments = (options.sensitiveKeys ?? []).reduce(
    (safeValue, key) => safeValue.replace(
      new RegExp(`(['"]?${escapeRegExp(key)}['"]?\\s*[=:]\\s*['"]?)[^\\s,;:'"}]+`, 'giu'),
      '$1***'
    ),
    withUrlPlaceholders
  );
  const withNamedAssignments = withKnownAssignments.replace(
    /(['"]?(?:api[_-]?key|app[_-]?key|access[_-]?key|access[_-]?token|token|secret|signature|sign|authorization|cookie|set[_-]?cookie|session(?:[_-]?id)?|csrf|xsrf|password|credential)['"]?\s*[=:]\s*['"]?)[^\s,;:'"}]+/giu,
    '$1***'
  );
  const withSafeKnownValues = isKnownSecretValue(withNamedAssignments, options)
    ? '***'
    : redactBoundedKnownSecretValues(withNamedAssignments, options);
  return withSafeKnownValues.replace(/\uE000(\d+)\uE001/gu, (_match, index: string) => safeUrls[Number(index)] ?? '');
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
) => {
  const dynamicSensitiveKeys = ['__appKeyParam', '__secretParam', '__secretHeader']
    .map((controlKey) => params[controlKey])
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .map((value) => value.trim());
  const snapshotOptions: ResourceImportSanitizationOptions = {
    sensitiveKeys: [...(options.sensitiveKeys ?? []), ...dynamicSensitiveKeys],
    secretValues: [
      ...(options.secretValues ?? []),
      ...dynamicSensitiveKeys.map((key) => {
        const value = params[key];
        return typeof value === 'string' ? value : null;
      })
    ]
  };

  return {
    method,
    endpointUrl: sanitizeResourceImportUrl(endpointUrl, snapshotOptions),
    dataPath,
    params: sanitizeResourceImportValue(params, snapshotOptions) as Record<string, unknown>,
    sourceName
  };
};
