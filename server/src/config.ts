import dotenv from 'dotenv';

dotenv.config();

const getEnv = (key: string, fallback?: string) => {
  const value = process.env[key];
  if (value && value.trim()) return value.trim();
  if (fallback !== undefined) return fallback;
  throw new Error(`Missing env: ${key}`);
};

export const config = {
  port: Number.parseInt(process.env.PORT ?? '3002', 10),
  env: process.env.APP_ENV ?? 'dev',
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
  jwtAdminSecret: getEnv('JWT_ADMIN_SECRET', 'change-me-admin'),
  jwtAppSecret: getEnv('JWT_APP_SECRET', 'change-me-app'),
  uploadDir: process.env.UPLOAD_DIR ?? './uploads'
};
