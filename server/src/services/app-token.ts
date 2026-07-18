import jwt from 'jsonwebtoken';

import { config } from '../config';

export const APP_ACCESS_TOKEN_EXPIRES_IN = 60 * 60 * 24 * 7;

export type AppJwtPayload = {
  sub: string;
  type: 'app';
};

export const signAppAccessToken = (userId: number, secret = config.jwtAppSecret) => ({
  accessToken: jwt.sign(
    { sub: String(userId), type: 'app' } satisfies AppJwtPayload,
    secret,
    { expiresIn: APP_ACCESS_TOKEN_EXPIRES_IN }
  ),
  expiresIn: APP_ACCESS_TOKEN_EXPIRES_IN
});

export const verifyAppAccessToken = (token: string, secret = config.jwtAppSecret): AppJwtPayload => {
  const payload = jwt.verify(token, secret) as Partial<AppJwtPayload>;
  const userId = Number(payload.sub);
  if (payload.type !== 'app' || !Number.isInteger(userId) || userId <= 0) {
    throw new Error('invalid app token');
  }
  return { sub: String(userId), type: 'app' };
};

export const parseBearerToken = (header: string | undefined) => {
  if (!header?.toLowerCase().startsWith('bearer ')) return null;
  const token = header.slice('bearer '.length).trim();
  return token || null;
};
