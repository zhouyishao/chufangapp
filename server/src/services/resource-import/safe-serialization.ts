const isSensitiveKey = (key: string): boolean => {
  const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, '');
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
    'password',
    'credential'
  ].some((name) => normalized === name || normalized.endsWith(name));
};

const redactLooseQueryValues = (value: string) => value.replace(
  /([?&]([^=&\s]+)=)([^&#\s]*)/gu,
  (match, prefix: string, key: string) => isSensitiveKey(key) ? `${prefix}***` : match
);

export const sanitizeResourceImportUrl = (value: string): string => {
  try {
    const url = new URL(value);
    url.searchParams.forEach((_, key) => {
      if (isSensitiveKey(key)) url.searchParams.set(key, '***');
    });
    return url.toString();
  } catch {
    return redactLooseQueryValues(value);
  }
};

export const sanitizeResourceImportValue = (value: unknown): unknown => {
  if (typeof value === 'string') {
    return /^https?:\/\//iu.test(value) ? sanitizeResourceImportUrl(value) : value;
  }
  if (Array.isArray(value)) return value.map(sanitizeResourceImportValue);
  if (!value || typeof value !== 'object') return value;

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, item]) => [
      key,
      isSensitiveKey(key) ? '***' : sanitizeResourceImportValue(item)
    ])
  );
};

export const sanitizeResourceImportError = (value: string): string => {
  const withSafeUrls = value.replace(/https?:\/\/[^\s'"）)]+/giu, sanitizeResourceImportUrl);
  return withSafeUrls.replace(
    /((?:api[_-]?key|app[_-]?key|access[_-]?key|access[_-]?token|token|secret|signature|sign|authorization|password|credential)\s*[=:]\s*['"]?)[^\s,;:'"`]+/giu,
    '$1***'
  );
};

export const buildSafeRequestSnapshot = (
  method: string,
  endpointUrl: string,
  dataPath: string,
  params: Record<string, unknown>,
  sourceName: string | null
) => ({
  method,
  endpointUrl: sanitizeResourceImportUrl(endpointUrl),
  dataPath,
  params: sanitizeResourceImportValue(params) as Record<string, unknown>,
  sourceName
});
