import type { UserProfile } from '../types/profile';
import { apiRequest, resolveAssetUrl } from './public-api';

type RemoteUserProfile = {
  id: number;
  phone: string | null;
  nickname: string | null;
  avatar: string | null;
  avatarFileId: number | null;
  bio: string | null;
};

export type UpdateUserProfilePayload = {
  nickname?: string;
  bio?: string;
  avatarFileId?: number | null;
};

const DEFAULT_AVATAR_URL =
  'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 200%22%3E%3Crect width=%22200%22 height=%22200%22 rx=%22100%22 fill=%22%23E9E2D6%22/%3E%3Ccircle cx=%22100%22 cy=%2278%22 r=%2234%22 fill=%22%237A8B6F%22 opacity=%22.72%22/%3E%3Cpath d=%22M42 174c16-38 36-57 58-57s42 19 58 57%22 fill=%22%237A8B6F%22 opacity=%22.72%22/%3E%3C/svg%3E';

export const getDefaultUserProfile = (): UserProfile => ({
  nickname: '',
  avatarUrl: DEFAULT_AVATAR_URL,
  avatarFileId: null,
  bio: ''
});

const mapRemoteProfile = (profile: RemoteUserProfile): UserProfile => ({
  nickname: profile.nickname?.trim() ?? '',
  avatarUrl: resolveAssetUrl(profile.avatar, DEFAULT_AVATAR_URL),
  avatarFileId: profile.avatarFileId,
  bio: profile.bio?.trim() ?? ''
});

export const getUserProfile = async (): Promise<UserProfile> => {
  const profile = await apiRequest<RemoteUserProfile>('/mobile/profile');
  return mapRemoteProfile(profile);
};

export const updateUserProfile = async (payload: UpdateUserProfilePayload): Promise<UserProfile> => {
  const profile = await apiRequest<RemoteUserProfile>('/mobile/profile', {
    method: 'PATCH',
    data: payload
  });
  return mapRemoteProfile(profile);
};
