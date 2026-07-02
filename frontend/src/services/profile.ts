import type { UserProfile } from '../types/profile';

const PROFILE_STORAGE_KEY = 'recipe-app-user-profile';
const DEFAULT_AVATAR_URL =
  'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 200%22%3E%3Crect width=%22200%22 height=%22200%22 rx=%22100%22 fill=%22%23E9E2D6%22/%3E%3Ccircle cx=%22100%22 cy=%2278%22 r=%2234%22 fill=%22%237A8B6F%22 opacity=%22.72%22/%3E%3Cpath d=%22M42 174c16-38 36-57 58-57s42 19 58 57%22 fill=%22%237A8B6F%22 opacity=%22.72%22/%3E%3C/svg%3E';

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const isUserProfile = (value: unknown): value is UserProfile => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.nickname === 'string' &&
    typeof value.avatarUrl === 'string' &&
    typeof value.bio === 'string'
  );
};

export const getDefaultUserProfile = (): UserProfile => {
  return {
    nickname: '周末小家',
    avatarUrl: DEFAULT_AVATAR_URL,
    bio: '一起把一日三餐过得更松弛'
  };
};

export const loadUserProfile = (): UserProfile => {
  const storedProfile = uni.getStorageSync(PROFILE_STORAGE_KEY) as unknown;
  if (!storedProfile) {
    return getDefaultUserProfile();
  }

  return isUserProfile(storedProfile) ? storedProfile : getDefaultUserProfile();
};

export const saveUserProfile = (profile: UserProfile) => {
  uni.setStorageSync(PROFILE_STORAGE_KEY, profile);
};
