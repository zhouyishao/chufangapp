import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveContentTarget } from '../services/content-target';

test('supports canonical five-type target identity', () => {
  assert.deepEqual(resolveContentTarget({ targetType: 'RECIPE', targetId: '7' }), { targetType: 'RECIPE', targetId: '7', recipeId: 7, ingredientId: null, beverageId: null });
  assert.deepEqual(resolveContentTarget({ targetType: 'FRUIT', targetId: 8 }), { targetType: 'FRUIT', targetId: '8', recipeId: null, ingredientId: 8, beverageId: null });
  assert.deepEqual(resolveContentTarget({ targetType: 'SEASONING', targetId: 9 }), { targetType: 'SEASONING', targetId: '9', recipeId: null, ingredientId: 9, beverageId: null });
  assert.deepEqual(resolveContentTarget({ targetType: 'BEVERAGE', targetId: 10 }), { targetType: 'BEVERAGE', targetId: '10', recipeId: null, ingredientId: null, beverageId: 10 });
});

test('keeps one-target legacy request compatibility and rejects conflicts', () => {
  assert.equal(resolveContentTarget({ recipeId: 3 }).targetType, 'RECIPE');
  assert.throws(() => resolveContentTarget({ recipeId: 3, ingredientId: 4 }), /请选择一个/);
  assert.throws(() => resolveContentTarget({ targetType: 'RECIPE', targetId: 3, recipeId: 3 }), /冲突/);
});
