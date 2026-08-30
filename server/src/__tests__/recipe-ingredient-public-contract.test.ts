import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';

test('public recipe detail serializes the linked ingredient as the source of truth', async () => {
  const source = await readFile(join(process.cwd(), 'src/routes/api/recipes.ts'), 'utf8');

  assert.match(source, /serializeRecipeIngredient/);
  assert.match(source, /getPublicId\('ingredient', item\.ingredient\)/);
  assert.match(source, /name:\s*item\.ingredient\.name/);
  assert.match(source, /transparentImage:\s*item\.ingredient\.transparentImage/);
  assert.match(source, /categoryType:\s*item\.ingredient\.category\?\.type/);
  assert.match(source, /if \(!item\.ingredient\).*ingredientId: null, ingredient: null/s);
  assert.doesNotMatch(source, /ingredient:\s*\{\s*select:\s*\{\s*cover:\s*true/);
});
