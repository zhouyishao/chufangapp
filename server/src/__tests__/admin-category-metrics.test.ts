import assert from 'node:assert/strict';
import test from 'node:test';

import { buildCategoryMetrics, getCategoryLevel } from '../services/admin-category-metrics';

test('category metrics aggregate descendants without double counting', () => {
  const nodes = [
    { id: 1, parentId: null },
    { id: 2, parentId: 1 },
    { id: 3, parentId: 1 },
  ];
  const metrics = buildCategoryMetrics(
    nodes,
    new Map([[1, 2], [2, 3], [3, 4]]),
    new Map([[2, 1], [3, 2]]),
  );

  assert.deepEqual(metrics.get(1), {
    level: 1,
    childCount: 2,
    directContentCount: 2,
    descendantContentCount: 9,
    publicContentCount: 3,
  });
});

test('category level is derived from parent id', () => {
  assert.equal(getCategoryLevel({ id: 1, parentId: null }), 1);
  assert.equal(getCategoryLevel({ id: 2, parentId: 1 }), 2);
});

test('category metrics tolerate cycles without counting a node twice', () => {
  const metrics = buildCategoryMetrics(
    [
      { id: 1, parentId: 2 },
      { id: 2, parentId: 1 },
    ],
    new Map([[1, 3], [2, 4]]),
    new Map([[1, 1], [2, 2]]),
  );

  assert.equal(metrics.get(1)?.descendantContentCount, 7);
  assert.equal(metrics.get(1)?.publicContentCount, 3);
});
