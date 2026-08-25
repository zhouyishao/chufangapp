import assert from 'node:assert/strict';
import test from 'node:test';

import { assertRecipeProviderCanSync, getRecipeProviderRole } from '../services/resource-import/recipe-provider-policy';

test('classifies known recipe providers', () => {
  assert.equal(getRecipeProviderRole('proj_kitchen'), 'PRIMARY');
  assert.equal(getRecipeProviderRole('tianapi_caipu'), 'SUPPLEMENTAL');
  assert.equal(getRecipeProviderRole('themealdb_recipe'), 'OVERSEAS');
  assert.equal(getRecipeProviderRole('mock_recipe'), 'TEST');
});

test('allows active Chinese providers and rejects disabled or overseas providers', () => {
  assert.doesNotThrow(() => assertRecipeProviderCanSync({
    providerCode: 'proj_kitchen', resourceType: 'RECIPE', status: 'ACTIVE', licenseNote: '已确认允许导入并展示，保留来源署名'
  }));
  assert.throws(() => assertRecipeProviderCanSync({
    providerCode: 'themealdb_recipe', resourceType: 'RECIPE', status: 'ACTIVE', licenseNote: '历史来源'
  }), /不允许同步中国菜谱/);
  assert.throws(() => assertRecipeProviderCanSync({
    providerCode: 'proj_kitchen', resourceType: 'RECIPE', status: 'DISABLED', licenseNote: '已确认'
  }), /Provider 已禁用/);
  assert.throws(() => assertRecipeProviderCanSync({
    providerCode: 'proj_kitchen', resourceType: 'RECIPE', status: 'ACTIVE', licenseNote: null
  }), /未确认内容许可/);
});
