export const getResourceSourceScopeLabel = (providerName?: string | null) => {
  const text = (providerName || '').toLowerCase();
  if (text.includes('proj.kitchen') || text.includes('厨房计划')) {
    return '中文主菜谱源';
  }
  if (text.includes('tianapi') || text.includes('天行') || text.includes('天聚')) {
    return '中文菜谱';
  }
  if (text.includes('themealdb') || text.includes('cocktaildb')) {
    return '国际菜谱';
  }
  return '第三方资源';
};
