import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const mobileRoute = readFileSync(resolve('src/routes/api/mobile.ts'), 'utf8');

test('basket item creation deduplicates both linked and unlinked recipe ingredients', () => {
  const createBlock = mobileRoute.slice(
    mobileRoute.indexOf("apiMobileRouter.post('/basket-items'"),
    mobileRoute.indexOf("apiMobileRouter.put('/basket-items/:id'")
  );

  assert.match(createBlock, /ingredientId:\s*parsed\.data\.ingredientId \?\? null/);
  assert.match(createBlock, /name:\s*parsed\.data\.name/);
  assert.doesNotMatch(createBlock, /const existing = parsed\.data\.ingredientId\s*\?/);
});
