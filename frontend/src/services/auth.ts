import { loginMobileAuth } from './public-api';
import {
  clearAuthUser,
  loadAuthUser,
  saveAuthUser,
  type AuthUser
} from './auth-session';

export { clearAuthUser, loadAuthUser, saveAuthUser, type AuthUser } from './auth-session';

export const isValidPhone = (phone: string) => /^1[3-9]\d{9}$/.test(phone.trim());

export const maskPhone = (phone: string) => {
  const trimmedPhone = phone.trim();
  if (trimmedPhone.length !== 11) {
    return trimmedPhone;
  }

  return `${trimmedPhone.slice(0, 3)}****${trimmedPhone.slice(7)}`;
};

export const loginAuthUser = async (phone: string, password: string): Promise<AuthUser> => {
  const normalizedPhone = phone.trim();
  const session = await loginMobileAuth({
    phone: normalizedPhone,
    password
  });
  const user: AuthUser = {
    id: session.user.id,
    phone: normalizedPhone,
    nickname: session.user.nickname || maskPhone(normalizedPhone),
    token: session.accessToken
  };
  saveAuthUser(user);
  return user;
};

export const syncAuthUserWithBackend = async (user: AuthUser | null = loadAuthUser()) => {
  if (!user?.id || user.token.split('.').length !== 3) return null;
  return user;
};
