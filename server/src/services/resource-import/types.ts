export const resourceImportTypes = ['RECIPE', 'INGREDIENT', 'FRUIT', 'SEASONING', 'BEVERAGE'] as const;
export type ResourceImportType = (typeof resourceImportTypes)[number];

export const resourceProviderAuthTypes = ['NONE', 'HEADER_TOKEN', 'QUERY_KEY', 'CUSTOM_HEADERS'] as const;
export type ResourceProviderAuthType = (typeof resourceProviderAuthTypes)[number];

export const resourceProviderMethods = ['GET', 'POST'] as const;
export type ResourceProviderMethod = (typeof resourceProviderMethods)[number];

export const resourceImportRowStatuses = ['PENDING', 'FAILED', 'IGNORED', 'IMPORTED'] as const;
export type ResourceImportRowStatus = (typeof resourceImportRowStatuses)[number];

export type NormalizedResourcePayload = {
  name: string;
  title?: string;
  subtitle?: string;
  description?: string;
  cover?: string | null;
  coverImage?: string | null;
  categoryName?: string | null;
  cuisineName?: string | null;
  cookTime?: number | null;
  servings?: number | null;
  calories?: number | null;
  difficulty?: string | null;
  taste?: string | null;
  scene?: string | null;
  tips?: string | null;
  steps?: Array<string | { sortIndex?: number; description: string; image?: string | null }>;
  ingredients?: Array<string | { name: string; amount?: string; unit?: string; sortIndex?: number }>;
  seasonMonth?: string | null;
  nutrition?: string | null;
  selectionTips?: string | null;
  storageMethod?: string | null;
  taboo?: string | null;
  currentPrice?: number | null;
  priceUnit?: string | null;
  priceSource?: string | null;
  priceDate?: string | null;
  beverageType?: string | null;
  isAlcoholic?: boolean | null;
  alcoholDegree?: number | null;
  drinkType?: string | null;
  cocktailMethod?: string | null;
  baseSpirit?: string | null;
  glassType?: string | null;
  alcoholicType?: string | null;
  measures?: string[];
  garnish?: string | null;
  instructions?: string | null;
  flavorTags?: string[];
  sceneTags?: string[];
  rawJson?: Record<string, unknown> | null;
  externalId?: string | null;
  externalUrl?: string | null;
  sourceName?: string | null;
};

export type ResourceImportEvaluation = {
  mappedData: NormalizedResourcePayload;
  status: 'PENDING' | 'FAILED';
  errorMessage: string | null;
  filterCode: string | null;
  externalId: string | null;
  externalUrl: string | null;
};

export type ResourceApiProviderDraft = {
  name: string;
  providerName: string;
  resourceType: ResourceImportType;
  method: ResourceProviderMethod;
  endpointUrl: string;
  authType: ResourceProviderAuthType;
  appKey: string | null;
  secret: string | null;
  defaultHeaders: Record<string, unknown> | null;
  defaultParams: Record<string, unknown> | null;
  dataPath: string;
  timeoutMs: number;
  dailyLimit: number;
  description: string | null;
  status: 'ACTIVE' | 'DISABLED';
};
