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

const deriveApiOrigin = () => {
  try {
    return new URL(API_BASE).origin;
  } catch {
    if (typeof window !== 'undefined' && window.location?.origin) {
      return window.location.origin;
    }
    return 'http://localhost:3002';
  }
};

const API_ORIGIN = deriveApiOrigin();

export const resolveAssetUrl = (input?: string | null): string => {
  if (!input) return '';
  const value = String(input).trim();
  if (!value) return '';
  if (
    value.startsWith('http://') ||
    value.startsWith('https://') ||
    value.startsWith('data:') ||
    value.startsWith('blob:')
  ) {
    return value;
  }
  if (value.startsWith('/uploads/')) {
    return `${API_ORIGIN}${value}`;
  }
  try {
    return new URL(value, API_ORIGIN).toString();
  } catch {
    return '';
  }
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
  type?: 'image' | 'video';
  name?: string;
  size?: number;
  mimeType?: string;
};

export type UploadMediaResult = Required<Pick<UploadImageResult, 'url'>> & {
  type: 'image' | 'video';
  name: string;
  size: number;
  mimeType?: string;
};

const uploadFile = async <T extends UploadImageResult>(file: File, endpoint: 'image' | 'video' | 'media'): Promise<T> => {
  const formData = new FormData();
  formData.append('file', file);

  const headers = new Headers();
  const token = loadToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${API_BASE}/upload/${endpoint}`, {
    method: 'POST',
    headers,
    body: formData
  });
  const payload = (await response.json()) as ApiResponse<T>;
  if (payload.code !== 0) {
    if (payload.code === 401) {
      clearToken();
      clearAdminUser();
    }
    throw new ApiError(payload.message, payload.code);
  }
  if (!payload.data) throw new ApiError('上传失败');
  return payload.data;
};

export const uploadImage = async (file: File): Promise<UploadImageResult> => uploadFile<UploadImageResult>(file, 'image');
export const uploadVideo = async (file: File): Promise<UploadMediaResult> => uploadFile<UploadMediaResult>(file, 'video');
export const uploadMedia = async (file: File): Promise<UploadMediaResult> => uploadFile<UploadMediaResult>(file, 'media');

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
  setParam(qs, 'type', params.type);
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

export type TagItem = {
  id: number;
  name: string;
  scope: 'RECIPE' | 'INGREDIENT' | 'SCENE' | 'TASTE' | 'METHOD' | 'CROWD';
  sort: number;
  status: 'ACTIVE' | 'DISABLED';
  isPublish: boolean;
  createdAt: string;
  updatedAt: string;
};

export const listTags = async (params: {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: TagItem['status'];
  scope?: TagItem['scope'];
} = {}) => {
  const qs = createPageQuery(params.page, params.pageSize, 20);
  setParam(qs, 'q', params.q?.trim());
  setParam(qs, 'status', params.status);
  setParam(qs, 'scope', params.scope);
  return request<PageResult<TagItem>>(`/tags?${qs.toString()}`);
};

export const createTag = async (payload: { name: string; scope: TagItem['scope']; sort: number; status: TagItem['status']; isPublish: boolean }) => {
  return request<TagItem>('/tags', { method: 'POST', body: JSON.stringify(payload) });
};

export const updateTag = async (id: number, payload: { name: string; scope: TagItem['scope']; sort: number; status: TagItem['status']; isPublish: boolean }) => {
  return request<TagItem>(`/tags/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
};

export const deleteTag = async (id: number) => {
  return request<TagItem>(`/tags/${id}`, { method: 'DELETE' });
};

export const setTagStatus = async (id: number, status: TagItem['status']) => {
  return request<TagItem>(`/tags/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
};

export type ChannelItem = {
  id: number;
  name: string;
  code: string;
  position: string | null;
  sort: number;
  status: 'ACTIVE' | 'DISABLED';
  isPublish: boolean;
  createdAt: string;
  updatedAt: string;
};

export const listChannels = async (params: {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: ChannelItem['status'];
} = {}) => {
  const qs = createPageQuery(params.page, params.pageSize, 20);
  setParam(qs, 'q', params.q?.trim());
  setParam(qs, 'status', params.status);
  return request<PageResult<ChannelItem>>(`/channels?${qs.toString()}`);
};

export const createChannel = async (payload: { name: string; code: string; position: string | null; sort: number; status: ChannelItem['status']; isPublish: boolean }) => {
  return request<ChannelItem>('/channels', { method: 'POST', body: JSON.stringify(payload) });
};

export const updateChannel = async (id: number, payload: { name: string; code: string; position: string | null; sort: number; status: ChannelItem['status']; isPublish: boolean }) => {
  return request<ChannelItem>(`/channels/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
};

export const deleteChannel = async (id: number) => {
  return request<ChannelItem>(`/channels/${id}`, { method: 'DELETE' });
};

export const setChannelStatus = async (id: number, status: ChannelItem['status']) => {
  return request<ChannelItem>(`/channels/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
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
  detailImages?: string[];
  selectionMedia?: string | null;
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
  images?: string[];
  video?: string | null;
  description: string | null;
  categoryId: number | null;
  cookTime: number | null;
  servings: number | null;
  calories: number | null;
  difficulty: string | null;
  taste: string | null;
  scene: string | null;
  visibility?: string | null;
  tips: string | null;
  sort: number;
  status: Recipe['status'];
  auditStatus: Recipe['auditStatus'];
  isDraft: boolean;
  isPublish: boolean;
  isRecommend: boolean;
  steps: { sortIndex: number; title: string | null; description: string; image: string | null; video?: string | null; duration?: number | null }[];
  ingredients: {
    sortIndex: number;
    ingredientId: number | null;
    name: string;
    amount: string | null;
    unit?: string | null;
    type?: string | null;
    note?: string | null;
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
  return isPublish ? publishRecipe(id) : offlineRecipe(id);
};

export const publishRecipe = async (id: number) => request<Recipe>(`/recipes/${id}/publish`, { method: 'PATCH', body: JSON.stringify({ isPublish: true }) });

export const offlineRecipe = async (id: number) => request<Recipe>(`/recipes/${id}/offline`, { method: 'PATCH' });

export const submitRecipeAudit = async (id: number) => request<Recipe>(`/recipes/${id}/submit-audit`, { method: 'PATCH' });

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

export const setRecipeAudit = async (id: number, auditStatus: Recipe['auditStatus'], rejectReason?: string) => {
  return request<Recipe>(`/recipes/${id}/audit`, {
    method: 'PATCH',
    body: JSON.stringify({ auditStatus, rejectReason })
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

import type { AuditItem } from './types';

export const listAudits = async (params: {
  page?: number;
  pageSize?: number;
  type?: AuditItem['type'];
  status?: AuditItem['auditStatus'];
  keyword?: string;
} = {}) => {
  const qs = createPageQuery(params.page, params.pageSize, 10);
  if (params.type) qs.set('type', params.type);
  if (params.status) qs.set('status', params.status);
  if (params.keyword) qs.set('keyword', params.keyword.trim());
  return request<PageResult<AuditItem>>(`/audits?${qs.toString()}`);
};

export const approveAudit = async (bizId: number, type: string) => {
  if (type === 'RECIPE') {
    return request<Recipe>(`/recipes/${bizId}/audit`, {
      method: 'PATCH',
      body: JSON.stringify({ auditStatus: 'APPROVED' })
    });
  }
  throw new ApiError('暂不支持此类型的审核操作');
};

export const rejectAudit = async (bizId: number, type: string, rejectReason: string) => {
  if (type === 'RECIPE') {
    return request<Recipe>(`/recipes/${bizId}/audit`, {
      method: 'PATCH',
      body: JSON.stringify({ auditStatus: 'REJECTED', rejectReason })
    });
  }
  throw new ApiError('暂不支持此类型的审核操作');
};

export const deleteAdminResource = async <T extends AdminResourceItem>(resource: string, id: number) => {
  return request<T>(`/${resource}/${id}`, { method: 'DELETE' });
};
