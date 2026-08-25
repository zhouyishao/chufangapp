import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [types, api, providers, accessCenter, recipes] = await Promise.all([
  readFile(new URL('../types.ts', import.meta.url), 'utf8'),
  readFile(new URL('../api.ts', import.meta.url), 'utf8'),
  readFile(new URL('./ApiProviderListPage.tsx', import.meta.url), 'utf8'),
  readFile(new URL('./ResourceAccessCenterPage.tsx', import.meta.url), 'utf8'),
  readFile(new URL('./RecipesPage.tsx', import.meta.url), 'utf8')
]);

test('admin exposes governed Chinese recipe fields and actions', () => {
  assert.match(types, /recipeSourceRole/);
  assert.match(types, /qualityScore/);
  assert.match(types, /isChinese/);
  assert.match(api, /bulkIgnoreImportItems/);
  assert.match(api, /minQuality/);
  assert.match(providers, /中国菜谱主源/);
  assert.match(providers, /海外历史源/);
  assert.match(types, /termsUrl/);
  assert.match(types, /licenseNote/);
  assert.match(accessCenter, /质量分/);
  assert.match(accessCenter, /批量忽略海外菜谱/);
  assert.match(recipes, /导入质量/);
  assert.match(recipes, /数据来源/);
});
