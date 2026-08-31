import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const readSource = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('recipe ingredient editor never treats free text as a resource link', async () => {
  const page = await readSource('./RecipeFormPage.tsx');
  assert.match(page, /ingredientId:\s*null/);
  assert.match(page, /transparentImage/);
  assert.match(page, /请选择资源库食材/);
  assert.match(page, /食材缺少透明图/);
  assert.match(page, /已关联/);
});

test('recipe ingredient selection returns presentation fields', async () => {
  const page = await readSource('./RecipeFormPage.tsx');
  assert.match(page, /onSelectIngredient:\s*\(ing:\s*\{[\s\S]*transparentImage/);
  assert.match(page, /resolveAssetUrl\(item\.transparentImage/);
});

test('non-draft recipe states validate the first invalid ingredient before saving', async () => {
  const page = await readSource('./RecipeFormPage.tsx');
  assert.match(page, /intent === 'submit' \|\| requiresQualifiedIngredients\(finalDraft\)/);
  assert.match(page, /食材“\$\{invalidItem\.name\.trim\(\)\}”/);
});

test('ingredient binding only searches active resources and preserves unavailable associations as invalid', async () => {
  const page = await readSource('./RecipeFormPage.tsx');
  const types = await readSource('../types.ts');

  assert.match(page, /listIngredients\(\{ q, pageSize: 8, status: 'ACTIVE' \}\)/);
  assert.match(page, /关联食材不可用/);
  assert.match(page, /ingredientStatus === 'UNAVAILABLE'/);
  assert.match(types, /'LINKED' \| 'UNLINKED' \| 'MISSING_TRANSPARENT_IMAGE' \| 'UNAVAILABLE'/);
});
