import assert from 'node:assert/strict';
import test from 'node:test';

import {
  assertImportItemCanBeEdited,
  assertManualImportItemTransition,
  assertRecipeImportBatchCanFinalize
} from '../services/resource-import/import-governance';

test('only pending or failed import items can be edited', () => {
  assert.doesNotThrow(() => assertImportItemCanBeEdited('PENDING'));
  assert.doesNotThrow(() => assertImportItemCanBeEdited('FAILED'));
  assert.throws(() => assertImportItemCanBeEdited('IGNORED'), /待处理或失败/);
  assert.throws(() => assertImportItemCanBeEdited('IMPORTED'), /待处理或失败/);
  assert.throws(() => assertImportItemCanBeEdited('PROCESSING'), /待处理或失败/);
});

test('manual status changes can only ignore pending or failed items', () => {
  assert.doesNotThrow(() => assertManualImportItemTransition('PENDING', 'IGNORED'));
  assert.doesNotThrow(() => assertManualImportItemTransition('FAILED', 'IGNORED'));
  assert.throws(() => assertManualImportItemTransition('IGNORED', 'PENDING'), /不允许恢复/);
  assert.throws(() => assertManualImportItemTransition('PENDING', 'IMPORTED'), /不允许直接设置/);
  assert.throws(() => assertManualImportItemTransition('PENDING', 'PROCESSING'), /不允许直接设置/);
});

test('recipe confirmation revalidates provider role, status, and license', () => {
  assert.doesNotThrow(() => assertRecipeImportBatchCanFinalize({
    importType: 'RECIPE',
    sourceType: 'API',
    provider: {
      providerCode: 'proj_kitchen',
      resourceType: 'RECIPE',
      status: 'ACTIVE',
      licenseNote: '已确认允许导入并展示'
    }
  }));
  assert.throws(() => assertRecipeImportBatchCanFinalize({
    importType: 'RECIPE',
    sourceType: 'API',
    provider: {
      providerCode: 'themealdb_recipe',
      resourceType: 'RECIPE',
      status: 'ACTIVE',
      licenseNote: '历史来源'
    }
  }), /不允许同步中国菜谱/);
  assert.throws(() => assertRecipeImportBatchCanFinalize({
    importType: 'RECIPE',
    sourceType: 'API',
    provider: {
      providerCode: 'proj_kitchen',
      resourceType: 'RECIPE',
      status: 'DISABLED',
      licenseNote: '已确认'
    }
  }), /Provider 已禁用/);
  assert.throws(() => assertRecipeImportBatchCanFinalize({
    importType: 'RECIPE',
    sourceType: 'API',
    provider: null
  }), /缺少 Provider/);
});

test('local file recipe batches remain eligible without a provider', () => {
  assert.doesNotThrow(() => assertRecipeImportBatchCanFinalize({
    importType: 'RECIPE',
    sourceType: 'CSV',
    provider: null
  }));
  assert.doesNotThrow(() => assertRecipeImportBatchCanFinalize({
    importType: 'INGREDIENT',
    sourceType: 'API',
    provider: null
  }));
});
