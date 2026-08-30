import type { ContentType } from '@prisma/client';

import { HttpError } from '../http/errors';

export type ContentTargetInput = {
  targetType?: ContentType;
  targetId?: string | number;
  recipeId?: number | null;
  ingredientId?: number | null;
  beverageId?: number | null;
};

export const resolveContentTarget = (input: ContentTargetInput) => {
  const legacy = [input.recipeId, input.ingredientId, input.beverageId].filter((value) => value != null);
  if (input.targetType || input.targetId != null) {
    if (!input.targetType || input.targetId == null || legacy.length) throw new HttpError('内容对象参数冲突', 400, 400);
    const numericId = Number.parseInt(String(input.targetId), 10);
    if (!Number.isFinite(numericId) || numericId <= 0) throw new HttpError('内容对象不存在', 400, 400);
    return {
      targetType: input.targetType,
      targetId: String(numericId),
      recipeId: input.targetType === 'RECIPE' ? numericId : null,
      ingredientId: ['INGREDIENT', 'FRUIT', 'SEASONING'].includes(input.targetType) ? numericId : null,
      beverageId: input.targetType === 'BEVERAGE' ? numericId : null
    };
  }
  if (legacy.length !== 1) throw new HttpError('请选择一个收藏或浏览对象', 400, 400);
  const targetType: ContentType = input.recipeId ? 'RECIPE' : input.beverageId ? 'BEVERAGE' : 'INGREDIENT';
  const numericId = input.recipeId ?? input.ingredientId ?? input.beverageId!;
  return {
    targetType,
    targetId: String(numericId),
    recipeId: input.recipeId ?? null,
    ingredientId: input.ingredientId ?? null,
    beverageId: input.beverageId ?? null
  };
};
