import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const readSource = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('recipe ingredients use only linked transparent images', async () => {
  const page = await readSource('../src/pages/recipe-detail/index.vue');
  const api = await readSource('../src/services/public-api.ts');

  assert.doesNotMatch(page, /enrichIngredientCovers/);
  assert.doesNotMatch(page, /listIngredients/);
  assert.doesNotMatch(page, /item\.ingredient\?\.cover/);
  assert.match(page, /item\.ingredient\?\.transparentImage/);
  assert.match(page, /mode="aspectFit"/);
  assert.match(api, /categoryType:\s*'INGREDIENT'\s*\|\s*'FRUIT'\s*\|\s*'SEASONING'/);
});

test('recipe ingredient strip is horizontal, transparent and navigable', async () => {
  const page = await readSource('../src/pages/recipe-detail/index.vue');

  assert.match(page, /<scroll-view[\s\S]*scroll-x/);
  assert.match(page, /goToIngredientDetail\(item\)/);
  assert.match(page, /categoryType\s*===\s*'FRUIT'/);
  assert.match(page, /categoryType\s*===\s*'SEASONING'/);
  assert.match(page, /\.ingredient-card\s*\{[\s\S]*background:\s*transparent/);
  assert.match(page, /\.ingredient-img\s*\{[\s\S]*background:\s*transparent/);
  assert.match(page, /\.ingredient-img-fallback\s*\{[\s\S]*background:\s*transparent/);
});
