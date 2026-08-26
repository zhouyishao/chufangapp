import assert from 'node:assert/strict';
import test from 'node:test';

import { fetchProviderPreview, type ResourceApiProviderRuntime } from '../services/resource-import/provider-client';
import { encryptSecret } from '../services/resource-import/secret';

const provider: ResourceApiProviderRuntime = {
  providerCode: 'tianapi_caipu',
  name: '中国菜谱查询',
  providerName: 'TianAPI - 中国菜谱查询',
  resourceType: 'RECIPE',
  sourceKind: 'API',
  formatHint: 'JSON',
  method: 'GET',
  endpointUrl: 'https://example.test/recipes',
  sourceHomeUrl: null,
  authType: 'QUERY_KEY',
  appKey: 'actual-query-key',
  encryptedSecret: null,
  defaultHeaders: null,
  defaultParams: { __appKeyParam: 'key', word: '黄瓜' },
  dataPath: 'result.list',
  timeoutMs: 1000,
  dailyLimit: 100,
  description: null,
  status: 'ACTIVE',
  lastSyncedAt: null,
  lastTestedAt: null,
  lastError: null
};

test('query-key requests use the real key only for fetch and mask preview and raw-record URLs', async () => {
  const originalFetch = globalThis.fetch;
  let fetchedUrl = '';
  globalThis.fetch = (async (input: string | URL | Request) => {
    fetchedUrl = String(input);
    return new Response(JSON.stringify({ result: { list: [{ name: '黄瓜炒蛋' }] } }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }) as typeof fetch;

  try {
    const preview = await fetchProviderPreview(provider, 1);

    assert.match(fetchedUrl, /key=actual-query-key/);
    assert.doesNotMatch(preview.requestUrl, /actual-query-key/);
    assert.doesNotMatch(preview.rawRecords[0]?.sourceUrl ?? '', /actual-query-key/);
    assert.match(preview.rawRecords[0]?.sourceUrl ?? '', /key=\*\*\*/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('custom query credential names are redacted everywhere after the fetch uses the real values', async () => {
  const originalFetch = globalThis.fetch;
  let fetchedUrl = '';
  globalThis.fetch = (async (input: string | URL | Request) => {
    fetchedUrl = String(input);
    return new Response(JSON.stringify({
      result: {
        list: [{
          name: '宫保鸡丁',
          echoedClientId: 'real-client-id',
          echoedSecret: 'real-query-secret'
        }]
      }
    }), { headers: { 'Content-Type': 'application/json' } });
  }) as typeof fetch;

  try {
    const preview = await fetchProviderPreview({
      ...provider,
      appKey: 'real-client-id',
      encryptedSecret: null,
      defaultParams: {
        __appKeyParam: 'client_id',
        __secretParam: 'partner_signature',
        word: '鸡丁'
      }
    }, 1, { partner_signature: 'real-query-secret' });

    assert.match(fetchedUrl, /client_id=real-client-id/);
    assert.match(fetchedUrl, /partner_signature=real-query-secret/);
    assert.doesNotMatch(JSON.stringify(preview), /real-client-id|real-query-secret/);
    assert.match(preview.requestUrl, /client_id=\*\*\*/);
    assert.match(preview.requestUrl, /partner_signature=\*\*\*/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('custom header credentials are redacted by name and value after the fetch uses the real secret', async () => {
  const originalFetch = globalThis.fetch;
  let fetchedHeaders: HeadersInit | undefined;
  globalThis.fetch = (async (_input: string | URL | Request, init?: RequestInit) => {
    fetchedHeaders = init?.headers;
    return new Response(JSON.stringify({ result: { list: [{ name: '鱼香肉丝', echoed: 'real-private-secret' }] } }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }) as typeof fetch;

  try {
    const preview = await fetchProviderPreview({
      ...provider,
      authType: 'CUSTOM_HEADERS',
      appKey: null,
      encryptedSecret: encryptSecret('real-private-secret'),
      defaultParams: { __secretHeader: 'X-Private-Partner', word: '肉丝' }
    }, 1);

    assert.equal((fetchedHeaders as Record<string, string>)['X-Private-Partner'], 'real-private-secret');
    assert.doesNotMatch(JSON.stringify(preview), /real-private-secret/);
    assert.equal(preview.headers['X-Private-Partner'], '***');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('request errors redact dynamically named credentials before callers can log them', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (input: string | URL | Request) => {
    throw new Error(`network failure for ${String(input)}`);
  }) as typeof fetch;

  try {
    await assert.rejects(
      fetchProviderPreview({
        ...provider,
        appKey: 'error-client-id',
        defaultParams: { __appKeyParam: 'client_id', word: '鱼' }
      }, 1),
      (error: Error) => {
        assert.doesNotMatch(error.message, /error-client-id/);
        assert.match(error.message, /client_id=\*\*\*/);
        return true;
      }
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('dataset source URLs redact token and signature before they become raw records', async () => {
  const originalFetch = globalThis.fetch;
  const sourceUrl = 'https://example.test/source.json?token=dataset-token&signature=dataset-signature';
  globalThis.fetch = (async () => new Response(JSON.stringify([{ name: '豆腐青菜' }]), {
    headers: { 'Content-Type': 'application/json' }
  })) as typeof fetch;

  try {
    const preview = await fetchProviderPreview({
      ...provider,
      sourceKind: 'OPEN_DATASET',
      formatHint: 'JSON',
      authType: 'NONE',
      appKey: null,
      defaultParams: { __sourceUrls: [sourceUrl] },
      dataPath: ''
    }, 1);

    assert.doesNotMatch(preview.rawRecords[0]?.sourceUrl ?? '', /dataset-token|dataset-signature/);
    assert.match(preview.rawRecords[0]?.sourceUrl ?? '', /token=\*\*\*/);
    assert.match(preview.rawRecords[0]?.sourceUrl ?? '', /signature=\*\*\*/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
