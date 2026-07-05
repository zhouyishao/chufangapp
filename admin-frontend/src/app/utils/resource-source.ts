export const getResourceSourceScopeLabel = (providerName?: string | null) => {
  const text = (providerName || '').toLowerCase();
  if (text.includes('juhe') || text.includes('聚合') || text.includes('tianapi') || text.includes('天行') || text.includes('天聚')) {
    return '中文菜谱';
  }
  if (text.includes('themealdb') || text.includes('cocktaildb')) {
    return '国际菜谱';
  }
  return '第三方资源';
};
