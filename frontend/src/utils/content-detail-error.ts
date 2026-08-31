import { ApiError } from '../services/public-api';

export const getContentDetailErrorMessage = (error: unknown) => {
  if (error instanceof ApiError) {
    if (error.code === 401) return '登录状态已失效，请重新登录后再试。';
    if (error.code === 403) return '当前账号没有权限查看这份内容。';
    if (error.code === 404) return '内容可能已下架或编号无效。';
    if (error.code === 408) return '网络连接不稳定，请检查网络后重试。';
  }

  const message = error instanceof Error ? error.message.toLowerCase() : '';
  if (message.includes('timeout') || message.includes('network') || message.includes('fetch')) {
    return '网络连接不稳定，请检查网络后重试。';
  }
  return '内容暂时不可用，请稍后重新加载。';
};
