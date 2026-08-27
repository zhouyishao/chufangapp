import { getByPath } from './json-path';
import { decryptSecret, maskSecret } from './secret';
import { parseDatasetFile } from './dataset-parser';
import {
  type ResourceImportSanitizationOptions,
  sanitizeResourceImportError,
  sanitizeResourceImportUrl,
  sanitizeResourceImportValue
} from './safe-serialization';
import type {
  ResourceApiProviderDraft,
  ResourceProviderFormatHint,
  ResourceProviderAuthType,
  ResourceProviderMethod,
  ResourceProviderSourceKind
} from './types';

export type ResourceApiProviderRuntime = {
  id?: number;
  providerCode: string;
  name: string;
  providerName: string;
  resourceType: string;
  sourceKind: ResourceProviderSourceKind | string;
  formatHint: ResourceProviderFormatHint | string;
  method: ResourceProviderMethod | string;
  endpointUrl: string;
  sourceHomeUrl: string | null;
  authType: ResourceProviderAuthType | string;
  appKey: string | null;
  encryptedSecret: string | null;
  defaultHeaders: Record<string, unknown> | null;
  defaultParams: Record<string, unknown> | null;
  dataPath: string;
  timeoutMs: number;
  dailyLimit: number;
  description: string | null;
  status: string;
  lastSyncedAt: Date | null;
  lastTestedAt: Date | null;
  lastError: string | null;
};

export type ProviderFetchPreview = {
  total: number;
  rows: Record<string, unknown>[];
  preview: Record<string, unknown>[];
  requestUrl: string;
  requestBody: Record<string, unknown> | null;
  headers: Record<string, string>;
  rawRecords: Array<{
    fileName: string;
    sourceUrl: string;
    contentType: string | null;
    rawText: string | null;
    rawJson: Record<string, unknown> | null;
    parsedCount: number;
  }>;
};

const toPlainObject = (value: unknown): Record<string, unknown> => (value && typeof value === 'object' ? (value as Record<string, unknown>) : {});

const mergeRecords = (...values: Array<Record<string, unknown> | null | undefined>) => Object.assign({}, ...values.filter(Boolean));

const getControlText = (params: Record<string, unknown>, key: string, fallback: string) => {
  const value = params[key];
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
};

export const getProviderCredentialSanitizationOptions = (
  provider: Pick<ResourceApiProviderRuntime, 'appKey' | 'defaultParams'>,
  knownSecrets: readonly (string | null | undefined)[] = []
): ResourceImportSanitizationOptions => {
  const params = provider.defaultParams ?? {};
  return {
    sensitiveKeys: [
      getControlText(params, '__appKeyParam', 'appKey'),
      getControlText(params, '__secretParam', 'secret'),
      getControlText(params, '__secretHeader', 'X-Resource-Secret')
    ],
    secretValues: [provider.appKey, ...knownSecrets]
  };
};

type ProviderCredentialContext = {
  mergedParams: Record<string, unknown>;
  requestParams: Record<string, unknown>;
  appKeyParamName: string;
  secretParamName: string;
  secretHeaderName: string;
  runtimeAppKey: string | null;
  runtimeSecret: string | null;
  sanitizationOptions: ResourceImportSanitizationOptions;
};

const stripControlParams = (params: Record<string, unknown>) => Object.fromEntries(
  Object.entries(params).filter(([key]) => !key.startsWith('__'))
);

const resolveProviderCredentialContext = (
  provider: ResourceApiProviderRuntime,
  params: Record<string, unknown>
): ProviderCredentialContext => {
  const mergedParams = mergeRecords(provider.defaultParams ?? {}, params);
  const requestParams = stripControlParams(mergedParams);
  const appKeyParamName = getControlText(mergedParams, '__appKeyParam', 'appKey');
  const appKeyEnvName = getControlText(mergedParams, '__appKeyEnv', '');
  const secretParamName = getControlText(mergedParams, '__secretParam', 'secret');
  const secretHeaderName = getControlText(mergedParams, '__secretHeader', 'X-Resource-Secret');
  const secretEnvName = getControlText(mergedParams, '__secretEnv', '');
  const runtimeAppKey = provider.appKey
    ? provider.appKey
    : appKeyEnvName
      ? process.env[appKeyEnvName]?.trim() || null
      : null;
  const runtimeSecret = provider.encryptedSecret
    ? decryptSecret(provider.encryptedSecret)
    : secretEnvName
      ? process.env[secretEnvName]?.trim() || null
      : null;
  const defaultHeaderCredential = provider.defaultHeaders?.[secretHeaderName];
  const requestCredentialValues = [
    runtimeAppKey,
    runtimeSecret,
    typeof requestParams[appKeyParamName] === 'string' ? requestParams[appKeyParamName] : null,
    typeof requestParams[secretParamName] === 'string' ? requestParams[secretParamName] : null,
    typeof defaultHeaderCredential === 'string' ? defaultHeaderCredential : null
  ];
  const sanitizationOptions = getProviderCredentialSanitizationOptions({
    appKey: provider.appKey,
    defaultParams: mergedParams
  }, requestCredentialValues);

  if (appKeyEnvName && !runtimeAppKey) {
    throw new Error(`Missing env: ${appKeyEnvName}`);
  }
  if (secretEnvName && !runtimeSecret) {
    throw new Error(`Missing env: ${secretEnvName}`);
  }

  return {
    mergedParams,
    requestParams,
    appKeyParamName,
    secretParamName,
    secretHeaderName,
    runtimeAppKey,
    runtimeSecret,
    sanitizationOptions
  };
};

const buildProviderHeaders = (
  provider: ResourceApiProviderRuntime,
  context: ProviderCredentialContext,
  defaults: Record<string, string>
): Record<string, string> => {
  const headers = {
    ...defaults,
    ...(provider.defaultHeaders
      ? Object.fromEntries(Object.entries(provider.defaultHeaders).map(([key, value]) => [key, String(value)]))
      : {})
  };

  if (provider.authType === 'HEADER_TOKEN' && context.runtimeSecret) {
    headers.Authorization = `Bearer ${context.runtimeSecret}`;
  } else if (provider.authType === 'CUSTOM_HEADERS' && context.runtimeSecret) {
    headers[context.secretHeaderName] = context.runtimeSecret;
  }

  return headers;
};

const applyProviderQueryCredentials = (
  url: URL,
  provider: ResourceApiProviderRuntime,
  context: ProviderCredentialContext
) => {
  if (provider.authType !== 'QUERY_KEY') return url;
  const requestAppKey = context.requestParams[context.appKeyParamName];
  const requestSecret = context.requestParams[context.secretParamName];
  const appKey = typeof requestAppKey === 'string' && requestAppKey
    ? requestAppKey
    : context.runtimeAppKey;
  const secret = typeof requestSecret === 'string' && requestSecret
    ? requestSecret
    : context.runtimeSecret;
  if (appKey) url.searchParams.set(context.appKeyParamName, appKey);
  if (secret) url.searchParams.set(context.secretParamName, secret);
  return url;
};

const interpolatePathTemplate = (template: string, values: Record<string, unknown>) =>
  template.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key: string) => {
    const value = values[key];
    if (value === undefined || value === null || value === '') return '';
    return encodeURIComponent(typeof value === 'string' ? value : String(value));
  });

export const serializeSecretPreview = (value: string | null | undefined) => maskSecret(value);

export const buildProviderDraft = (input: ResourceApiProviderDraft): ResourceApiProviderDraft => ({
  ...input,
  providerCode: input.providerCode.trim(),
  name: input.name.trim(),
  providerName: input.providerName.trim(),
  endpointUrl: input.endpointUrl.trim(),
  sourceHomeUrl: input.sourceHomeUrl?.trim() || null,
  dataPath: input.dataPath.trim() || 'data.list',
  description: input.description?.trim() || null,
  appKey: input.appKey?.trim() || null,
  secret: input.secret?.trim() || null
});

const getFileNameFromUrl = (value: string) => {
  try {
    const url = new URL(value);
    const segment = url.pathname.split('/').filter(Boolean).pop();
    return segment || 'source';
  } catch {
    return 'source';
  }
};

const buildProjKitchenDetailUrl = (params: Record<string, unknown>, recipeId: string) => {
  const detailTemplate = getControlText(params, '__detailEndpointTemplate', 'https://proj.kitchen/api/recipes/{id}');
  return interpolatePathTemplate(detailTemplate, { id: recipeId });
};

const fetchProjKitchenPreview = async (
  provider: ResourceApiProviderRuntime,
  limit: number,
  context: ProviderCredentialContext,
  purpose: 'test' | 'sync'
): Promise<ProviderFetchPreview> => {
  const { mergedParams, sanitizationOptions } = context;
  const endpointUrl = purpose === 'test'
    ? getControlText(mergedParams, '__testEndpointUrl', provider.endpointUrl)
    : getControlText(mergedParams, '__syncEndpointUrl', provider.endpointUrl);
  const headers = buildProviderHeaders(provider, context, { Accept: 'application/json' });
  const listUrl = new URL(endpointUrl);
  const listParams = stripControlParams(mergedParams);

  for (const [key, value] of Object.entries(listParams)) {
    if (value !== undefined && value !== null && value !== '') {
      listUrl.searchParams.set(key, typeof value === 'string' ? value : JSON.stringify(value));
    }
  }
  applyProviderQueryCredentials(listUrl, provider, context);

  const listResponse = await fetch(listUrl.toString(), { headers });
  if (!listResponse.ok) {
    throw new Error(`HTTP ${listResponse.status} ${listResponse.statusText}`);
  }
  const listRaw = (await listResponse.json()) as unknown;
  const listRowsRaw = provider.dataPath ? getByPath(listRaw, provider.dataPath) : listRaw;
  const excludedCategories = Array.isArray(mergedParams.__excludeCategories)
    ? mergedParams.__excludeCategories.map((item: unknown) => String(item).trim()).filter(Boolean)
    : [];
  const normalizedListRows = Array.isArray(listRowsRaw)
    ? listRowsRaw
    : Array.isArray(listRaw)
      ? listRaw
      : [];
  const listRows = normalizedListRows.map((item) => toPlainObject(item)).filter((item) => {
      const category = typeof item.category === 'string' ? item.category.trim() : '';
      return category ? !excludedCategories.includes(category) : true;
    });

  if (purpose === 'test') {
    const safeRows = sanitizeResourceImportValue(listRows, sanitizationOptions) as Record<string, unknown>[];
    const safeListUrl = sanitizeResourceImportUrl(listUrl.toString(), sanitizationOptions);
    return {
      total: listRows.length,
      rows: safeRows.slice(0, limit),
      preview: safeRows.slice(0, limit),
      requestUrl: safeListUrl,
      requestBody: null,
      headers: sanitizeResourceImportValue(headers, sanitizationOptions) as Record<string, string>,
      rawRecords: [
        {
          fileName: getFileNameFromUrl(listUrl.toString()),
          sourceUrl: safeListUrl,
          contentType: 'application/json',
          rawText: null,
          rawJson: listRaw && typeof listRaw === 'object'
            ? sanitizeResourceImportValue(listRaw, sanitizationOptions) as Record<string, unknown>
            : null,
          parsedCount: listRows.length
        }
      ]
    };
  }

  const detailRows: Record<string, unknown>[] = [];
  const rawRecords: ProviderFetchPreview['rawRecords'] = [];
  for (const item of listRows.slice(0, limit)) {
    const recipeId = typeof item.id === 'string' || typeof item.id === 'number' ? String(item.id) : '';
    if (!recipeId) continue;
    const detailUrl = applyProviderQueryCredentials(
      new URL(buildProjKitchenDetailUrl(mergedParams, recipeId)),
      provider,
      context
    );
    const detailRequestUrl = detailUrl.toString();
    const detailResponse = await fetch(detailRequestUrl, { headers });
    if (!detailResponse.ok) {
      throw new Error(`HTTP ${detailResponse.status} ${detailResponse.statusText}`);
    }
    const detailRaw = (await detailResponse.json()) as unknown;
    const detailRow = toPlainObject(detailRaw);
    detailRows.push(detailRow);
    rawRecords.push({
      fileName: getFileNameFromUrl(detailRequestUrl),
      sourceUrl: sanitizeResourceImportUrl(detailRequestUrl, sanitizationOptions),
      contentType: 'application/json',
      rawText: null,
      rawJson: detailRaw && typeof detailRaw === 'object'
        ? sanitizeResourceImportValue(detailRaw, sanitizationOptions) as Record<string, unknown>
        : null,
      parsedCount: 1
    });
  }

  const safeDetailRows = sanitizeResourceImportValue(detailRows, sanitizationOptions) as Record<string, unknown>[];

  return {
    total: detailRows.length,
    rows: safeDetailRows,
    preview: safeDetailRows.slice(0, limit),
    requestUrl: sanitizeResourceImportUrl(listUrl.toString(), sanitizationOptions),
    requestBody: null,
    headers: sanitizeResourceImportValue(headers, sanitizationOptions) as Record<string, string>,
    rawRecords
  };
};

const fetchGitHubSourceUrls = async (
  params: Record<string, unknown>,
  headers: Record<string, string>,
  provider: ResourceApiProviderRuntime,
  context: ProviderCredentialContext
) => {
  const repo = typeof params.__githubRepo === 'string' ? params.__githubRepo.trim() : '';
  if (!repo) return [] as string[];
  const ref = typeof params.__githubRef === 'string' && params.__githubRef.trim() ? params.__githubRef.trim() : 'main';
  const maxSources = typeof params.__maxSources === 'number' ? Math.min(100, Math.max(1, params.__maxSources)) : 30;
  const rawPrefixes = Array.isArray(params.__githubPaths)
    ? params.__githubPaths.map((item) => String(item).trim()).filter(Boolean)
    : typeof params.__githubPath === 'string' && params.__githubPath.trim()
      ? [params.__githubPath.trim()]
      : [];
  const extensions = Array.isArray(params.__fileExtensions)
    ? params.__fileExtensions.map((item) => String(item).trim().toLowerCase()).filter(Boolean)
    : [];
  const treeUrl = applyProviderQueryCredentials(
    new URL(`https://api.github.com/repos/${repo}/git/trees/${ref}?recursive=1`),
    provider,
    context
  ).toString();
  const response = await fetch(treeUrl, {
    headers: { ...headers, Accept: 'application/vnd.github+json' }
  });
  if (!response.ok) throw new Error(`GitHub tree request failed: HTTP ${response.status}`);
  const payload = (await response.json()) as { tree?: Array<{ path?: string; type?: string }> };
  const tree = Array.isArray(payload.tree) ? payload.tree : [];
  return tree
    .filter((item) => item.type === 'blob' && typeof item.path === 'string')
    .map((item) => item.path as string)
    .filter((path) => (rawPrefixes.length === 0 ? true : rawPrefixes.some((prefix) => path.startsWith(prefix))))
    .filter((path) => (extensions.length === 0 ? true : extensions.some((extension) => path.toLowerCase().endsWith(extension))))
    .slice(0, maxSources)
    .map((path) => `https://raw.githubusercontent.com/${repo}/${ref}/${path}`);
};

const fetchDatasetPreview = async (
  provider: ResourceApiProviderRuntime,
  limit: number,
  context: ProviderCredentialContext
): Promise<ProviderFetchPreview> => {
  const { mergedParams, sanitizationOptions } = context;
  const headers = buildProviderHeaders(provider, context, {
    Accept: 'application/json, text/plain, text/markdown, text/csv;q=0.9, */*;q=0.8'
  });
  const directSourceUrls = Array.isArray(mergedParams.__sourceUrls)
    ? mergedParams.__sourceUrls.map((item: unknown) => String(item).trim()).filter(Boolean)
    : [];
  const configuredSourceUrls = directSourceUrls.length > 0
    ? directSourceUrls
    : await fetchGitHubSourceUrls(mergedParams, headers, provider, context);
  const sourceUrls = configuredSourceUrls.map((sourceUrl) => applyProviderQueryCredentials(
    new URL(sourceUrl),
    provider,
    context
  ).toString());
  if (sourceUrls.length === 0) {
    throw new Error(`未配置 ${provider.providerName} 的数据源文件，请设置 __sourceUrls 或 __githubRepo`);
  }

  const formatHint = (provider.formatHint || 'AUTO').toString().toUpperCase() as ResourceProviderFormatHint;
  const rows: Record<string, unknown>[] = [];
  const rawRecords: ProviderFetchPreview['rawRecords'] = [];

  for (const sourceUrl of sourceUrls) {
    const response = await fetch(sourceUrl, { headers });
    if (!response.ok) {
      throw new Error(`拉取数据集文件失败: HTTP ${response.status}`);
    }
    const rawText = await response.text();
    const contentType = response.headers.get('content-type');
    const fileName = getFileNameFromUrl(sourceUrl);
    const parsed = parseDatasetFile({ fileName, sourceUrl, contentType, rawText }, formatHint, provider.dataPath);
    const safeSourceUrl = sanitizeResourceImportUrl(sourceUrl, sanitizationOptions);
    const safeParsedRows = sanitizeResourceImportValue(parsed.rows, sanitizationOptions) as Record<string, unknown>[];
    const normalizedRows = safeParsedRows.map((row) => ({
      ...row,
      sourceUrl: safeSourceUrl,
      sourceName: row.sourceName ?? provider.providerName
    }));
    const safeRawJson = parsed.rawJson
      ? sanitizeResourceImportValue(parsed.rawJson, sanitizationOptions) as Record<string, unknown>
      : null;
    rows.push(...normalizedRows);
    rawRecords.push({
      fileName,
      sourceUrl: safeSourceUrl,
      contentType,
      rawText: safeRawJson
        ? JSON.stringify(safeRawJson)
        : sanitizeResourceImportError(rawText, sanitizationOptions),
      rawJson: safeRawJson,
      parsedCount: normalizedRows.length
    });
    if (rows.length >= limit) break;
  }

  return {
    total: rows.length,
    rows,
    preview: rows.slice(0, limit),
    requestUrl: sanitizeResourceImportUrl(sourceUrls[0] || provider.endpointUrl, sanitizationOptions),
    requestBody: null,
    headers: sanitizeResourceImportValue(headers, sanitizationOptions) as Record<string, string>,
    rawRecords
  };
};

export async function fetchProviderPreview(
  provider: ResourceApiProviderRuntime,
  limit: number,
  params: Record<string, unknown> = {},
  purpose: 'test' | 'sync' = 'sync'
): Promise<ProviderFetchPreview> {
  const context = resolveProviderCredentialContext(provider, params);
  if (provider.providerCode === 'proj_kitchen') {
    try {
      return await fetchProjKitchenPreview(provider, limit, context, purpose);
    } catch (error) {
      throw new Error(sanitizeResourceImportError(
        error instanceof Error ? error.message : '未知资源请求错误',
        context.sanitizationOptions
      ));
    }
  }
  if (provider.sourceKind === 'GITHUB_DATASET' || provider.sourceKind === 'OPEN_DATASET') {
    try {
      return await fetchDatasetPreview(provider, limit, context);
    } catch (error) {
      throw new Error(sanitizeResourceImportError(
        error instanceof Error ? error.message : '未知资源请求错误',
        context.sanitizationOptions
      ));
    }
  }

  const {
    mergedParams,
    requestParams,
    sanitizationOptions
  } = context;
  const method = provider.method.toUpperCase() === 'POST' ? 'POST' : 'GET';
  const pathTemplate = getControlText(mergedParams, '__pathTemplate', '');
  const headers = buildProviderHeaders(provider, context, { 'Content-Type': 'application/json' });

  const endpointOverride = purpose === 'test'
    ? getControlText(mergedParams, '__testEndpointUrl', provider.endpointUrl)
    : getControlText(mergedParams, '__syncEndpointUrl', provider.endpointUrl);
  let requestUrl = endpointOverride;
  let requestBody: Record<string, unknown> | null = null;
  const url = new URL(endpointOverride);
  const pathValues = { ...requestParams, word: getControlText(mergedParams, 'word', '') };

  if (pathTemplate) {
    const nextPath = interpolatePathTemplate(pathTemplate, pathValues);
    if (nextPath) {
      url.pathname = nextPath.startsWith('/') ? nextPath : `/${nextPath}`;
    }
  }

  applyProviderQueryCredentials(url, provider, context);

  if (method === 'GET') {
    for (const [key, value] of Object.entries(requestParams)) {
      if (value !== undefined && value !== null && value !== '') {
        if (pathTemplate && pathTemplate.includes(`{${key}}`)) continue;
        url.searchParams.set(key, typeof value === 'string' ? value : JSON.stringify(value));
      }
    }
    requestUrl = url.toString();
  } else {
    requestBody = requestParams;
    requestUrl = url.toString();
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), provider.timeoutMs);

  try {
    const response = await fetch(requestUrl, {
      method,
      headers,
      signal: controller.signal,
      body: method === 'POST' ? JSON.stringify(requestBody ?? {}) : undefined
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    const raw = (await response.json()) as unknown;
    const rawRecord = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : null;
    const businessCode = typeof rawRecord?.code === 'number' ? rawRecord.code : null;
    const businessMessage =
      typeof rawRecord?.msg === 'string'
        ? rawRecord.msg
        : typeof rawRecord?.message === 'string'
          ? rawRecord.message
          : typeof rawRecord?.error === 'string'
            ? rawRecord.error
            : null;

    if (businessCode !== null && ![0, 200].includes(businessCode)) {
      throw new Error(
        `${provider.providerName} 返回错误：code=${businessCode}${businessMessage ? `，msg=${businessMessage}` : ''}`
      );
    }
    if (rawRecord && (rawRecord.success === false || rawRecord.ok === false)) {
      throw new Error(
        `${provider.providerName} 返回错误${businessMessage ? `：${businessMessage}` : ''}`
      );
    }

    const extracted = provider.dataPath ? getByPath(raw, provider.dataPath) : raw;
    const rows = Array.isArray(extracted)
      ? extracted.map((item) => toPlainObject(item))
      : Array.isArray((raw as { data?: unknown })?.data)
        ? ((raw as { data?: unknown }).data as unknown[]).map((item) => toPlainObject(item))
        : extracted && typeof extracted === 'object'
          ? [toPlainObject(extracted)]
        : [];
    const safeRows = sanitizeResourceImportValue(rows, sanitizationOptions) as Record<string, unknown>[];
    const cappedRows = safeRows.slice(0, limit);
    const safeRequestUrl = sanitizeResourceImportUrl(requestUrl, sanitizationOptions);

    return {
      total: rows.length,
      rows: safeRows,
      preview: cappedRows,
      requestUrl: safeRequestUrl,
      requestBody: sanitizeResourceImportValue(requestBody, sanitizationOptions) as Record<string, unknown> | null,
      headers: sanitizeResourceImportValue(headers, sanitizationOptions) as Record<string, string>,
      rawRecords: [
        {
          fileName: getFileNameFromUrl(requestUrl),
          sourceUrl: safeRequestUrl,
          contentType: 'application/json',
          rawText: null,
          rawJson: raw && typeof raw === 'object'
            ? sanitizeResourceImportValue(raw, sanitizationOptions) as Record<string, unknown>
            : null,
          parsedCount: rows.length
        }
      ]
    };
  } catch (error) {
    throw new Error(sanitizeResourceImportError(
      error instanceof Error ? error.message : '未知资源请求错误',
      sanitizationOptions
    ));
  } finally {
    clearTimeout(timeout);
  }
}
