export const homeModuleChannels = ['recommend', 'recipe', 'ingredient', 'fruit', 'beverage'] as const;
export type HomeModuleChannel = typeof homeModuleChannels[number];

export type HomeModuleSlot = {
  key: string;
  label: string;
  description: string;
  displayStyle: string;
  contentType: string;
  displayCount: number;
};

export const homeModuleSlots: Record<HomeModuleChannel, readonly HomeModuleSlot[]> = {
  recommend: [
    { key: 'SEASONAL_PRODUCE', label: '时令果蔬', description: '小方图横滑，展示当季食材与水果', displayStyle: 'SEASONAL_INGREDIENT_CARD', contentType: 'INGREDIENT', displayCount: 8 },
    { key: 'HOME_RECIPES', label: '家常精选', description: '菜谱方图横滑，首屏约露出 2.5 张', displayStyle: 'HORIZONTAL_RECIPE_CARD', contentType: 'RECIPE', displayCount: 6 },
    { key: 'SELECTION_GUIDE', label: '挑选指南', description: '单张横向图文卡，承载怎么挑', displayStyle: 'IMAGE_TEXT_LIST', contentType: 'INGREDIENT', displayCount: 1 },
    { key: 'LIGHT_MEAL', label: '清爽一餐', description: '双列菜谱卡片', displayStyle: 'TWO_COLUMN_RECIPE_GRID', contentType: 'RECIPE', displayCount: 4 },
    { key: 'INGREDIENT_INSPIRATION', label: '食材灵感', description: '一个食材关联多道菜', displayStyle: 'IMAGE_TEXT_LIST', contentType: 'INGREDIENT', displayCount: 1 },
    { key: 'DRINK_PAIRING', label: '饮品搭配', description: '饮品小方图横滑', displayStyle: 'SEASONAL_INGREDIENT_CARD', contentType: 'BEVERAGE', displayCount: 6 },
    { key: 'WEEKLY_HOT', label: '本周热门', description: '紧凑图文列表', displayStyle: 'IMAGE_TEXT_LIST', contentType: 'RECIPE', displayCount: 6 }
  ],
  recipe: [
    { key: 'TODAY_RECIPES', label: '今天吃什么', description: '菜谱方图横滑', displayStyle: 'HORIZONTAL_RECIPE_CARD', contentType: 'RECIPE', displayCount: 6 },
    { key: 'MEAL_OCCASIONS', label: '按一餐来选', description: '早餐、午餐、晚餐、夜宵入口', displayStyle: 'FOUR_CARD_GRID', contentType: 'RECIPE', displayCount: 4 },
    { key: 'MORE_HOME_RECIPES', label: '更多家常菜', description: '紧凑图文列表', displayStyle: 'IMAGE_TEXT_LIST', contentType: 'RECIPE', displayCount: 8 }
  ],
  ingredient: [
    { key: 'SEASONAL_INGREDIENTS', label: '当季食材', description: '双列方图食材卡', displayStyle: 'FOUR_CARD_GRID', contentType: 'INGREDIENT', displayCount: 8 },
    { key: 'INGREDIENT_SELECTION_GUIDE', label: '今天怎么挑', description: '横向挑选指南', displayStyle: 'IMAGE_TEXT_LIST', contentType: 'INGREDIENT', displayCount: 1 },
    { key: 'ONE_INGREDIENT_MANY_DISHES', label: '一材多吃', description: '一个食材关联多道菜', displayStyle: 'IMAGE_TEXT_LIST', contentType: 'INGREDIENT', displayCount: 3 }
  ],
  fruit: [
    { key: 'SEASONAL_FRUITS', label: '本月正当季', description: '双列方图水果卡', displayStyle: 'FOUR_CARD_GRID', contentType: 'FRUIT', displayCount: 8 },
    { key: 'FRUIT_STORAGE_GUIDE', label: '怎么挑 · 怎么放', description: '水果知识横滑卡', displayStyle: 'HORIZONTAL_RECIPE_CARD', contentType: 'FRUIT', displayCount: 6 },
    { key: 'FRUIT_IN_RECIPES', label: '水果也能入菜', description: '双列菜谱与饮品卡', displayStyle: 'TWO_COLUMN_RECIPE_GRID', contentType: 'RECIPE', displayCount: 4 }
  ],
  beverage: [
    { key: 'REFRESHING_DRINKS', label: '清爽饮品', description: '饮品方图横滑', displayStyle: 'HORIZONTAL_RECIPE_CARD', contentType: 'BEVERAGE', displayCount: 8 },
    { key: 'MEAL_DRINK_PAIRING', label: '搭配这一餐', description: '菜品与饮品搭配列表', displayStyle: 'IMAGE_TEXT_LIST', contentType: 'BEVERAGE', displayCount: 4 },
    { key: 'WINE_BASICS', label: '酒水基础', description: '酒水知识双列卡', displayStyle: 'TWO_COLUMN_RECIPE_GRID', contentType: 'BEVERAGE', displayCount: 4 },
    { key: 'MIXOLOGY_ENTRY', label: '调饮配方', description: '调饮制作流程入口', displayStyle: 'LARGE_IMAGE_CAROUSEL', contentType: 'BEVERAGE', displayCount: 1 }
  ]
};

const allKeys = new Set(Object.values(homeModuleSlots).flat().map((slot) => slot.key));

export const getHomeModuleSlots = (channel: HomeModuleChannel) => homeModuleSlots[channel];
export const isHomeModuleKey = (value: unknown): value is string => typeof value === 'string' && allKeys.has(value);
export const isHomeModuleKeyForChannel = (channel: HomeModuleChannel, value: unknown): value is string => (
  typeof value === 'string' && getHomeModuleSlots(channel).some((slot) => slot.key === value)
);

export const getHomeModuleChannelByContentType = (contentType: string | null | undefined): HomeModuleChannel | null => {
  if (!contentType) return 'recommend';
  const normalized = contentType.toUpperCase();
  if (normalized === 'RECIPE') return 'recipe';
  if (normalized === 'INGREDIENT') return 'ingredient';
  if (normalized === 'FRUIT') return 'fruit';
  if (normalized === 'BEVERAGE') return 'beverage';
  return null;
};

type LegacyModule = { title: string; displayStyle: string; contentType: string; sortOrder: number };

export const inferLegacyHomeModuleKey = (channel: HomeModuleChannel, module: LegacyModule) => {
  const slots = getHomeModuleSlots(channel);
  const normalizedTitle = module.title.trim();
  const exact = slots.find((slot) => slot.label === normalizedTitle || slot.key === normalizedTitle);
  if (exact) return exact.key;

  const compatible = slots.filter((slot) => (
    slot.displayStyle === module.displayStyle && slot.contentType === module.contentType
  ));
  if (compatible.length === 1) return compatible[0]?.key ?? null;

  const position = Math.max(0, module.sortOrder - 1);
  return slots[position]?.key ?? null;
};
