import { HttpError } from './errors';

export const resolveRequestUserId = (authenticatedUserId: number, legacyUserId?: number) => {
  if (legacyUserId !== undefined && legacyUserId !== authenticatedUserId) {
    throw new HttpError('登录身份与请求用户不一致', 403, 403);
  }

  return authenticatedUserId;
};
