import type { NormalizedResourcePayload } from './types';

export type ChineseRecipeEvaluation = {
  mappedData: NormalizedResourcePayload;
  isChinese: boolean;
  categoryName: string | null;
  qualityScore: number;
  qualityIssues: string[];
  hardFailure: boolean;
  filterCode: 'NON_CHINESE_RECIPE' | 'INCOMPLETE_RECIPE' | 'INVALID_RECIPE_TITLE' | 'TEST_RECIPE_TITLE' | 'UNMAPPED_RECIPE_CATEGORY' | 'UNTRACEABLE_RECIPE_SOURCE' | null;
  errorMessage: string | null;
};

export const CHINESE_RECIPE_CATEGORIES = [
  '家常菜', '快手菜', '素菜', '荤菜', '汤羹', '凉菜', '主食', '早餐', '烘焙', '地方菜', '节气时令'
] as const;

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

export const evaluateChineseRecipeCandidate = (payload: NormalizedResourcePayload): ChineseRecipeEvaluation => {
  const originalTitle = payload.title?.trim() || payload.name.trim();
  const title = normalizeImportedRecipeTitle(originalTitle);
  const isChinese = containsChineseText(title);
  const categoryName = mapChineseRecipeCategory(payload.categoryName);
  const ingredientCount = entryCount(payload.ingredients);
  const stepCount = entryCount(payload.steps);
  const qualityIssues: string[] = [];
  let qualityScore = 0;

  if (isChinese && title.length >= 2 && title.length <= 40) qualityScore += 20;
  else qualityIssues.push('中文标题无效');
  if (categoryName) qualityScore += 15;
  else qualityIssues.push('分类待映射');
  if (ingredientCount >= 2) qualityScore += 20;
  else qualityIssues.push('有效用料少于2项');
  if (stepCount >= 1) qualityScore += 20;
  else qualityIssues.push('制作步骤为空');
  if (payload.cover) qualityScore += 15;
  else qualityIssues.push('缺少封面');
  if ((payload.sourceName && payload.externalId) || payload.externalUrl) qualityScore += 10;
  else qualityIssues.push('来源不可追溯');

  const invalidTitle = !title || title.length < 2 || title.length > 40;
  const incomplete = ingredientCount < 2 || stepCount < 1;
  const testTitle = /(?:E2E|测试|^\d+$)/i.test(originalTitle);
  const traceable = Boolean((payload.sourceName && payload.externalId) || payload.externalUrl);
  const filterCode = testTitle
    ? 'TEST_RECIPE_TITLE'
    : invalidTitle
      ? 'INVALID_RECIPE_TITLE'
      : !isChinese
        ? 'NON_CHINESE_RECIPE'
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
