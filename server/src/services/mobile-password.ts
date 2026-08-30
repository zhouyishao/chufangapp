import bcrypt from 'bcryptjs';

export const MOBILE_PASSWORD_BCRYPT_COST = 10;

export const isValidMobilePassword = (password: string) =>
  password.length >= 8 &&
  password.length <= 72 &&
  /[A-Za-z]/.test(password) &&
  /\d/.test(password);

export const hashMobilePassword = (password: string) =>
  bcrypt.hash(password, MOBILE_PASSWORD_BCRYPT_COST);

export const compareMobilePassword = (password: string, passwordHash: string) =>
  bcrypt.compare(password, passwordHash);
