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
};

export const getHome = async () => {
  const data = await request<ApiMobileHome>('/mobile/home');
  const recommendRecipes = data.recommendations
    .filter((item) => item.recipe)
    .map((item) => ({
      id: item.recipe?.id ?? item.id,
      title: item.recipe?.title ?? item.title,
      subtitle: item.recipe?.subtitle ?? null,
      cover: item.recipe?.cover ?? null,
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
    cover: item.ingredient?.cover ?? null,
    seasonMonth: String(item.month),
    currentPrice: null,
    priceUnit: null,
    updatedAt: ''
  }));

  return {
    recommendRecipes,
    recommendIngredients,
    recipeCategories: data.categories.filter((item) => item.type === 'RECIPE') as ApiHome['recipeCategories'],
    ingredientCategories: data.categories.filter((item) => item.type === 'INGREDIENT') as ApiHome['ingredientCategories']
  } satisfies ApiHome;
};

export type ApiRecipeListItem = {
  id: number;
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
};

export type ApiRecipeDetail = ApiRecipeListItem & {
  isPublish: boolean;
  isRecommend: boolean;
  calories: number | null;
  tips: string | null;
  steps: { id: number; sortIndex: number; title: string | null; description: string; image: string | null }[];
  ingredients: { id: number; sortIndex: number; ingredientId: number | null; name: string; amount: string | null }[];
};

export const listRecipes = async (params: { page: number; pageSize: number; q?: string }) => {
  const qs = new URLSearchParams({ page: String(params.page), pageSize: String(params.pageSize) });
  if (params.q) qs.set('q', params.q);
  return request<PageResult<ApiRecipeListItem>>(`/recipes?${qs.toString()}`);
};

export const getRecipe = async (id: number) => request<ApiRecipeDetail>(`/recipes/${id}`);

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
  return request<PageResult<ApiIngredientListItem>>(`/ingredients?${qs.toString()}`);
};

export const getIngredient = async (id: number) => request<ApiIngredientListItem>(`/ingredients/${id}`);
