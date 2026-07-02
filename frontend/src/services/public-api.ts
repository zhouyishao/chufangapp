type ApiOk<T> = { code: 0; message: string; data: T };
type ApiFail = { code: number; message: string; data: null };
type ApiResponse<T> = ApiOk<T> | ApiFail;

type PageResult<T> = {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
};

export class ApiError extends Error {
  code: number;
  constructor(message: string, code = 500) {
    super(message);
    this.code = code;
  }
}

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3002/api';
const DEFAULT_IMAGE_URL =
  'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 900 600%22%3E%3Crect width=%22900%22 height=%22600%22 fill=%22%23F5F1EA%22/%3E%3Cpath d=%22M210 382c78-96 155-144 231-144 74 0 137 44 249 144%22 fill=%22none%22 stroke=%22%237A8B6F%22 stroke-width=%2228%22 stroke-linecap=%22round%22/%3E%3Ccircle cx=%22648%22 cy=%22182%22 r=%2250%22 fill=%22%23E9E2D6%22/%3E%3Crect x=%22218%22 y=%22416%22 width=%22464%22 height=%2232%22 rx=%2216%22 fill=%22%23E9E2D6%22/%3E%3C/svg%3E';

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

export const resolveAssetUrl = (url: string | null | undefined, fallback = DEFAULT_IMAGE_URL) => {
  if (!url) return fallback;
  const value = String(url).trim();
  if (!value) return fallback;
  if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('data:') || value.startsWith('blob:')) {
    return value;
  }
  if (value.startsWith('/uploads/') || value.startsWith('/static/')) {
    return `${API_ORIGIN}${value}`;
  }
  return value;
};

type RequestOptions = {
  method?: UniApp.RequestOptions['method'];
  data?: UniApp.RequestOptions['data'];
  header?: UniApp.RequestOptions['header'];
  timeout?: number;
};

const request = async <T>(path: string, options: RequestOptions = {}) => {
  const result = await new Promise<ApiResponse<T>>((resolve, reject) => {
    uni.request({
      url: `${API_BASE}${path}`,
      method: options.method ?? 'GET',
      data: options.data,
      header: options.header,
      timeout: options.timeout ?? 15000,
      success: (res) => resolve(res.data as ApiResponse<T>),
      fail: reject
    });
  });

  if (result.code !== 0) throw new ApiError(result.message, result.code);

  return (result as ApiOk<T>).data;
};

export type ApiHome = {
  banners: {
    id: number;
    title: string;
    image: string;
    targetType: string;
    targetUrl: string | null;
    recipeId: number | null;
  }[];
  recommendRecipes: {
    id: number;
    title: string;
    subtitle: string | null;
    cover: string | null;
    description: string | null;
    cookTime: number | null;
    difficulty: string | null;
    viewCount: number;
    favoriteCount: number;
    updatedAt: string;
  }[];
  recommendIngredients: {
    id: number;
    name: string;
    cover: string | null;
    seasonMonth: string | null;
    currentPrice: number | null;
    priceUnit: string | null;
    updatedAt: string;
  }[];
  recipeCategories: { id: number; type: 'RECIPE'; name: string }[];
  ingredientCategories: { id: number; type: 'INGREDIENT'; name: string }[];
};

type ApiMobileHome = {
  banners: {
    id: number;
    title: string;
    image: string;
    targetType: string;
    targetUrl: string | null;
    recipeId: number | null;
  }[];
  recommendations: {
    id: number;
    title: string;
    description: string | null;
    recipe?: {
      id: number;
      title: string;
      subtitle: string | null;
      cover: string | null;
    } | null;
  }[];
  seasonalFoods: {
    id: number;
    name: string;
    reason: string | null;
    month: number;
    ingredient?: {
      id: number;
      name: string;
      cover: string | null;
    } | null;
  }[];
  categories: { id: number; type: 'RECIPE' | 'INGREDIENT'; name: string }[];
  channels?: { id: number; title: string; code: string; status: string; sort: number; items: { id: number; title: string; imageUrl: string | null }[] }[];
};

export type ApiHomeTopNav = {
  id: string;
  code?: string | null;
  name: string;
  navType: string;
  isDefault: boolean;
  sortOrder: number;
  style?: {
    activeStyle?: string;
    textColor?: string;
    activeTextColor?: string;
  } | null;
};

export type ApiHomeTopNavContent = {
  navId: string;
  navName: string;
  moreButtonText: string;
  items: {
    id: string;
    code?: string | null;
    type: 'recipe';
    title: string;
    coverUrl: string | null;
    duration: string | null;
    difficulty: string | null;
    calorie: string | null;
  }[];
};

export type ApiHomeHeroBanner = {
  id: number;
  moduleType: 'HOME_HERO_CAROUSEL';
  title: string;
  subtitle: string | null;
  buttonText: string | null;
  cover: string;
  imageFocus: string;
  targetType: string;
  targetId: string | null;
  link: string | null;
  sortOrder: number;
};

export const getHome = async () => {
  const data = await request<ApiMobileHome>('/mobile/home');
  const recommendRecipes = data.recommendations
    .filter((item) => item.recipe)
    .map((item) => ({
      id: item.recipe?.id ?? item.id,
      title: item.recipe?.title ?? item.title,
      subtitle: item.recipe?.subtitle ?? null,
      cover: resolveAssetUrl(item.recipe?.cover),
      description: item.description,
      cookTime: null,
      difficulty: null,
      viewCount: 0,
      favoriteCount: 0,
      updatedAt: ''
    }));
  const recommendIngredients = data.seasonalFoods.map((item) => ({
    id: item.ingredient?.id ?? item.id,
    name: item.ingredient?.name ?? item.name,
    cover: resolveAssetUrl(item.ingredient?.cover),
    seasonMonth: String(item.month),
    currentPrice: null,
    priceUnit: null,
    updatedAt: ''
  }));

  const banners = (data.banners ?? []).map((banner) => ({
    id: banner.id,
    title: banner.title,
    image: resolveAssetUrl(banner.image),
    targetType: banner.targetType ?? 'NONE',
    targetUrl: banner.targetUrl ?? null,
    recipeId: banner.recipeId ?? null
  }));

  return {
    banners,
    recommendRecipes,
    recommendIngredients,
    recipeCategories: data.categories.filter((item) => item.type === 'RECIPE') as ApiHome['recipeCategories'],
    ingredientCategories: data.categories.filter((item) => item.type === 'INGREDIENT') as ApiHome['ingredientCategories']
  } satisfies ApiHome;
};

export const getHomeTopNavs = async () => {
  const data = await request<ApiHomeTopNav[]>('/app/home/top-navs');
  return data;
};

export const getHomeTopNavContents = async (navId: string, params: { page?: number; pageSize?: number } = {}) => {
  const qs = new URLSearchParams({
    page: String(params.page ?? 1),
    pageSize: String(params.pageSize ?? 10)
  });
  const data = await request<ApiHomeTopNavContent>(`/app/home/top-navs/${navId}/contents?${qs.toString()}`);
  return {
    ...data,
    items: data.items.map((item) => ({ ...item, coverUrl: resolveAssetUrl(item.coverUrl) }))
  };
};

export const getHomeHeroBanners = async (navId: string) => {
  const data = await request<ApiHomeHeroBanner[]>(`/app/home/top-navs/${navId}/hero-banners`);
  return data.map((item) => ({ ...item, cover: resolveAssetUrl(item.cover) }));
};

export type ApiRecipeListItem = {
  id: string;
  legacyId?: number;
  code?: string;
  title: string;
  subtitle: string | null;
  cover: string | null;
  description: string | null;
  cookTime: number | null;
  servings: number | null;
  difficulty: string | null;
  taste: string | null;
  scene: string | null;
  viewCount: number;
  favoriteCount: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
  categoryId?: string | null;
  category?: { id: string; name: string; type: string } | null;
  cuisineId?: number | null;
  cuisine?: { id: number; name: string } | null;
};

export type ApiRecipeDetail = ApiRecipeListItem & {
  isPublish: boolean;
  isRecommend: boolean;
  calories: number | null;
  tips: string | null;
  steps: { id: number; sortIndex: number; title: string | null; description: string; image: string | null }[];
  ingredients: { id: number; sortIndex: number; ingredientId: number | null; name: string; amount: string | null; ingredient?: { cover: string | null } | null }[];
  beverages?: {
    recommendReason: string | null;
    sortOrder: number;
    beverage: {
      id: string;
      code?: string;
      name: string;
      coverImage: string | null;
      beverageType: string | null;
      isAlcoholic: boolean;
      alcoholDegree: number | null;
      description: string | null;
    };
  }[];
};

export const listRecipes = async (params: { page: number; pageSize: number; q?: string }) => {
  const qs = new URLSearchParams({ page: String(params.page), pageSize: String(params.pageSize) });
  if (params.q) qs.set('q', params.q);
  const data = await request<PageResult<ApiRecipeListItem>>(`/recipes?${qs.toString()}`);
  return { ...data, list: data.list.map((item) => ({ ...item, cover: resolveAssetUrl(item.cover) })) };
};

export const getRecipe = async (id: string) => {
  const data = await request<ApiRecipeDetail>(`/recipes/${id}`);
  return {
    ...data,
    cover: resolveAssetUrl(data.cover),
    beverages: (data.beverages ?? []).map((entry) => ({
      ...entry,
      beverage: { ...entry.beverage, coverImage: resolveAssetUrl(entry.beverage.coverImage) }
    })),
    steps: (data.steps ?? []).map((step) => ({
      ...step,
      image: step.image ? resolveAssetUrl(step.image) : null
    }))
  };
};

export type ApiIngredientListItem = {
  id: number;
  name: string;
  cover: string | null;
  seasonMonth: string | null;
  currentPrice: number | null;
  priceUnit: string | null;
  updatedAt: string;
  category?: { id: number; name: string; type: 'INGREDIENT' } | null;
};

export type ApiIngredientDetail = ApiIngredientListItem & {
  nutrition: string | null;
  selectionTips: string | null;
  storageMethod: string | null;
  taboo: string | null;
  detailImages: string[] | null;
  selectionMedia: string | null;
  relatedRecipes: unknown;
  priceSource: string | null;
  priceDate: string | null;
};

export type ApiBeverageDetail = {
  id: string;
  legacyId: number;
  code?: string | null;
  name: string;
  coverImage: string | null;
  categoryId: number | null;
  beverageType: string | null;
  isAlcoholic: boolean;
  alcoholDegree: number | null;
  description: string | null;
  category?: { id: number; name: string; type: string } | null;
  createdAt: string;
  updatedAt: string;
};

export type ApiIngredientPriceRecord = {
  id: number;
  ingredientId: number;
  userId: number | null;
  price: number;
  unit: string;
  date: string;
  source: string | null;
  createdAt: string;
  updatedAt: string;
};

export const listIngredients = async (params: { page: number; pageSize: number; q?: string }) => {
  const qs = new URLSearchParams({ page: String(params.page), pageSize: String(params.pageSize) });
  if (params.q) qs.set('q', params.q);
  const data = await request<PageResult<ApiIngredientListItem>>(`/ingredients?${qs.toString()}`);
  return { ...data, list: data.list.map((item) => ({ ...item, cover: resolveAssetUrl(item.cover) })) };
};

export const getIngredient = async (id: number) => {
  const data = await request<ApiIngredientDetail>(`/ingredients/${id}`);
  return {
    ...data,
    cover: resolveAssetUrl(data.cover),
    detailImages: Array.isArray(data.detailImages) ? data.detailImages.map((url) => resolveAssetUrl(url, data.cover ?? undefined)) : []
  };
};

export const getBeverage = async (id: string) => {
  const data = await request<ApiBeverageDetail>(`/beverages/${encodeURIComponent(id)}`);
  return {
    ...data,
    coverImage: resolveAssetUrl(data.coverImage)
  };
};

export const listMobileIngredientPriceRecords = async (params: { userId: number; ingredientId: number }) => {
  return request<ApiIngredientPriceRecord[]>(
    `/mobile/ingredient-price-records?userId=${params.userId}&ingredientId=${params.ingredientId}`
  );
};

export const createMobileIngredientPriceRecord = async (payload: {
  userId: number;
  ingredientId: number;
  price: number;
  unit: string;
  priceDate?: string;
  source?: string | null;
}) => {
  return request<ApiIngredientPriceRecord>('/mobile/ingredient-price-records', {
    method: 'POST',
    data: payload
  });
};

export const deleteMobileIngredientPriceRecord = async (id: number, userId: number) => {
  return request<ApiIngredientPriceRecord>(`/mobile/ingredient-price-records/${id}`, {
    method: 'DELETE',
    data: { userId }
  });
};

export type ApiMobileUser = {
  id: number;
  phone: string | null;
  openid: string | null;
  nickname: string | null;
  avatar: string | null;
};

export const loginMobileAuth = async (payload: {
  phone?: string;
  openid?: string;
  nickname?: string;
  avatar?: string;
}) => {
  return request<ApiMobileUser>('/mobile/auth/login', {
    method: 'POST',
    data: payload
  });
};

type MobileActivityRecipe = {
  id: number;
  title: string;
  subtitle: string | null;
  cover: string | null;
  description: string | null;
  cookTime: number | null;
  difficulty: string | null;
};

type MobileActivityIngredient = {
  id: number;
  name: string;
  cover: string | null;
  seasonMonth: string | null;
  currentPrice: number | null;
  priceUnit: string | null;
};

export type ApiMobileFavorite = {
  id: number;
  userId: number;
  recipeId: number | null;
  ingredientId: number | null;
  recipe: MobileActivityRecipe | null;
  ingredient: MobileActivityIngredient | null;
  createdAt: string;
  updatedAt: string;
};

export type ApiMobileViewHistory = ApiMobileFavorite;

const resolveMobileActivityAssets = <T extends ApiMobileFavorite | ApiMobileViewHistory>(item: T): T => ({
  ...item,
  recipe: item.recipe ? { ...item.recipe, cover: resolveAssetUrl(item.recipe.cover) } : null,
  ingredient: item.ingredient
    ? {
        ...item.ingredient,
        cover: resolveAssetUrl(
          item.ingredient.cover,
          DEFAULT_IMAGE_URL
        )
      }
    : null
});

export const listMobileFavorites = async (params: { userId: number; page?: number; pageSize?: number }) => {
  const qs = new URLSearchParams({
    userId: String(params.userId),
    page: String(params.page ?? 1),
    pageSize: String(params.pageSize ?? 50)
  });
  const data = await request<PageResult<ApiMobileFavorite>>(`/mobile/favorites?${qs.toString()}`);
  return { ...data, list: data.list.map(resolveMobileActivityAssets) };
};

export const addMobileFavorite = async (payload: { userId: number; recipeId?: number; ingredientId?: number }) => {
  const data = await request<ApiMobileFavorite>('/mobile/favorites', {
    method: 'POST',
    data: payload
  });
  return resolveMobileActivityAssets(data);
};

export const deleteMobileFavorite = async (favoriteId: number) => {
  return request<ApiMobileFavorite>(`/mobile/favorites/${favoriteId}`, {
    method: 'DELETE'
  });
};

export const listMobileViewHistories = async (params: { userId: number; page?: number; pageSize?: number }) => {
  const qs = new URLSearchParams({
    userId: String(params.userId),
    page: String(params.page ?? 1),
    pageSize: String(params.pageSize ?? 50)
  });
  const data = await request<PageResult<ApiMobileViewHistory>>(`/mobile/view-histories?${qs.toString()}`);
  return { ...data, list: data.list.map(resolveMobileActivityAssets) };
};

export const addMobileViewHistory = async (payload: { userId: number; recipeId?: number; ingredientId?: number }) => {
  const data = await request<ApiMobileViewHistory>('/mobile/view-histories', {
    method: 'POST',
    data: payload
  });
  return resolveMobileActivityAssets(data);
};

export type ApiSearchHistory = {
  id: number;
  userId: number;
  keyword: string;
  resultCount: number;
  createdAt: string;
  updatedAt: string;
};

export const listMobileSearchHistories = async (params: { userId: number; page?: number; pageSize?: number }) => {
  const qs = new URLSearchParams({
    userId: String(params.userId),
    page: String(params.page ?? 1),
    pageSize: String(params.pageSize ?? 20)
  });
  return request<PageResult<ApiSearchHistory>>(`/mobile/search-histories?${qs.toString()}`);
};

export const clearMobileSearchHistories = async (userId: number) => {
  return request<{ count: number }>(`/mobile/search-histories?userId=${userId}`, { method: 'DELETE' });
};

export type ApiSearchResult = {
  recipes: ApiRecipeListItem[];
  ingredients: ApiIngredientListItem[];
};

export const searchMobileContent = async (params: { q: string; userId?: number }) => {
  const qs = new URLSearchParams({ q: params.q });
  if (params.userId) qs.set('userId', String(params.userId));
  const data = await request<ApiSearchResult>(`/mobile/search?${qs.toString()}`);
  return {
    recipes: data.recipes.map((item) => ({ ...item, cover: resolveAssetUrl(item.cover) })),
    ingredients: data.ingredients.map((item) => ({
      ...item,
      cover: resolveAssetUrl(item.cover)
    }))
  };
};

export type ApiFamilyMember = {
  id: number;
  role: 'CREATOR' | 'ADMIN' | 'MEMBER';
  joinedAt: string;
  remark: string | null;
  user: { id: number; nickname: string | null; phone: string | null; avatar: string | null };
};

export type ApiFamilyPreference = {
  avoidItems: string[];
  allergies: string[];
  preferences: string[];
  taste: string | null;
  note: string | null;
};

export type ApiFamily = {
  id: number;
  name: string;
  avatar: string | null;
  city: string | null;
  district: string | null;
  description: string | null;
  memberLimit: number;
  memberCount: number;
  pendingItems: number;
  createdAt: string;
  owner: { id: number; nickname: string | null; phone: string | null; avatar: string | null } | null;
  members: ApiFamilyMember[];
  preferences: ApiFamilyPreference;
};

export type ApiFamilyInvite = {
  id: number;
  token: string | null;
  url: string | null;
  inviteName: string;
  inviteStatus: string;
  expiresAt: string | null;
  family: ApiFamily;
};

export const listMobileFamilies = async (userId: number) => {
  return request<ApiFamily[]>(`/mobile/families?userId=${userId}`);
};

export const createMobileFamily = async (payload: { userId: number; name: string; city?: string; district?: string; description?: string }) => {
  return request<ApiFamily>('/mobile/families', { method: 'POST', data: payload });
};

export const getMobileFamily = async (familyId: number) => {
  return request<ApiFamily>(`/mobile/families/${familyId}`);
};

export const updateMobileFamily = async (familyId: number, payload: { userId: number; name: string; description?: string | null }) => {
  return request<ApiFamily>(`/mobile/families/${familyId}`, { method: 'PUT', data: payload });
};

export const createMobileFamilyInvite = async (familyId: number, userId: number) => {
  return request<ApiFamilyInvite>(`/mobile/families/${familyId}/invites`, { method: 'POST', data: { userId } });
};

export const getMobileFamilyInvite = async (token: string) => {
  return request<ApiFamilyInvite>(`/mobile/family-invites/${encodeURIComponent(token)}`);
};

export const joinMobileFamilyInvite = async (token: string, userId: number) => {
  return request<ApiFamily>(`/mobile/family-invites/${encodeURIComponent(token)}/join`, { method: 'POST', data: { userId } });
};

export type ApiMyRecipeIngredient = {
  id: number;
  name: string;
  amount: string;
};

export type ApiMyRecipeStep = {
  id: number;
  title: string;
  description: string;
};

export type ApiMyRecipe = {
  id: number;
  publicId: string;
  code: string | null;
  name: string;
  description: string;
  image: string | null;
  duration: string;
  flavor: string;
  updatedAt: string;
  status: 'draft' | 'published';
  difficulty: string;
  category: string;
  visibility: string;
  note: string;
  ingredients: ApiMyRecipeIngredient[];
  steps: ApiMyRecipeStep[];
};

export const listMobileMyRecipes = async (params: { userId: number; page?: number; pageSize?: number; q?: string }) => {
  const qs = new URLSearchParams({
    userId: String(params.userId),
    page: String(params.page ?? 1),
    pageSize: String(params.pageSize ?? 20)
  });
  if (params.q?.trim()) qs.set('q', params.q.trim());
  return request<PageResult<ApiMyRecipe>>(`/mobile/my-recipes?${qs.toString()}`);
};

export const getMobileMyRecipe = async (recipeId: string, userId?: number) => {
  const qs = userId ? `?userId=${userId}` : '';
  return request<ApiMyRecipe>(`/mobile/my-recipes/${encodeURIComponent(recipeId)}${qs}`);
};

export const createMobileMyRecipe = async (payload: {
  userId: number;
  title: string;
  subtitle?: string | null;
  cover?: string | null;
  description?: string | null;
  duration?: string | null;
  difficulty?: string | null;
  flavor?: string | null;
  category?: string | null;
  visibility?: string | null;
  notes?: string | null;
  isDraft?: boolean;
  ingredients: Array<{ sortIndex: number; name: string; amount?: string | null }>;
  steps: Array<{ sortIndex: number; title?: string | null; description: string; image?: string | null; video?: string | null }>;
}) => {
  return request<ApiMyRecipe>('/mobile/my-recipes', { method: 'POST', data: payload });
};

export const saveMobileFamilyPreferences = async (familyId: number, payload: ApiFamilyPreference & { userId: number }) => {
  return request<ApiFamilyPreference>(`/mobile/families/${familyId}/preferences`, { method: 'PUT', data: payload });
};

export const removeMobileFamilyMember = async (memberId: number, userId: number) => {
  return request<ApiFamilyMember>(`/mobile/family-members/${memberId}`, { method: 'DELETE', data: { userId } });
};

export const updateMobileFamilyMember = async (
  memberId: number,
  payload: { userId: number; remark?: string | null; role?: 'CREATOR' | 'ADMIN' | 'MEMBER' }
) => {
  return request<ApiFamilyMember>(`/mobile/family-members/${memberId}`, { method: 'PUT', data: payload });
};

export type ApiBasketItem = {
  id: number;
  userId: number;
  familyId: number | null;
  recipeId: number | null;
  ingredientId: number | null;
  recipeName: string | null;
  name: string;
  amountText: string | null;
  quantity: number;
  unit: string | null;
  purchaseText: string | null;
  checked: boolean;
  checkedAt: string | null;
  createdAt: string;
  updatedAt: string;
  recipe?: { id: number; title: string; cover: string | null } | null;
  ingredient?: { id: number; name: string; cover: string | null; currentPrice: number | null; priceUnit: string | null } | null;
  family?: { id: number; name: string } | null;
};

export const listMobileBasketItems = async (params: { userId: number; familyId?: number; page?: number; pageSize?: number }) => {
  const qs = new URLSearchParams({
    userId: String(params.userId),
    page: String(params.page ?? 1),
    pageSize: String(params.pageSize ?? 50)
  });
  if (params.familyId) qs.set('familyId', String(params.familyId));
  const data = await request<PageResult<ApiBasketItem>>(`/mobile/basket-items?${qs.toString()}`);
  return { ...data, list: data.list.map((item) => ({ ...item, ingredient: item.ingredient ? { ...item.ingredient, cover: resolveAssetUrl(item.ingredient.cover) } : null })) };
};

export const addMobileBasketItem = async (payload: {
  userId: number;
  familyId?: number | null;
  recipeId?: number | null;
  ingredientId?: number | null;
  recipeName?: string | null;
  name: string;
  amountText?: string | null;
  quantity?: number;
  unit?: string | null;
  purchaseText?: string | null;
}) => request<ApiBasketItem>('/mobile/basket-items', { method: 'POST', data: payload });

export const updateMobileBasketItem = async (id: number, payload: { userId: number; quantity?: number; checked?: boolean }) => {
  return request<ApiBasketItem>(`/mobile/basket-items/${id}`, { method: 'PUT', data: payload });
};

export const deleteMobileBasketItem = async (id: number, userId: number) => {
  return request<ApiBasketItem>(`/mobile/basket-items/${id}`, { method: 'DELETE', data: { userId } });
};

// ====== 分类页聚合接口 ======

export type PageModuleTopNavItem = {
  id: string;
  code: string | null;
  name: string;
  navType: string;
  contentType: string | null;
  isDefault: boolean;
  sortOrder: number;
  active: boolean;
};

export type PageModuleCategoryFilterItem = {
  name: string;
  key: string;
  type: 'system' | 'category';
  categoryId?: number;
};

export type PageModuleBanner = {
  id: number;
  title: string;
  subtitle: string | null;
  buttonText: string | null;
  cover: string;
  imageFocus: string;
  targetType: string;
  targetId: string | null;
  link: string | null;
  sortOrder: number;
};

export type PageModuleContentItem = {
  id: string;
  navId: number;
  title: string;
  subtitle: string | null;
  displayStyle: string;
  contentType: string;
  contentSource: string;
  categoryId: number | null;
  categoryName: string | null;
  displayCount: number;
  showMore: boolean;
  showTitle: boolean;
  moreLink: string | null;
  sortOrder: number;
  status: string;
  items: Array<Record<string, unknown>>;
};

export type PageModule = {
  moduleType: string;
  sortOrder: number;
  config?: Record<string, unknown>;
  data?: Record<string, unknown>;
};

export type PageModulesResult = PageModule[];

export const getPageModules = async (params: {
  page?: string;
  type?: string;
  filter?: string;
  categoryId?: number;
} = {}) => {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', params.page);
  if (params.type) qs.set('type', params.type);
  if (params.filter) qs.set('filter', params.filter);
  if (params.categoryId) qs.set('categoryId', String(params.categoryId));
  const data = await request<PageModulesResult>(`/app/page-modules?${qs.toString()}`);
  // Resolve asset URLs in banner covers and content module item covers
  return data.map((mod) => {
    if (mod.moduleType === 'hero_banner' && mod.data) {
      const heroData = mod.data as { banners?: Array<{ cover: string }> };
      if (heroData.banners) {
        heroData.banners = heroData.banners.map((b) => ({ ...b, cover: resolveAssetUrl(b.cover) }));
      }
    }
    if (mod.moduleType === 'content_module' && mod.data) {
      const contentData = mod.data as unknown as Array<{ items?: Array<{ cover?: string | null }> }>;
      for (const cm of contentData) {
        if (cm.items) {
          cm.items = cm.items.map((item) => ({
            ...item,
            cover: item.cover ? resolveAssetUrl(item.cover as string) : null
          }));
        }
      }
    }
    return mod;
  });
};

// ====== 首页内容模块 ======

export type HomeModuleItem = {
  id: string;
  code?: string;
  type: 'recipe' | 'ingredient' | 'beverage' | 'category' | 'image';
  title?: string;
  name?: string;
  cover: string | null;
  subtitle?: string | null;
  buttonText?: string | null;
  jumpType?: string | null;
  jumpTarget?: string | null;
  status?: string | null;
  duration?: string | null;
  difficulty?: string | null;
  servings?: number | null;
  calories?: string | null;
  description?: string | null;
  favoriteCount?: number | null;
  currentPrice?: number | null;
  priceUnit?: string | null;
  sortOrder?: number;
};

export type HomeModule = {
  id: number;
  navId: number;
  title: string;
  subtitle: string | null;
  displayStyle: string;
  contentType: string;
  contentSource: string;
  displayCount: number;
  showMore: boolean;
  showTitle?: boolean;
  moreLink: string | null;
  sortOrder: number;
  status: string;
  items: HomeModuleItem[];
};

export const getHomeModules = async (navId: string) => {
  const data = await request<HomeModule[]>(`/app/home/top-navs/${navId}/modules`);
  return data.map((mod) => ({
    ...mod,
    items: mod.items.map((item) => ({
      ...item,
      cover: resolveAssetUrl(item.cover)
    }))
  }));
};
