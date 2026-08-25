import assert from 'node:assert/strict';
import test from 'node:test';

import { serializeProvider } from '../routes/admin/resource-api-providers';

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
