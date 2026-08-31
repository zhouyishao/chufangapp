import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';

const readSource = (path: string) => readFile(join(process.cwd(), path), 'utf8');

test('ingredient and beverage models persist optional transparent product images', async () => {
  const schema = await readSource('prisma/schema.prisma');
  const migration = await readSource('prisma/migrations/20260812143000_add_transparent_product_images/migration.sql');

  assert.match(schema, /transparentImage\s+String\?/);
  assert.match(schema, /transparentImageFileId\s+Int\?/);
  assert.match(schema, /IngredientTransparentImage/);
  assert.match(schema, /BeverageTransparentImage/);
  assert.match(migration, /ingredients[\s\S]*transparent_image/);
  assert.match(migration, /beverages[\s\S]*transparent_image/);
});

test('admin ingredient and beverage routes resolve and lock transparent image files', async () => {
  for (const route of ['src/routes/admin/ingredients.ts', 'src/routes/admin/beverages.ts']) {
    const source = await readSource(route);
    assert.match(source, /transparentImage:\s*z\.string/);
    assert.match(source, /transparentImageFileId:\s*z\.coerce\.number/);
    assert.match(source, /resolveActiveFileId\(tx, parsed\.data\.transparentImageFileId, parsed\.data\.transparentImage\)/);
    assert.match(source, /lockActiveMediaFiles\(tx,[\s\S]*transparentImageFileId/);
  }
});

test('recipe detail exposes transparent ingredient images', async () => {
  const source = await readSource('src/routes/api/recipes.ts');
  assert.match(source, /ingredient:\s*\{\s*select:\s*\{\s*cover:\s*true,\s*transparentImage:\s*true\s*\}\s*\}/);
});
