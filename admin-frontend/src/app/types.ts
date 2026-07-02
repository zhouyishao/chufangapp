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
  id: string;
  legacyId?: number;
  code?: string;
  type: 'RECIPE' | 'INGREDIENT' | 'SEASONING' | 'FRUIT' | 'COCKTAIL' | 'BEVERAGE';
  name: string;
  sort: number;
  status: 'ACTIVE' | 'DISABLED';
  isPublish: boolean;
  isRecommend: boolean;
  relatedCount?: number;
  createdAt: string;
  updatedAt: string;
};

export type Ingredient = {
  id: string;
  legacyId?: number;
  code?: string;
  name: string;
  cover: string | null;
  categoryId: string | null;
  category?: { id: string; legacyId?: number; code?: string; name: string; type: IngredientCategory['type'] } | null;
  seasonMonth: string | null;
  nutrition: string | null;
  selectionTips: string | null;
  storageMethod: string | null;
  taboo: string | null;
  detailImages?: string[] | null;
  selectionMedia?: string | null;
  currentPrice: number | null;
  priceUnit: string | null;
  priceSource: string | null;
  priceDate?: string | null;
  isPublish: boolean;
  isRecommend: boolean;
  status: 'ACTIVE' | 'DISABLED';
  sort: number;
  createdAt: string;
  updatedAt: string;
};

export type Recipe = {
  id: string;
  legacyId?: number;
  code?: string;
  title: string;
  subtitle: string | null;
  cover: string | null;
  images?: string[] | null;
  video?: string | null;
  description: string | null;
  categoryId: string | null;
  category?: { id: string; legacyId?: number; code?: string; name: string; type: IngredientCategory['type'] } | null;
  cuisineId?: number | null;
  cuisine?: { id: number; name: string } | null;
  cookTime: number | null;
  servings: number | null;
  calories: number | null;
  difficulty: string | null;
  taste: string | null;
  scene: string | null;
  visibility?: string | null;
  tips: string | null;
  isDraft: boolean;
  isPublish: boolean;
  isRecommend: boolean;
  auditStatus: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectReason?: string | null;
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
    video?: string | null;
    duration?: number | null;
  }[];
  ingredients?: {
    id: number;
    sortIndex: number;
    ingredientId: string | number | null;
    name: string;
    amount: string | null;
    unit?: string | null;
    type?: string | null;
    note?: string | null;
  }[];
  createdAt: string;
  updatedAt: string;
};

export type AuditItem = {
  id: string;
  bizId: string;
  type: 'RECIPE' | 'INGREDIENT' | 'POST' | 'COMMENT' | 'REPORT';
  title: string;
  submitter: string;
  auditStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DRAFT';
  statusTone: 'orange' | 'green' | 'red' | 'gray';
  cover: string | null;
  description: string | null;
  rejectReason: string | null;
  submittedAt: string;
};

export type ResourceStatus = 'ACTIVE' | 'DISABLED';
export type TargetType = 'NONE' | 'URL' | 'RECIPE' | 'INGREDIENT' | 'CATEGORY' | 'MENU';
export type PostStatus = 'DRAFT' | 'PUBLISHED' | 'HIDDEN';

export type AdminResourceItem = {
  id: string;
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

export type AdminUserListItem = {
  id: string;
  legacyId: number;
  code: string;
  phone: string | null;
  openid: string | null;
  nickname: string | null;
  avatar: string | null;
  gender: string | null;
  email: string | null;
  role: string;
  source: string;
  birthday: string | null;
  region: string | null;
  status: 'ACTIVE' | 'DISABLED';
  registerSource: 'WECHAT' | 'PHONE';
  joinedFamilyCount: number;
  createdFamilyCount: number;
  familyCount: number;
  favoriteCount: number;
  recentViewCount: number;
  recipeCount: number;
  postCount?: number;
  commentCount?: number;
  submissionCount?: number;
  priceRecordCount: number;
  lastActiveAt: string;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ResourceAppItem = {
  id: number;
  name: string;
  appId: string;
  appType: 'ADMIN' | 'APP' | 'THIRD_PARTY';
  owner: string;
  status: 'ACTIVE' | 'DISABLED';
  apiKeyCount: number;
  todayCallCount: number;
  lastCalledAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ResourceApiKeyItem = {
  id: number;
  name: string;
  appId: number;
  appName: string;
  keyPrefix: string;
  permissionScope: string;
  status: 'ACTIVE' | 'DISABLED' | 'EXPIRED';
  expiresAt: string | null;
  todayCallCount: number;
  createdAt: string;
  updatedAt: string;
  rawKey?: string;
};

export type ResourcePermissionItem = {
  id: number;
  name: string;
  code: string;
  path: string;
  method: string;
  module: 'RECIPE' | 'INGREDIENT' | 'FRUIT' | 'SEASONING' | 'BEVERAGE' | 'PRICE' | 'CATEGORY';
  authRequired: boolean;
  status: 'ACTIVE' | 'DISABLED';
  createdAt: string;
  updatedAt: string;
};

export type ResourceLogItem = {
  id: number;
  calledAt: string;
  appId: number;
  appName: string;
  apiKeyPrefix: string | null;
  path: string;
  method: string;
  statusCode: number;
  durationMs: number;
  ip: string | null;
  errorMessage: string | null;
  createdAt: string;
};

export type ResourceImportBatchItem = {
  id: number;
  fileName: string;
  sourceType: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  totalCount: number;
  successCount: number;
  failCount: number;
  errorMessage: string | null;
  operator: string;
  createdAt: string;
  updatedAt: string;
};

export type ResourceImportStagedItem = {
  id: number;
  batchId: number;
  resourceType: 'RECIPE' | 'INGREDIENT' | 'FRUIT' | 'SEASONING' | 'BEVERAGE';
  name: string;
  content: Record<string, any>;
  status: 'PENDING' | 'IMPORTED' | 'FAILED' | 'IGNORED';
  isDuplicate: boolean;
  errorReason: string | null;
  createdAt: string;
  updatedAt: string;
};
