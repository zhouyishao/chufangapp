import assert from 'node:assert/strict';
import test from 'node:test';

import {
  formatRecipeIngredientPublishError,
  getRecipeIngredientPublishIssues
} from '../services/recipe-ingredient-quality';

test('reports unlinked, inactive and transparent-image issues by ingredient name', () => {
  const issues = getRecipeIngredientPublishIssues([
    { name: '盐', ingredientId: null, ingredient: null },
    { name: '番茄', ingredientId: 2, ingredient: { status: 'ACTIVE', deletedAt: null, transparentImage: null } },
    { name: '牛腩', ingredientId: 3, ingredient: { status: 'DISABLED', deletedAt: null, transparentImage: '/beef.webp' } }
  ]);

  assert.deepEqual(issues, [
    { name: '盐', reason: '未关联食材' },
    { name: '番茄', reason: '缺少透明实物图' },
    { name: '牛腩', reason: '关联食材不可用' }
  ]);
  assert.equal(
    formatRecipeIngredientPublishError(issues),
    '菜谱用料未满足发布要求：盐未关联食材；番茄缺少透明实物图；牛腩关联食材不可用'
  );
});

test('accepts active linked ingredients with transparent images', () => {
  assert.deepEqual(getRecipeIngredientPublishIssues([
    { name: '黄瓜', ingredientId: 8, ingredient: { status: 'ACTIVE', deletedAt: null, transparentImage: '/cucumber.webp' } }
  ]), []);
});
