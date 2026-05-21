import { loadActiveFamilyId, loadFamilies } from './family';

export interface BasketItem {
  id: string;
  recipeId: string;
  recipeName: string;
  name: string;
  amountText: string;
  purchaseText?: string;
  checked: boolean;
}

const BASKET_STORAGE_KEY = 'recipe-app-basket-items';
const FAMILY_BASKET_STORAGE_PREFIX = 'recipe-app-family-basket-items';

export const defaultBasketItems: BasketItem[] = [
  { id: 'asparagus', recipeId: 'recipe-3', recipeName: '芦笋虾仁', name: '芦笋', amountText: '200g', checked: false },
  { id: 'shrimp', recipeId: 'recipe-3', recipeName: '芦笋虾仁', name: '虾仁', amountText: '150g', checked: false },
  { id: 'garlic-1', recipeId: 'recipe-3', recipeName: '芦笋虾仁', name: '大蒜', amountText: '3瓣', checked: false },
  { id: 'ginger-1', recipeId: 'recipe-3', recipeName: '芦笋虾仁', name: '生姜', amountText: '3片', checked: true },
  { id: 'tomato', recipeId: 'recipe-2', recipeName: '番茄牛腩', name: '番茄', amountText: '4个', checked: false },
  { id: 'beef', recipeId: 'recipe-2', recipeName: '番茄牛腩', name: '牛腩', amountText: '500g', checked: false },
  { id: 'ginger-2', recipeId: 'recipe-2', recipeName: '番茄牛腩', name: '生姜', amountText: '4片', checked: true },
  { id: 'garlic-2', recipeId: 'recipe-2', recipeName: '番茄牛腩', name: '大蒜', amountText: '2瓣', checked: false },
  { id: 'lettuce', recipeId: 'recipe-1', recipeName: '初夏蔬菜沙拉', name: '生菜', amountText: '1颗', checked: false },
  { id: 'cucumber', recipeId: 'recipe-1', recipeName: '初夏蔬菜沙拉', name: '黄瓜', amountText: '1根', checked: false },
  { id: 'olive-oil', recipeId: 'recipe-1', recipeName: '初夏蔬菜沙拉', name: '橄榄油', amountText: '1勺', checked: false }
];

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const isBasketItem = (value: unknown): value is BasketItem => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === 'string' &&
    typeof value.recipeId === 'string' &&
    typeof value.recipeName === 'string' &&
    typeof value.name === 'string' &&
    typeof value.amountText === 'string' &&
    (value.purchaseText === undefined || typeof value.purchaseText === 'string') &&
    typeof value.checked === 'boolean'
  );
};

export const getIngredientBasketItemId = (ingredientId: string) => `ingredient-${ingredientId}`;

const getBasketStorageKey = (familyId = loadActiveFamilyId()) => `${FAMILY_BASKET_STORAGE_PREFIX}-${familyId}`;

const getPrimaryFamilyId = () => loadFamilies()[0]?.id ?? loadActiveFamilyId();

export const getIngredientPurchaseText = (name: string) => {
  const purchaseTextMap: Record<string, string> = {
    芦笋: '约18元/斤',
    虾仁: '约38元/斤',
    三文鱼: '约68元/斤',
    西兰花: '约8元/斤',
    番茄: '约6元/斤',
    草莓: '约22元/斤',
    苹果: '约9元/斤',
    牛肉: '约45元/斤',
    生抽: '约12元/瓶',
    料酒: '约8元/瓶',
    食用油: '约65元/桶',
    盐: '约3元/袋'
  };

  return purchaseTextMap[name];
};

export const loadBasketItems = (familyId = loadActiveFamilyId()) => {
  const scopedItems = uni.getStorageSync(getBasketStorageKey(familyId)) as unknown;
  if (Array.isArray(scopedItems)) {
    return scopedItems.filter(isBasketItem).map(withPurchaseText);
  }

  const legacyItems = uni.getStorageSync(BASKET_STORAGE_KEY) as unknown;
  if (Array.isArray(legacyItems) && familyId === getPrimaryFamilyId()) {
    const migratedItems = legacyItems.filter(isBasketItem).map(withPurchaseText);
    saveBasketItems(migratedItems, familyId);
    return migratedItems;
  }

  if (familyId === getPrimaryFamilyId()) {
    const initialItems = defaultBasketItems.map(withPurchaseText);
    saveBasketItems(initialItems, familyId);
    return initialItems;
  }

  return [];
};

const withPurchaseText = (item: BasketItem): BasketItem => ({
  ...item,
  purchaseText: item.purchaseText ?? getIngredientPurchaseText(item.name)
});

export const saveBasketItems = (items: BasketItem[], familyId = loadActiveFamilyId()) => {
  uni.setStorageSync(getBasketStorageKey(familyId), items);
};

export const addBasketItem = (item: BasketItem, familyId = loadActiveFamilyId()) => {
  const items = loadBasketItems(familyId);
  if (items.some((basketItem) => basketItem.id === item.id)) {
    return items;
  }

  const nextItems = [...items, item];
  saveBasketItems(nextItems, familyId);
  return nextItems;
};

export const removeBasketItem = (itemId: string, familyId = loadActiveFamilyId()) => {
  const nextItems = loadBasketItems(familyId).filter((item) => item.id !== itemId);
  saveBasketItems(nextItems, familyId);
  return nextItems;
};
