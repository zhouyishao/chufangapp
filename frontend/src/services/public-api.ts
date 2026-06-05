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
const DEFAULT_IMAGE_URL = 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80';

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
    cover: resolveAssetUrl(item.ingredient?.cover, 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80'),
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

export type ApiRecipeListItem = {
  id: string;
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
  ingredients: { id: number; sortIndex: number; ingredientId: number | null; name: string; amount: string | null }[];
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

export const listIngredients = async (params: { page: number; pageSize: number; q?: string }) => {
  const qs = new URLSearchParams({ page: String(params.page), pageSize: String(params.pageSize) });
  if (params.q) qs.set('q', params.q);
  const data = await request<PageResult<ApiIngredientListItem>>(`/ingredients?${qs.toString()}`);
  return { ...data, list: data.list.map((item) => ({ ...item, cover: resolveAssetUrl(item.cover, 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80') })) };
};

export const getIngredient = async (id: number) => {
  const data = await request<ApiIngredientListItem>(`/ingredients/${id}`);
  return { ...data, cover: resolveAssetUrl(data.cover, 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80') };
};
