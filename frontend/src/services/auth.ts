export interface AuthUser {
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
const AUTH_ACCOUNTS_STORAGE_KEY = 'recipe-app-auth-accounts';

const demoAccount: AuthAccount = {
  phone: '13800138000',
  password: '123456',
  nickname: '周末小家'
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const isAuthUser = (value: unknown): value is AuthUser => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.phone === 'string' &&
    typeof value.nickname === 'string' &&
    typeof value.token === 'string'
  );
};

const isAuthAccount = (value: unknown): value is AuthAccount => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.phone === 'string' &&
    typeof value.password === 'string' &&
    typeof value.nickname === 'string'
  );
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
  return isAuthUser(storedUser) ? storedUser : null;
};

export const saveAuthUser = (user: AuthUser) => {
  uni.setStorageSync(AUTH_STORAGE_KEY, user);
};

export const clearAuthUser = () => {
  uni.removeStorageSync(AUTH_STORAGE_KEY);
};

export const loadAuthAccounts = () => {
  const storedAccounts = uni.getStorageSync(AUTH_ACCOUNTS_STORAGE_KEY) as unknown;
  if (!Array.isArray(storedAccounts)) {
    return [demoAccount];
  }

  const accounts = storedAccounts.filter(isAuthAccount);
  if (accounts.some((account) => account.phone === demoAccount.phone)) {
    return accounts;
  }

  return [demoAccount, ...accounts];
};

export const saveAuthAccounts = (accounts: AuthAccount[]) => {
  uni.setStorageSync(AUTH_ACCOUNTS_STORAGE_KEY, accounts);
};

export const findAuthAccount = (phone: string) => {
  const normalizedPhone = phone.trim();
  return loadAuthAccounts().find((account) => account.phone === normalizedPhone) ?? null;
};

export const registerAuthAccount = (phone: string, password: string) => {
  const normalizedPhone = phone.trim();
  const accounts = loadAuthAccounts();
  const nextAccount: AuthAccount = {
    phone: normalizedPhone,
    password: password.trim(),
    nickname: maskPhone(normalizedPhone)
  };
  const nextAccounts = [
    nextAccount,
    ...accounts.filter((account) => account.phone !== normalizedPhone)
  ];
  saveAuthAccounts(nextAccounts);
  return nextAccount;
};

export const resetAuthPassword = (phone: string, password: string) => {
  const normalizedPhone = phone.trim();
  const accounts = loadAuthAccounts();
  const existingAccount = accounts.find((account) => account.phone === normalizedPhone);
  const nextAccount: AuthAccount = {
    phone: normalizedPhone,
    password: password.trim(),
    nickname: existingAccount?.nickname ?? maskPhone(normalizedPhone)
  };
  const nextAccounts = [
    nextAccount,
    ...accounts.filter((account) => account.phone !== normalizedPhone)
  ];
  saveAuthAccounts(nextAccounts);
  return nextAccount;
};

export const verifyPassword = (phone: string, password: string) => {
  const account = findAuthAccount(phone);
  return account !== null && account.password === password.trim();
};

export const createAuthUser = (phone: string, nickname?: string): AuthUser => {
  const normalizedPhone = phone.trim();
  return {
    phone: normalizedPhone,
    nickname: nickname?.trim() || maskPhone(normalizedPhone),
    token: `mock-token-${Date.now()}`
  };
};
