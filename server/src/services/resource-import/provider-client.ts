import { getByPath } from './json-path';
import { decryptSecret, maskSecret } from './secret';
import type {
  ResourceApiProviderDraft,
  ResourceProviderAuthType,
  ResourceProviderMethod
} from './types';

export type ResourceApiProviderRuntime = {
  id?: number;
  name: string;
  providerName: string;
  resourceType: string;
  method: ResourceProviderMethod | string;
  endpointUrl: string;
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
};

const toPlainObject = (value: unknown): Record<string, unknown> => (value && typeof value === 'object' ? (value as Record<string, unknown>) : {});

const mergeRecords = (...values: Array<Record<string, unknown> | null | undefined>) => Object.assign({}, ...values.filter(Boolean));

const getControlText = (params: Record<string, unknown>, key: string, fallback: string) => {
  const value = params[key];
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
};

const stripControlParams = (params: Record<string, unknown>) => Object.fromEntries(
  Object.entries(params).filter(([key]) => !key.startsWith('__'))
);

const maskUrlSecrets = (value: string, secretNames: string[]) => {
  const url = new URL(value);
  for (const name of secretNames) {
    if (url.searchParams.has(name)) url.searchParams.set(name, '***');
  }
  return url.toString();
};

const maskHeaders = (headers: Record<string, string>, secretHeaderNames: string[]) => Object.fromEntries(
  Object.entries(headers).map(([key, value]) => [
    key,
    secretHeaderNames.some((name) => name.toLowerCase() === key.toLowerCase()) || key.toLowerCase() === 'authorization'
      ? '***'
      : value
  ])
);

export const serializeSecretPreview = (value: string | null | undefined) => maskSecret(value);

export const buildProviderDraft = (input: ResourceApiProviderDraft): ResourceApiProviderDraft => ({
  ...input,
  name: input.name.trim(),
  providerName: input.providerName.trim(),
  endpointUrl: input.endpointUrl.trim(),
  dataPath: input.dataPath.trim() || 'data.list',
  description: input.description?.trim() || null,
  appKey: input.appKey?.trim() || null,
  secret: input.secret?.trim() || null
});

export async function fetchProviderPreview(provider: ResourceApiProviderRuntime, limit: number, params: Record<string, unknown> = {}): Promise<ProviderFetchPreview> {
  const mergedParams = mergeRecords(provider.defaultParams ?? {}, params);
  const requestParams = stripControlParams(mergedParams);
  const method = provider.method.toUpperCase() === 'POST' ? 'POST' : 'GET';
  const appKeyParamName = getControlText(mergedParams, '__appKeyParam', 'appKey');
  const secretParamName = getControlText(mergedParams, '__secretParam', 'secret');
  const secretHeaderName = getControlText(mergedParams, '__secretHeader', 'X-Resource-Secret');
  const secretEnvName = getControlText(mergedParams, '__secretEnv', '');
  const runtimeSecret = provider.encryptedSecret
    ? decryptSecret(provider.encryptedSecret)
    : secretEnvName
      ? process.env[secretEnvName]?.trim() || null
      : null;
  if (secretEnvName && !runtimeSecret) {
    throw new Error(`Missing env: ${secretEnvName}`);
  }
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(provider.defaultHeaders ? Object.fromEntries(Object.entries(provider.defaultHeaders).map(([key, value]) => [key, String(value)])) : {})
  };

  let requestUrl = provider.endpointUrl;
  let requestBody: Record<string, unknown> | null = null;
  const url = new URL(provider.endpointUrl);

  if (provider.authType === 'HEADER_TOKEN' && runtimeSecret) {
    headers.Authorization = `Bearer ${runtimeSecret}`;
  } else if (provider.authType === 'CUSTOM_HEADERS' && runtimeSecret) {
    headers[secretHeaderName] = runtimeSecret;
  } else if (provider.authType === 'QUERY_KEY') {
    if (provider.appKey) url.searchParams.set(appKeyParamName, provider.appKey);
    if (runtimeSecret) url.searchParams.set(secretParamName, runtimeSecret);
  }

  if (method === 'GET') {
    for (const [key, value] of Object.entries(requestParams)) {
      if (value !== undefined && value !== null && value !== '') {
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
    const extracted = getByPath(raw, provider.dataPath);
    const rows = Array.isArray(extracted)
      ? extracted.map((item) => toPlainObject(item))
      : Array.isArray((raw as { data?: unknown })?.data)
        ? ((raw as { data?: unknown }).data as unknown[]).map((item) => toPlainObject(item))
        : [];
    const cappedRows = rows.slice(0, limit);

    return {
      total: rows.length,
      rows,
      preview: cappedRows,
      requestUrl: maskUrlSecrets(requestUrl, [appKeyParamName, secretParamName]),
      requestBody,
      headers: maskHeaders(headers, [secretHeaderName])
    };
  } finally {
    clearTimeout(timeout);
  }
}
