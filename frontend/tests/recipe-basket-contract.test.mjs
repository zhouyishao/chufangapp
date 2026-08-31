import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const recipePage = await readFile(new URL('../src/pages/recipe-detail/index.vue', import.meta.url), 'utf8');
const basketService = await readFile(new URL('../src/services/basket.ts', import.meta.url), 'utf8');

test('recipe ingredients keep real ingredient ids and use the legacy recipe id for basket identity', () => {
  assert.match(recipePage, /ingredientId\?: number \| string/);
  assert.match(recipePage, /ingredientId: item\.ingredientId/);
  assert.match(recipePage, /currentRecipeLegacyId\.value \? String\(currentRecipeLegacyId\.value\)/);
});

test('bulk recipe basket writes share one scope and verify one final read before success', () => {
  assert.match(basketService, /export const addBasketItems/);
  assert.match(basketService, /for \(const item of items\)/);
  assert.match(recipePage, /addBasketItems/);

  const bulkBlock = recipePage.slice(
    recipePage.indexOf('const toggleMainIngredientsInBasket = async () =>'),
    recipePage.indexOf('const getBasketKey')
  );
  assert.doesNotMatch(bulkBlock, /Promise\.all\(pendingIngredients/);
  assert.match(bulkBlock, /every/);
  assert.match(bulkBlock, /主食材加入不完整/);
});
