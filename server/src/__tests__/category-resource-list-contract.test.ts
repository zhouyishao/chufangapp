import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';

const readSource = (path: string) => readFile(join(process.cwd(), path), 'utf8');

test('category page reads published resources instead of requiring an operations module', async () => {
  const source = await readSource('src/routes/api/page-modules.ts');

  assert.match(source, /loadCategoryResourceItems/);
  assert.match(source, /prisma\.ingredient\.findMany/);
  assert.match(source, /prisma\.recipe\.findMany/);
  assert.match(source, /prisma\.beverage\.findMany/);
  assert.match(source, /collectDescendantCategoryIds/);
  assert.match(source, /categoryId:\s*\{\s*in:\s*categoryIds\s*\}/);
  assert.match(source, /isPublish:\s*true/);
  assert.match(source, /status:\s*'ACTIVE'/);
  assert.match(source, /categoryResourceItems/);
});

test('category resource loading uses one shared path for every C-end content type', async () => {
  const source = await readSource('src/routes/api/page-modules.ts');

  for (const type of ['recipe', 'ingredient', 'fruit', 'seasoning', 'beverage']) {
    assert.match(source, new RegExp(`['\"]${type}['\"]`));
  }
  assert.match(source, /const dbCategoryType = categoryTypeMap\[contentType\]/);
  assert.match(source, /loadCategoryResourceItems\(\s*contentType as CategoryContentType/);
});

test('category recommendation aggregates published resources instead of home operation modules', async () => {
  const source = await readSource('src/routes/api/page-modules.ts');

  assert.match(source, /collectCategoryTypeIds/);
  assert.match(source, /moduleKey:\s*`category-recommend-\$\{contentType\}`/);
  assert.match(source, /contentSource:\s*'CATEGORY_RESOURCE'/);
  assert.match(source, /else if \(pageParam === 'category'\)/);
});

test('category navigation excludes empty categories and uses compact display labels', async () => {
  const source = await readSource('src/routes/api/page-modules.ts');

  assert.match(source, /loadCategoryResourceCategoryIds/);
  assert.match(source, /collectVisibleCategoryIds/);
  assert.match(source, /getCategoryNavigationName/);
});
