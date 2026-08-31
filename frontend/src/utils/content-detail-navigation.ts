export const resolveDetailEntryOrigin = (queryOrigin?: string) => {
  const normalizedOrigin = queryOrigin?.trim();
  if (normalizedOrigin) return normalizedOrigin;
  if (typeof window === 'undefined') return '';

  const hashQuery = window.location.hash.split('?')[1] || '';
  return new URLSearchParams(hashQuery).get('from')?.trim() || '';
};

export const navigateBackFromContentDetail = (origin: string, fallbackUrl: string) => {
  if (origin === 'home') {
    uni.reLaunch({ url: '/pages/index/index' });
    return;
  }

  if (getCurrentPages().length > 1) {
    uni.navigateBack();
    return;
  }

  uni.reLaunch({ url: fallbackUrl });
};
