import type { NormalizedResourcePayload } from './types';

export type ChineseRecipeEvaluation = {
  mappedData: NormalizedResourcePayload;
  isChinese: boolean;
  categoryName: string | null;
  qualityScore: number;
  qualityIssues: string[];
  hardFailure: boolean;
  filterCode: 'NON_CHINESE_RECIPE' | 'NOT_HOUSEHOLD_RECIPE' | 'INVALID_RECIPE_STEPS' | 'MIXED_LANGUAGE_RECIPE' | 'INCOMPLETE_RECIPE' | 'INVALID_RECIPE_TITLE' | 'TEST_RECIPE_TITLE' | 'UNMAPPED_RECIPE_CATEGORY' | 'UNTRACEABLE_RECIPE_SOURCE' | null;
  errorMessage: string | null;
};

export const CHINESE_RECIPE_CATEGORIES = [
  '家常菜', '快手菜', '素菜', '荤菜', '汤羹', '凉菜', '主食', '早餐', '烘焙', '地方菜', '节气时令'
] as const;

export const CHINESE_RECIPE_CONFIRMATION_QUALITY = 80;

const CATEGORY_ALIASES: Record<string, (typeof CHINESE_RECIPE_CATEGORIES)[number]> = {
  家常菜: '家常菜',
  家常: '家常菜',
  快手菜: '快手菜',
  素菜: '素菜',
  素食: '素菜',
  蔬菜类: '素菜',
  荤菜: '荤菜',
  肉类: '荤菜',
  汤: '汤羹',
  汤羹: '汤羹',
  凉菜: '凉菜',
  凉拌: '凉菜',
  主食: '主食',
  面食: '主食',
  早餐: '早餐',
  烘焙: '烘焙',
  地方菜: '地方菜',
  时令菜: '节气时令',
  节气时令: '节气时令'
};

export const containsChineseText = (value: string): boolean => /[\u3400-\u9fff]/u.test(value);

export const normalizeImportedRecipeTitle = (value: string): string => value
  .trim()
  .replace(/^(?:E2E[_-]?\d*[_-]?|测试[_-]?)/i, '')
  .replace(/^\d+[._-]?/, '')
  .trim();

export const mapChineseRecipeCategory = (value: string | null | undefined): string | null => {
  const normalized = String(value ?? '').trim();
  return normalized ? CATEGORY_ALIASES[normalized] ?? null : null;
};

const entryCount = (value: unknown): number => Array.isArray(value)
  ? value.filter((item) => {
      if (typeof item === 'string') return item.trim().length > 0;
      return Boolean(item && typeof item === 'object' && String((item as { name?: unknown; description?: unknown }).name ?? (item as { description?: unknown }).description ?? '').trim());
    }).length
  : 0;

const getStepText = (step: NonNullable<NormalizedResourcePayload['steps']>[number]): string =>
  typeof step === 'string' ? step.trim() : step.description.trim();

const CHINESE_RECIPE_ACTION = /(?:洗|切|剁|拍|焯|煮|炖|蒸|煎|炒|炸|烤|烘|拌|腌|调|倒|加|放|烧|焖|煲|熬|煨|盛|装|搅|打|煸|爆|汆|卤|烩|收汁|勾芡|出锅)/u;
const PACKAGED_FOOD_TEXT = /(?:包装食品|预包装|方便面|速食|零食|薯片|饼干|罐头|即食|调味包)/u;
const DRINK_TEXT = /(?:鸡尾酒|饮品|饮料|奶茶|咖啡|果汁|汽水|啤酒|红酒|白酒|威士忌|伏特加|朗姆酒|调酒|酒水)/u;
const COOKED_DISH_TITLE = /(?:炒|煮|炖|蒸|煎|炸|烤|拌|烧|焖|煲|熬|卤|烩|鸡翅|排骨|肉|菜|蛋|豆腐|饭|面|饺|包|粥|羹|汤)/u;
const LATIN_WORD = /[A-Za-z]+/gu;
const CHINESE_CHARACTER = /[\u3400-\u9fff]/gu;
const NUMERIC_UNIT = /\b\d+(?:\.\d+)?\s*(?:g|kg|ml|l|°c|cm|min)\b/giu;
const ALLOWED_RECIPE_LATIN_TOKENS = ['kikkoman', 'bbq'] as const;
const ALLOWED_RECIPE_LATIN_TOKEN = new RegExp(`\\b(?:${ALLOWED_RECIPE_LATIN_TOKENS.join('|')})\\b`, 'giu');
const TITLE_MIN_CHINESE_RATIO = 0.9;
const TITLE_MAX_NON_WHITELISTED_ENGLISH_WORDS = 0;
const TITLE_MAX_NON_WHITELISTED_ENGLISH_SEGMENT_LENGTH = 0;
const STEP_MIN_CHINESE_RATIO = 0.7;
const STEP_MAX_NON_WHITELISTED_ENGLISH_WORDS = 0;

type RecipeLanguageBalance = {
  chineseRatio: number;
  englishWordCount: number;
  longestEnglishWordLength: number;
};

const getRecipeLanguageBalance = (value: string): RecipeLanguageBalance => {
  const normalized = value
    .replace(NUMERIC_UNIT, ' ')
    .replace(ALLOWED_RECIPE_LATIN_TOKEN, ' ');
  const chineseCharacterCount = normalized.match(CHINESE_CHARACTER)?.length ?? 0;
  const englishWords = normalized.match(LATIN_WORD) ?? [];
  const englishCharacterCount = englishWords.join('').length;
  const languageCharacterCount = chineseCharacterCount + englishCharacterCount;

  return {
    chineseRatio: languageCharacterCount > 0 ? chineseCharacterCount / languageCharacterCount : 0,
    englishWordCount: englishWords.length,
    longestEnglishWordLength: Math.max(0, ...englishWords.map((word) => word.length))
  };
};

const hasUnsupportedMixedLanguageTitle = (title: string): boolean => {
  const balance = getRecipeLanguageBalance(title);
  return balance.chineseRatio < TITLE_MIN_CHINESE_RATIO
    || balance.englishWordCount > TITLE_MAX_NON_WHITELISTED_ENGLISH_WORDS
    || balance.longestEnglishWordLength > TITLE_MAX_NON_WHITELISTED_ENGLISH_SEGMENT_LENGTH;
};

const hasChineseExecutableSteps = (steps: NormalizedResourcePayload['steps']): boolean =>
  Array.isArray(steps)
  && steps.filter((step) => getStepText(step).length > 0).every((step) => {
    const text = getStepText(step);
    const balance = getRecipeLanguageBalance(text);
    return containsChineseText(text)
      && CHINESE_RECIPE_ACTION.test(text)
      && balance.chineseRatio >= STEP_MIN_CHINESE_RATIO
      && balance.englishWordCount <= STEP_MAX_NON_WHITELISTED_ENGLISH_WORDS;
  });

const isDrinkPayload = (payload: NormalizedResourcePayload): boolean =>
  Boolean(
    payload.beverageType
    || payload.drinkType
    || payload.cocktailMethod
    || payload.baseSpirit
    || payload.glassType
    || payload.alcoholicType
    || payload.isAlcoholic === true
    || (payload.alcoholDegree ?? 0) > 0
    || payload.instructions
    || payload.garnish
    || payload.measures?.length
  );

const getHouseholdRecipeExclusion = (payload: NormalizedResourcePayload, title: string): string | null => {
  const metadataText = [payload.categoryName, payload.description, payload.subtitle, payload.scene, payload.taste]
    .filter((value): value is string => Boolean(value?.trim()))
    .join(' ');
  const allText = `${title} ${metadataText}`;
  if (isDrinkPayload(payload) || DRINK_TEXT.test(allText) && !COOKED_DISH_TITLE.test(title)) {
    return '饮品或鸡尾酒不属于中国家庭菜谱';
  }
  if (PACKAGED_FOOD_TEXT.test(allText)) return '包装食品不属于中国家庭菜谱';
  return null;
};

export const evaluateChineseRecipeCandidate = (payload: NormalizedResourcePayload): ChineseRecipeEvaluation => {
  const originalTitle = payload.title?.trim() || payload.name.trim();
  const title = normalizeImportedRecipeTitle(originalTitle);
  const isChinese = containsChineseText(title);
  const categoryName = mapChineseRecipeCategory(payload.categoryName);
  const ingredientCount = entryCount(payload.ingredients);
  const stepCount = entryCount(payload.steps);
  const validChineseSteps = hasChineseExecutableSteps(payload.steps);
  const householdExclusion = getHouseholdRecipeExclusion(payload, title);
  const mixedLanguageTitle = hasUnsupportedMixedLanguageTitle(title);
  const qualityIssues: string[] = [];
  let qualityScore = 0;
  const testTitle = /(?:E2E|测试|^\d+$)/i.test(originalTitle);

  if (isChinese && title.length >= 2 && title.length <= 40) qualityScore += 20;
  else qualityIssues.push('中文标题无效');
  if (categoryName) qualityScore += 15;
  else qualityIssues.push('分类待映射');
  if (ingredientCount >= 2) qualityScore += 20;
  else qualityIssues.push('有效用料少于2项');
  if (stepCount >= 1 && validChineseSteps) qualityScore += 20;
  else qualityIssues.push(stepCount < 1 ? '制作步骤为空' : '每个步骤必须以中文为主且为可执行烹饪说明');
  if (payload.cover) qualityScore += 15;
  else qualityIssues.push('缺少封面');
  if ((payload.sourceName && payload.externalId) || payload.externalUrl) qualityScore += 10;
  else qualityIssues.push('来源不可追溯');
  if (testTitle) {
    qualityIssues.push('测试标题不可导入');
    qualityScore = 0;
  }
  if (householdExclusion) qualityIssues.push(householdExclusion);
  if (mixedLanguageTitle) qualityIssues.push('中英混合标题不可自动导入');

  const invalidTitle = !title || title.length < 2 || title.length > 40;
  const incomplete = ingredientCount < 2 || stepCount < 1;
  const traceable = Boolean((payload.sourceName && payload.externalId) || payload.externalUrl);
  const filterCode = testTitle
    ? 'TEST_RECIPE_TITLE'
    : invalidTitle
      ? 'INVALID_RECIPE_TITLE'
      : !isChinese
        ? 'NON_CHINESE_RECIPE'
        : householdExclusion
          ? 'NOT_HOUSEHOLD_RECIPE'
          : mixedLanguageTitle
            ? 'MIXED_LANGUAGE_RECIPE'
            : !validChineseSteps
              ? 'INVALID_RECIPE_STEPS'
        : incomplete
          ? 'INCOMPLETE_RECIPE'
          : !categoryName
            ? 'UNMAPPED_RECIPE_CATEGORY'
            : !traceable
              ? 'UNTRACEABLE_RECIPE_SOURCE'
              : null;

  return {
    mappedData: { ...payload, name: title, title, categoryName },
    isChinese,
    categoryName,
    qualityScore,
    qualityIssues,
    hardFailure: filterCode !== null,
    filterCode,
    errorMessage: filterCode ? qualityIssues.join('；') : null
  };
};

export const getChineseRecipeConfirmationFailure = (
  evaluation: ChineseRecipeEvaluation
): string | null => {
  if (evaluation.hardFailure) {
    return evaluation.errorMessage || '菜谱未通过中国家庭菜准入';
  }
  if (evaluation.qualityScore < CHINESE_RECIPE_CONFIRMATION_QUALITY) {
    return `菜谱质量分低于${CHINESE_RECIPE_CONFIRMATION_QUALITY}，暂不可确认导入`;
  }
  return null;
};
