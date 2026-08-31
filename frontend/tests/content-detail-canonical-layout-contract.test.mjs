import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('recipe and ingredient details finish with a canonical prototype layout layer', async () => {
  const recipePage = await read('src/pages/recipe-detail/index.vue');
  const ingredientPage = await read('src/pages/ingredient-detail/index.vue');
  assert.match(recipePage, /src="\.\/canonical\.scss"/);
  assert.match(ingredientPage, /src="\.\/canonical\.scss"/);

  const recipeStyle = await read('src/pages/recipe-detail/canonical.scss');
  assert.match(recipeStyle, /\.recipe-info-card/);
  assert.match(recipeStyle, /\.ingredients-grid/);
  assert.match(recipeStyle, /grid-template-columns:\s*repeat\(4/);
  assert.doesNotMatch(recipeStyle, /\.bottom-fixed-bar[\s\S]*display:\s*none/);
  assert.match(recipeStyle, /\.recipe-detail-sheet/);
  assert.match(recipeStyle, /\.recipe-sheet-safe-zone/);
  assert.doesNotMatch(recipeStyle, /font-size:\s*\d/);

  const ingredientStyle = await read('src/pages/ingredient-detail/canonical.scss');
  assert.match(ingredientStyle, /\.ingredient-heading/);
  assert.match(ingredientStyle, /\.ingredient-info-strip/);
  assert.match(ingredientStyle, /\.guide-item__dot/);
  assert.match(ingredientStyle, /\.recipe-item__image[\s\S]*aspect-ratio:\s*1/);
  assert.match(ingredientStyle, /\.bottom-actions[\s\S]*display:\s*none/);
  assert.doesNotMatch(ingredientStyle, /font-size:\s*\d/);
});

test('fruit beverage and seasoning details use the same compact content rhythm', async () => {
  const sharedStyle = await read('src/styles/content-detail-canonical.scss');
  assert.match(sharedStyle, /\.identity-section/);
  assert.match(sharedStyle, /\.guide-tabs/);
  assert.match(sharedStyle, /\.related-card/);
  assert.match(sharedStyle, /\.detail-bottom-action[\s\S]*display:\s*none/);
  assert.doesNotMatch(sharedStyle, /font-size:\s*\d/);

  for (const page of [
    'src/pages/fruit-detail/index.vue',
    'src/pages/beverage-detail/index.vue',
    'src/pages/seasoning-detail/index.vue'
  ]) {
    assert.match(await read(page), /content-detail-canonical\.scss/);
  }
});
