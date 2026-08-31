export type RecipeIngredientQualityCandidate = {
  name: string;
  ingredientId: number | null;
  ingredient: {
    status: 'ACTIVE' | 'DISABLED';
    deletedAt: Date | null;
    transparentImage: string | null;
  } | null;
};

export type RecipeIngredientPublishIssue = {
  name: string;
  reason: '未关联食材' | '关联食材不可用' | '缺少透明实物图';
};

export const getRecipeIngredientPublishIssues = (
  items: RecipeIngredientQualityCandidate[]
): RecipeIngredientPublishIssue[] => items.flatMap((item): RecipeIngredientPublishIssue[] => {
  if (!item.ingredientId || !item.ingredient) return [{ name: item.name, reason: '未关联食材' as const }];
  if (item.ingredient.deletedAt || item.ingredient.status !== 'ACTIVE') {
    return [{ name: item.name, reason: '关联食材不可用' as const }];
  }
  if (!item.ingredient.transparentImage?.trim()) {
    return [{ name: item.name, reason: '缺少透明实物图' as const }];
  }
  return [];
});

export const formatRecipeIngredientPublishError = (issues: RecipeIngredientPublishIssue[]) =>
  `菜谱用料未满足发布要求：${issues.map((item) => `${item.name}${item.reason}`).join('；')}`;
