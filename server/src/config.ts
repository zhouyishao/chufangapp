import dotenv from 'dotenv';

dotenv.config();

const getEnv = (key: string, fallback?: string) => {
  const value = process.env[key];
  if (value && value.trim()) return value.trim();
  if (fallback !== undefined) return fallback;
  throw new Error(`Missing env: ${key}`);
};

const parseCorsOrigin = (value: string) => {
  if (value.trim() === '*') return '*';
  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const productionNames = ['production', 'prod'];
const placeholders = new Set(['change-me-admin', 'change-me-app', 'change-me-resource-provider']);

export const validateProductionEnv = (env: NodeJS.ProcessEnv | Record<string, string | undefined>) => {
  if (!productionNames.includes((env.APP_ENV ?? '').trim().toLowerCase())) return;

  const missing: string[] = [];
  const requireSecret = (key: string) => {
    const value = env[key]?.trim();
    if (!value || placeholders.has(value)) missing.push(key);
  };

  requireSecret('DATABASE_URL');
  requireSecret('JWT_ADMIN_SECRET');
  requireSecret('JWT_APP_SECRET');
  requireSecret('RESOURCE_PROVIDER_SECRET_KEY');
  requireSecret('STORAGE_DRIVER');

  if (env.STORAGE_DRIVER?.trim().toLowerCase() === 'object') {
    for (const key of ['STORAGE_BUCKET', 'STORAGE_ENDPOINT', 'STORAGE_ACCESS_KEY', 'STORAGE_SECRET_KEY']) {
      requireSecret(key);
    }
  }

  if (missing.length) {
    throw new Error(`Production environment is missing secure configuration: ${missing.join(', ')}`);
  }
};

validateProductionEnv(process.env);

export const config = {
  port: Number.parseInt(process.env.PORT ?? '3002', 10),
  env: process.env.APP_ENV ?? 'dev',
  corsOrigin: parseCorsOrigin(process.env.CORS_ORIGIN ?? '*'),
  jwtAdminSecret: getEnv('JWT_ADMIN_SECRET', 'change-me-admin'),
  jwtAppSecret: getEnv('JWT_APP_SECRET', 'change-me-app'),
  resourceProviderSecretKey: getEnv('RESOURCE_PROVIDER_SECRET_KEY', 'change-me-resource-provider'),
  uploadDir: process.env.UPLOAD_DIR ?? './uploads',
  storageDriver: process.env.STORAGE_DRIVER ?? 'local'
};
