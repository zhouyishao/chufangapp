import { clearAdminUser, clearToken, loadToken } from './storage';
import type {
  ApiResponse,
  Ingredient,
  IngredientCategory,
  AdminUserActivityItem,
  AdminUserListItem,
  AdminResourceItem,
  LoginResult,
  PageResult,
  Recipe,
  ResourceApiProviderItem,
  ResourceAppItem,
  ResourceApiKeyItem,
  ResourcePermissionItem,
  ResourceLogItem
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
  if (value.startsWith('/uploads/') || value.startsWith('/static/')) {
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
  const rawPayload = await response.text();
  let payload: ApiResponse<T>;
  try {
    payload = JSON.parse(rawPayload) as ApiResponse<T>;
  } catch {
    const preview = rawPayload.trim().slice(0, 80);
    throw new ApiError(
      `接口未返回 JSON，请确认后端已重启并挂载 ${API_BASE}${path}${preview ? `（返回：${preview}）` : ''}`,
      response.status || 502
    );
  }

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

export const listUsers = async (params: {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: AdminUserListItem['status'];
  registerSource?: AdminUserListItem['registerSource'];
  familyCount?: 'NONE' | 'ONE' | 'MULTIPLE';
  source?: string;
  role?: string;
  startDate?: string;
  endDate?: string;
} = {}) => {
  const qs = createPageQuery(params.page, params.pageSize, 20);
  setParam(qs, 'q', params.q?.trim());
  setParam(qs, 'status', params.status);
  setParam(qs, 'registerSource', params.registerSource);
  setParam(qs, 'familyCount', params.familyCount);
  setParam(qs, 'source', params.source);
  setParam(qs, 'role', params.role);
  setParam(qs, 'startDate', params.startDate);
  setParam(qs, 'endDate', params.endDate);
  return request<PageResult<AdminUserListItem>>(`/users?${qs.toString()}`);
};

export const getUser = async (id: string | number) => {
  return request<AdminUserListItem>(`/users/${id}`);
};

export const createUser = async (payload: Record<string, unknown>) => {
  return request<AdminUserListItem>('/users', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const updateUser = async (id: string | number, payload: Record<string, unknown>) => {
  return request<AdminUserListItem>(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
};

export const deleteUser = async (id: string | number) => {
  return request<{ success: boolean; message: string; id: string }>(`/users/${id}`, {
    method: 'DELETE'
  });
};

export const setUserStatus = async (id: string | number, status: AdminUserListItem['status']) => {
  return request<AdminUserListItem>(`/users/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
};

export const listUserFavorites = async (params: {
  page?: number;
  pageSize?: number;
  q?: string;
  userId?: number;
  targetType?: AdminUserActivityItem['targetType'] | 'all';
} = {}) => {
  const qs = createPageQuery(params.page, params.pageSize, 20);
  setParam(qs, 'q', params.q?.trim());
  setParam(qs, 'userId', params.userId);
  setParam(qs, 'targetType', params.targetType);
  return request<PageResult<AdminUserActivityItem>>(`/users/favorites?${qs.toString()}`);
};

export const listUserRecentViews = async (params: {
  page?: number;
  pageSize?: number;
  q?: string;
  userId?: number;
  targetType?: AdminUserActivityItem['targetType'] | 'all';
} = {}) => {
  const qs = createPageQuery(params.page, params.pageSize, 20);
  setParam(qs, 'q', params.q?.trim());
  setParam(qs, 'userId', params.userId);
  setParam(qs, 'targetType', params.targetType);
  return request<PageResult<AdminUserActivityItem>>(`/users/recent-views?${qs.toString()}`);
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
  id: string,
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

export const deleteCategory = async (id: string) => {
  return request<IngredientCategory>(`/categories/${id}`, { method: 'DELETE' });
};

export const setCategoryPublish = async (id: string, isPublish: boolean) => {
  return request<IngredientCategory>(`/categories/${id}/publish`, {
    method: 'PATCH',
    body: JSON.stringify({ isPublish })
  });
};

export const setCategoryStatus = async (id: string, status: IngredientCategory['status']) => {
  return request<IngredientCategory>(`/categories/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
};

export const getCategory = async (id: string) => {
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

export const getTag = async (id: number | string) => {
  return request<TagItem>(`/tags/${id}`);
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

export const updateChannel = async (id: string, payload: { name: string; code: string; position: string | null; sort: number; status: ChannelItem['status']; isPublish: boolean }) => {
  return request<ChannelItem>(`/channels/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
};

export const deleteChannel = async (id: string) => {
  return request<ChannelItem>(`/channels/${id}`, { method: 'DELETE' });
};

export const setChannelStatus = async (id: string, status: ChannelItem['status']) => {
  return request<ChannelItem>(`/channels/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
};

export const listIngredients = async (params: {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: Ingredient['status'];
  isPublish?: boolean;
  isRecommend?: boolean;
  categoryId?: string;
} = {}) => {
  const qs = createPageQuery(params.page, params.pageSize, 20);
  setParam(qs, 'q', params.q?.trim());
  setParam(qs, 'status', params.status);
  if (typeof params.isPublish === 'boolean') qs.set('isPublish', String(params.isPublish));
  if (typeof params.isRecommend === 'boolean') qs.set('isRecommend', String(params.isRecommend));
  setParam(qs, 'categoryId', params.categoryId);
  return request<PageResult<Ingredient>>(`/ingredients?${qs.toString()}`);
};

type IngredientWritePayload = {
  name: string;
  coverUrl: string | null;
  categoryId: string | null;
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

export const updateIngredient = async (id: string, payload: IngredientWritePayload) => {
  return request<Ingredient>(`/ingredients/${id}`, { method: 'PUT', body: JSON.stringify(toIngredientRequestBody(payload)) });
};

export const deleteIngredient = async (id: string) => {
  return request<Ingredient>(`/ingredients/${id}`, { method: 'DELETE' });
};

export const setIngredientPublish = async (id: string, isPublish: boolean) => {
  return request<Ingredient>(`/ingredients/${id}/publish`, {
    method: 'PATCH',
    body: JSON.stringify({ isPublish })
  });
};

export const setIngredientRecommend = async (id: string, isRecommend: boolean) => {
  return request<Ingredient>(`/ingredients/${id}/recommend`, {
    method: 'PATCH',
    body: JSON.stringify({ isRecommend })
  });
};

export const setIngredientStatus = async (id: string, status: Ingredient['status']) => {
  return request<Ingredient>(`/ingredients/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
};

export const getIngredient = async (id: string) => {
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
  categoryId?: string;
} = {}) => {
  const qs = createPageQuery(params.page, params.pageSize, 20);
  setParam(qs, 'q', params.q?.trim());
  setParam(qs, 'status', params.status);
  if (typeof params.isPublish === 'boolean') qs.set('isPublish', String(params.isPublish));
  if (typeof params.isRecommend === 'boolean') qs.set('isRecommend', String(params.isRecommend));
  setParam(qs, 'auditStatus', params.auditStatus);
  setParam(qs, 'categoryId', params.categoryId);
  return request<PageResult<Recipe>>(`/recipes?${qs.toString()}`);
};

export const getRecipe = async (id: string) => {
  return request<Recipe>(`/recipes/${id}`);
};

type RecipeWritePayload = {
  title: string;
  subtitle: string | null;
  coverUrl: string | null;
  images?: string[];
  video?: string | null;
  description: string | null;
  categoryId: string | null;
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
    ingredientId: string | number | null;
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

export const updateRecipe = async (id: string, payload: RecipeWritePayload) => {
  return request<Recipe>(`/recipes/${id}`, { method: 'PUT', body: JSON.stringify(toRecipeRequestBody(payload)) });
};

export const deleteRecipe = async (id: string) => {
  return request<Recipe>(`/recipes/${id}`, { method: 'DELETE' });
};

export const setRecipePublish = async (id: string, isPublish: boolean) => {
  return isPublish ? publishRecipe(id) : offlineRecipe(id);
};

export const publishRecipe = async (id: string) => request<Recipe>(`/recipes/${id}/publish`, { method: 'PATCH', body: JSON.stringify({ isPublish: true }) });

export const offlineRecipe = async (id: string) => request<Recipe>(`/recipes/${id}/offline`, { method: 'PATCH' });

export const submitRecipeAudit = async (id: string) => request<Recipe>(`/recipes/${id}/submit-audit`, { method: 'PATCH' });

export const setRecipeRecommend = async (id: string, isRecommend: boolean) => {
  return request<Recipe>(`/recipes/${id}/recommend`, {
    method: 'PATCH',
    body: JSON.stringify({ isRecommend })
  });
};

export const setRecipeStatus = async (id: string, status: Recipe['status']) => {
  return request<Recipe>(`/recipes/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
};

export const setRecipeAudit = async (id: string, auditStatus: Recipe['auditStatus'], rejectReason?: string) => {
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
  id: string,
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

export const approveAudit = async (bizId: string, type: string) => {
  if (type === 'RECIPE') {
    return request<Recipe>(`/recipes/${bizId}/audit`, {
      method: 'PATCH',
      body: JSON.stringify({ auditStatus: 'APPROVED' })
    });
  }
  throw new ApiError('暂不支持此类型的审核操作');
};

export const rejectAudit = async (bizId: string, type: string, rejectReason: string) => {
  if (type === 'RECIPE') {
    return request<Recipe>(`/recipes/${bizId}/audit`, {
      method: 'PATCH',
      body: JSON.stringify({ auditStatus: 'REJECTED', rejectReason })
    });
  }
  throw new ApiError('暂不支持此类型的审核操作');
};

export const deleteAdminResource = async <T extends AdminResourceItem>(resource: string, id: string) => {
  return request<T>(`/${resource}/${id}`, { method: 'DELETE' });
};

// ====== 首页顶部轮播图（HeroBanner）API ======
// 已迁移至顶部导航配置内容，绑定 navId
// 旧全局接口 /home-hero-banners 已废弃，保留类型用于兼容

export type BannerStatus = 'DRAFT' | 'ENABLED' | 'DISABLED';
export type HeroBannerTargetType = 'NONE' | 'URL' | 'RECIPE' | 'INGREDIENT' | 'CATEGORY' | 'MENU' | 'BEVERAGE' | 'TOPIC';
export type HeroBannerImageFocus = 'left' | 'center' | 'right';

export type HeroBanner = {
  id: number;
  navId: number;
  title: string;
  subtitle: string | null;
  buttonText: string | null;
  cover: string;
  imageFocus: HeroBannerImageFocus;
  targetType: HeroBannerTargetType;
  targetId: string | null;
  targetTitleSnapshot: string | null;
  link: string | null;
  sortOrder: number;
  status: BannerStatus;
  startAt: string | null;
  endAt: string | null;
  remark: string | null;
  createdAt: string;
  updatedAt: string;
};

export type HeroBannerPayload = {
  title: string;
  subtitle: string | null;
  buttonText: string | null;
  cover: string;
  imageFocus: HeroBannerImageFocus;
  targetType: HeroBannerTargetType;
  targetId: string | null;
  targetTitleSnapshot: string | null;
  link: string | null;
  sortOrder: number;
  status: BannerStatus;
  startAt: string | null;
  endAt: string | null;
  remark: string | null;
};

export const listHeroBanners = async (navId: string, params: {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: BannerStatus;
} = {}) => {
  const qs = createPageQuery(params.page, params.pageSize, 10);
  setParam(qs, 'q', params.q?.trim());
  setParam(qs, 'status', params.status);
  return request<PageResult<HeroBanner>>(`/home/top-navs/${navId}/hero-banners?${qs.toString()}`);
};

export const getHeroBanner = async (navId: string, bannerId: number) =>
  request<HeroBanner>(`/home/top-navs/${navId}/hero-banners/${bannerId}`);

export const createHeroBanner = async (navId: string, payload: HeroBannerPayload) =>
  request<HeroBanner>(`/home/top-navs/${navId}/hero-banners`, { method: 'POST', body: JSON.stringify(payload) });

export const updateHeroBanner = async (navId: string, bannerId: number, payload: HeroBannerPayload) =>
  request<HeroBanner>(`/home/top-navs/${navId}/hero-banners/${bannerId}`, { method: 'PUT', body: JSON.stringify(payload) });

export const updateHeroBannerStatus = async (navId: string, bannerId: number, status: BannerStatus) =>
  request<HeroBanner>(`/home/top-navs/${navId}/hero-banners/${bannerId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });

export const deleteHeroBanner = async (navId: string, bannerId: number) =>
  request<HeroBanner>(`/home/top-navs/${navId}/hero-banners/${bannerId}`, { method: 'DELETE' });

// ====== 旧类型别名，兼容已废弃的 HomeHeroBannersPage ======
// 该页面已迁移至顶部导航配置内容，不再作为独立页面路由
// 以下导出仅用于保持 TypeScript 编译兼容

const throwDeprecatedHomeHeroBannerError = (): never => {
  throw new ApiError('旧首页顶部轮播图入口已废弃，请进入“首页运营 > 顶部导航 > 配置内容 > 轮播图设置”继续操作。');
};

/** @deprecated 使用 HeroBanner 替代 */
export type HomeHeroBanner = HeroBanner;
/** @deprecated 使用 HeroBannerPayload 替代 */
export type HomeHeroBannerPayload = HeroBannerPayload;
/** @deprecated 使用 BannerStatus 替代 */
export type HomeHeroBannerStatus = BannerStatus;
/** @deprecated 使用 HeroBannerTargetType 替代 */
export type HomeHeroBannerTargetType = HeroBannerTargetType;
/** @deprecated 使用 listHeroBanners 替代 */
export const listHomeHeroBanners = async (params: { page?: number; pageSize?: number; q?: string; status?: BannerStatus } = {}) => {
  void params;
  return throwDeprecatedHomeHeroBannerError();
};
/** @deprecated 使用 createHeroBanner 替代 */
export const createHomeHeroBanner = async (payload: HomeHeroBannerPayload) => {
  void payload;
  return throwDeprecatedHomeHeroBannerError();
};
/** @deprecated 使用 updateHeroBanner 替代 */
export const updateHomeHeroBanner = async (id: number, payload: HomeHeroBannerPayload) => {
  void id;
  void payload;
  return throwDeprecatedHomeHeroBannerError();
};
/** @deprecated 使用 updateHeroBannerStatus 替代 */
export const updateHomeHeroBannerStatus = async (id: number, status: HomeHeroBannerStatus) => {
  void id;
  void status;
  return throwDeprecatedHomeHeroBannerError();
};
/** @deprecated 使用 deleteHeroBanner 替代 */
export const deleteHomeHeroBanner = async (id: number) => {
  void id;
  return throwDeprecatedHomeHeroBannerError();
};

export type Beverage = {
  id: string;
  legacyId?: number;
  code?: string;
  name: string;
  coverImage: string | null;
  categoryId: string | null;
  category?: { id: string; legacyId?: number; code?: string; name: string; type: IngredientCategory['type'] } | null;
  beverageType: string | null;
  isAlcoholic: boolean;
  alcoholDegree: number | null;
  description: string | null;
  status: 'ACTIVE' | 'DISABLED';
  sort: number;
  sortOrder?: number;
  isPublish: boolean;
  isRecommend: boolean;
  createdAt: string;
  updatedAt: string;
};

export type BeverageWritePayload = {
  name: string;
  coverImage: string | null;
  categoryId: string | null;
  beverageType: string | null;
  isAlcoholic: boolean;
  alcoholDegree: number | null;
  description: string | null;
  status: Beverage['status'];
  sort: number;
  sortOrder?: number;
  isPublish: boolean;
  isRecommend: boolean;
};

export const listBeverages = async (params: {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: Beverage['status'];
  isPublish?: boolean;
  isRecommend?: boolean;
  categoryId?: string;
  isAlcoholic?: boolean;
  beverageType?: string;
} = {}) => {
  const qs = createPageQuery(params.page, params.pageSize, 20);
  setParam(qs, 'q', params.q?.trim());
  setParam(qs, 'status', params.status);
  setParam(qs, 'categoryId', params.categoryId);
  setParam(qs, 'beverageType', params.beverageType);
  if (typeof params.isPublish === 'boolean') qs.set('isPublish', String(params.isPublish));
  if (typeof params.isRecommend === 'boolean') qs.set('isRecommend', String(params.isRecommend));
  if (typeof params.isAlcoholic === 'boolean') qs.set('isAlcoholic', String(params.isAlcoholic));
  return request<PageResult<Beverage>>(`/beverages?${qs.toString()}`);
};

export const getBeverage = async (id: string) => request<Beverage>(`/beverages/${id}`);
export const createBeverage = async (payload: BeverageWritePayload) => request<Beverage>('/beverages', { method: 'POST', body: JSON.stringify(payload) });
export const updateBeverage = async (id: string, payload: BeverageWritePayload) => request<Beverage>(`/beverages/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
export const deleteBeverage = async (id: string) => request<Beverage>(`/beverages/${id}`, { method: 'DELETE' });
export const enableBeverage = async (id: string) => request<Beverage>(`/beverages/${id}/enable`, { method: 'POST' });
export const disableBeverage = async (id: string) => request<Beverage>(`/beverages/${id}/disable`, { method: 'POST' });
export type HomeTopNavStatus = 'draft' | 'online' | 'offline';
export type HomeTopNavType = 'system_recommend' | 'recipe_category' | 'recipe_tag' | 'topic' | 'recommend_pool' | 'content_type';
export type HomeTopNavDisplayPosition = 'home_top' | 'category_top';
export type HomeTopNavContentType = 'recipe' | 'ingredient' | 'fruit' | 'seasoning' | 'beverage';

export type HomeTopNavRelation = {
  relationType: string;
  relationId: string;
  relationName?: string | null;
};

export type HomeTopNavStyle = {
  navStyle: string;
  activeStyle: string;
  layoutMode: string;
  textColor: string;
  activeTextColor: string;
  showDivider: boolean;
  tabGap: string;
  reserveSpace: boolean;
};

export type HomeTopNavContentRule = {
  sourceType: string;
  difficultyFilter?: string | null;
  durationFilter?: string | null;
  cookingMethodFilter?: string | null;
  displayCount: number;
  sortRule: string;
  moreButtonText: string;
  jumpRule: string;
  recommendStartAt?: string | null;
  recommendEndAt?: string | null;
};

export type HomeTopNav = {
  id: string;
  legacyId?: number;
  code?: string | null;
  name: string;
  alias?: string | null;
  navType: HomeTopNavType;
  navTypeText?: string;
  contentType?: string | null;
  contentTypeLabel?: string | null;
  displayPosition: string;
  displayPositionLabel?: string;
  iconUrl?: string | null;
  sortOrder: number;
  status: HomeTopNavStatus;
  statusText?: string;
  isDefault: boolean;
  isFixed: boolean;
  showMoreEntry: boolean;
  description?: string | null;
  remark?: string | null;
  relationName?: string | null;
  relations: HomeTopNavRelation[];
  contentRule: HomeTopNavContentRule | null;
  style: HomeTopNavStyle | null;
  updatedAt: string;
};

export type HomeTopNavPayload = {
  name: string;
  alias?: string | null;
  navType: HomeTopNavType;
  contentType?: string | null;
  displayPosition: string;
  iconUrl?: string | null;
  sortOrder: number;
  status: HomeTopNavStatus;
  isDefault: boolean;
  isFixed: boolean;
  showMoreEntry: boolean;
  description?: string | null;
  remark?: string | null;
  relations: HomeTopNavRelation[];
  contentRule: HomeTopNavContentRule;
  style: HomeTopNavStyle;
};

export type HomeTopNavSummary = {
  totalCount: number;
  onlineCount: number;
  defaultCount: number;
  availableRelationCount: number;
};

export type ContentSelectorItem = {
  id: string;
  code?: string | null;
  name: string;
  type: string;
  status: string;
};

export const getHomeTopNavSummary = async () => request<HomeTopNavSummary>('/home/top-navs/summary');

export const listHomeTopNavs = async (params: { page?: number; pageSize?: number; keyword?: string; status?: HomeTopNavStatus; displayPosition?: HomeTopNavDisplayPosition } = {}) => {
  const qs = createPageQuery(params.page, params.pageSize, 20);
  setParam(qs, 'keyword', params.keyword?.trim());
  setParam(qs, 'status', params.status);
  setParam(qs, 'displayPosition', params.displayPosition);
  return request<PageResult<HomeTopNav>>(`/home/top-navs?${qs.toString()}`);
};

export const getHomeTopNav = async (id: string) => request<HomeTopNav>(`/home/top-navs/${id}`);

export const createHomeTopNav = async (payload: HomeTopNavPayload) => request<HomeTopNav>('/home/top-navs', { method: 'POST', body: JSON.stringify(payload) });

export const updateHomeTopNav = async (id: string, payload: HomeTopNavPayload) => request<HomeTopNav>(`/home/top-navs/${id}`, { method: 'PUT', body: JSON.stringify(payload) });

export const deleteHomeTopNav = async (id: string) => request<boolean>(`/home/top-navs/${id}`, { method: 'DELETE' });

export const updateHomeTopNavStatus = async (id: string, status: HomeTopNavStatus) => request<HomeTopNav>(`/home/top-navs/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });

export const setHomeTopNavDefault = async (id: string, isDefault: boolean) => request<HomeTopNav>(`/home/top-navs/${id}/default`, { method: 'PATCH', body: JSON.stringify({ isDefault }) });

export const reorderHomeTopNavs = async (items: { id: string; sortOrder: number }[]) => request<boolean>('/home/top-navs/reorder', { method: 'PATCH', body: JSON.stringify({ items }) });

export const listContentSelector = async (params: { type: string; keyword?: string; page?: number; pageSize?: number }) => {
  const qs = createPageQuery(params.page, params.pageSize, 20);
  setParam(qs, 'type', params.type);
  setParam(qs, 'keyword', params.keyword?.trim());
  return request<PageResult<ContentSelectorItem>>(`/content-selector?${qs.toString()}`);
};

// ====== 内容模块 (ContentModule) API ======

export type ContentModuleDisplayStyle = 'HORIZONTAL_RECIPE_CARD' | 'SEASONAL_INGREDIENT_CARD' | 'IMAGE_TEXT_LIST' | 'TWO_COLUMN_RECIPE_GRID' | 'LARGE_IMAGE_CAROUSEL' | 'FOUR_CARD_GRID';
export type ContentModuleContentType = 'RECIPE' | 'INGREDIENT' | 'FRUIT' | 'SEASONING' | 'BEVERAGE';
export type ContentModuleContentSource = 'MANUAL' | 'CATEGORY' | 'CATEGORY_CONTENT' | 'CATEGORY_GROUP' | 'TAG';
export type ContentModuleStatus = 'ENABLED' | 'DISABLED';

export type ContentModuleItem = {
  id: string;
  type: string;
  sortOrder: number;
};

export type ContentModule = {
  id: number;
  navId: number;
  title: string;
  subtitle: string | null;
  displayStyle: ContentModuleDisplayStyle;
  displayStyleLabel?: string;
  contentType: ContentModuleContentType;
  contentTypeLabel?: string;
  contentSource: ContentModuleContentSource;
  contentSourceLabel?: string;
  displayCount: number;
  showMore: boolean;
  showTitle: boolean;
  moreLink: string | null;
  sortOrder: number;
  status: ContentModuleStatus;
  items: ContentModuleItem[];
  categoryId: number | null;
  tagId: number | null;
  createdAt: string;
  updatedAt: string;
};

export type ContentModulePayload = {
  title: string;
  subtitle?: string | null;
  displayStyle: ContentModuleDisplayStyle;
  contentType: ContentModuleContentType;
  contentSource: ContentModuleContentSource;
  displayCount: number;
  showMore: boolean;
  showTitle: boolean;
  moreLink?: string | null;
  sortOrder: number;
  status: ContentModuleStatus;
  items?: ContentModuleItem[];
  categoryId?: number | null;
  tagId?: number | null;
};

/** 按内容类型自动映射 CategoryType 并列出对应分类 */
export const listCategoriesByContentType = async (contentType: ContentModuleContentType) => {
  const categoryTypeMap: Record<ContentModuleContentType, IngredientCategory['type']> = {
    RECIPE: 'RECIPE',
    INGREDIENT: 'INGREDIENT',
    FRUIT: 'FRUIT',
    SEASONING: 'SEASONING',
    BEVERAGE: 'BEVERAGE'
  };
  const type = categoryTypeMap[contentType];
  return listCategories({ page: 1, pageSize: 100, type, status: 'ACTIVE' });
};

export const listContentModules = async (navId: string, params: {
  page?: number;
  pageSize?: number;
  keyword?: string;
  status?: ContentModuleStatus;
} = {}) => {
  const qs = createPageQuery(params.page, params.pageSize, 20);
  setParam(qs, 'keyword', params.keyword?.trim());
  setParam(qs, 'status', params.status);
  return request<PageResult<ContentModule>>(`/home/top-navs/${navId}/modules?${qs.toString()}`);
};

export const getContentModule = async (navId: string, moduleId: number) =>
  request<ContentModule>(`/home/top-navs/${navId}/modules/${moduleId}`);

export const createContentModule = async (navId: string, payload: ContentModulePayload) =>
  request<ContentModule>(`/home/top-navs/${navId}/modules`, { method: 'POST', body: JSON.stringify(payload) });

export const updateContentModule = async (navId: string, moduleId: number, payload: ContentModulePayload) =>
  request<ContentModule>(`/home/top-navs/${navId}/modules/${moduleId}`, { method: 'PUT', body: JSON.stringify(payload) });

export const updateContentModuleStatus = async (navId: string, moduleId: number, status: ContentModuleStatus) =>
  request<ContentModule>(`/home/top-navs/${navId}/modules/${moduleId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });

export const deleteContentModule = async (navId: string, moduleId: number) =>
  request<boolean>(`/home/top-navs/${navId}/modules/${moduleId}`, { method: 'DELETE' });

export type FamilyUserSummary = {
  id: string;
  legacyId: number;
  code?: string | null;
  nickname?: string | null;
  phone?: string | null;
  avatar?: string | null;
  gender?: string | null;
  createdAt?: string;
};

export type FamilyStatus = 'ACTIVE' | 'DISABLED';
export type FamilyMemberRole = 'CREATOR' | 'ADMIN' | 'MEMBER';
export type FamilyJoinMethod = 'SCAN_QR' | 'MANUAL_INVITE' | 'INVITE_LINK' | 'ADMIN_CREATE';
export type FamilyMemberStatus = 'ACTIVE' | 'LEFT' | 'REMOVED';
export type FamilyInviteMethod = 'QR_CODE' | 'LINK';
export type FamilyInviteStatus = 'JOINED' | 'PENDING' | 'EXPIRED' | 'REVOKED';

export type FamilySummary = {
  id: string;
  legacyId: number;
  code?: string | null;
  name: string;
  avatar?: string | null;
  city?: string | null;
  district?: string | null;
  memberLimit: number;
  memberCount: number;
  inviteCount: number;
  activeAt?: string | null;
  createdAt: string;
  status: FamilyStatus;
  owner?: FamilyUserSummary | null;
};

export type FamilyMember = {
  id: number;
  role: FamilyMemberRole;
  joinMethod: FamilyJoinMethod;
  joinedAt: string;
  leftAt?: string | null;
  memberStatus: FamilyMemberStatus;
  user: FamilyUserSummary | null;
  family: FamilySummary;
};

export type FamilyInvite = {
  id: string;
  legacyId: number;
  code?: string | null;
  inviteName: string;
  inviteMethod: FamilyInviteMethod;
  inviteType: string;
  token?: string | null;
  url?: string | null;
  inviteStatus: FamilyInviteStatus;
  joinedAt?: string | null;
  expiresAt?: string | null;
  createdAt: string;
  family: FamilySummary;
  inviter?: FamilyUserSummary | null;
  invitee?: FamilyUserSummary | null;
};

export type FamilyDetail = FamilySummary & {
  members: FamilyMember[];
  invites: FamilyInvite[];
};

export type FamilyOverview = {
  familyTotal: number;
  activeFamilies: number;
  memberTotal: number;
  todayFamilies: number;
  todayMembers: number;
  abnormalMembers: number;
};

export const getFamilyOverview = async () => request<FamilyOverview>('/families/overview');

export const listFamilies = async (params: {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: FamilyStatus;
  city?: string;
  minMembers?: number | string;
  maxMembers?: number | string;
} = {}) => {
  const qs = createPageQuery(params.page, params.pageSize, 20);
  setParam(qs, 'q', params.q?.trim());
  setParam(qs, 'status', params.status);
  setParam(qs, 'city', params.city);
  setParam(qs, 'minMembers', params.minMembers);
  setParam(qs, 'maxMembers', params.maxMembers);
  return request<PageResult<FamilySummary>>(`/families?${qs.toString()}`);
};

export const getFamilyDetail = async (id: number | string) => request<FamilyDetail>(`/families/${id}`);

export const createFamily = async (payload: { name: string; ownerId?: number; city?: string; district?: string; memberLimit?: number }) =>
  request<FamilySummary>('/families', { method: 'POST', body: JSON.stringify(payload) });

export const updateFamilyStatus = async (id: number, status: FamilyStatus) =>
  request<FamilySummary>(`/families/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });

export const listFamilyMembers = async (params: {
  page?: number;
  pageSize?: number;
  q?: string;
  familyId?: number | string;
  role?: FamilyMemberRole;
  joinMethod?: FamilyJoinMethod;
  memberStatus?: FamilyMemberStatus;
  city?: string;
} = {}) => {
  const qs = createPageQuery(params.page, params.pageSize, 20);
  setParam(qs, 'q', params.q?.trim());
  setParam(qs, 'familyId', params.familyId);
  setParam(qs, 'role', params.role);
  setParam(qs, 'joinMethod', params.joinMethod);
  setParam(qs, 'memberStatus', params.memberStatus);
  setParam(qs, 'city', params.city);
  return request<PageResult<FamilyMember>>(`/families/members?${qs.toString()}`);
};

export const removeFamilyMember = async (id: number) => request<FamilyMember>(`/families/members/${id}/remove`, { method: 'PATCH' });

export const listFamilyInvites = async (params: {
  page?: number;
  pageSize?: number;
  q?: string;
  familyId?: number | string;
  inviteMethod?: FamilyInviteMethod;
  inviteStatus?: FamilyInviteStatus;
  inviterId?: number | string;
} = {}) => {
  const qs = createPageQuery(params.page, params.pageSize, 20);
  setParam(qs, 'q', params.q?.trim());
  setParam(qs, 'familyId', params.familyId);
  setParam(qs, 'inviteMethod', params.inviteMethod);
  setParam(qs, 'inviteStatus', params.inviteStatus);
  setParam(qs, 'inviterId', params.inviterId);
  return request<PageResult<FamilyInvite>>(`/families/invites?${qs.toString()}`);
};

export const createFamilyInvite = async (payload: { familyId: number; inviterId?: number; inviteMethod?: FamilyInviteMethod; inviteName?: string }) =>
  request<FamilyInvite>('/families/invites', { method: 'POST', body: JSON.stringify(payload) });

// ==========================================
// 资源接口管理 (Resource Apps, Keys, Permissions, Logs)
// ==========================================

export const listResourceApiProviders = async (params: {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: ResourceApiProviderItem['status'];
  resourceType?: ResourceApiProviderItem['resourceType'];
} = {}) => {
  const qs = createPageQuery(params.page, params.pageSize, 10);
  setParam(qs, 'q', params.q?.trim());
  setParam(qs, 'status', params.status);
  setParam(qs, 'resourceType', params.resourceType);
  return request<PageResult<ResourceApiProviderItem>>(`/resource-api-providers?${qs.toString()}`);
};

export const getResourceApiProvider = async (id: number | string) => {
  return request<ResourceApiProviderItem>(`/resource-api-providers/${id}`);
};

export const createResourceApiProvider = async (payload: {
  name: string;
  providerName: string;
  resourceType: ResourceApiProviderItem['resourceType'];
  method: ResourceApiProviderItem['method'];
  endpointUrl: string;
  authType: ResourceApiProviderItem['authType'];
  appKey?: string | null;
  secret?: string | null;
  defaultHeaders?: Record<string, unknown> | null;
  defaultParams?: Record<string, unknown> | null;
  dataPath: string;
  timeoutMs: number;
  dailyLimit: number;
  description?: string | null;
  status: ResourceApiProviderItem['status'];
}) => request<ResourceApiProviderItem>('/resource-api-providers', {
  method: 'POST',
  body: JSON.stringify(payload)
});

export const updateResourceApiProvider = async (
  id: number | string,
  payload: {
    name: string;
    providerName: string;
    resourceType: ResourceApiProviderItem['resourceType'];
    method: ResourceApiProviderItem['method'];
    endpointUrl: string;
    authType: ResourceApiProviderItem['authType'];
    appKey?: string | null;
    secret?: string | null;
    defaultHeaders?: Record<string, unknown> | null;
    defaultParams?: Record<string, unknown> | null;
    dataPath: string;
    timeoutMs: number;
    dailyLimit: number;
    description?: string | null;
    status: ResourceApiProviderItem['status'];
  }
) => request<ResourceApiProviderItem>(`/resource-api-providers/${id}`, {
  method: 'PUT',
  body: JSON.stringify(payload)
});

export const setResourceApiProviderStatus = async (id: number | string, status: ResourceApiProviderItem['status']) =>
  request<ResourceApiProviderItem>(`/resource-api-providers/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });

export const deleteResourceApiProvider = async (id: number | string) =>
  request<ResourceApiProviderItem>(`/resource-api-providers/${id}`, { method: 'DELETE' });

export const testResourceApiProvider = async (payload: {
  name: string;
  providerName: string;
  resourceType: ResourceApiProviderItem['resourceType'];
  method: ResourceApiProviderItem['method'];
  endpointUrl: string;
  authType: ResourceApiProviderItem['authType'];
  appKey?: string | null;
  secret?: string | null;
  defaultHeaders?: Record<string, unknown> | null;
  defaultParams?: Record<string, unknown> | null;
  dataPath: string;
  timeoutMs: number;
  dailyLimit: number;
  description?: string | null;
  status: ResourceApiProviderItem['status'];
}) => request<{ total: number; preview: Array<Record<string, unknown>>; requestUrl: string; requestBody: Record<string, unknown> | null; headers: Record<string, string> }>('/resource-api-providers/test', {
  method: 'POST',
  body: JSON.stringify(payload)
});

export const testSavedResourceApiProvider = async (id: number | string) =>
  request<{ total: number; preview: Array<Record<string, unknown>>; requestUrl: string; requestBody: Record<string, unknown> | null; headers: Record<string, string> }>(`/resource-api-providers/${id}/test`, {
    method: 'POST'
  });

export const syncResourceApiProvider = async (id: number | string, payload: { limit?: number; params?: Record<string, unknown> | null } = {}) =>
  request<{ batch: ResourceImportBatchItem; summary: { total: number; pending: number; failed: number; imported: number; ignored: number }; preview: Array<Record<string, unknown>> }>(`/resource-api-providers/${id}/sync`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });

export const listResourceApps = async (params: {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: ResourceAppItem['status'];
  appType?: ResourceAppItem['appType'];
} = {}) => {
  const qs = createPageQuery(params.page, params.pageSize, 10);
  setParam(qs, 'q', params.q?.trim());
  setParam(qs, 'status', params.status);
  setParam(qs, 'appType', params.appType);
  return request<PageResult<ResourceAppItem>>(`/resource-apps?${qs.toString()}`);
};

export const getResourceApp = async (id: number | string) => {
  return request<ResourceAppItem>(`/resource-apps/${id}`);
};

export const createResourceApp = async (payload: {
  name: string;
  appId: string;
  appType: ResourceAppItem['appType'];
  owner: string;
  status: ResourceAppItem['status'];
}) => {
  return request<ResourceAppItem>('/resource-apps', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const updateResourceApp = async (
  id: number | string,
  payload: {
    name: string;
    appId: string;
    appType: ResourceAppItem['appType'];
    owner: string;
    status: ResourceAppItem['status'];
  }
) => {
  return request<ResourceAppItem>(`/resource-apps/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
};

export const setResourceAppStatus = async (id: number | string, status: ResourceAppItem['status']) => {
  return request<ResourceAppItem>(`/resource-apps/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
};

export const deleteResourceApp = async (id: number | string) => {
  return request<ResourceAppItem>(`/resource-apps/${id}`, {
    method: 'DELETE'
  });
};

// --- API Keys ---

export const listResourceApiKeys = async (params: {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: ResourceApiKeyItem['status'];
} = {}) => {
  const qs = createPageQuery(params.page, params.pageSize, 10);
  setParam(qs, 'q', params.q?.trim());
  setParam(qs, 'status', params.status);
  return request<PageResult<ResourceApiKeyItem>>(`/resource-api-keys?${qs.toString()}`);
};

export const createResourceApiKey = async (payload: {
  name: string;
  appId: number;
  permissionScope: string;
  status: ResourceApiKeyItem['status'];
  expiresAt: string | null;
}) => {
  return request<ResourceApiKeyItem>('/resource-api-keys', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const resetResourceApiKey = async (id: number | string) => {
  return request<ResourceApiKeyItem>(`/resource-api-keys/${id}/reset`, {
    method: 'POST'
  });
};

export const setResourceApiKeyStatus = async (id: number | string, status: ResourceApiKeyItem['status']) => {
  return request<ResourceApiKeyItem>(`/resource-api-keys/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
};

export const deleteResourceApiKey = async (id: number | string) => {
  return request<ResourceApiKeyItem>(`/resource-api-keys/${id}`, {
    method: 'DELETE'
  });
};

// --- Permissions ---

export const listResourcePermissions = async (params: {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: ResourcePermissionItem['status'];
  module?: ResourcePermissionItem['module'];
} = {}) => {
  const qs = createPageQuery(params.page, params.pageSize, 10);
  setParam(qs, 'q', params.q?.trim());
  setParam(qs, 'status', params.status);
  setParam(qs, 'module', params.module);
  return request<PageResult<ResourcePermissionItem>>(`/resource-permissions?${qs.toString()}`);
};

export const createResourcePermission = async (payload: {
  name: string;
  code: string;
  path: string;
  method: string;
  module: ResourcePermissionItem['module'];
  authRequired: boolean;
  status: ResourcePermissionItem['status'];
}) => {
  return request<ResourcePermissionItem>('/resource-permissions', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const updateResourcePermission = async (
  id: number | string,
  payload: {
    name: string;
    code: string;
    path: string;
    method: string;
    module: ResourcePermissionItem['module'];
    authRequired: boolean;
    status: ResourcePermissionItem['status'];
  }
) => {
  return request<ResourcePermissionItem>(`/resource-permissions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
};

export const setResourcePermissionStatus = async (
  id: number | string,
  status: ResourcePermissionItem['status']
) => {
  return request<ResourcePermissionItem>(`/resource-permissions/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
};

export const deleteResourcePermission = async (id: number | string) => {
  return request<ResourcePermissionItem>(`/resource-permissions/${id}`, {
    method: 'DELETE'
  });
};

// --- Call Logs ---

export const listResourceLogs = async (params: {
  page?: number;
  pageSize?: number;
  q?: string;
  method?: string;
  statusCode?: number | string;
} = {}) => {
  const qs = createPageQuery(params.page, params.pageSize, 20);
  setParam(qs, 'q', params.q?.trim());
  setParam(qs, 'method', params.method);
  setParam(qs, 'statusCode', params.statusCode);
  return request<PageResult<ResourceLogItem>>(`/resource-logs?${qs.toString()}`);
};

export const getResourceLog = async (id: number | string) => {
  return request<ResourceLogItem>(`/resource-logs/${id}`);
};

// --- Resource Imports ---

import type { ResourceImportBatchItem, ResourceImportStagedItem } from './types';

export const createImportBatch = async (payload: {
  importType: string;
  sourceType: string;
  fileName: string;
  items: Array<{ rowIndex: number; rawData: Record<string, any> }>;
}) => {
  return request<{ batch: ResourceImportBatchItem; items: ResourceImportStagedItem[] }>('/resource-imports/upload', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const previewImport = async (payload: {
  importType: string;
  sourceType: string;
  items: Array<{ rowIndex: number; rawData: Record<string, any> }>;
}) => {
  return request<Array<{ rowIndex: number; rawData: Record<string, any>; mappedData: Record<string, any>; status: string; errorMessage: string | null }>>('/resource-imports/preview', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const listImportBatches = async (params: {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: ResourceImportBatchItem['status'];
  importType?: ResourceImportBatchItem['importType'];
  sourceType?: string;
  providerId?: number;
} = {}) => {
  const qs = createPageQuery(params.page, params.pageSize, 20);
  setParam(qs, 'q', params.q?.trim());
  setParam(qs, 'status', params.status);
  setParam(qs, 'importType', params.importType);
  setParam(qs, 'sourceType', params.sourceType);
  setParam(qs, 'providerId', params.providerId);
  return request<PageResult<ResourceImportBatchItem>>(`/resource-imports?${qs.toString()}`);
};

export const getImportBatchesStats = async () => {
  return request<{ total: number; pending: number; completed: number; failed: number }>('/resource-imports/batches/stats');
};

export const listImportItems = async (params: {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: ResourceImportStagedItem['status'];
  batchId?: number;
  importId?: number;
  providerId?: number;
  resourceType?: ResourceImportStagedItem['importType'];
} = {}) => {
  const qs = createPageQuery(params.page, params.pageSize, 20);
  setParam(qs, 'q', params.q?.trim());
  setParam(qs, 'status', params.status);
  setParam(qs, 'importId', params.importId || params.batchId);
  setParam(qs, 'providerId', params.providerId);
  setParam(qs, 'resourceType', params.resourceType);
  return request<PageResult<ResourceImportStagedItem>>(`/resource-imports/items?${qs.toString()}`);
};

export const updateImportItem = async (
  id: number | string,
  payload: { name: string; content: Record<string, any> }
) => {
  return request<ResourceImportStagedItem>(`/resource-imports/items/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
};

export const setImportItemStatus = async (
  id: number | string,
  status: ResourceImportStagedItem['status']
) => {
  return request<ResourceImportStagedItem>(`/resource-imports/items/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
};

export const confirmImportBatch = async (payload: { importId: number; itemIds?: number[] }) => {
  return request<{ successCount: number; failCount: number; batch: ResourceImportBatchItem }>('/resource-imports/confirm', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const retryFailedImport = async (id: number | string) => {
  return request<{ successCount: number; failCount: number; batch: ResourceImportBatchItem }>(`/resource-imports/${id}/retry-failed`, {
    method: 'POST'
  });
};

// ====== Client-side Template Reference ======
// Template downloads for Recipe, Ingredient, Fruit, Seasoning, and Beverage are generated
// dynamically on the client-side inside ResourceAccessCenterPage.tsx to optimize speed,
// keep server footprint zero, and avoid backend binary write dependencies.
