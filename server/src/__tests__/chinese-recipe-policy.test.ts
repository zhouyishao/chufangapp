import assert from 'node:assert/strict';
import test from 'node:test';

import {
  containsChineseText,
  evaluateChineseRecipeCandidate,
  getChineseRecipeConfirmationFailure,
  mapChineseRecipeCategory,
  normalizeImportedRecipeTitle
} from '../services/resource-import/chinese-recipe-policy';

test('normalizes Chinese recipe titles and rejects test-only titles', () => {
  assert.equal(normalizeImportedRecipeTitle('  E2E_20260825_番茄炒蛋  '), '番茄炒蛋');
  assert.equal(containsChineseText('番茄炒蛋'), true);
  assert.equal(containsChineseText('Chicken Handi'), false);

  const testRecipe = evaluateChineseRecipeCandidate({
    name: 'E2E_20260825_番茄炒蛋',
    categoryName: '家常菜',
    cover: 'https://example.com/tomato-eggs.webp',
    ingredients: [{ name: '番茄' }, { name: '鸡蛋' }],
    steps: ['翻炒'],
    sourceName: '测试来源',
    externalId: 'e2e-001'
  });
  assert.equal(testRecipe.filterCode, 'TEST_RECIPE_TITLE');
  assert.ok(testRecipe.qualityIssues.includes('测试标题不可导入'));
  assert.notEqual(testRecipe.errorMessage, '');
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

test('non-Chinese and unmapped recipe retries remain inadmissible', () => {
  const overseas = evaluateChineseRecipeCandidate({
    name: 'Chicken Handi', categoryName: 'Chicken',
    ingredients: [{ name: 'Chicken' }, { name: 'Salt' }], steps: ['Cook'],
    sourceName: '海外来源', externalId: 'foreign-1'
  });
  const unmapped = evaluateChineseRecipeCandidate({
    name: '番茄炒蛋', categoryName: 'Western',
    ingredients: [{ name: '番茄' }, { name: '鸡蛋' }], steps: ['翻炒'],
    sourceName: '来源', externalId: 'unmapped-1'
  });

  assert.notEqual(getChineseRecipeConfirmationFailure(overseas), null);
  assert.notEqual(getChineseRecipeConfirmationFailure(unmapped), null);
});

test('rejects drinks, cocktails, and packaged foods from the Chinese household recipe catalog', () => {
  const cocktail = evaluateChineseRecipeCandidate({
    name: '家庭鸡尾酒', categoryName: '家常菜', cover: 'https://example.com/cocktail.webp',
    ingredients: [{ name: '冰块' }, { name: '朗姆酒' }], steps: ['Shake with ice'],
    sourceName: '来源', externalId: 'drink-001', beverageType: '鸡尾酒', cocktailMethod: 'Shake'
  });
  const packagedFood = evaluateChineseRecipeCandidate({
    name: '番茄味方便面', categoryName: '家常菜', cover: 'https://example.com/noodles.webp',
    ingredients: [{ name: '方便面' }, { name: '调味包' }], steps: ['加入开水浸泡三分钟'],
    sourceName: '来源', externalId: 'packaged-001'
  });

  assert.equal(cocktail.hardFailure, true);
  assert.ok(cocktail.qualityIssues.some((issue) => issue.includes('饮品')));
  assert.equal(packagedFood.hardFailure, true);
  assert.ok(packagedFood.qualityIssues.some((issue) => issue.includes('包装')));
});

test('requires each recipe step to be a Chinese executable instruction', () => {
  const englishSteps = evaluateChineseRecipeCandidate({
    name: '番茄炒蛋', categoryName: '家常菜', cover: 'https://example.com/tomato-eggs.webp',
    ingredients: [{ name: '番茄' }, { name: '鸡蛋' }], steps: ['Whisk eggs', 'Cook until done'],
    sourceName: '来源', externalId: 'english-steps-001'
  });

  assert.equal(englishSteps.hardFailure, true);
  assert.ok(englishSteps.qualityIssues.some((issue) => issue.includes('步骤')));
});

test('rejects suspicious overseas mixed-language titles but preserves Chinese dishes and limited brands', () => {
  const overseasMixed = evaluateChineseRecipeCandidate({
    name: 'Chicken Handi 印度咖喱鸡', categoryName: '家常菜', cover: 'https://example.com/handi.webp',
    ingredients: [{ name: '鸡肉' }, { name: '洋葱' }], steps: ['鸡肉切块后放入锅中炖熟'],
    sourceName: '来源', externalId: 'mixed-001'
  });
  const brandDish = evaluateChineseRecipeCandidate({
    name: 'Kikkoman 照烧鸡翅', categoryName: '家常菜', cover: 'https://example.com/wings.webp',
    ingredients: [{ name: '鸡翅' }, { name: '酱油' }], steps: ['鸡翅洗净后煎熟，再加入酱油烧至入味'],
    sourceName: '来源', externalId: 'brand-001'
  });
  const commonDishWithUnit = evaluateChineseRecipeCandidate({
    name: '可乐鸡翅 200g', categoryName: '家常菜', cover: 'https://example.com/cola-wings.webp',
    ingredients: [{ name: '鸡翅' }, { name: '可乐' }], steps: ['鸡翅洗净后煎熟，再倒入可乐烧至收汁'],
    sourceName: '来源', externalId: 'cola-wings-001'
  });

  assert.equal(overseasMixed.hardFailure, true);
  assert.ok(overseasMixed.qualityIssues.some((issue) => issue.includes('中英混合')));
  assert.equal(brandDish.hardFailure, false);
  assert.equal(commonDishWithUnit.hardFailure, false);
});

test('hard-fails mixed-language titles that use an English dish name after Chinese text', () => {
  const mixedTitle = evaluateChineseRecipeCandidate({
    name: '泰式 Tom Yum Soup', categoryName: '家常菜', cover: 'https://example.com/tom-yum.webp',
    ingredients: [{ name: '虾' }, { name: '香茅' }], steps: ['虾洗净后放入锅中煮熟'],
    sourceName: '来源', externalId: 'tom-yum-001'
  });

  assert.equal(mixedTitle.hardFailure, true);
  assert.equal(mixedTitle.filterCode, 'MIXED_LANGUAGE_RECIPE');
  assert.ok(mixedTitle.qualityIssues.some((issue) => issue.includes('中英混合')));
});

test('hard-fails a Chinese step when its executable content is English-dominant', () => {
  const mixedStep = evaluateChineseRecipeCandidate({
    name: '番茄炒蛋', categoryName: '家常菜', cover: 'https://example.com/tomato-eggs.webp',
    ingredients: [{ name: '番茄' }, { name: '鸡蛋' }],
    steps: ['Whisk eggs and cook until done，最后炒匀出锅'],
    sourceName: '来源', externalId: 'mixed-step-001'
  });

  assert.equal(mixedStep.hardFailure, true);
  assert.equal(mixedStep.filterCode, 'INVALID_RECIPE_STEPS');
  assert.ok(mixedStep.qualityIssues.some((issue) => issue.includes('步骤')));
});

test('allows Chinese-dominant instructions with whitelisted brands and unit forms', () => {
  const chineseRecipe = evaluateChineseRecipeCandidate({
    name: 'Kikkoman 照烧鸡翅 200g', categoryName: '家常菜', cover: 'https://example.com/wings.webp',
    ingredients: [{ name: '鸡翅' }, { name: '酱油' }],
    steps: ['鸡翅洗净后加入 200g Kikkoman 酱油腌制', '烤箱预热至 180°C，烤熟后出锅'],
    sourceName: '来源', externalId: 'whitelist-001'
  });

  assert.equal(chineseRecipe.hardFailure, false);
  assert.ok(chineseRecipe.qualityScore >= 80);
});
