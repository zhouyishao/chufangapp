import type { NormalizedResourcePayload, ResourceImportEvaluation, ResourceImportType } from './types';
import { localizeResourcePayload } from './localize';

const toText = (value: unknown): string => {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return '';
};

const toNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const asRecord = (value: unknown): Record<string, unknown> => (value && typeof value === 'object' ? (value as Record<string, unknown>) : {});

const getText = (raw: Record<string, unknown>, keys: string[]): string => {
  for (const key of keys) {
    const value = toText(raw[key]);
    if (value) return value;
  }
  return '';
};

const getNumber = (raw: Record<string, unknown>, keys: string[]): number | null => {
  for (const key of keys) {
    const value = toNumber(raw[key]);
    if (value !== null) return value;
  }
  return null;
};

const getBoolean = (raw: Record<string, unknown>, keys: string[]): boolean | null => {
  for (const key of keys) {
    const value = raw[key];
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (['true', '1', 'yes', 'y', '是'].includes(normalized)) return true;
      if (['false', '0', 'no', 'n', '否'].includes(normalized)) return false;
    }
  }
  return null;
};

const splitLines = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((item) => toText(item)).filter(Boolean);
  }
  const text = toText(value);
  if (!text) return [];
  return text
    .split(/\n|；|;|。|．|!\s*|\?\s*/u)
    .map((item) => item.trim())
    .filter(Boolean);
};

const splitTags = (value: unknown): string[] => {
  const text = toText(value);
  if (!text) return [];
  return text.split(/,|，|\n|；|;/).map((item) => item.trim()).filter(Boolean);
};

type IngredientEntry = {
  name: string;
  amount?: string;
  unit?: string;
  sortIndex?: number;
};

const isIngredientEntry = (value: IngredientEntry | null): value is IngredientEntry => value !== null;

const splitIngredients = (value: unknown): IngredientEntry[] => {
  if (Array.isArray(value)) {
    return value
      .map((item, index): IngredientEntry | null => {
        if (typeof item === 'string') {
          const trimmed = item.trim();
          if (!trimmed) return null;
          const [name, amount = ''] = trimmed.split(/[:：\s]+/);
          return name ? { name, amount: amount || undefined, sortIndex: index + 1 } : null;
        }
        const raw = asRecord(item);
        const name = getText(raw, ['name', '名称']);
        if (!name) return null;
        return {
          name,
          amount: getText(raw, ['amount', '用量']) || undefined,
          unit: getText(raw, ['unit', '单位']) || undefined,
          sortIndex: getNumber(raw, ['sortIndex', '排序']) ?? index + 1
        };
      })
      .filter(isIngredientEntry);
  }

  const text = toText(value);
  if (!text) return [];
  return text
    .split(/,|，|\n|；|;|、/)
    .map((part, index): IngredientEntry | null => {
      const trimmed = part.trim();
      if (!trimmed) return null;
      const [name, amount = ''] = trimmed.split(/[:：\s]+/);
      return name ? { name, amount: amount || undefined, sortIndex: index + 1 } : null;
    })
    .filter(isIngredientEntry);
};

const collectNumberedIngredients = (raw: Record<string, unknown>, max = 20): IngredientEntry[] => {
  const entries: IngredientEntry[] = [];
  for (let index = 1; index <= max; index += 1) {
    const name = toText(raw[`strIngredient${index}`]);
    if (!name) continue;
    entries.push({
      name,
      amount: toText(raw[`strMeasure${index}`]) || undefined,
      sortIndex: entries.length + 1
    });
  }
  return entries;
};

const collectNumberedMeasures = (raw: Record<string, unknown>, max = 20): string[] => {
  const measures: string[] = [];
  for (let index = 1; index <= max; index += 1) {
    const name = toText(raw[`strIngredient${index}`]);
    const amount = toText(raw[`strMeasure${index}`]);
    if (!name && !amount) continue;
    measures.push(amount ? `${name}: ${amount}` : name);
  }
  return measures;
};

const detectCocktailMethod = (instruction: string): string | null => {
  const lower = instruction.toLowerCase();
  if (lower.includes('shake')) return '摇和';
  if (lower.includes('stir')) return '搅拌';
  if (lower.includes('build') || lower.includes('pour')) return '直调';
  if (lower.includes('blend')) return '搅打';
  if (lower.includes('layer')) return '分层';
  if (lower.includes('muddle')) return '捣压';
  return null;
};

const findBaseSpirit = (ingredients: IngredientEntry[]): string | null => {
  const spirits = [
    'vodka',
    'gin',
    'rum',
    'tequila',
    'whiskey',
    'whisky',
    'bourbon',
    'brandy',
    'mezcal',
    'cognac',
    'liqueur'
  ];
  const found = ingredients.find((item) => spirits.some((spirit) => item.name.toLowerCase().includes(spirit)));
  return found?.name ?? null;
};

const extractGarnish = (ingredients: IngredientEntry[], instructions: string): string | null => {
  const garnishIngredients = ingredients
    .filter((item) => `${item.name} ${item.amount ?? ''}`.toLowerCase().includes('garnish'))
    .map((item) => item.name);
  if (garnishIngredients.length > 0) return garnishIngredients.join(', ');
  const match = instructions.match(/garnish(?:ed)? with ([^.。\n]+)/i);
  return match?.[1]?.trim() ?? null;
};

const summarizeNutrition = (value: unknown): string | null => {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  const entries = [
    ['能量', raw['energy-kcal_100g'] ?? raw.calories],
    ['蛋白质', raw.proteins_100g ?? raw.protein],
    ['脂肪', raw.fat_100g ?? raw.fat],
    ['碳水', raw.carbohydrates_100g ?? raw.carbohydrates],
    ['糖', raw.sugars_100g],
    ['膳食纤维', raw.fiber_100g],
    ['钠', raw.sodium_100g]
  ]
    .map(([label, item]) => {
      const text = toText(item);
      return text ? `${label}: ${text}` : '';
    })
    .filter(Boolean);
  return entries.length > 0 ? entries.join('；') : JSON.stringify(raw);
};

const summarizeFoodNutrients = (value: unknown): string | null => {
  if (!Array.isArray(value)) return null;
  const entries = value
    .map((item) => {
      const raw = asRecord(item);
      const nutrient = asRecord(raw.nutrient);
      const name = getText(raw, ['nutrientName']) || getText(nutrient, ['name']);
      const amount = toText(raw.value ?? raw.amount);
      const unit = getText(raw, ['unitName']) || getText(nutrient, ['unitName']);
      return name && amount ? `${name}: ${amount}${unit ? ` ${unit}` : ''}` : '';
    })
    .filter(Boolean)
    .slice(0, 12);
  return entries.length > 0 ? entries.join('；') : null;
};

const normalizeUrl = (value: unknown): string | null => {
  const text = toText(value);
  return text || null;
};

const firstText = (value: unknown): string | null => {
  if (!Array.isArray(value) || value.length === 0) return null;
  return toText(value[0]);
};

const isValidMediaUrl = (value: string | null | undefined): boolean => {
  if (!value) return true;
  return value.startsWith('http://') || value.startsWith('https://') || value.startsWith('/uploads/');
};

export function normalizeResourcePayload(resourceType: ResourceImportType, rawInput: unknown): NormalizedResourcePayload {
  const raw = asRecord(rawInput);
  const name = getText(raw, ['name', 'title', '名称', '标题', 'strDrink', 'strMeal', 'food', 'name_cn', 'product_name', 'product_name_en', 'menu', 'cpName']);
  const payload: NormalizedResourcePayload = {
    name,
    sourceName: getText(raw, ['sourceName', 'providerName', '来源名称']) || null,
    externalId: getText(raw, ['externalId', 'id', 'ID', 'sourceId', 'idDrink', 'idMeal', 'code', '_id', 'cpId', 'menuId', 'cookId']) || null,
    externalUrl: normalizeUrl(raw.sourceUrl ?? raw.url ?? raw.source_url ?? raw.strImageSource ?? raw.strSource ?? raw['链接']) || null,
    rawJson: raw
  };

  if (resourceType === 'RECIPE') {
    const recipeInstructions = getText(raw, ['instructions', 'strInstructions', '步骤', 'process', 'content', 'method', 'imtro', 'intro']);
    const numberedIngredients = collectNumberedIngredients(raw, 20);
    payload.title = name;
    payload.subtitle = getText(raw, ['subtitle', '副标题']) || undefined;
    payload.description = getText(raw, ['description', 'desc', 'imtro', 'intro', 'message', '描述', '摘要']) || undefined;
    payload.cover = normalizeUrl(
      raw.cover ??
      raw.pic ??
      raw.img ??
      raw.image ??
      raw.images ??
      raw.strMealThumb ??
      firstText(raw.albums) ??
      firstText(raw.album) ??
      raw['封面']
    ) || null;
    payload.cookTime = getNumber(raw, ['cookTime', 'cook_time', '耗时', 'time']);
    payload.servings = getNumber(raw, ['servings', '份量']);
    payload.calories = getNumber(raw, ['calories', '卡路里', 'calorie']);
    payload.difficulty = getText(raw, ['difficulty', '难度', 'grade']) || null;
    payload.taste = getText(raw, ['taste', '口味', 'tag', 'strTags']) || null;
    payload.scene = getText(raw, ['scene', '场景']) || null;
    payload.tips = getText(raw, ['tips', '技巧', 'summary']) || null;
    payload.categoryName = getText(raw, ['categoryName', 'category', 'classify', 'strCategory', 'tags', 'classid', 'class', '分类', '分类名称']) || null;
    payload.cuisineName = getText(raw, ['cuisineName', 'strArea', '菜系', '来源菜系']) || null;
    payload.steps = splitLines(raw.steps ?? raw.process ?? raw.content ?? raw.method ?? recipeInstructions ?? raw['步骤']);
    payload.ingredients = splitIngredients(raw.ingredients ?? raw.burden ?? raw.material ?? raw.yl ?? raw.food ?? raw['用料'] ?? raw['食材']);
    if (payload.ingredients.length === 0) payload.ingredients = numberedIngredients;
  } else if (resourceType === 'BEVERAGE') {
    const cocktailIngredients = collectNumberedIngredients(raw, 15);
    const instructions = getText(raw, ['instructions', 'strInstructions', '调制步骤', '描述']);
    payload.coverImage = normalizeUrl(raw.coverImage ?? raw.cover ?? raw.strDrinkThumb ?? raw['图片']) || null;
    payload.categoryName = getText(raw, ['categoryName', 'category', 'strCategory', '分类', '分类名称']) || null;
    payload.beverageType = getText(raw, ['beverageType', 'drinkType', 'strCategory', '酒水类型']) || null;
    payload.isAlcoholic = getBoolean(raw, ['isAlcoholic', '是否含酒精']) ?? getText(raw, ['strAlcoholic']).toLowerCase() === 'alcoholic';
    payload.alcoholDegree = getNumber(raw, ['alcoholDegree', '酒精浓度']);
    payload.description = instructions || getText(raw, ['description', '描述']) || undefined;
    payload.drinkType = getText(raw, ['drinkType', 'drink_type', 'strCategory']) || null;
    payload.cocktailMethod = getText(raw, ['cocktailMethod', 'cocktail_method']) || detectCocktailMethod(instructions);
    payload.baseSpirit = getText(raw, ['baseSpirit', 'base_spirit']) || findBaseSpirit(cocktailIngredients);
    payload.glassType = getText(raw, ['glassType', 'glass_type', 'strGlass']) || null;
    payload.alcoholicType = getText(raw, ['alcoholicType', 'alcoholic_type', 'strAlcoholic']) || null;
    payload.ingredients = splitIngredients(raw.ingredients ?? raw['用料']);
    if (payload.ingredients.length === 0) payload.ingredients = cocktailIngredients;
    payload.measures = Array.isArray(raw.measures) ? raw.measures.map((item) => toText(item)).filter(Boolean) : collectNumberedMeasures(raw, 15);
    payload.garnish = getText(raw, ['garnish', '装饰']) || extractGarnish(cocktailIngredients, instructions);
    payload.instructions = instructions || null;
    payload.flavorTags = splitTags(raw.flavorTags ?? raw.flavor_tags ?? raw.strTags);
    payload.sceneTags = splitTags(raw.sceneTags ?? raw.scene_tags ?? raw.strIBA);
  } else {
    payload.cover = normalizeUrl(raw.cover ?? raw.image_url ?? raw.image_front_url ?? raw['图片']) || null;
    payload.categoryName = getText(raw, ['categoryName', 'category', 'classify', 'food_groups', 'categories', 'family', '分类', '分类名称']) || null;
    payload.seasonMonth = getText(raw, ['seasonMonth', '时令月份']) || null;
    payload.nutrition = getText(raw, ['nutrition', '营养成分', 'content', 'nutrient'])
      || summarizeNutrition(raw.nutriments ?? raw.nutritions)
      || summarizeFoodNutrients(raw.foodNutrients);
    payload.selectionTips = getText(raw, ['selectionTips', '挑选技巧']) || null;
    payload.storageMethod = getText(raw, ['storageMethod', '储存方法']) || null;
    payload.taboo = getText(raw, ['taboo', '食用禁忌']) || null;
    payload.currentPrice = getNumber(raw, ['currentPrice', '价格']);
    payload.priceUnit = getText(raw, ['priceUnit', '计价单位']) || null;
    payload.priceSource = getText(raw, ['priceSource', '价格来源']) || null;
    payload.priceDate = getText(raw, ['priceDate', '价格时间']) || null;
  }

  return localizeResourcePayload(resourceType, payload);
}

export function evaluateResourcePayload(resourceType: ResourceImportType, mapped: NormalizedResourcePayload): ResourceImportEvaluation {
  const externalId = mapped.externalId?.trim() || null;
  const externalUrl = mapped.externalUrl?.trim() || null;
  const name = mapped.name.trim();

  if (!name) {
    return {
      mappedData: mapped,
      status: 'FAILED',
      errorMessage: '必填项缺失: 名称为空',
      filterCode: 'MISSING_NAME',
      externalId,
      externalUrl
    };
  }

  if (!isValidMediaUrl(mapped.cover) || !isValidMediaUrl(mapped.coverImage)) {
    return {
      mappedData: mapped,
      status: 'FAILED',
      errorMessage: '图片地址无效',
      filterCode: 'INVALID_IMAGE_URL',
      externalId,
      externalUrl
    };
  }

  if (resourceType === 'RECIPE') {
    const steps = Array.isArray(mapped.steps) ? mapped.steps : [];
    const ingredients = Array.isArray(mapped.ingredients) ? mapped.ingredients : [];
    if (steps.length === 0) {
      return {
        mappedData: mapped,
        status: 'FAILED',
        errorMessage: '必填项缺失: 菜谱步骤为空',
        filterCode: 'MISSING_RECIPE_STEPS',
        externalId,
        externalUrl
      };
    }
    if (ingredients.length === 0) {
      return {
        mappedData: mapped,
        status: 'FAILED',
        errorMessage: '必填项缺失: 菜谱用料为空',
        filterCode: 'MISSING_RECIPE_INGREDIENTS',
        externalId,
        externalUrl
      };
    }
  }

  if (typeof mapped.currentPrice === 'number' && !Number.isFinite(mapped.currentPrice)) {
    return {
      mappedData: mapped,
      status: 'FAILED',
      errorMessage: '价格格式无效',
      filterCode: 'INVALID_PRICE',
      externalId,
      externalUrl
    };
  }

  if (typeof mapped.alcoholDegree === 'number' && !Number.isFinite(mapped.alcoholDegree)) {
    return {
      mappedData: mapped,
      status: 'FAILED',
      errorMessage: '酒精浓度格式无效',
      filterCode: 'INVALID_ALCOHOL_DEGREE',
      externalId,
      externalUrl
    };
  }

  return {
    mappedData: mapped,
    status: 'PENDING',
    errorMessage: null,
    filterCode: null,
    externalId,
    externalUrl
  };
}
