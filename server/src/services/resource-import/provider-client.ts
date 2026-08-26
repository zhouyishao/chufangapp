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

const stripControlParams = (params: Record<string, unknown>) => Object.fromEntries(
  Object.entries(params).filter(([key]) => !key.startsWith('__'))
);

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
  params: Record<string, unknown>,
  purpose: 'test' | 'sync'
): Promise<ProviderFetchPreview> => {
  const mergedParams = mergeRecords(provider.defaultParams ?? {}, params);
  const endpointUrl = purpose === 'test'
    ? getControlText(mergedParams, '__testEndpointUrl', provider.endpointUrl)
    : getControlText(mergedParams, '__syncEndpointUrl', provider.endpointUrl);
  const headers: Record<string, string> = { Accept: 'application/json' };
  const listUrl = new URL(endpointUrl);
  const listParams = stripControlParams(mergedParams);

  for (const [key, value] of Object.entries(listParams)) {
    if (value !== undefined && value !== null && value !== '') {
      listUrl.searchParams.set(key, typeof value === 'string' ? value : JSON.stringify(value));
    }
  }

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
    return {
      total: listRows.length,
      rows: listRows.slice(0, limit),
      preview: listRows.slice(0, limit),
      requestUrl: sanitizeResourceImportUrl(listUrl.toString()),
      requestBody: null,
      headers,
      rawRecords: [
        {
          fileName: getFileNameFromUrl(listUrl.toString()),
          sourceUrl: sanitizeResourceImportUrl(listUrl.toString()),
          contentType: 'application/json',
          rawText: null,
          rawJson: listRaw && typeof listRaw === 'object' ? (listRaw as Record<string, unknown>) : null,
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
    const detailUrl = buildProjKitchenDetailUrl(mergedParams, recipeId);
    const detailResponse = await fetch(detailUrl, { headers });
    if (!detailResponse.ok) {
      throw new Error(`HTTP ${detailResponse.status} ${detailResponse.statusText}`);
    }
    const detailRaw = (await detailResponse.json()) as unknown;
    const detailRow = toPlainObject(detailRaw);
    detailRows.push(detailRow);
    rawRecords.push({
      fileName: getFileNameFromUrl(detailUrl),
      sourceUrl: sanitizeResourceImportUrl(detailUrl),
      contentType: 'application/json',
      rawText: null,
      rawJson: detailRaw && typeof detailRaw === 'object' ? (detailRaw as Record<string, unknown>) : null,
      parsedCount: 1
    });
  }

  return {
    total: detailRows.length,
    rows: detailRows,
    preview: detailRows.slice(0, limit),
    requestUrl: listUrl.toString(),
    requestBody: null,
    headers,
    rawRecords
  };
};

const fetchGitHubSourceUrls = async (params: Record<string, unknown>) => {
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
  const treeUrl = `https://api.github.com/repos/${repo}/git/trees/${ref}?recursive=1`;
  const response = await fetch(treeUrl, {
    headers: { Accept: 'application/vnd.github+json' }
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

const fetchDatasetPreview = async (provider: ResourceApiProviderRuntime, limit: number, params: Record<string, unknown>): Promise<ProviderFetchPreview> => {
  const mergedParams = mergeRecords(provider.defaultParams ?? {}, params);
  const directSourceUrls = Array.isArray(mergedParams.__sourceUrls)
    ? mergedParams.__sourceUrls.map((item: unknown) => String(item).trim()).filter(Boolean)
    : [];
  const sourceUrls = directSourceUrls.length > 0 ? directSourceUrls : await fetchGitHubSourceUrls(mergedParams);
  if (sourceUrls.length === 0) {
    throw new Error(`未配置 ${provider.providerName} 的数据源文件，请设置 __sourceUrls 或 __githubRepo`);
  }

  const formatHint = (provider.formatHint || 'AUTO').toString().toUpperCase() as ResourceProviderFormatHint;
  const rows: Record<string, unknown>[] = [];
  const rawRecords: ProviderFetchPreview['rawRecords'] = [];

  for (const sourceUrl of sourceUrls) {
    const response = await fetch(sourceUrl, {
      headers: { Accept: 'application/json, text/plain, text/markdown, text/csv;q=0.9, */*;q=0.8' }
    });
    if (!response.ok) {
      throw new Error(`拉取数据集文件失败: HTTP ${response.status}`);
    }
    const rawText = await response.text();
    const contentType = response.headers.get('content-type');
    const fileName = getFileNameFromUrl(sourceUrl);
    const parsed = parseDatasetFile({ fileName, sourceUrl, contentType, rawText }, formatHint, provider.dataPath);
    const normalizedRows = parsed.rows.map((row) => ({
      ...row,
      sourceUrl: sanitizeResourceImportUrl(sourceUrl),
      sourceName: row.sourceName ?? provider.providerName
    }));
    rows.push(...normalizedRows);
    rawRecords.push({
      fileName,
      sourceUrl: sanitizeResourceImportUrl(sourceUrl),
      contentType,
      rawText,
      rawJson: parsed.rawJson,
      parsedCount: normalizedRows.length
    });
    if (rows.length >= limit) break;
  }

  return {
    total: rows.length,
    rows,
    preview: rows.slice(0, limit),
    requestUrl: sanitizeResourceImportUrl(sourceUrls[0] || provider.endpointUrl),
    requestBody: null,
    headers: {},
    rawRecords
  };
};

export async function fetchProviderPreview(
  provider: ResourceApiProviderRuntime,
  limit: number,
  params: Record<string, unknown> = {},
  purpose: 'test' | 'sync' = 'sync'
): Promise<ProviderFetchPreview> {
  if (provider.providerCode === 'proj_kitchen') {
    return fetchProjKitchenPreview(provider, limit, params, purpose);
  }
  if (provider.sourceKind === 'GITHUB_DATASET' || provider.sourceKind === 'OPEN_DATASET') {
    return fetchDatasetPreview(provider, limit, params);
  }

  const mergedParams = mergeRecords(provider.defaultParams ?? {}, params);
  const requestParams = stripControlParams(mergedParams);
  const method = provider.method.toUpperCase() === 'POST' ? 'POST' : 'GET';
  const appKeyParamName = getControlText(mergedParams, '__appKeyParam', 'appKey');
  const appKeyEnvName = getControlText(mergedParams, '__appKeyEnv', '');
  const secretParamName = getControlText(mergedParams, '__secretParam', 'secret');
  const secretHeaderName = getControlText(mergedParams, '__secretHeader', 'X-Resource-Secret');
  const secretEnvName = getControlText(mergedParams, '__secretEnv', '');
  const pathTemplate = getControlText(mergedParams, '__pathTemplate', '');
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
  const requestCredentialValues = [
    runtimeAppKey,
    runtimeSecret,
    typeof requestParams[appKeyParamName] === 'string' ? requestParams[appKeyParamName] : null,
    typeof requestParams[secretParamName] === 'string' ? requestParams[secretParamName] : null
  ];
  const sanitizationOptions = getProviderCredentialSanitizationOptions(provider, requestCredentialValues);
  if (appKeyEnvName && !runtimeAppKey) {
    throw new Error(`Missing env: ${appKeyEnvName}`);
  }
  if (secretEnvName && !runtimeSecret) {
    throw new Error(`Missing env: ${secretEnvName}`);
  }
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(provider.defaultHeaders ? Object.fromEntries(Object.entries(provider.defaultHeaders).map(([key, value]) => [key, String(value)])) : {})
  };

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

  if (provider.authType === 'HEADER_TOKEN' && runtimeSecret) {
    headers.Authorization = `Bearer ${runtimeSecret}`;
  } else if (provider.authType === 'CUSTOM_HEADERS' && runtimeSecret) {
    headers[secretHeaderName] = runtimeSecret;
  } else if (provider.authType === 'QUERY_KEY') {
    if (runtimeAppKey) url.searchParams.set(appKeyParamName, runtimeAppKey);
    if (runtimeSecret) url.searchParams.set(secretParamName, runtimeSecret);
  }

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
