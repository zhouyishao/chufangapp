import { loginMobileAuth } from './public-api';

export interface AuthUser {
  id?: number;
  phone: string;
  nickname: string;
  token: string;
}

export interface AuthAccount {
  phone: string;
  password: string;
  nickname: string;
}

const AUTH_STORAGE_KEY = 'recipe-app-auth-user';

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const isAuthUser = (value: unknown): value is AuthUser => {
  if (!isRecord(value)) {
    return false;
  }

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

export const isValidPhone = (phone: string) => /^1[3-9]\d{9}$/.test(phone.trim());

export const isValidPassword = (password: string) => password.trim().length >= 6;

export const maskPhone = (phone: string) => {
  const trimmedPhone = phone.trim();
  if (trimmedPhone.length !== 11) {
    return trimmedPhone;
  }

  return `${trimmedPhone.slice(0, 3)}****${trimmedPhone.slice(7)}`;
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

export const registerAuthAccount = (phone: string, password: string) => {
  const normalizedPhone = phone.trim();
  return {
    phone: normalizedPhone,
    password: password.trim(),
    nickname: maskPhone(normalizedPhone)
  } satisfies AuthAccount;
};

export const resetAuthPassword = (phone: string, password: string) => {
  const normalizedPhone = phone.trim();
  return {
    phone: normalizedPhone,
    password: password.trim(),
    nickname: maskPhone(normalizedPhone)
  } satisfies AuthAccount;
};

export const createAuthUser = (phone: string, nickname?: string): AuthUser => {
  const normalizedPhone = phone.trim();
  return {
    phone: normalizedPhone,
    nickname: nickname?.trim() || maskPhone(normalizedPhone),
    token: ''
  };
};

export const syncAuthUserWithBackend = async (user: AuthUser | null = loadAuthUser()) => {
  if (!user) return null;
  if (user.id) return user;

  const remoteUser = await loginMobileAuth({
    phone: user.phone,
    nickname: user.nickname
  });
  const nextUser: AuthUser = {
    ...user,
    id: remoteUser.id,
    nickname: remoteUser.nickname || user.nickname,
    token: `mobile-user-${remoteUser.id}`
  };
  saveAuthUser(nextUser);
  return nextUser;
};
