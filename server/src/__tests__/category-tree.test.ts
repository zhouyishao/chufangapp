import assert from 'node:assert/strict';
import test from 'node:test';

import { collectDescendantCategoryIds } from '../services/category-tree';

test('collects the selected category and every nested child', () => {
  const categories = [
    { id: 10, parentId: null },
    { id: 11, parentId: 10 },
    { id: 12, parentId: 10 },
    { id: 13, parentId: 11 },
    { id: 20, parentId: null }
  ];

  assert.deepEqual(collectDescendantCategoryIds(categories, 10), [10, 11, 12, 13]);
});

test('does not loop forever when legacy data contains a cycle', () => {
  const categories = [
    { id: 10, parentId: 12 },
    { id: 11, parentId: 10 },
    { id: 12, parentId: 11 }
  ];

  assert.deepEqual(collectDescendantCategoryIds(categories, 10), [10, 11, 12]);
});
