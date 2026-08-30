export type CategoryNavigationType = 'RECIPE' | 'INGREDIENT' | 'FRUIT' | 'BEVERAGE' | 'SEASONING';

type CategoryNavigationNode = {
  id: number;
  parentId: number | null;
};

const fruitNavigationNames: Readonly<Record<string, string>> = {
  李杏梅樱桃类: '李杏梅樱桃',
  浆果及猕猴桃类: '浆果·猕猴桃',
  香蕉芒果类: '香蕉·芒果',
  亚热带及特色水果: '特色水果',
};

export const collectVisibleCategoryIds = (
  categories: CategoryNavigationNode[],
  resourceCategoryIds: number[],
): Set<number> => {
  const parentById = new Map(categories.map((category) => [category.id, category.parentId]));
  const visibleIds = new Set<number>();

  for (const resourceCategoryId of resourceCategoryIds) {
    let currentId: number | null | undefined = resourceCategoryId;
    const visited = new Set<number>();

    while (currentId != null && parentById.has(currentId) && !visited.has(currentId)) {
      visited.add(currentId);
      visibleIds.add(currentId);
      currentId = parentById.get(currentId);
    }
  }

  return visibleIds;
};

export const getCategoryNavigationName = (
  categoryType: CategoryNavigationType,
  categoryName: string,
): string => categoryType === 'FRUIT'
  ? (fruitNavigationNames[categoryName] ?? categoryName)
  : categoryName;
