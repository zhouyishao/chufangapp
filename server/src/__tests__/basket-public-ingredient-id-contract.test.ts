import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';

const readMobileRoute = () => readFile(join(process.cwd(), 'src/routes/api/mobile.ts'), 'utf8');

test('basket creation resolves a public ingredient ID to an active internal ingredient ID', async () => {
  const source = await readMobileRoute();
  const createBlock = source.slice(
    source.indexOf("apiMobileRouter.post('/basket-items'"),
    source.indexOf("apiMobileRouter.put('/basket-items/:id'")
  );

  assert.match(createBlock, /ingredientId:\s*z\.union\(\[z\.coerce\.number\(\)\.int\(\)\.positive\(\), z\.string\(\)\.trim\(\)\.min\(1\)\]\)\.nullable\(\)\.optional\(\)/);
  assert.match(createBlock, /buildPublicIdWhere\(parsed\.data\.ingredientId\)/);
  assert.match(createBlock, /deletedAt:\s*null/);
  assert.match(createBlock, /status:\s*'ACTIVE'/);
  assert.match(createBlock, /const ingredientId = ingredient\?\.id \?\? null/);
  assert.match(createBlock, /ingredientId:\s*ingredientId/);
});

test('basket creation rejects an invalid public ingredient ID before deduplication or writes', async () => {
  const source = await readMobileRoute();
  const createBlock = source.slice(
    source.indexOf("apiMobileRouter.post('/basket-items'"),
    source.indexOf("apiMobileRouter.put('/basket-items/:id'")
  );

  assert.match(createBlock, /throw new HttpError\('食材不存在或不可用', 422, 422\)/);
  assert.match(createBlock, /ingredientId:\s*ingredientId,\n\s*name:\s*parsed\.data\.name/);
});

test('basket responses present ingredient IDs through the shared public-ID serializer', async () => {
  const source = await readMobileRoute();

  assert.match(source, /import \{ presentPurchaseItem \} from '..\/..\/services\/purchase-item-presentation'/);
  assert.match(source, /bizId:\s*true/);
  assert.match(source, /code:\s*true/);
  assert.match(source, /rows\.map\(presentPurchaseItem\)/);
  assert.match(source, /res\.json\(ok\(presentPurchaseItem\(item\)\)\)/);
});

test('price records accept the same public ingredient ID emitted by basket responses', async () => {
  const source = await readMobileRoute();
  const getPriceRoute = source.slice(
    source.indexOf("apiMobileRouter.get('/ingredient-price-records'"),
    source.indexOf("apiMobileRouter.post('/ingredient-price-records'")
  );
  const postPriceRoute = source.slice(
    source.indexOf("apiMobileRouter.post('/ingredient-price-records'"),
    source.indexOf("apiMobileRouter.delete('/ingredient-price-records'")
  );

  assert.match(getPriceRoute, /buildPublicIdWhere\(parsed\.data\.ingredientId\)/);
  assert.match(postPriceRoute, /buildPublicIdWhere\(parsed\.data\.ingredientId\)/);
  assert.match(postPriceRoute, /食材不存在或不可用/);
});
