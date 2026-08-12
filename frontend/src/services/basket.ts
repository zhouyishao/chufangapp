import { loadAuthUser, syncAuthUserWithBackend } from './auth';
import {
  addMobileBasketItem,
  deleteMobileBasketItem,
  listMobileBasketItems,
  updateMobileBasketItem,
  type ApiBasketItem
} from './public-api';
import { loadActiveFamilyId, loadFamilies } from './family';

export interface BasketItem {
  id: string;
  recipeId: string;
  recipeName: string;
  name: string;
  amountText: string;
  purchaseText?: string;
  checked: boolean;
  ingredientId?: string;
  quantity?: number;
  checkedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  familyId?: string | null;
  familyName?: string | null;
  imageUrl?: string | null;
  currentPrice?: number | null;
  priceUnit?: string | null;
  recipeCoverUrl?: string | null;
}

const requireUser = async () => {
  const user = await syncAuthUserWithBackend(loadAuthUser());
  if (!user?.id) throw new Error('请先登录');
  return { ...user, id: user.id };
};

const resolveBasketFamilyId = async (familyId?: string | null) => {
  if (familyId === null) {
    return null;
  }

  if (familyId && familyId.trim()) {
    return familyId;
  }

  const activeFamilyId = loadActiveFamilyId();
  if (activeFamilyId) {
    return activeFamilyId;
  }

  const families = await loadFamilies();
  return families[0]?.id ?? null;
};

const resolveBasketItemName = (item: ApiBasketItem) => {
  const legacyName = item.name?.trim();
  const linkedName = item.ingredient?.name?.trim();
  if (linkedName && (!legacyName || /^(食材详情|食材|未命名)$/.test(legacyName))) {
    return linkedName;
  }
  return legacyName || linkedName || '待确认食材';
};

const mapBasketItem = (item: ApiBasketItem): BasketItem => ({
  id: String(item.id),
  recipeId: item.recipeId ? String(item.recipeId) : 'ingredient',
  recipeName: item.recipeName || item.recipe?.title || '单独添加',
  name: resolveBasketItemName(item),
  amountText: item.amountText || (item.quantity ? String(item.quantity) : ''),
  purchaseText: item.purchaseText || undefined,
  checked: item.checked,
  ingredientId: item.ingredientId ? String(item.ingredientId) : undefined,
  quantity: item.quantity,
  checkedAt: item.checkedAt,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
  familyId: item.familyId ? String(item.familyId) : null,
  familyName: item.family?.name ?? null,
  imageUrl: item.ingredient?.cover ?? null,
  currentPrice: item.ingredient?.currentPrice ?? null,
  priceUnit: item.ingredient?.priceUnit ?? null,
  recipeCoverUrl: item.recipe?.cover ?? null
});

export const getIngredientBasketItemId = (ingredientId: string) => `ingredient-${ingredientId}`;

export const getIngredientPurchaseText = (_name: string): string | undefined => undefined;

export const loadBasketItems = async (familyId?: string | null) => {
  const user = await requireUser();
  const scopeFamilyId = await resolveBasketFamilyId(familyId);
  const data = await listMobileBasketItems({
    userId: user.id,
    familyId: scopeFamilyId ? Number(scopeFamilyId) : undefined,
    page: 1,
    pageSize: 50
  });
  return data.list.map(mapBasketItem);
};

export const addBasketItem = async (item: BasketItem, familyId?: string | null) => {
  const user = await requireUser();
  const scopeFamilyId = await resolveBasketFamilyId(familyId);
  await addMobileBasketItem({
    userId: user.id,
    familyId: scopeFamilyId ? Number(scopeFamilyId) : null,
    recipeId: item.recipeId && item.recipeId !== 'ingredient' ? Number(item.recipeId) : null,
    ingredientId: item.ingredientId ? Number(item.ingredientId) : null,
    recipeName: item.recipeName,
    name: item.name,
    amountText: item.amountText,
    quantity: item.quantity ?? 1,
    purchaseText: item.purchaseText ?? null
  });
  return loadBasketItems(scopeFamilyId);
};

export const updateBasketItemChecked = async (itemId: string, checked: boolean) => {
  const user = await requireUser();
  await updateMobileBasketItem(Number(itemId), { userId: user.id, checked });
};

export const updateBasketItemQuantity = async (itemId: string, quantity: number) => {
  const user = await requireUser();
  await updateMobileBasketItem(Number(itemId), { userId: user.id, quantity });
};

export const removeBasketItem = async (itemId: string) => {
  const user = await requireUser();
  await deleteMobileBasketItem(Number(itemId), user.id);
};

export const saveBasketItems = async (items: BasketItem[]) => {
  await Promise.all(items.map((item) => updateBasketItemChecked(item.id, item.checked)));
};
