import { clearAdminUser, clearToken, loadToken } from './storage';
import type {
  ApiResponse,
  Ingredient,
  IngredientCategory,
  AdminResourceItem,
  LoginResult,
  PageResult,
  Recipe
} from './types';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3002/api/admin';

export const resolveAssetUrl = (url: string | null | undefined) => {
  if (!url) return null;
  if (/^(https?:|blob:|data:)/i.test(url)) return url;
  if (!url.startsWith('/')) return url;
  const apiUrl = new URL(API_BASE);
  return `${apiUrl.origin}${url}`;
};

const normalizePage = (value: unknown, fallback: number) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(1, Math.floor(parsed));
};

const normalizePageSize = (value: unknown, fallback: number) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(100, Math.max(1, Math.floor(parsed)));
};

const createPageQuery = (page: unknown, pageSize: unknown, defaultPageSize: number) =>
  new URLSearchParams({
    page: String(normalizePage(page, 1)),
    pageSize: String(normalizePageSize(pageSize, defaultPageSize))
  });

const isMeaningfulParam = (value: unknown) => value !== undefined && value !== null && value !== '' && value !== 'all' && value !== 'empty';

const setParam = (qs: URLSearchParams, key: string, value: unknown) => {
  if (isMeaningfulParam(value)) qs.set(key, String(value));
};

export class ApiError extends Error {
  code: number;
  constructor(message: string, code = 500) {
    super(message);
    this.code = code;
  }
}

const request = async <T>(
  path: string,
  init: RequestInit & { auth?: boolean } = {}
): Promise<T> => {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');

  if (init.auth !== false) {
    const token = loadToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, { ...init, headers });
  const payload = (await response.json()) as ApiResponse<T>;

  if (payload.code !== 0) {
    if (payload.code === 401) {
      clearToken();
      clearAdminUser();
    }
    throw new ApiError(payload.message, payload.code);
  }
  return (payload as { data: T }).data;
};

export type UploadImageResult = {
  url: string;
};

export const uploadImage = async (file: File): Promise<UploadImageResult> => {
  const formData = new FormData();
  formData.append('file', file);

  const headers = new Headers();
  const token = loadToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${API_BASE}/upload/image`, {
    method: 'POST',
    headers,
    body: formData
  });
  const payload = (await response.json()) as ApiResponse<UploadImageResult>;
  if (payload.code !== 0) {
    if (payload.code === 401) {
      clearToken();
      clearAdminUser();
    }
    throw new ApiError(payload.message, payload.code);
  }
  if (!payload.data) throw new ApiError('图片上传失败');
  return payload.data;
};

export const login = async (username: string, password: string) => {
  return request<LoginResult>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
    auth: false
  });
};

export const listCategories = async (params: {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: IngredientCategory['status'];
  type?: IngredientCategory['type'];
} = {}) => {
  const qs = createPageQuery(params.page, params.pageSize, 20);
  setParam(qs, 'type', params.type ?? 'INGREDIENT');
  setParam(qs, 'q', params.q?.trim());
  setParam(qs, 'status', params.status);
  return request<PageResult<IngredientCategory>>(`/categories?${qs.toString()}`);
};

export const createCategory = async (payload: {
  name: string;
  type: IngredientCategory['type'];
  sort: number;
  status: IngredientCategory['status'];
  isPublish: boolean;
}) => {
  return request<IngredientCategory>('/categories', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const updateCategory = async (
  id: number,
  payload: {
    name: string;
    type: IngredientCategory['type'];
    sort: number;
    status: IngredientCategory['status'];
    isPublish: boolean;
  }
) => {
  return request<IngredientCategory>(`/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
};

export const deleteCategory = async (id: number) => {
  return request<IngredientCategory>(`/categories/${id}`, { method: 'DELETE' });
};

export const setCategoryPublish = async (id: number, isPublish: boolean) => {
  return request<IngredientCategory>(`/categories/${id}/publish`, {
    method: 'PATCH',
    body: JSON.stringify({ isPublish })
  });
};

export const setCategoryStatus = async (id: number, status: IngredientCategory['status']) => {
  return request<IngredientCategory>(`/categories/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
};

export const getCategory = async (id: number) => {
  return request<IngredientCategory>(`/categories/${id}`);
};

export const listIngredients = async (params: {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: Ingredient['status'];
  isPublish?: boolean;
  isRecommend?: boolean;
  categoryId?: number;
} = {}) => {
  const qs = createPageQuery(params.page, params.pageSize, 20);
  setParam(qs, 'q', params.q?.trim());
  setParam(qs, 'status', params.status);
  if (typeof params.isPublish === 'boolean') qs.set('isPublish', String(params.isPublish));
  if (typeof params.isRecommend === 'boolean') qs.set('isRecommend', String(params.isRecommend));
  if (typeof params.categoryId === 'number' && Number.isFinite(params.categoryId)) qs.set('categoryId', String(params.categoryId));
  return request<PageResult<Ingredient>>(`/ingredients?${qs.toString()}`);
};

type IngredientWritePayload = {
  name: string;
  coverUrl: string | null;
  categoryId: number | null;
  seasonMonth: string | null;
  nutrition: string | null;
  selectionTips: string | null;
  storageMethod: string | null;
  taboo: string | null;
  currentPrice: number | null;
  priceUnit: string | null;
  priceSource: string | null;
  isPublish: boolean;
  isRecommend: boolean;
  status: Ingredient['status'];
  sort: number;
};

const toIngredientRequestBody = ({ coverUrl, ...payload }: IngredientWritePayload) => ({
  ...payload,
  cover: coverUrl
});

export const createIngredient = async (payload: IngredientWritePayload) => {
  return request<Ingredient>('/ingredients', { method: 'POST', body: JSON.stringify(toIngredientRequestBody(payload)) });
};

export const updateIngredient = async (id: number, payload: IngredientWritePayload) => {
  return request<Ingredient>(`/ingredients/${id}`, { method: 'PUT', body: JSON.stringify(toIngredientRequestBody(payload)) });
};

export const deleteIngredient = async (id: number) => {
  return request<Ingredient>(`/ingredients/${id}`, { method: 'DELETE' });
};

export const setIngredientPublish = async (id: number, isPublish: boolean) => {
  return request<Ingredient>(`/ingredients/${id}/publish`, {
    method: 'PATCH',
    body: JSON.stringify({ isPublish })
  });
};

export const setIngredientRecommend = async (id: number, isRecommend: boolean) => {
  return request<Ingredient>(`/ingredients/${id}/recommend`, {
    method: 'PATCH',
    body: JSON.stringify({ isRecommend })
  });
};

export const setIngredientStatus = async (id: number, status: Ingredient['status']) => {
  return request<Ingredient>(`/ingredients/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
};

export const getIngredient = async (id: number) => {
  return request<Ingredient>(`/ingredients/${id}`);
};

export const listRecipes = async (params: {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: Recipe['status'];
  isPublish?: boolean;
  isRecommend?: boolean;
  auditStatus?: Recipe['auditStatus'];
  categoryId?: number;
} = {}) => {
  const qs = createPageQuery(params.page, params.pageSize, 20);
  setParam(qs, 'q', params.q?.trim());
  setParam(qs, 'status', params.status);
  if (typeof params.isPublish === 'boolean') qs.set('isPublish', String(params.isPublish));
  if (typeof params.isRecommend === 'boolean') qs.set('isRecommend', String(params.isRecommend));
  setParam(qs, 'auditStatus', params.auditStatus);
  if (typeof params.categoryId === 'number' && Number.isFinite(params.categoryId)) qs.set('categoryId', String(params.categoryId));
  return request<PageResult<Recipe>>(`/recipes?${qs.toString()}`);
};

export const getRecipe = async (id: number) => {
  return request<Recipe>(`/recipes/${id}`);
};

type RecipeWritePayload = {
  title: string;
  subtitle: string | null;
  coverUrl: string | null;
  description: string | null;
  categoryId: number | null;
  cookTime: number | null;
  servings: number | null;
  calories: number | null;
  difficulty: string | null;
  taste: string | null;
  scene: string | null;
  tips: string | null;
  sort: number;
  status: Recipe['status'];
  auditStatus: Recipe['auditStatus'];
  isDraft: boolean;
  isPublish: boolean;
  isRecommend: boolean;
  steps: { sortIndex: number; title: string | null; description: string; image: string | null }[];
  ingredients: {
    sortIndex: number;
    ingredientId: number | null;
    name: string;
    amount: string | null;
  }[];
};

const toRecipeRequestBody = ({ coverUrl, ...payload }: RecipeWritePayload) => ({
  ...payload,
  cover: coverUrl
});

export const createRecipe = async (payload: RecipeWritePayload) => {
  return request<Recipe>('/recipes', { method: 'POST', body: JSON.stringify(toRecipeRequestBody(payload)) });
};

export const updateRecipe = async (id: number, payload: RecipeWritePayload) => {
  return request<Recipe>(`/recipes/${id}`, { method: 'PUT', body: JSON.stringify(toRecipeRequestBody(payload)) });
};

export const deleteRecipe = async (id: number) => {
  return request<Recipe>(`/recipes/${id}`, { method: 'DELETE' });
};

export const setRecipePublish = async (id: number, isPublish: boolean) => {
  return request<Recipe>(`/recipes/${id}/publish`, {
    method: 'PATCH',
    body: JSON.stringify({ isPublish })
  });
};

export const setRecipeRecommend = async (id: number, isRecommend: boolean) => {
  return request<Recipe>(`/recipes/${id}/recommend`, {
    method: 'PATCH',
    body: JSON.stringify({ isRecommend })
  });
};

export const setRecipeStatus = async (id: number, status: Recipe['status']) => {
  return request<Recipe>(`/recipes/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
};

export const setRecipeAudit = async (id: number, auditStatus: Recipe['auditStatus']) => {
  return request<Recipe>(`/recipes/${id}/audit`, {
    method: 'PATCH',
    body: JSON.stringify({ auditStatus })
  });
};

export const listAdminResource = async <T extends AdminResourceItem>(
  resource: string,
  params: {
    page?: number;
    pageSize?: number;
    q?: string;
    status?: T['status'];
    isPublish?: boolean;
    isRecommend?: boolean;
  } = {}
) => {
  const qs = createPageQuery(params.page, params.pageSize, 20);
  setParam(qs, 'q', params.q?.trim());
  setParam(qs, 'status', params.status);
  if (typeof params.isPublish === 'boolean') qs.set('isPublish', String(params.isPublish));
  if (typeof params.isRecommend === 'boolean') qs.set('isRecommend', String(params.isRecommend));
  return request<PageResult<T>>(`/${resource}?${qs.toString()}`);
};

export const createAdminResource = async <T extends AdminResourceItem>(
  resource: string,
  payload: Record<string, unknown>
) => {
  return request<T>(`/${resource}`, { method: 'POST', body: JSON.stringify(payload) });
};

export const updateAdminResource = async <T extends AdminResourceItem>(
  resource: string,
  id: number,
  payload: Record<string, unknown>
) => {
  return request<T>(`/${resource}/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
};

export const deleteAdminResource = async <T extends AdminResourceItem>(resource: string, id: number) => {
  return request<T>(`/${resource}/${id}`, { method: 'DELETE' });
};
