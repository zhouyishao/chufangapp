import assert from 'node:assert/strict';
import test from 'node:test';
import { createOrLoadByUniqueKey } from '../services/idempotent-create';

test('returns the existing record when a concurrent create loses the unique-key race', async () => {
  const existing = { id: 12, dedupeKey: 'meal-ready:1:request-123' };
  let loadCount = 0;

  const result = await createOrLoadByUniqueKey({
    load: async () => {
      loadCount += 1;
      return loadCount === 1 ? null : existing;
    },
    create: async () => {
      throw Object.assign(new Error('Unique constraint failed'), { code: 'P2002' });
    }
  });

  assert.deepEqual(result, existing);
  assert.equal(loadCount, 2);
});

test('rethrows non-unique create failures', async () => {
  const failure = new Error('database unavailable');

  await assert.rejects(
    createOrLoadByUniqueKey({
      load: async () => null,
      create: async () => {
        throw failure;
      }
    }),
    failure
  );
});
