export type CategoryMetricNode = {
  id: number;
  parentId: number | null;
};

export type CategoryMetric = {
  level: 1 | 2;
  childCount: number;
  directContentCount: number;
  descendantContentCount: number;
  publicContentCount: number;
};

export const getCategoryLevel = (node: CategoryMetricNode): 1 | 2 => (
  node.parentId == null ? 1 : 2
);

export const buildCategoryMetrics = (
  nodes: CategoryMetricNode[],
  directTotalCounts: ReadonlyMap<number, number>,
  directPublicCounts: ReadonlyMap<number, number>,
): Map<number, CategoryMetric> => {
  const childrenByParent = new Map<number, number[]>();
  for (const node of nodes) {
    if (node.parentId == null) continue;
    const children = childrenByParent.get(node.parentId) ?? [];
    children.push(node.id);
    childrenByParent.set(node.parentId, children);
  }

  const collectSubtreeCount = (rootId: number, counts: ReadonlyMap<number, number>) => {
    const queue = [rootId];
    const visited = new Set<number>();
    let total = 0;

    while (queue.length > 0) {
      const id = queue.shift();
      if (id == null || visited.has(id)) continue;
      visited.add(id);
      total += counts.get(id) ?? 0;
      queue.push(...(childrenByParent.get(id) ?? []));
    }

    return total;
  };

  return new Map(nodes.map((node) => [node.id, {
    level: getCategoryLevel(node),
    childCount: childrenByParent.get(node.id)?.length ?? 0,
    directContentCount: directTotalCounts.get(node.id) ?? 0,
    descendantContentCount: collectSubtreeCount(node.id, directTotalCounts),
    publicContentCount: collectSubtreeCount(node.id, directPublicCounts),
  }]));
};
