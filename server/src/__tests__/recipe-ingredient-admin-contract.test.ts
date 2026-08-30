import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';

const readSource = (path: string) => readFile(join(process.cwd(), path), 'utf8');

test('admin recipe writes canonical linked ingredient data and validates quality-gated writes', async () => {
  const source = await readSource('src/routes/admin/recipes.ts');

  assert.match(source, /const resolveIngredient = async/);
  assert.match(source, /name:\s*ingredient\?\.name\s*\?\?\s*item\.name/);
  assert.match(source, /getRecipeIngredientPublishIssues/);
  assert.match(source, /parsed\.isPublish\s*\|\|\s*parsed\.auditStatus\s*===\s*'APPROVED'\s*\|\|\s*parsed\.auditStatus\s*===\s*'PENDING'/);
  assert.match(source, /throw new HttpError\(formatRecipeIngredientPublishError\(issues\), 422, 422\)/);
});

test('admin recipe detail includes linked ingredient presentation data', async () => {
  const source = await readSource('src/routes/admin/recipes.ts');

  assert.match(source, /transparentImage:\s*true/);
  assert.match(source, /category:\s*\{\s*select:\s*\{\s*type:\s*true/);
  assert.match(source, /ingredientStatus/);
});

test('submitting a recipe for audit validates existing linked ingredient quality', async () => {
  const source = await readSource('src/routes/admin/recipes.ts');
  const submitAuditRoute = source.slice(
    source.indexOf("adminRecipesRouter.patch('/:id/submit-audit'"),
    source.indexOf("adminRecipesRouter.patch('/:id/recommend'")
  );

  assert.match(submitAuditRoute, /include:\s*includeRecipeRelations/);
  assert.match(submitAuditRoute, /assertRecipeIngredientPublishable\(existing\.ingredients\)/);
});

test('approving or publishing a recipe validates existing linked ingredient quality', async () => {
  const source = await readSource('src/routes/admin/recipes.ts');
  const publishRoute = source.slice(
    source.indexOf("adminRecipesRouter.patch('/:id/publish'"),
    source.indexOf("adminRecipesRouter.patch('/:id/offline'")
  );
  const auditRoute = source.slice(
    source.indexOf("adminRecipesRouter.patch('/:id/audit'"),
    source.indexOf("adminRecipesRouter.get('/:id/beverages'")
  );

  assert.match(publishRoute, /getExistingRecipeWithIngredients\(req\.params\.id\)/);
  assert.match(publishRoute, /assertRecipeIngredientPublishable\(existing\.ingredients\)/);
  assert.match(auditRoute, /getExistingRecipeWithIngredients\(req\.params\.id\)/);
  assert.match(auditRoute, /if \(parsed\.data\.auditStatus === 'APPROVED'\) \{\s*assertRecipeIngredientPublishable\(existing\.ingredients\)/);
});
