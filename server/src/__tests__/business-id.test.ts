import assert from 'node:assert/strict';
import test from 'node:test';

import { buildPublicIdWhere } from '../lib/business-id';

test('buildPublicIdWhere resolves numeric database ids directly', () => {
  assert.deepEqual(buildPublicIdWhere('11'), { id: 11 });
});

test('buildPublicIdWhere resolves legacy generated public ids by bizId or numeric fallback', () => {
  assert.deepEqual(buildPublicIdWhere('ingredient_000011'), {
    OR: [{ bizId: 'ingredient_000011' }, { id: 11 }]
  });
  assert.deepEqual(buildPublicIdWhere('top_nav_000002'), {
    OR: [{ bizId: 'top_nav_000002' }, { id: 2 }]
  });
});

test('buildPublicIdWhere keeps opaque public ids on the bizId path', () => {
  assert.deepEqual(buildPublicIdWhere('ingredient_9f0a7bcde123456789ab'), {
    bizId: 'ingredient_9f0a7bcde123456789ab'
  });
});
