import assert from 'node:assert/strict';
import test from 'node:test';

import {
  collectVisibleCategoryIds,
  getCategoryNavigationName,
} from '../services/category-navigation';

test('category navigation hides empty branches but keeps ancestors of populated categories', () => {
  const categories = [
    { id: 1, parentId: null },
    { id: 2, parentId: 1 },
    { id: 3, parentId: null },
    { id: 4, parentId: 3 },
    { id: 5, parentId: null },
  ];

  assert.deepEqual(
    [...collectVisibleCategoryIds(categories, [2, 5])].sort((left, right) => left - right),
    [1, 2, 5],
  );
});

test('category navigation keeps canonical names while shortening long fruit labels', () => {
  assert.equal(getCategoryNavigationName('FRUIT', '李杏梅樱桃类'), '李杏梅樱桃');
  assert.equal(getCategoryNavigationName('FRUIT', '浆果及猕猴桃类'), '浆果·猕猴桃');
  assert.equal(getCategoryNavigationName('FRUIT', '香蕉芒果类'), '香蕉·芒果');
  assert.equal(getCategoryNavigationName('FRUIT', '亚热带及特色水果'), '特色水果');
  assert.equal(getCategoryNavigationName('INGREDIENT', '亚热带及特色水果'), '亚热带及特色水果');
});
