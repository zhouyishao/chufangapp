import type { ContentModuleContentType, HomeModuleKey } from './api';

const navContentTypeMap: Record<string, ContentModuleContentType> = {
  recipe: 'RECIPE',
  ingredient: 'INGREDIENT',
  fruit: 'FRUIT',
  seasoning: 'SEASONING',
  beverage: 'BEVERAGE'
};

export const resolveDefaultModuleContentType = (
  navContentType: string | null | undefined
): ContentModuleContentType => navContentTypeMap[navContentType ?? ''] ?? 'RECIPE';

export const getContentTypeChangeImpact = (
  currentType: ContentModuleContentType,
  nextType: ContentModuleContentType
) => ({
  changed: currentType !== nextType,
  clearSelections: currentType !== nextType
});

export const isDisplayStyleCompatibleWithContent = (
  allowedTypes: readonly ContentModuleContentType[],
  contentType: ContentModuleContentType
) => allowedTypes.includes(contentType);

export const getMissingCoverContentIds = (
  items: readonly { id: string }[],
  selectedContentById: Readonly<Record<string, { cover?: string | null }>>
) => items
  .filter((item) => {
    const selected = selectedContentById[item.id];
    return selected !== undefined && !selected.cover?.trim();
  })
  .map((item) => item.id);

const seasonalModuleKeys = new Set<HomeModuleKey>([
  'SEASONAL_PRODUCE',
  'SEASONAL_INGREDIENTS',
  'SEASONAL_FRUITS'
]);

export const getMinimumManualContentCount = (moduleKey: HomeModuleKey | null) =>
  moduleKey && seasonalModuleKeys.has(moduleKey) ? 5 : 1;
