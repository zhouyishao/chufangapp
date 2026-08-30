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

  assert.match(submitAuditRoute, /const updated = await prisma\.\$transaction\(async \(tx\) =>/);
  assert.match(submitAuditRoute, /getLockedRecipeWithIngredientsForQuality\(tx, req\.params\.id\)/);
  assert.match(submitAuditRoute, /assertRecipeIngredientPublishable\(existing\.ingredients\)/);
  assert.match(submitAuditRoute, /tx\.recipe\.update/);
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

  assert.match(publishRoute, /const offline = await prisma\.\$transaction\(async \(tx\) =>/);
  assert.match(publishRoute, /const existing = await getExistingRecipeInTransaction\(tx, req\.params\.id\);\s*await lockRecipeRowForWrite\(tx, existing\.id\)/);
  assert.match(publishRoute, /const updated = await prisma\.\$transaction\(async \(tx\) =>/);
  assert.match(publishRoute, /getLockedRecipeWithIngredientsForQuality\(tx, req\.params\.id\)/);
  assert.match(publishRoute, /assertRecipeIngredientPublishable\(existing\.ingredients\)/);
  assert.match(publishRoute, /tx\.recipe\.update/);
  assert.match(auditRoute, /if \(parsed\.data\.auditStatus === 'APPROVED'\) \{[\s\S]*?getLockedRecipeWithIngredientsForQuality\(tx, req\.params\.id\)/);
  assert.match(auditRoute, /if \(parsed\.data\.auditStatus === 'APPROVED'\) \{[\s\S]*?assertRecipeIngredientPublishable\(existing\.ingredients\)/);
  assert.match(auditRoute, /if \(!parsed\.data\.rejectReason\) throw new HttpError\('驳回原因不能为空', 422, 422\);[\s\S]*?prisma\.\$transaction\(async \(tx\) =>/);
  assert.match(auditRoute, /const existing = await getExistingRecipeInTransaction\(tx, req\.params\.id\);\s*await lockRecipeRowForWrite\(tx, existing\.id\)/);
});

test('quality-gated recipe status transitions lock then re-read linked ingredients', async () => {
  const source = await readSource('src/routes/admin/recipes.ts');

  assert.match(source, /const getLockedRecipeWithIngredientsForQuality = async/);
  assert.match(source, /const initial = await getRecipeWithIngredients\(tx, value\)/);
  assert.match(source, /await lockRecipeRowForWrite\(tx, initial\.id\)/);
  assert.match(source, /await lockRecipeIngredientRowsForWrite\(tx, initial\.ingredients\.map\(\(item\) => item\.ingredientId\)\)/);
  assert.match(source, /const refreshed = await getRecipeWithIngredients\(tx, value\)/);
  assert.match(source, /name: item\.ingredient\?\.name \?\? item\.name/);
});

test('recipe writes lock and re-read linked ingredients inside their transaction before quality checks', async () => {
  const source = await readSource('src/routes/admin/recipes.ts');
  const createRoute = source.slice(
    source.indexOf("adminRecipesRouter.post('/',"),
    source.indexOf("adminRecipesRouter.put('/:id',")
  );
  const updateRoute = source.slice(
    source.indexOf("adminRecipesRouter.put('/:id',"),
    source.indexOf("adminRecipesRouter.delete('/:id',")
  );

  for (const route of [createRoute, updateRoute]) {
    const transactionIndex = route.indexOf('prisma.$transaction');
    const beforeTransaction = route.slice(0, transactionIndex);
    const transaction = route.slice(transactionIndex);

    assert.doesNotMatch(beforeTransaction, /resolveRecipeIngredients|assertPublishableIngredients/);
    assert.match(transaction, /const initialRecipeIngredients = await resolveRecipeIngredients\(tx, parsed\.data\.ingredients\)/);
    assert.match(transaction, /await lockRecipeIngredientRowsForWrite\(tx, initialRecipeIngredients\.map\(\(item\) => item\.ingredientId\)\)/);
    assert.match(transaction, /const resolvedIngredients = await resolveRecipeIngredients\(tx, parsed\.data\.ingredients\)/);
    assert.match(transaction, /assertPublishableIngredients\(parsed\.data, resolvedIngredients\)/);
    assert.match(transaction, /const ingredients = toRecipeIngredientWrites\(resolvedIngredients\)/);
  }
});
