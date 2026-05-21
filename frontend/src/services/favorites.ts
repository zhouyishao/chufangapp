export interface FavoriteIngredient {
  id: string;
  name: string;
  description: string;
  image: string;
  tag: string;
}

const FAVORITE_INGREDIENTS_STORAGE_KEY = 'recipe-app-favorite-ingredients';

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const isFavoriteIngredient = (value: unknown): value is FavoriteIngredient => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.description === 'string' &&
    typeof value.image === 'string' &&
    typeof value.tag === 'string'
  );
};

export const loadFavoriteIngredients = () => {
  const storedItems = uni.getStorageSync(FAVORITE_INGREDIENTS_STORAGE_KEY) as unknown;
  if (!Array.isArray(storedItems)) {
    return [];
  }

  return storedItems.filter(isFavoriteIngredient);
};

export const saveFavoriteIngredients = (items: FavoriteIngredient[]) => {
  uni.setStorageSync(FAVORITE_INGREDIENTS_STORAGE_KEY, items);
};

export const addFavoriteIngredient = (ingredient: FavoriteIngredient) => {
  const items = loadFavoriteIngredients();
  if (items.some((item) => item.id === ingredient.id)) {
    return items;
  }

  const nextItems = [ingredient, ...items];
  saveFavoriteIngredients(nextItems);
  return nextItems;
};

export const removeFavoriteIngredient = (ingredientId: string) => {
  const nextItems = loadFavoriteIngredients().filter((item) => item.id !== ingredientId);
  saveFavoriteIngredients(nextItems);
  return nextItems;
};
