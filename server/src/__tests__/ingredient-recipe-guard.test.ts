import assert from 'node:assert/strict';
import test from 'node:test';

import { assertIngredientCanBecomeUnavailable } from '../services/ingredient-recipe-guard';

type GuardFixture = {
  protectedRecipeIds: number[][];
  locks: string[];
};

const createTransaction = ({ protectedRecipeIds, locks }: GuardFixture) => ({
  recipeIngredient: {
    findMany: async () => (protectedRecipeIds.shift() ?? []).map((recipeId) => ({ recipeId }))
  },
  $executeRawUnsafe: async (query: string, id: number) => {
    locks.push(`${query.includes('recipes') ? 'recipe' : 'ingredient'}:${id}`);
    return 1;
  }
});

test('blocks an ingredient downgrade after locking protected recipes before the ingredient', async () => {
  const locks: string[] = [];
  const transaction = createTransaction({ protectedRecipeIds: [[9, 3], [3, 9]], locks });

  await assert.rejects(
    assertIngredientCanBecomeUnavailable(transaction, 7),
    /请先下架或重绑关联菜谱/
  );

  assert.deepEqual(locks, ['recipe:3', 'recipe:9', 'ingredient:7']);
});

test('allows an ingredient downgrade when no protected recipe remains after the ingredient lock', async () => {
  const locks: string[] = [];
  const transaction = createTransaction({ protectedRecipeIds: [[], []], locks });

  await assert.doesNotReject(assertIngredientCanBecomeUnavailable(transaction, 7));

  assert.deepEqual(locks, ['ingredient:7']);
});
