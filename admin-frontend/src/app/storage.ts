import type { AdminUser } from './types';

const TOKEN_KEY = 'chufangapp_admin_token';
const ADMIN_KEY = 'chufangapp_admin_user';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isAdminUser = (value: unknown): value is AdminUser => {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === 'number' &&
    typeof value.username === 'string' &&
    (typeof value.nickname === 'string' || value.nickname === null)
  );
};

export const loadToken = (): string | null => {
  const token = localStorage.getItem(TOKEN_KEY);
  return token && token.trim() ? token : null;
};

export const saveToken = (token: string) => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const clearToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

export const loadAdminUser = (): AdminUser | null => {
  const raw = localStorage.getItem(ADMIN_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    return isAdminUser(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export const saveAdminUser = (user: AdminUser) => {
  localStorage.setItem(ADMIN_KEY, JSON.stringify(user));
};

export const clearAdminUser = () => {
  localStorage.removeItem(ADMIN_KEY);
};

