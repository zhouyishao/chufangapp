import { loginMobileAuth } from './public-api';
import {
  clearAuthUser,
  loadAuthUser,
  saveAuthUser,
  type AuthUser
} from './auth-session';

export { clearAuthUser, loadAuthUser, saveAuthUser, type AuthUser } from './auth-session';

export interface AuthAccount {
  phone: string;
  password: string;
  nickname: string;
}

export const isValidPhone = (phone: string) => /^1[3-9]\d{9}$/.test(phone.trim());

export const isValidPassword = (password: string) => password.trim().length >= 6;

export const maskPhone = (phone: string) => {
  const trimmedPhone = phone.trim();
  if (trimmedPhone.length !== 11) {
    return trimmedPhone;
  }

  return `${trimmedPhone.slice(0, 3)}****${trimmedPhone.slice(7)}`;
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
  if (user.id && user.token.split('.').length === 3) return user;

  const session = await loginMobileAuth({
    phone: user.phone,
    nickname: user.nickname
  });
  const nextUser: AuthUser = {
    ...user,
    id: session.user.id,
    nickname: session.user.nickname || user.nickname,
    token: session.accessToken
  };
  saveAuthUser(nextUser);
  return nextUser;
};
