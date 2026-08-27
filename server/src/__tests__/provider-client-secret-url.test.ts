import assert from 'node:assert/strict';
import test from 'node:test';

import {
  fetchProviderPreview,
  getProviderCredentialSanitizationOptions,
  type ResourceApiProviderRuntime
} from '../services/resource-import/provider-client';
import { encryptSecret } from '../services/resource-import/secret';
import { buildSafeRequestSnapshot } from '../services/resource-import/safe-serialization';

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

test('dataset previews use real dynamic credentials for fetch and redact every persisted copy', async () => {
  const originalFetch = globalThis.fetch;
  const fetched: Array<{ url: string; headers: HeadersInit | undefined }> = [];
  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    fetched.push({ url: String(input), headers: init?.headers });
    return new Response(JSON.stringify([{
      name: '清炒时蔬',
      client_id: 'dataset-client-id',
      partner_header: 'dataset-header-secret'
    }]), { headers: { 'Content-Type': 'application/json' } });
  }) as typeof fetch;

  try {
    const preview = await fetchProviderPreview({
      ...provider,
      providerCode: 'custom_dataset',
      sourceKind: 'OPEN_DATASET',
      formatHint: 'JSON',
      authType: 'CUSTOM_HEADERS',
      appKey: 'dataset-client-id',
      encryptedSecret: encryptSecret('dataset-header-secret'),
      defaultParams: {
        __appKeyParam: 'client_id',
        __secretHeader: 'X-Partner-Credential',
        __sourceUrls: ['https://example.test/recipes.json?client_id=dataset-client-id']
      },
      dataPath: ''
    }, 1);

    assert.match(fetched[0]?.url ?? '', /client_id=dataset-client-id/);
    assert.equal(
      (fetched[0]?.headers as Record<string, string>)['X-Partner-Credential'],
      'dataset-header-secret'
    );
    assert.doesNotMatch(JSON.stringify(preview), /dataset-client-id|dataset-header-secret/);
    assert.match(preview.requestUrl, /client_id=\*\*\*/);
    assert.match(preview.rows[0]?.sourceUrl as string, /client_id=\*\*\*/);
    assert.match(preview.rawRecords[0]?.sourceUrl ?? '', /client_id=\*\*\*/);
    assert.equal(preview.headers['X-Partner-Credential'], '***');
    const rawRows = preview.rawRecords[0]?.rawJson as unknown as Array<Record<string, unknown>>;
    assert.equal(rawRows[0]?.client_id, '***');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('dataset fetch errors redact dynamically named query credentials', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (input: string | URL | Request) => {
    throw new Error(`dataset network failure for ${String(input)}`);
  }) as typeof fetch;

  try {
    await assert.rejects(
      fetchProviderPreview({
        ...provider,
        providerCode: 'custom_dataset',
        sourceKind: 'OPEN_DATASET',
        formatHint: 'JSON',
        authType: 'QUERY_KEY',
        appKey: 'dataset-error-id',
        defaultParams: {
          __appKeyParam: 'client_id',
          __sourceUrls: ['https://example.test/recipes.json']
        },
        dataPath: ''
      }, 1),
      (error: Error) => {
        assert.doesNotMatch(error.message, /dataset-error-id/);
        assert.match(error.message, /client_id=\*\*\*/);
        return true;
      }
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('GitHub dataset tree and raw-file requests both use and redact dynamic query credentials', async () => {
  const originalFetch = globalThis.fetch;
  const fetchedUrls: string[] = [];
  globalThis.fetch = (async (input: string | URL | Request) => {
    const url = String(input);
    fetchedUrls.push(url);
    if (url.includes('api.github.com')) {
      return new Response(JSON.stringify({
        tree: [{ path: 'recipes/home.json', type: 'blob' }]
      }), { headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify([{ name: '青椒炒肉' }]), {
      headers: { 'Content-Type': 'application/json' }
    });
  }) as typeof fetch;

  try {
    const preview = await fetchProviderPreview({
      ...provider,
      providerCode: 'custom_github_dataset',
      sourceKind: 'GITHUB_DATASET',
      formatHint: 'JSON',
      authType: 'QUERY_KEY',
      appKey: 'github-client-id',
      defaultParams: {
        __appKeyParam: 'client_id',
        __githubRepo: 'example/recipes',
        __githubPath: 'recipes/'
      },
      dataPath: ''
    }, 1);

    assert.equal(fetchedUrls.length, 2);
    assert.ok(fetchedUrls.every((url) => url.includes('client_id=github-client-id')));
    assert.doesNotMatch(JSON.stringify(preview), /github-client-id/);
    assert.match(preview.requestUrl, /client_id=\*\*\*/);
    assert.match(preview.rawRecords[0]?.sourceUrl ?? '', /client_id=\*\*\*/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Proj.Kitchen previews redact dynamic query credentials from list, detail, rows, and raw records', async () => {
  const originalFetch = globalThis.fetch;
  const fetchedUrls: string[] = [];
  globalThis.fetch = (async (input: string | URL | Request) => {
    const url = String(input);
    fetchedUrls.push(url);
    if (url.includes('/recipes/42')) {
      return new Response(JSON.stringify({
        id: 42,
        name: '鱼香肉丝',
        sourceUrl: url,
        client_id: 'proj-client-id'
      }), { headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({ result: { list: [{ id: 42, name: '鱼香肉丝' }] } }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }) as typeof fetch;

  try {
    const preview = await fetchProviderPreview({
      ...provider,
      providerCode: 'proj_kitchen',
      appKey: 'proj-client-id',
      defaultParams: {
        __appKeyParam: 'client_id',
        __syncEndpointUrl: 'https://proj.example.test/recipes',
        __detailEndpointTemplate: 'https://proj.example.test/recipes/{id}'
      }
    }, 1, {}, 'sync');

    assert.equal(fetchedUrls.length, 2);
    assert.ok(fetchedUrls.every((url) => url.includes('client_id=proj-client-id')));
    assert.doesNotMatch(JSON.stringify(preview), /proj-client-id/);
    assert.match(preview.requestUrl, /client_id=\*\*\*/);
    assert.match(preview.rows[0]?.sourceUrl as string, /client_id=\*\*\*/);
    assert.match(preview.rawRecords[0]?.sourceUrl ?? '', /client_id=\*\*\*/);
    assert.equal(preview.rawRecords[0]?.rawJson?.client_id, '***');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('short credentials redact only credential boundaries and preserve business IDs and media paths', async () => {
  const originalFetch = globalThis.fetch;
  let fetchedUrl = '';
  globalThis.fetch = (async (input: string | URL | Request) => {
    fetchedUrl = String(input);
    return new Response(JSON.stringify({
      result: {
        list: [{
          name: '红烧豆腐',
          externalId: '123',
          cover: 'https://cdn.example.test/1.webp',
          client_id: '1'
        }]
      }
    }), { headers: { 'Content-Type': 'application/json' } });
  }) as typeof fetch;

  try {
    const preview = await fetchProviderPreview({
      ...provider,
      appKey: '1',
      defaultParams: { __appKeyParam: 'client_id', word: '豆腐' }
    }, 1);

    assert.match(fetchedUrl, /client_id=1/);
    assert.match(preview.requestUrl, /client_id=\*\*\*/);
    assert.equal(preview.rows[0]?.externalId, '123');
    assert.equal(preview.rows[0]?.cover, 'https://cdn.example.test/1.webp');
    assert.equal(preview.rows[0]?.client_id, '***');
    const rawResult = preview.rawRecords[0]?.rawJson?.result as Record<string, unknown>;
    const rawList = rawResult.list as Array<Record<string, unknown>>;
    assert.equal(rawList[0]?.externalId, '123');
    assert.equal(rawList[0]?.cover, 'https://cdn.example.test/1.webp');
    assert.equal(rawList[0]?.client_id, '***');
    assert.doesNotMatch(JSON.stringify(preview), /client_id(?:=|%3D)1/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('request snapshots redact dynamic credential fields without changing matching business substrings', () => {
  const sanitizationOptions = getProviderCredentialSanitizationOptions({
    appKey: '1',
    defaultParams: { __appKeyParam: 'client_id' }
  });
  const snapshot = buildSafeRequestSnapshot(
    'GET',
    'https://provider.example.test/1.webp?client_id=1',
    'result.list',
    {
      externalId: '123',
      cover: 'https://cdn.example.test/1.webp',
      client_id: '1'
    },
    '测试来源',
    sanitizationOptions
  );

  assert.equal(snapshot.endpointUrl, 'https://provider.example.test/1.webp?client_id=***');
  assert.equal(snapshot.params.externalId, '123');
  assert.equal(snapshot.params.cover, 'https://cdn.example.test/1.webp');
  assert.equal(snapshot.params.client_id, '***');
});

test('request snapshots derive dynamic credential boundaries from their own control parameters', () => {
  const snapshot = buildSafeRequestSnapshot(
    'GET',
    'https://provider.example.test/1.webp?client_id=1',
    'result.list',
    {
      __appKeyParam: 'client_id',
      client_id: '1',
      externalId: '123',
      cover: 'https://cdn.example.test/1.webp'
    },
    '测试来源'
  );

  assert.equal(snapshot.endpointUrl, 'https://provider.example.test/1.webp?client_id=***');
  assert.equal(snapshot.params.client_id, '***');
  assert.equal(snapshot.params.externalId, '123');
  assert.equal(snapshot.params.cover, 'https://cdn.example.test/1.webp');
});

test('long path credentials stay real for fetch and are redacted from request, row, and raw URLs', async () => {
  const originalFetch = globalThis.fetch;
  let fetchedUrl = '';
  globalThis.fetch = (async (input: string | URL | Request) => {
    fetchedUrl = String(input);
    return new Response(JSON.stringify({
      result: {
        list: [{
          name: '家常豆腐',
          sourceUrl: String(input),
          cover: 'https://cdn.example.test/1.webp'
        }]
      }
    }), { headers: { 'Content-Type': 'application/json' } });
  }) as typeof fetch;

  try {
    const preview = await fetchProviderPreview({
      ...provider,
      authType: 'NONE',
      appKey: 'real-path-api-key',
      endpointUrl: 'https://provider.test/api/real-path-api-key/recipes',
      defaultParams: { word: '豆腐' }
    }, 1);

    assert.match(fetchedUrl, /\/api\/real-path-api-key\/recipes/);
    assert.doesNotMatch(JSON.stringify(preview), /real-path-api-key/);
    assert.match(preview.requestUrl, /\/api\/\*\*\*\/recipes/);
    assert.match(preview.rows[0]?.sourceUrl as string, /\/api\/\*\*\*\/recipes/);
    assert.match(preview.rawRecords[0]?.sourceUrl ?? '', /\/api\/\*\*\*\/recipes/);
    const rawResult = preview.rawRecords[0]?.rawJson?.result as Record<string, unknown>;
    const rawList = rawResult.list as Array<Record<string, unknown>>;
    assert.match(rawList[0]?.sourceUrl as string, /\/api\/\*\*\*\/recipes/);
    assert.equal(preview.rows[0]?.cover, 'https://cdn.example.test/1.webp');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('URL-shaped errors and request snapshots redact long path credentials without changing short media paths', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (input: string | URL | Request) => {
    throw new Error(`network failure for ${String(input)}`);
  }) as typeof fetch;
  const pathProvider = {
    ...provider,
    authType: 'NONE',
    appKey: 'real-path-api-key',
    endpointUrl: 'https://provider.test/api/real-path-api-key/recipes',
    defaultParams: { word: '豆腐' }
  };

  try {
    await assert.rejects(
      fetchProviderPreview(pathProvider, 1),
      (error: Error) => {
        assert.doesNotMatch(error.message, /real-path-api-key/);
        assert.match(error.message, /\/api\/\*\*\*\/recipes/);
        return true;
      }
    );
  } finally {
    globalThis.fetch = originalFetch;
  }

  const snapshot = buildSafeRequestSnapshot(
    'GET',
    pathProvider.endpointUrl,
    'result.list',
    {
      cover: 'https://cdn.example.test/1.webp',
      businessUrl: 'https://cdn.example.test/prefix-real-path-api-key-suffix/cover.webp'
    },
    '测试来源',
    getProviderCredentialSanitizationOptions(pathProvider)
  );
  assert.equal(snapshot.endpointUrl, 'https://provider.test/api/***/recipes');
  assert.equal(snapshot.params.cover, 'https://cdn.example.test/1.webp');
  assert.equal(
    snapshot.params.businessUrl,
    'https://cdn.example.test/prefix-real-path-api-key-suffix/cover.webp'
  );

  const encodedPathProvider = {
    ...pathProvider,
    appKey: '中文路径密钥-abcdef',
    endpointUrl: `https://provider.test/api/${encodeURIComponent('中文路径密钥-abcdef')}/recipes`
  };
  const encodedSnapshot = buildSafeRequestSnapshot(
    'GET',
    encodedPathProvider.endpointUrl,
    'result.list',
    {},
    '测试来源',
    getProviderCredentialSanitizationOptions(encodedPathProvider)
  );
  assert.equal(encodedSnapshot.endpointUrl, 'https://provider.test/api/***/recipes');
});
