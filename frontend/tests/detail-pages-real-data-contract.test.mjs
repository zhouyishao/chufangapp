import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const readSource = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('all content detail pages use real detail services and shared actions', async () => {
  const pages = [
    ['../src/pages/recipe-detail/index.vue', /getRecipe\(/],
    ['../src/pages/ingredient-detail/index.vue', /getIngredient\(/],
    ['../src/pages/fruit-detail/index.vue', /getIngredient\(/],
    ['../src/pages/beverage-detail/index.vue', /getBeverage\(/],
    ['../src/pages/seasoning-detail/index.vue', /getIngredient\(/]
  ];

  for (const [path, loader] of pages) {
    const source = await readSource(path);
    assert.match(source, loader, `${path} must load its detail from the API`);
    assert.match(source, /ContentDetailState/, `${path} must use the shared detail state`);
    assert.match(source, /getContentDetailErrorMessage/, `${path} must map API errors to reader-friendly copy`);
    assert.match(source, /@action="[A-Za-z][A-Za-z]+"/, `${path} must expose a retry entry`);
    assert.match(source, /ContentDetailBottomBar/, `${path} must use the shared safe-area action bar`);
  }
});

test('fruit, seasoning and beverage detail pages expose shared favorite and basket actions', async () => {
  for (const path of [
    '../src/pages/fruit-detail/index.vue',
    '../src/pages/seasoning-detail/index.vue',
    '../src/pages/beverage-detail/index.vue'
  ]) {
    const source = await readSource(path);
    assert.match(source, /useContentActions/);
    assert.match(source, /targetType:\s*'(?:FRUIT|SEASONING|BEVERAGE)'/);
    assert.match(source, /toggleFavorite/);
    assert.match(source, /toggleBasket/);
  }
});

test('recipe and beverage step data preserve media and timer fields', async () => {
  const apiSource = await readSource('../src/services/public-api.ts');
  const cookingSource = await readSource('../src/pages/cooking/index.vue');

  assert.match(apiSource, /media\?:\s*\{/);
  assert.match(apiSource, /timerSeconds\?:\s*number/);
  assert.match(apiSource, /getRecipeGuidedFlow/);
  assert.match(apiSource, /getBeverageGuidedFlow/);
  assert.match(cookingSource, /timerSeconds/);
  assert.match(cookingSource, /media\?\.url/);
  assert.match(cookingSource, /<video/);
  assert.match(cookingSource, /mediaMimeType/);
  assert.match(cookingSource, /下一步|上一步/);
});
