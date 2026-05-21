export interface IngredientPriceRecord {
  id: string;
  ingredientName: string;
  price: number;
  unit: string;
  date: string;
}

const PRICE_STORAGE_KEY = 'recipe-app-ingredient-price-records';

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const isIngredientPriceRecord = (value: unknown): value is IngredientPriceRecord => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === 'string' &&
    typeof value.ingredientName === 'string' &&
    typeof value.price === 'number' &&
    typeof value.unit === 'string' &&
    typeof value.date === 'string'
  );
};

export const loadPriceRecords = () => {
  const storedRecords = uni.getStorageSync(PRICE_STORAGE_KEY) as unknown;
  if (!Array.isArray(storedRecords)) {
    return [];
  }

  return storedRecords.filter(isIngredientPriceRecord);
};

export const savePriceRecords = (records: IngredientPriceRecord[]) => {
  uni.setStorageSync(PRICE_STORAGE_KEY, records);
};

export const addPriceRecords = (records: IngredientPriceRecord[]) => {
  const nextRecords = [...loadPriceRecords(), ...records];
  savePriceRecords(nextRecords);
  return nextRecords;
};

export const removePriceRecord = (recordId: string) => {
  const nextRecords = loadPriceRecords().filter((record) => record.id !== recordId);
  savePriceRecords(nextRecords);
  return nextRecords;
};

export const getPriceRecordsByIngredient = (ingredientName: string) => {
  return loadPriceRecords()
    .filter((record) => record.ingredientName === ingredientName)
    .sort((a, b) => b.date.localeCompare(a.date));
};
