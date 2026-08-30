type RecipeIngredientLockDatabase = {
  $executeRawUnsafe(query: string, ...values: unknown[]): Promise<unknown>;
};

export const lockRecipeRowForWrite = async (
  database: RecipeIngredientLockDatabase,
  recipeId: number
) => {
  await database.$executeRawUnsafe(
    'SELECT id FROM recipes WHERE id = $1 FOR UPDATE',
    recipeId
  );
};

export const lockRecipeIngredientRowsForWrite = async (
  database: RecipeIngredientLockDatabase,
  ingredientIds: Array<number | null | undefined>
) => {
  const uniqueIds = [...new Set(ingredientIds.filter((id): id is number => typeof id === 'number'))]
    .sort((left, right) => left - right);

  for (const ingredientId of uniqueIds) {
    await database.$executeRawUnsafe(
      'SELECT id FROM ingredients WHERE id = $1 FOR UPDATE',
      ingredientId
    );
  }
};
