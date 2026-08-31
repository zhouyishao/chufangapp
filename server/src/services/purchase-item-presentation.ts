import { getPublicCode, getPublicId } from '../lib/business-id';

type PurchaseIngredient = {
  id: number;
  bizId?: string | null;
  code?: string | null;
  name: string;
  cover: string | null;
  currentPrice: number | null;
  priceUnit: string | null;
};

type PurchaseItem = {
  id: number;
  userId: number;
  familyId: number | null;
  recipeId: number | null;
  ingredientId: number | null;
  recipeName: string | null;
  name: string;
  amountText: string | null;
  quantity: { toNumber?: () => number } | number;
  unit: string | null;
  purchaseText: string | null;
  checked: boolean;
  checkedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  recipe?: { id: number; title: string; cover: string | null } | null;
  ingredient?: PurchaseIngredient | null;
  family?: { id: number; name: string } | null;
};

const presentIngredient = (ingredient: PurchaseIngredient | null | undefined) => {
  if (!ingredient) return null;
  const { id, bizId: _bizId, code: _code, ...fields } = ingredient;
  return {
    ...fields,
    legacyId: id,
    id: getPublicId('ingredient', ingredient),
    code: getPublicCode('ingredient', ingredient)
  };
};

export const presentPurchaseItem = <T extends PurchaseItem>(item: T) => ({
  ...item,
  ingredientId: item.ingredient ? getPublicId('ingredient', item.ingredient) : null,
  ingredient: presentIngredient(item.ingredient),
  quantity: typeof item.quantity === 'number' ? item.quantity : item.quantity.toNumber?.() ?? Number(item.quantity),
  checkedAt: item.checkedAt?.toISOString() ?? null,
  createdAt: item.createdAt.toISOString(),
  updatedAt: item.updatedAt.toISOString()
});
