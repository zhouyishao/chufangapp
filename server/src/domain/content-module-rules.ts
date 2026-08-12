export const resolveSourceCategoryId = (input: {
  contentSource: string;
  sourceCategoryId?: number | null;
  categoryId?: number | null;
}) => {
  if (input.sourceCategoryId) return input.sourceCategoryId;
  if (['CATEGORY', 'CATEGORY_CONTENT'].includes(input.contentSource)) {
    return input.categoryId ?? null;
  }
  return null;
};
