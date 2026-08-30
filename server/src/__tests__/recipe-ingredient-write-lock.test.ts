import assert from 'node:assert/strict';
import test from 'node:test';

import { lockRecipeIngredientRowsForWrite, lockRecipeRowForWrite } from '../services/recipe-ingredient-write-lock';

test('locks the recipe row before a guarded status transition', async () => {
  const locks: Array<{ query: string; id: number }> = [];
  const database = {
    $executeRawUnsafe: async (query: string, recipeId: number) => {
      locks.push({ query, id: recipeId });
      return 1;
    }
  };

  await lockRecipeRowForWrite(database, 12);

  assert.deepEqual(locks, [{ query: 'SELECT id FROM recipes WHERE id = $1 FOR UPDATE', id: 12 }]);
});

test('locks non-empty recipe ingredient rows once in stable ascending order', async () => {
  const locks: number[] = [];
  const database = {
    $executeRawUnsafe: async (_query: string, ingredientId: number) => {
      locks.push(ingredientId);
      return 1;
    }
  };

  await lockRecipeIngredientRowsForWrite(database, [8, null, 3, 8, undefined, 7]);

  assert.deepEqual(locks, [3, 7, 8]);
});
