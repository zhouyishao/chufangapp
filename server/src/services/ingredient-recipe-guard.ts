import { HttpError } from '../http/errors';
import { lockRecipeIngredientRowsForWrite, lockRecipeRowForWrite } from './recipe-ingredient-write-lock';

type IngredientRecipeGuardTransaction = {
  recipeIngredient: {
    findMany(args: {
      where: {
        ingredientId: number;
        deletedAt: null;
        recipe: {
          is: {
            deletedAt: null;
            OR: Array<{ auditStatus: { in: Array<'PENDING' | 'APPROVED'> } } | { isPublish: true }>;
          };
        };
      };
      select: { recipeId: true };
    }): Promise<Array<{ recipeId: number }>>;
  };
  $executeRawUnsafe(query: string, ...values: unknown[]): Promise<unknown>;
};

const protectedRecipeIdsForIngredient = async (
  transaction: IngredientRecipeGuardTransaction,
  ingredientId: number
) => {
  const links = await transaction.recipeIngredient.findMany({
    where: {
      ingredientId,
      deletedAt: null,
      recipe: {
        is: {
          deletedAt: null,
          OR: [
            { auditStatus: { in: ['PENDING', 'APPROVED'] } },
            { isPublish: true }
          ]
        }
      }
    },
    select: { recipeId: true }
  });

  return [...new Set(links.map((link) => link.recipeId))].sort((left, right) => left - right);
};

export const assertIngredientCanBecomeUnavailable = async (
  transaction: IngredientRecipeGuardTransaction,
  ingredientId: number
) => {
  const initialProtectedRecipeIds = await protectedRecipeIdsForIngredient(transaction, ingredientId);
  for (const recipeId of initialProtectedRecipeIds) {
    await lockRecipeRowForWrite(transaction, recipeId);
  }
  await lockRecipeIngredientRowsForWrite(transaction, [ingredientId]);

  const protectedRecipeIds = await protectedRecipeIdsForIngredient(transaction, ingredientId);
  if (protectedRecipeIds.length > 0) {
    throw new HttpError('关联菜谱处于待审核、已通过或已发布状态，请先下架或重绑关联菜谱', 422, 422);
  }
};
