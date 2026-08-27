import { HttpError } from '../../http/errors';

export type RecipeProviderRole = 'PRIMARY' | 'SUPPLEMENTAL' | 'OVERSEAS' | 'TEST';

const RECIPE_PROVIDER_ROLES: Record<string, RecipeProviderRole> = {
  proj_kitchen: 'PRIMARY',
  tianapi_caipu: 'SUPPLEMENTAL',
  themealdb_recipe: 'OVERSEAS',
  mock_recipe: 'TEST'
};

export const getRecipeProviderRole = (providerCode: string): RecipeProviderRole | null =>
  RECIPE_PROVIDER_ROLES[providerCode.trim().toLowerCase()] ?? null;

export const assertRecipeProviderCanSync = (provider: {
  providerCode: string;
  resourceType: string;
  status: string;
  licenseNote?: string | null;
}): void => {
  if (provider.status !== 'ACTIVE') throw new HttpError('Provider 已禁用，不能同步', 409, 409);
  if (provider.resourceType !== 'RECIPE') return;

  const role = getRecipeProviderRole(provider.providerCode);
  if (role !== 'PRIMARY' && role !== 'SUPPLEMENTAL') {
    throw new HttpError('该 Provider 不允许同步中国菜谱', 409, 409);
  }
  if (!provider.licenseNote?.trim()) {
    throw new HttpError('该中国菜谱 Provider 未确认内容许可，不能执行生产同步', 409, 409);
  }
};
