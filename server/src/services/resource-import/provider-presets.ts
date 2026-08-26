import { Prisma } from '@prisma/client';
import type { PrismaClient, RecordStatus } from '@prisma/client';

type ProviderPreset = {
  providerCode: string;
  name: string;
  providerName: string;
  resourceType: 'RECIPE' | 'BEVERAGE' | 'FRUIT' | 'INGREDIENT' | 'SEASONING';
  sourceKind: 'API' | 'GITHUB_DATASET' | 'OPEN_DATASET';
  formatHint: 'AUTO' | 'JSON' | 'MARKDOWN' | 'CSV';
  endpointUrl: string;
  sourceHomeUrl: string | null;
  authType: 'NONE' | 'HEADER_TOKEN' | 'QUERY_KEY' | 'CUSTOM_HEADERS';
  appKey: string | null;
  defaultHeaders: Record<string, unknown> | null;
  defaultParams: Record<string, unknown> | null;
  dataPath: string;
  timeoutMs: number;
  dailyLimit: number;
  description: string;
  status: RecordStatus;
};

const providerPresets: ProviderPreset[] = [
  {
    providerCode: 'proj_kitchen',
    name: '厨房计划 Proj.Kitchen',
    providerName: '厨房计划 - 中文菜谱 API',
    resourceType: 'RECIPE',
    sourceKind: 'API',
    formatHint: 'JSON',
    endpointUrl: 'https://proj.kitchen/api/recipes',
    sourceHomeUrl: 'https://proj.kitchen',
    authType: 'NONE',
    appKey: null,
    defaultHeaders: null,
    defaultParams: {
      __testEndpointUrl: 'https://proj.kitchen/api/recipes',
      __syncEndpointUrl: 'https://proj.kitchen/api/recipes',
      __detailEndpointTemplate: 'https://proj.kitchen/api/recipes/{id}',
      __excludeCategories: ['饮品'],
      page: 1,
      pageSize: 20
    },
    dataPath: '',
    timeoutMs: 15000,
    dailyLimit: 1000,
    description: '中国菜谱主接口，只用于菜谱导入。测试连接只请求测试接口，同步只写原始记录和导入池。',
    status: 'ACTIVE'
  },
  {
    providerCode: 'tianapi_caipu',
    name: '中国菜谱查询',
    providerName: 'TianAPI - 中国菜谱查询',
    resourceType: 'RECIPE',
    sourceKind: 'API',
    formatHint: 'JSON',
    endpointUrl: 'https://apis.tianapi.com/caipu/index',
    sourceHomeUrl: 'https://www.tianapi.com',
    authType: 'QUERY_KEY',
    appKey: null,
    defaultHeaders: null,
    defaultParams: {
      __appKeyEnv: 'TIANAPI_KEY',
      __appKeyParam: 'key',
      word: '黄瓜',
      num: 10,
      page: 1
    },
    dataPath: 'result.list',
    timeoutMs: 15000,
    dailyLimit: 100,
    description: '中国菜谱主接口，适合中文家常菜、地方菜、烘焙、食材、调料和步骤检索。',
    status: 'ACTIVE'
  },
  {
    providerCode: 'thecocktaildb',
    name: '鸡尾酒/调酒',
    providerName: 'TheCocktailDB - 鸡尾酒/调酒',
    resourceType: 'BEVERAGE',
    sourceKind: 'API',
    formatHint: 'JSON',
    endpointUrl: 'https://www.thecocktaildb.com/api/json/v1/1/search.php',
    sourceHomeUrl: 'https://www.thecocktaildb.com',
    authType: 'NONE',
    appKey: null,
    defaultHeaders: null,
    defaultParams: {
      s: 'margarita'
    },
    dataPath: 'drinks',
    timeoutMs: 15000,
    dailyLimit: 100000,
    description: '鸡尾酒主接口，支持名称、原料、杯型、是否含酒精和调制步骤。',
    status: 'ACTIVE'
  },
  {
    providerCode: 'fruityvice',
    name: '水果营养',
    providerName: 'Fruityvice - 水果营养',
    resourceType: 'FRUIT',
    sourceKind: 'API',
    formatHint: 'JSON',
    endpointUrl: 'https://www.fruityvice.com',
    sourceHomeUrl: 'https://www.fruityvice.com',
    authType: 'NONE',
    appKey: null,
    defaultHeaders: null,
    defaultParams: {
      __pathTemplate: '/api/fruit/{word}',
      word: 'apple'
    },
    dataPath: '',
    timeoutMs: 15000,
    dailyLimit: 100000,
    description: '水果临时数据源，返回基础营养字段，适合开发测试和导入池。',
    status: 'ACTIVE'
  },
  {
    providerCode: 'usda_fdc',
    name: '食材营养',
    providerName: 'USDA FoodData Central - 食材营养',
    resourceType: 'INGREDIENT',
    sourceKind: 'API',
    formatHint: 'JSON',
    endpointUrl: 'https://api.nal.usda.gov/fdc/v1/foods/search',
    sourceHomeUrl: 'https://fdc.nal.usda.gov',
    authType: 'QUERY_KEY',
    appKey: null,
    defaultHeaders: null,
    defaultParams: {
      __appKeyEnv: 'USDA_FDC_API_KEY',
      __appKeyParam: 'api_key',
      query: 'apple',
      pageSize: 10,
      pageNumber: 1
    },
    dataPath: 'foods',
    timeoutMs: 15000,
    dailyLimit: 1000,
    description: '食材营养备用源，英文数据，需要后端做中文名称映射。',
    status: 'ACTIVE'
  },
  {
    providerCode: 'open_food_facts',
    name: '包装食品/调料',
    providerName: 'Open Food Facts - 包装食品/调料',
    resourceType: 'SEASONING',
    sourceKind: 'API',
    formatHint: 'JSON',
    endpointUrl: 'https://world.openfoodfacts.org/api/v2/search',
    sourceHomeUrl: 'https://world.openfoodfacts.org',
    authType: 'NONE',
    appKey: null,
    defaultHeaders: {
      'User-Agent': 'chufangapp-resource-import/1.0'
    },
    defaultParams: {
      search_terms: 'salt',
      page_size: 20,
      fields: 'code,product_name,ingredients_text,nutriments,categories_tags,image_url,brands,quantity'
    },
    dataPath: 'products',
    timeoutMs: 15000,
    dailyLimit: 1000,
    description: '包装调料和包装食品备用源，包含条码、配料和营养值。',
    status: 'ACTIVE'
  }
];

const resolveAppKey = (preset: ProviderPreset) => {
  const controlParams = preset.defaultParams as Record<string, unknown> | null;
  const envName = typeof controlParams?.__appKeyEnv === 'string' ? controlParams.__appKeyEnv.trim() : '';
  if (!envName) return preset.appKey;
  return process.env[envName]?.trim() || preset.appKey;
};

export async function ensureDefaultResourceApiProviders(prisma: PrismaClient): Promise<void> {
  for (const preset of providerPresets) {
    const existing = await prisma.resourceApiProvider.findUnique({
      where: { providerCode: preset.providerCode }
    });

    if (existing) {
      continue;
    }

    const appKey = resolveAppKey(preset) || null;
    const defaultParams = preset.defaultParams;
    const controlParams = preset.defaultParams as Record<string, unknown> | null;
    const status = preset.authType === 'QUERY_KEY' && typeof controlParams?.__appKeyEnv === 'string' && !appKey
      ? 'DISABLED'
      : preset.status;

    await prisma.resourceApiProvider.create({
      data: {
        providerCode: preset.providerCode,
        name: preset.name,
        providerName: preset.providerName,
        resourceType: preset.resourceType,
        sourceKind: preset.sourceKind,
        formatHint: preset.formatHint,
        method: 'GET',
        endpointUrl: preset.endpointUrl,
        sourceHomeUrl: preset.sourceHomeUrl,
        authType: preset.authType,
        appKey,
        defaultHeaders: preset.defaultHeaders ? (preset.defaultHeaders as Prisma.InputJsonValue) : Prisma.DbNull,
        defaultParams: defaultParams ? (defaultParams as Prisma.InputJsonValue) : Prisma.DbNull,
        dataPath: preset.dataPath,
        timeoutMs: preset.timeoutMs,
        dailyLimit: preset.dailyLimit,
        description: preset.description,
        status
      }
    });
  }

  await prisma.resourceApiProvider.updateMany({
    where: { providerCode: { in: ['themealdb_recipe', 'mock_recipe'] } },
    data: {
      status: 'DISABLED',
      lastError: '已退出中国菜谱主导入链路，历史数据仅供追溯'
    }
  });
}
