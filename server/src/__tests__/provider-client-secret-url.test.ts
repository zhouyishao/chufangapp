import assert from 'node:assert/strict';
import test from 'node:test';

import { fetchProviderPreview, type ResourceApiProviderRuntime } from '../services/resource-import/provider-client';

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
