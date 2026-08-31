import assert from 'node:assert/strict';
import test from 'node:test';

import { serializeRecipeIngredient } from '../routes/api/recipes';

test('public recipe detail serializes linked ingredients from the authoritative resource', () => {
  const serialized = serializeRecipeIngredient({
    id: 9,
    ingredientId: 38,
    name: '历史番茄名称',
    amount: '2 个',
    ingredient: {
      id: 38,
      bizId: 'ingredient_tomato',
      code: 'SC000038',
      name: '番茄',
      transparentImage: 'https://example.test/tomato.webp',
      category: { type: 'INGREDIENT' }
    }
  });

  assert.equal(serialized.ingredientId, 'ingredient_tomato');
  assert.equal(serialized.name, '番茄');
  assert.deepEqual(serialized.ingredient, {
    id: 'ingredient_tomato',
    name: '番茄',
    transparentImage: 'https://example.test/tomato.webp',
    categoryType: 'INGREDIENT'
  });
});

test('public recipe detail preserves unlinked legacy ingredients as null associations', () => {
  const serialized = serializeRecipeIngredient({
    id: 10,
    ingredientId: null,
    name: '自定义香料',
    amount: '少许',
    ingredient: null
  });

  assert.equal(serialized.ingredientId, null);
  assert.equal(serialized.ingredient, null);
  assert.equal(serialized.name, '自定义香料');
});
