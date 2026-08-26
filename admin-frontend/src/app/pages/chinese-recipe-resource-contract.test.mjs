import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [types, api, providers, providerForm, accessCenter, recipes] = await Promise.all([
  readFile(new URL('../types.ts', import.meta.url), 'utf8'),
  readFile(new URL('../api.ts', import.meta.url), 'utf8'),
  readFile(new URL('./ApiProviderListPage.tsx', import.meta.url), 'utf8'),
  readFile(new URL('./ApiProviderFormPage.tsx', import.meta.url), 'utf8'),
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

test('admin preserves cross-page recipe selections and saved provider keys', () => {
  assert.match(accessCenter, /selectedItemsById/);
  assert.match(accessCenter, /Object\.values\(selectedItemsById\)/);
  assert.match(accessCenter, /setSelectedItemsById\(\{\}\)/);
  assert.match(providerForm, /shouldIncludeAppKey/);
  assert.match(providerForm, /\.\.\.\(shouldIncludeAppKey/);
});

test('admin recipe import workflow requires traceable templates and safe batch confirmation', () => {
  assert.match(accessCenter, /来源名称/);
  assert.match(accessCenter, /外部 ID/);
  assert.match(accessCenter, /外部链接/);
  assert.match(accessCenter, /至少填写外部链接，或同时填写来源名称与外部 ID/);
  assert.match(accessCenter, /filterCode/);
  assert.match(api, /filterCode/);
  assert.match(accessCenter, /canBulkConfirm/);
  assert.match(accessCenter, /同一导入批次/);
});

test('admin no longer promotes the removed Juhe recipe source', () => {
  assert.doesNotMatch(providerForm, /JUHE_RECIPE|Juhe 菜谱/);
  assert.doesNotMatch(providers, /Juhe 菜谱|JUHE_RECIPE/);
  assert.doesNotMatch(accessCenter, /juhe_recipe|JUHE_COOK_KEY/);
});
