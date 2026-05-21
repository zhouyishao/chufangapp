import type { UserProfile } from '../types/profile';

const PROFILE_STORAGE_KEY = 'recipe-app-user-profile';

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
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80',
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

