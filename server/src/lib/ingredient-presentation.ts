export type IngredientGuideItem = {
  title: string;
  description: string;
};

export type IngredientSeasonPresentation = {
  startMonth: number | null;
  endMonth: number | null;
  label: string;
  isInSeason: boolean;
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const cleanText = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

export const parseSeasonMonths = (value: unknown): number[] => {
  const source = Array.isArray(value) ? value : cleanText(value).match(/\d{1,2}/g) ?? [];
  return [...new Set(source.map(Number).filter((month) => month >= 1 && month <= 12))];
};

const formatMonthGroup = (months: number[]) => {
  const first = months[0];
  const last = months[months.length - 1];
  if (first === undefined || last === undefined) return '';
  if (months.length === 1) return `${first}月`;
  const wrapsYear = first > last;
  return `${first}月—${wrapsYear ? '次年' : ''}${last}月`;
};

const groupSeasonMonths = (months: number[]) => {
  if (months.length === 0) return [] as number[][];
  const selected = new Set(months);
  const first = months[0];
  if (first === undefined) return [] as number[][];
  const start = months.find((month) => !selected.has(month === 1 ? 12 : month - 1)) ?? first;
  const ordered = Array.from({ length: 12 }, (_, index) => ((start - 1 + index) % 12) + 1).filter((month) => selected.has(month));
  const groups: number[][] = [];
  for (const month of ordered) {
    const group = groups[groups.length - 1];
    if (!group) {
      groups.push([month]);
      continue;
    }
    const previous = group[group.length - 1];
    if (previous !== undefined && month === (previous % 12) + 1) group.push(month);
    else groups.push([month]);
  }
  return groups;
};

export const buildSeasonPresentation = (
  value: unknown,
  currentMonth = new Date().getMonth() + 1
): IngredientSeasonPresentation => {
  const months = parseSeasonMonths(value);
  const groups = groupSeasonMonths(months);
  const lastGroup = groups[groups.length - 1] ?? [];
  return {
    startMonth: groups[0]?.[0] ?? null,
    endMonth: lastGroup[lastGroup.length - 1] ?? null,
    label: groups.map(formatMonthGroup).filter(Boolean).join('、'),
    isInSeason: months.includes(currentMonth)
  };
};

const guideTitleKeys = ['title', 'name', 'label', 'heading'];
const guideBodyKeys = ['description', 'body', 'content', 'text', 'tip', 'detail'];
const guideCollectionKeys = ['items', 'tips', 'steps', 'groups', 'selectionGroups', 'list'];

const extractGuideItems = (value: unknown, fallbackTitle: string): IngredientGuideItem[] => {
  if (Array.isArray(value)) return value.flatMap((item) => extractGuideItems(item, fallbackTitle));
  const record = asRecord(value);
  if (record) {
    const title = guideTitleKeys.map((key) => cleanText(record[key])).find(Boolean) ?? '';
    const description = guideBodyKeys.map((key) => cleanText(record[key])).find(Boolean) ?? '';
    const direct = description ? [{ title: title || fallbackTitle, description }] : [];
    const nested = guideCollectionKeys.flatMap((key) =>
      record[key] === undefined ? [] : extractGuideItems(record[key], title || fallbackTitle)
    );
    return [...direct, ...nested];
  }
  const text = cleanText(value);
  if (!text) return [];
  return text
    .split(/\r?\n|；|;/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const separator = line.match(/^([^：:]{1,16})[：:]\s*(.+)$/);
      const title = separator?.[1]?.trim();
      const description = separator?.[2]?.trim();
      return separator
        ? { title: title || fallbackTitle, description: description || line }
        : { title: fallbackTitle, description: line };
    });
};

export const normalizeGuideItems = (value: unknown, fallbackTitle: string): IngredientGuideItem[] => {
  if (typeof value === 'string') {
    const text = value.trim();
    if (!text) return [];
    if (text.startsWith('{') || text.startsWith('[')) {
      try {
        return extractGuideItems(JSON.parse(text), fallbackTitle);
      } catch {
        return [];
      }
    }
  }
  return extractGuideItems(value, fallbackTitle);
};

export const presentIngredient = <T extends Record<string, unknown>>(ingredient: T) => {
  const selectionGuide = normalizeGuideItems(ingredient.selectionTips, '挑选要点');
  const storageGuide = normalizeGuideItems(ingredient.storageMethod, '保存方法');
  const eatingGuide = normalizeGuideItems(ingredient.nutrition, '食用建议');
  return {
    ...ingredient,
    cover: cleanText(ingredient.cover) || null,
    displayImage: cleanText(ingredient.transparentImage) || cleanText(ingredient.cover) || null,
    season: buildSeasonPresentation(ingredient.seasonMonth),
    selectionGuide,
    storageGuide,
    eatingGuide,
    selectionTips: selectionGuide.map((item) => `${item.title}：${item.description}`).join('\n'),
    storageMethod: storageGuide.map((item) => `${item.title}：${item.description}`).join('\n'),
    nutrition: eatingGuide.map((item) => `${item.title}：${item.description}`).join('\n')
  };
};
