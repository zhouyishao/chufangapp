export interface AuthUser {
  id?: number;
  phone: string;
  nickname: string;
  token: string;
}

const AUTH_STORAGE_KEY = 'recipe-app-auth-user';
let authExpiredNoticeVisible = false;

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const isAuthUser = (value: unknown): value is AuthUser => {
  if (!isRecord(value)) return false;

  return (
    (value.id === undefined || typeof value.id === 'number') &&
    typeof value.phone === 'string' &&
    typeof value.nickname === 'string' &&
    typeof value.token === 'string'
  );
};

const unwrapStoredValue = (value: unknown): unknown => {
  if (typeof value === 'string') {
    try {
      return unwrapStoredValue(JSON.parse(value));
    } catch {
      return value;
    }
  }
  if (isRecord(value) && 'data' in value && typeof value.type === 'string') {
    return unwrapStoredValue(value.data);
  }
  return value;
};

export const loadAuthUser = (): AuthUser | null => {
  const storedUser = uni.getStorageSync(AUTH_STORAGE_KEY) as unknown;
  const unwrappedUser = unwrapStoredValue(storedUser);
  return isAuthUser(unwrappedUser) ? unwrappedUser : null;
};

export const saveAuthUser = (user: AuthUser) => {
  uni.setStorageSync(AUTH_STORAGE_KEY, user);
};

export const clearAuthUser = () => {
  uni.removeStorageSync(AUTH_STORAGE_KEY);
};

export const getAuthToken = () => loadAuthUser()?.token.trim() || null;

export const handleAuthExpired = () => {
  clearAuthUser();
  if (authExpiredNoticeVisible) return;

  authExpiredNoticeVisible = true;
  uni.showToast({ title: '登录已过期，请重新登录', icon: 'none' });
  setTimeout(() => {
    authExpiredNoticeVisible = false;
  }, 1800);
};
