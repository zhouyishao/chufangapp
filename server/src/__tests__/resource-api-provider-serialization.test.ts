import assert from 'node:assert/strict';
import test from 'node:test';

import {
  resolveProviderEndpointUrl,
  resolveProviderJsonConfig,
  resolveProviderAppKey,
  serializeProvider
} from '../routes/admin/resource-api-providers';

test('provider serialization keeps application keys and encrypted secrets server-side', () => {
  const serialized = serializeProvider({
    id: 1,
    providerCode: 'tianapi_caipu',
    resourceType: 'RECIPE',
    appKey: 'app-key-must-not-leave-server',
    encryptedSecret: 'encrypted-secret-must-not-leave-server',
    lastSyncedAt: null,
    lastTestedAt: null,
    createdAt: new Date('2026-08-25T00:00:00.000Z'),
    updatedAt: new Date('2026-08-25T00:00:00.000Z'),
    _count: { importBatches: 0 }
  });

  assert.equal('appKey' in serialized, false);
  assert.equal('encryptedSecret' in serialized, false);
  assert.equal(serialized.hasSecret, true);
  assert.equal(serialized.recipeSourceRole, 'SUPPLEMENTAL');
});

test('provider updates keep an omitted application key and clear an explicit null key', () => {
  assert.equal(resolveProviderAppKey(undefined, 'saved-key'), 'saved-key');
  assert.equal(resolveProviderAppKey(null, 'saved-key'), null);
  assert.equal(resolveProviderAppKey('replacement-key', 'saved-key'), 'replacement-key');
});

test('provider serialization redacts JSON credentials and update placeholders retain existing configuration', () => {
  const serialized = serializeProvider({
    id: 1,
    providerCode: 'tianapi_caipu',
    resourceType: 'RECIPE',
    defaultHeaders: {
      Authorization: 'Bearer real-header-token',
      'X-Api-Key': 'real-header-key',
      Cookie: 'session=real-cookie',
      'Set-Cookie': 'csrf=real-set-cookie'
    },
    defaultParams: { token: 'real-param-token', word: '豆腐' },
    lastSyncedAt: null,
    lastTestedAt: null,
    createdAt: new Date('2026-08-25T00:00:00.000Z'),
    updatedAt: new Date('2026-08-25T00:00:00.000Z'),
    _count: { importBatches: 0 }
  });

  assert.doesNotMatch(
    JSON.stringify(serialized),
    /real-header-token|real-header-key|real-param-token|real-cookie|real-set-cookie/
  );
  assert.deepEqual(resolveProviderJsonConfig(
    { Authorization: '***', Cookie: '***', 'Set-Cookie': '***', nested: { token: '***', page: 2 } },
    {
      Authorization: 'Bearer saved',
      Cookie: 'session=saved',
      'Set-Cookie': 'csrf=saved',
      nested: { token: 'saved-token', page: 1 }
    }
  ), {
    Authorization: 'Bearer saved',
    Cookie: 'session=saved',
    'Set-Cookie': 'csrf=saved',
    nested: { token: 'saved-token', page: 2 }
  });
  assert.deepEqual(resolveProviderJsonConfig(undefined, { token: 'saved-token' }), { token: 'saved-token' });
  assert.equal(resolveProviderJsonConfig(null, { token: 'saved-token' }), null);
  assert.deepEqual(resolveProviderJsonConfig(
    { sourceUrl: 'https://provider.example/data?signature=***&page=2' },
    { sourceUrl: 'https://provider.example/data?signature=saved-signature&page=1' }
  ), { sourceUrl: 'https://provider.example/data?signature=saved-signature&page=2' });
  assert.equal(
    resolveProviderEndpointUrl(
      'https://provider.example/recipes?token=***&word=%E9%B1%BC',
      'https://provider.example/recipes?token=saved-token&word=%E9%B1%BC'
    ),
    'https://provider.example/recipes?token=saved-token&word=%E9%B1%BC'
  );
});

test('provider serialization redacts dynamically configured credential fields', () => {
  const serialized = serializeProvider({
    id: 2,
    providerCode: 'custom_provider',
    resourceType: 'INGREDIENT',
    appKey: 'real-client-id',
    encryptedSecret: 'encrypted-real-secret',
    endpointUrl: 'https://provider.example/resources?client_id=real-client-id',
    defaultHeaders: { 'X-Private-Partner': 'real-header-secret' },
    defaultParams: {
      __appKeyParam: 'client_id',
      __secretHeader: 'X-Private-Partner'
    },
    lastSyncedAt: null,
    lastTestedAt: null,
    createdAt: new Date('2026-08-25T00:00:00.000Z'),
    updatedAt: new Date('2026-08-25T00:00:00.000Z'),
    _count: { importBatches: 0 }
  });

  assert.doesNotMatch(JSON.stringify(serialized), /real-client-id|real-header-secret/);
  assert.match(serialized.endpointUrl, /client_id=\*\*\*/);
  assert.equal((serialized.defaultHeaders as Record<string, unknown>)['X-Private-Partner'], '***');
});

test('provider serialization redacts a long application key used as a complete endpoint path segment', () => {
  const serialized = serializeProvider({
    id: 3,
    providerCode: 'path_key_provider',
    resourceType: 'INGREDIENT',
    appKey: 'real-path-api-key',
    encryptedSecret: null,
    endpointUrl: 'https://provider.test/api/real-path-api-key/recipes',
    defaultHeaders: null,
    defaultParams: null,
    lastSyncedAt: null,
    lastTestedAt: null,
    createdAt: new Date('2026-08-25T00:00:00.000Z'),
    updatedAt: new Date('2026-08-25T00:00:00.000Z'),
    _count: { importBatches: 0 }
  });

  assert.equal(serialized.endpointUrl, 'https://provider.test/api/***/recipes');
  assert.doesNotMatch(JSON.stringify(serialized), /real-path-api-key/);
});
