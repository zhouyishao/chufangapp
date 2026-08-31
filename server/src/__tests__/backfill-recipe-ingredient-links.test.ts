import assert from 'node:assert/strict';
import test from 'node:test';

import {
  hasSameRecipeIngredientBackfillLinks,
  planRecipeIngredientBackfill
} from '../scripts/backfill-recipe-ingredient-links';

test('backfill only links unique normalized exact matches', () => {
  const plan = planRecipeIngredientBackfill(
    [{ id: 1, name: ' 黄瓜 ' }, { id: 2, name: '盐' }, { id: 3, name: '测试食材' }],
    [
      { id: 10, name: '黄瓜', transparentImage: '/cucumber.webp' },
      { id: 11, name: '盐', transparentImage: null },
      { id: 12, name: '盐', transparentImage: '/salt.webp' }
    ]
  );

  assert.deepEqual(plan.links, [{ recipeIngredientId: 1, ingredientId: 10, missingTransparentImage: false }]);
  assert.deepEqual(plan.skipped, [
    { recipeIngredientId: 2, name: '盐', reason: 'MULTIPLE_MATCHES' },
    { recipeIngredientId: 3, name: '测试食材', reason: 'NO_MATCH' }
  ]);
});

test('rejects an execute plan when a formerly unique normalized match becomes ambiguous', () => {
  const initialPlan = planRecipeIngredientBackfill(
    [{ id: 1, name: ' 黄瓜 ' }],
    [{ id: 10, name: '黄瓜', transparentImage: '/cucumber.webp' }]
  );
  const currentPlan = planRecipeIngredientBackfill(
    [{ id: 1, name: ' 黄瓜 ' }],
    [
      { id: 10, name: '黄瓜', transparentImage: '/cucumber.webp' },
      { id: 11, name: '黄 瓜', transparentImage: '/cucumber.webp' }
    ]
  );

  assert.equal(hasSameRecipeIngredientBackfillLinks(initialPlan.links, currentPlan.links), false);
});
