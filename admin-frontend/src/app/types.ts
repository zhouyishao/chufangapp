export type ApiOk<T> = { code: 0; message: string; data: T };
export type ApiFail = { code: number; message: string; data: null };
export type ApiResponse<T> = ApiOk<T> | ApiFail;

export type PageResult<T> = {
  list: T[];
  page: number;
  pageSize: number;
  total: number;
};

export type AdminUser = {
  id: number;
  username: string;
  nickname: string | null;
};

export type LoginResult = {
  token: string;
  admin: AdminUser;
};

export type IngredientCategory = {
  id: number;
  type: 'RECIPE' | 'INGREDIENT' | 'SEASONING' | 'FRUIT' | 'COCKTAIL';
  name: string;
  sort: number;
  status: 'ACTIVE' | 'DISABLED';
  isPublish: boolean;
  isRecommend: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Ingredient = {
  id: number;
  name: string;
  cover: string | null;
  categoryId: number | null;
  category?: { id: number; name: string; type: IngredientCategory['type'] } | null;
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
  status: 'ACTIVE' | 'DISABLED';
  sort: number;
  createdAt: string;
  updatedAt: string;
};

export type Recipe = {
  id: number;
  title: string;
  subtitle: string | null;
  cover: string | null;
  description: string | null;
  categoryId: number | null;
  category?: { id: number; name: string; type: IngredientCategory['type'] } | null;
  cookTime: number | null;
  servings: number | null;
  calories: number | null;
  difficulty: string | null;
  taste: string | null;
  scene: string | null;
  tips: string | null;
  isDraft: boolean;
  isPublish: boolean;
  isRecommend: boolean;
  auditStatus: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';
  status: 'ACTIVE' | 'DISABLED';
  sort: number;
  viewCount: number;
  favoriteCount: number;
  commentCount: number;
  steps?: {
    id: number;
    sortIndex: number;
    title: string | null;
    description: string;
    image: string | null;
  }[];
  ingredients?: {
    id: number;
    sortIndex: number;
    ingredientId: number | null;
    name: string;
    amount: string | null;
  }[];
  createdAt: string;
  updatedAt: string;
};

export type ResourceStatus = 'ACTIVE' | 'DISABLED';
export type TargetType = 'NONE' | 'URL' | 'RECIPE' | 'INGREDIENT' | 'CATEGORY' | 'MENU';
export type PostStatus = 'DRAFT' | 'PUBLISHED' | 'HIDDEN';

export type AdminResourceItem = {
  id: number;
  title?: string;
  name?: string;
  phone?: string | null;
  nickname?: string | null;
  status?: ResourceStatus;
  isPublish?: boolean;
  isRecommend?: boolean;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
};
