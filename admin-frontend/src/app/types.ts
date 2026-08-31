export type ApiOk<T> = { code: 0; message: string; data: T };
export type ApiFail = { code: number; message: string; data: null };
export type ApiResponse<T> = ApiOk<T> | ApiFail;

export type PageResult<T> = {
  list: T[];
  page: number;
  pageSize: number;
  total: number;
};

export type AdminRoleSummary = {
  id: number;
  code: string;
  name: string;
  isSystem: boolean;
};

export type AdminUser = {
  id: number;
  username: string;
  nickname: string | null;
  lastLoginAt: string | null;
  role: AdminRoleSummary;
  permissions: string[];
};

export type LoginResult = {
  token: string;
  admin: Omit<AdminUser, 'role' | 'permissions'>;
  role: AdminRoleSummary;
  permissions: string[];
};

export type AdminProfileResult = Omit<LoginResult, 'token'>;

export type AdminAccountItem = {
  id: number;
  username: string;
  nickname: string | null;
  status: 'ACTIVE' | 'DISABLED';
  lastLoginAt: string | null;
  createdAt: string;
  role: AdminRoleSummary | null;
};

export type AdminRoleItem = AdminRoleSummary & {
  description: string | null;
  status: 'ACTIVE' | 'DISABLED';
  adminCount: number;
  permissionCount: number | null;
  permissionIds: number[];
  updatedAt: string;
};

export type AdminPermissionItem = {
  id: number;
  key: string;
  name: string;
  module: string;
  action: string;
  sort: number;
  description: string | null;
};

export type AdminPermissionGroup = {
  module: string;
  moduleName: string;
  permissions: AdminPermissionItem[];
};

export type IngredientCategory = {
  id: string;
  legacyId?: number;
  code?: string;
  type: 'RECIPE' | 'INGREDIENT' | 'SEASONING' | 'FRUIT' | 'COCKTAIL' | 'BEVERAGE';
  name: string;
  parentId: string | null;
  parent?: { id: string; legacyId?: number; name: string } | null;
  sort: number;
  status: 'ACTIVE' | 'DISABLED';
  isPublish: boolean;
  isRecommend: boolean;
  level: 1 | 2;
  childCount: number;
  directContentCount: number;
  descendantContentCount: number;
  publicContentCount: number;
  canChangeType: boolean;
  relatedCount?: number;
  createdAt: string;
  updatedAt: string;
};

export type CategorySummary = {
  total: number;
  firstLevel: number;
  secondLevel: number;
  active: number;
  disabled: number;
  published: number;
  hidden: number;
  emptyPublic: number;
};

export type Ingredient = {
  id: string;
  legacyId?: number;
  code?: string;
  name: string;
  cover: string | null;
  coverFileId?: number | null;
  transparentImage: string | null;
  transparentImageFileId?: number | null;
  categoryId: string | null;
  category?: { id: string; legacyId?: number; code?: string; name: string; type: IngredientCategory['type'] } | null;
  seasonMonth: string | null;
  nutrition: string | null;
  selectionTips: string | null;
  storageMethod: string | null;
  taboo: string | null;
  detailImages?: string[] | null;
  detailImageFileIds?: number[] | null;
  selectionMedia?: string | null;
  selectionMediaFileId?: number | null;
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
  coverFileId?: number | null;
  images?: string[] | null;
  imageFileIds?: number[] | null;
  video?: string | null;
  videoFileId?: number | null;
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
  sourceType?: 'ADMIN' | 'USER' | 'IMPORT' | 'SYSTEM';
  authorId?: number | null;
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
    ingredient?: {
      id: string;
      name: string;
      transparentImage: string | null;
      categoryType: IngredientCategory['type'];
    } | null;
    ingredientStatus?: 'LINKED' | 'UNLINKED' | 'MISSING_TRANSPARENT_IMAGE';
    transparentImage: string | null;
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
  hasPassword: boolean;
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

export type AdminUserActivityItem = {
  id: number;
  userId: number;
  userCode: string;
  userName: string | null;
  phone: string | null;
  avatar: string | null;
  targetType: 'RECIPE' | 'INGREDIENT';
  targetId: number | null;
  targetTitle: string;
  targetCover: string | null;
  targetStatus: 'ACTIVE' | 'DISABLED' | null;
  isPublish: boolean | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminUserBehaviorEventType = 'VIEW' | 'FAVORITE' | 'SEARCH' | 'BASKET_ADD';

export type AdminUserBehaviorEvent = {
  id: string;
  eventType: AdminUserBehaviorEventType;
  user: {
    id: number;
    code: string;
    name: string | null;
    phone: string | null;
    avatar: string | null;
  };
  target: {
    type: string;
    id: string | number;
    title: string;
  };
  detail: string | null;
  eventTime: string;
};

export type AdminUserBehaviorResult = PageResult<AdminUserBehaviorEvent> & {
  summary: {
    views: number;
    favorites: number;
    searches: number;
    basketAdds: number;
  };
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

export type ResourceApiProviderItem = {
  id: number;
  providerCode: string;
  name: string;
  providerName: string;
  resourceType: 'RECIPE' | 'INGREDIENT' | 'FRUIT' | 'SEASONING' | 'BEVERAGE';
  sourceKind: 'API' | 'GITHUB_DATASET' | 'OPEN_DATASET';
  formatHint: 'AUTO' | 'JSON' | 'MARKDOWN' | 'CSV';
  method: 'GET' | 'POST';
  endpointUrl: string;
  sourceHomeUrl: string | null;
  authType: 'NONE' | 'HEADER_TOKEN' | 'QUERY_KEY' | 'CUSTOM_HEADERS';
  appKey: string | null;
  hasSecret?: boolean;
  secretPreview?: string | null;
  defaultHeaders: Record<string, unknown> | null;
  defaultParams: Record<string, unknown> | null;
  dataPath: string;
  timeoutMs: number;
  dailyLimit: number;
  description: string | null;
  status: 'ACTIVE' | 'DISABLED';
  lastSyncedAt: string | null;
  lastTestedAt: string | null;
  lastError: string | null;
  importBatchCount?: number;
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

export type AdminOperationLogItem = {
  id: number;
  admin: { id: number; username: string; nickname: string | null } | null;
  module: string | null;
  action: string | null;
  method: string | null;
  path: string | null;
  ip: string | null;
  responseCode: number | null;
  responseMessage: string | null;
  detail: Record<string, unknown> | null;
  createdAt: string;
};

export type ResourceImportBatchItem = {
  id: number;
  importType: 'RECIPE' | 'INGREDIENT' | 'FRUIT' | 'SEASONING' | 'BEVERAGE';
  providerId?: number | null;
  providerName?: string | null;
  provider?: { id: number; name: string; providerName: string } | null;
  sourceType: string;
  fileName: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  totalCount: number;
  successCount: number;
  failedCount: number;
  errorMessage: string | null;
  createdBy: string;
  sourceName?: string | null;
  requestSnapshot?: Record<string, unknown> | null;
  createdAt: string;
  finishedAt: string | null;
};

export type ResourceImportStagedItem = {
  id: number;
  importId: number;
  importType: 'RECIPE' | 'INGREDIENT' | 'FRUIT' | 'SEASONING' | 'BEVERAGE';
  providerId?: number | null;
  providerName?: string | null;
  rowIndex: number;
  rawData: Record<string, any>;
  mappedData: Record<string, any>;
  status: 'PENDING' | 'IMPORTED' | 'FAILED' | 'IGNORED';
  errorMessage: string | null;
  targetId: number | null;
  externalId?: string | null;
  externalUrl?: string | null;
  filterCode?: string | null;
  duplicateTargetId?: number | null;
  createdAt: string;
};
