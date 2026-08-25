import assert from 'node:assert/strict';
import test from 'node:test';

import {
  containsChineseText,
  evaluateChineseRecipeCandidate,
  mapChineseRecipeCategory,
  normalizeImportedRecipeTitle
} from '../services/resource-import/chinese-recipe-policy';

test('normalizes Chinese recipe titles and rejects test-only titles', () => {
  assert.equal(normalizeImportedRecipeTitle('  E2E_20260825_番茄炒蛋  '), '番茄炒蛋');
  assert.equal(containsChineseText('番茄炒蛋'), true);
  assert.equal(containsChineseText('Chicken Handi'), false);
});

test('maps known Chinese categories without creating overseas categories', () => {
  assert.equal(mapChineseRecipeCategory('蔬菜类'), '素菜');
  assert.equal(mapChineseRecipeCategory('家常菜'), '家常菜');
  assert.equal(mapChineseRecipeCategory('Chicken'), null);
});

test('scores a complete Chinese recipe at or above confirmation threshold', () => {
  const result = evaluateChineseRecipeCandidate({
    name: '番茄炒蛋',
    title: '番茄炒蛋',
    categoryName: '家常菜',
    cover: 'https://example.com/tomato-eggs.webp',
    ingredients: [{ name: '番茄' }, { name: '鸡蛋' }],
    steps: ['番茄切块，鸡蛋打散', '先炒鸡蛋，再加入番茄翻炒'],
    sourceName: '厨房计划 - 中文菜谱 API',
    externalId: 'cn-001',
    externalUrl: 'https://example.com/recipes/cn-001'
  });

  assert.equal(result.isChinese, true);
  assert.equal(result.categoryName, '家常菜');
  assert.equal(result.hardFailure, false);
  assert.ok(result.qualityScore >= 80);
});

test('hard-fails overseas or structurally incomplete recipes', () => {
  const overseas = evaluateChineseRecipeCandidate({
    name: 'Chicken Handi',
    ingredients: [{ name: 'Chicken' }, { name: 'Salt' }],
    steps: ['Cook the chicken'],
    categoryName: 'Chicken'
  });
  const incomplete = evaluateChineseRecipeCandidate({
    name: '番茄炒蛋',
    ingredients: [{ name: '番茄' }],
    steps: []
  });

  assert.equal(overseas.filterCode, 'NON_CHINESE_RECIPE');
  assert.equal(incomplete.filterCode, 'INCOMPLETE_RECIPE');
});

test('requires mapped category and traceable source before confirmation', () => {
  const unmapped = evaluateChineseRecipeCandidate({
    name: '番茄炒蛋', categoryName: 'Chicken',
    ingredients: [{ name: '番茄' }, { name: '鸡蛋' }], steps: ['翻炒'],
    sourceName: '来源', externalId: '1'
  });
  const untraceable = evaluateChineseRecipeCandidate({
    name: '番茄炒蛋', categoryName: '家常菜',
    ingredients: [{ name: '番茄' }, { name: '鸡蛋' }], steps: ['翻炒']
  });

  assert.equal(unmapped.filterCode, 'UNMAPPED_RECIPE_CATEGORY');
  assert.equal(untraceable.filterCode, 'UNTRACEABLE_RECIPE_SOURCE');
});
