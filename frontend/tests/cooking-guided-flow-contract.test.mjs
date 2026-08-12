import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('cooking preview uses the explicit development-only guided flow fixture', async () => {
  const cooking = await read('src/pages/cooking/index.vue');
  const fixtures = await read('src/dev/detail-preview-fixtures.ts');

  assert.match(cooking, /getGuidedFlowPreviewFixture/);
  assert.match(cooking, /previewOptions/);
  assert.match(fixtures, /export const getGuidedFlowPreviewFixture/);
  assert.match(fixtures, /import\.meta\.env\.DEV/);
});

test('guided flow services fall back to published detail steps without fake production data', async () => {
  const service = await read('src/services/public-api.ts');

  assert.match(service, /const buildRecipeGuidedFlow/);
  assert.match(service, /const buildBeverageGuidedFlow/);
  assert.match(service, /getRecipe\(id\)/);
  assert.match(service, /getBeverage\(id\)/);
});

test('cooking page never exposes raw backend error text', async () => {
  const cooking = await read('src/pages/cooking/index.vue');

  assert.match(cooking, /制作步骤暂时无法显示/);
  assert.doesNotMatch(cooking, /error\.value\s*=\s*err instanceof Error \? err\.message/);
});

test('finishing the last step shows a persistent completion state before navigation', async () => {
  const cooking = await read('src/pages/cooking/index.vue');

  assert.match(cooking, /isCompleted/);
  assert.match(cooking, /烹饪完成/);
  assert.match(cooking, /返回菜谱/);
  assert.doesNotMatch(cooking, /setTimeout\(\(\) => \{[\s\S]{0,500}redirectTo/);
});
