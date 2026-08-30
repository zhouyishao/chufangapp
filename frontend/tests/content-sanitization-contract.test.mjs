import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('home keeps valid named content with media fallback and hides invalid records', async () => {
  const source = await read('src/components/home-modules/PrototypeHomeModules.vue');

  assert.match(source, /isRenderableItem/);
  assert.match(source, /isItemCompatibleWithModule/);
  assert.match(source, /sanitizedModules/);
  assert.match(source, /supportsTextMediaFallback/);
  assert.match(source, /recipe.*beverage/);
  assert.doesNotMatch(source, /\?\s*['"]内容待配置['"]/);
});

test('category filters items without a usable id, title or content type', async () => {
  const source = await read('src/pages/ingredients/index.vue');

  assert.match(source, /isRenderableContentItem/);
  assert.doesNotMatch(source, /item\.title \?\? item\.name \?\? ['"]未命名['"]/);
  assert.doesNotMatch(source, /该内容暂未配置跳转/);
});

test('basket prefers the linked ingredient name over legacy generic labels', async () => {
  const source = await read('src/services/basket.ts');

  assert.match(source, /resolveBasketItemName/);
  assert.match(source, /item\.ingredient\?\.name/);
});
