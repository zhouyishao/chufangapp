export type CategoryTreeNode = {
  id: number;
  parentId: number | null;
};

export const collectDescendantCategoryIds = (
  categories: CategoryTreeNode[],
  rootId: number
): number[] => {
  const childrenByParent = new Map<number, number[]>();
  for (const category of categories) {
    if (category.parentId == null) continue;
    const children = childrenByParent.get(category.parentId) ?? [];
    children.push(category.id);
    childrenByParent.set(category.parentId, children);
  }

  const result: number[] = [];
  const visited = new Set<number>();
  const queue = [rootId];
  while (queue.length > 0) {
    const current = queue.shift();
    if (current == null || visited.has(current)) continue;
    visited.add(current);
    result.push(current);
    queue.push(...(childrenByParent.get(current) ?? []));
  }
  return result;
};
