import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const basketService = await readFile(new URL('../src/services/basket.ts', import.meta.url), 'utf8');
const publicApi = await readFile(new URL('../src/services/public-api.ts', import.meta.url), 'utf8');

test('basket writes preserve public ingredient IDs instead of coercing them to numbers', () => {
  assert.match(basketService, /ingredientId\?: string \| null/);
  assert.match(basketService, /ingredientId:\s*item\.ingredientId \?\? null/);
  assert.doesNotMatch(basketService, /ingredientId:\s*item\.ingredientId \? Number\(item\.ingredientId\) : null/);
});

test('mobile basket create payload accepts public string ingredient IDs', () => {
  const createPayload = publicApi.slice(
    publicApi.indexOf('export const addMobileBasketItem'),
    publicApi.indexOf('export const updateMobileBasketItem')
  );

  assert.match(createPayload, /ingredientId\?: string \| number \| null/);
});

test('basket response boundary exposes stable public string ingredient IDs without numeric reads', async () => {
  const basketPage = await readFile(new URL('../src/pages/basket/index.vue', import.meta.url), 'utf8');

  assert.match(publicApi, /ingredientId: string \| null/);
  assert.match(basketService, /ingredientId\?: string \| null/);
  assert.doesNotMatch(basketPage, /Number\(item\.ingredientId\)/);
});

test('basket checkout carries public ingredient IDs into price-record writes', async () => {
  const priceService = await readFile(new URL('../src/services/price.ts', import.meta.url), 'utf8');

  assert.match(priceService, /ingredientId: string \| number/);
});
