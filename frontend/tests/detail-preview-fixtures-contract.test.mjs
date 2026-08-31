import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('detail preview fixtures are development-only and require an explicit preview route', async () => {
  const source = await read('src/dev/detail-preview-fixtures.ts');

  assert.match(source, /import\.meta\.env\.DEV/);
  assert.match(source, /preview-\$\{kind\}/);
  assert.match(source, /preview.*===\s*['"]1['"]/s);
  assert.match(source, /recipe:/);
  assert.match(source, /ingredient:/);
  assert.match(source, /fruit:/);
  assert.match(source, /beverage:/);
  assert.match(source, /seasoning:/);
});

test('all five public detail pages opt into preview fixtures without replacing their real API loader', async () => {
  const pages = [
    ['src/pages/recipe-detail/index.vue', 'recipe', /getRecipe\(/],
    ['src/pages/ingredient-detail/index.vue', 'ingredient', /getIngredient\(/],
    ['src/pages/fruit-detail/index.vue', 'fruit', /getIngredient\(/],
    ['src/pages/beverage-detail/index.vue', 'beverage', /getBeverage\(/],
    ['src/pages/seasoning-detail/index.vue', 'seasoning', /getIngredient\(/]
  ];

  for (const [path, kind, realLoader] of pages) {
    const source = await read(path);
    assert.match(source, /getDetailPreviewFixture/);
    assert.match(source, new RegExp(`['"]${kind}['"]`));
    assert.match(source, realLoader);
  }
});

test('optional favorite and basket state never blocks non-recipe detail content', async () => {
  for (const path of [
    'src/pages/fruit-detail/index.vue',
    'src/pages/beverage-detail/index.vue',
    'src/pages/seasoning-detail/index.vue'
  ]) {
    const source = await read(path);
    assert.match(source, /void syncActions\(\)\.catch\(\(\) => undefined\)/);
    assert.doesNotMatch(source, /await syncActions\(\)/);
  }
});
