import { loadAuthUser, syncAuthUserWithBackend } from './auth';
import {
  createMobileIngredientPriceRecord,
  deleteMobileIngredientPriceRecord,
  listMobileIngredientPriceRecords,
  type ApiIngredientPriceRecord
} from './public-api';

export interface IngredientPriceRecord {
  id: string;
  ingredientId: number;
  ingredientName: string;
  price: number;
  unit: string;
  date: string;
}

const toRecord = (record: ApiIngredientPriceRecord, ingredientName = ''): IngredientPriceRecord => ({
  id: String(record.id),
  ingredientId: record.ingredientId,
  ingredientName,
  price: record.price,
  unit: record.unit,
  date: record.date
});

const requireUser = async () => {
  const user = await syncAuthUserWithBackend(loadAuthUser());
  if (!user?.id) throw new Error('请先登录');
  return { ...user, id: user.id };
};

export const loadPriceRecords = async (ingredientId: number, ingredientName = '') => {
  const user = await requireUser();
  const records = await listMobileIngredientPriceRecords({ userId: user.id, ingredientId });
  return records.map((record) => toRecord(record, ingredientName));
};

export const addPriceRecords = async (records: IngredientPriceRecord[]) => {
  if (!records.length) return [];
  const user = await requireUser();
  const created = await Promise.all(
    records.map((record) =>
      createMobileIngredientPriceRecord({
        userId: user.id,
        ingredientId: record.ingredientId,
        price: record.price,
        unit: record.unit,
        priceDate: record.date
      })
    )
  );
  return created.map((record) => toRecord(record));
};

export const removePriceRecord = async (recordId: string) => {
  const user = await requireUser();
  await deleteMobileIngredientPriceRecord(Number(recordId), user.id);
  return true;
};

export const getPriceRecordsByIngredient = async (ingredientId: number, ingredientName = '') => {
  return loadPriceRecords(ingredientId, ingredientName);
};
