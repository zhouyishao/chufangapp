import assert from 'node:assert/strict';
import test from 'node:test';

import { lockRecipeIngredientRowsForWrite } from '../services/recipe-ingredient-write-lock';

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
