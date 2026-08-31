import assert from 'node:assert/strict';
import test from 'node:test';

import { presentPurchaseItem } from '../services/purchase-item-presentation';

const baseItem = {
  id: 21,
  userId: 5,
  familyId: null,
  recipeId: null,
  ingredientId: 8,
  recipeName: null,
  name: '番茄',
  amountText: '2 个',
  quantity: 2,
  unit: '个',
  purchaseText: null,
  checked: false,
  checkedAt: null,
  createdAt: new Date('2026-08-31T00:00:00.000Z'),
  updatedAt: new Date('2026-08-31T01:00:00.000Z')
};

test('presents linked basket ingredients with one stable public ID at every boundary', () => {
  const result = presentPurchaseItem({
    ...baseItem,
    ingredient: {
      id: 8,
      bizId: 'ingredient_tomato',
      code: 'SC000008',
      name: '番茄',
      cover: '/tomato.webp',
      currentPrice: 4.5,
      priceUnit: '斤'
    }
  });

  assert.equal(result.ingredientId, 'ingredient_tomato');
  assert.deepEqual(result.ingredient, {
    id: 'ingredient_tomato',
    legacyId: 8,
    code: 'SC000008',
    name: '番茄',
    cover: '/tomato.webp',
    currentPrice: 4.5,
    priceUnit: '斤'
  });
});

test('presents unlinked basket ingredients as null without a misleading numeric ID', () => {
  const result = presentPurchaseItem({ ...baseItem, ingredientId: null, ingredient: null });

  assert.equal(result.ingredientId, null);
  assert.equal(result.ingredient, null);
});
