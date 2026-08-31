import assert from 'node:assert/strict';
import test from 'node:test';

import { validateProductionEnv } from '../config';

const validProductionEnv = {
  APP_ENV: 'production',
  DATABASE_URL: 'postgresql://app:secret@db.example.com:5432/chufangapp',
  JWT_ADMIN_SECRET: 'admin-secret-that-is-not-a-placeholder',
  JWT_APP_SECRET: 'app-secret-that-is-not-a-placeholder',
  RESOURCE_PROVIDER_SECRET_KEY: 'provider-secret-that-is-not-a-placeholder',
  STORAGE_DRIVER: 'object',
  STORAGE_BUCKET: 'chufangapp-production',
  STORAGE_ENDPOINT: 'https://storage.example.com',
  STORAGE_ACCESS_KEY: 'access-key',
  STORAGE_SECRET_KEY: 'storage-secret'
};

test('development keeps local defaults available', () => {
  assert.doesNotThrow(() => validateProductionEnv({ APP_ENV: 'dev' }));
});

test('production rejects missing and placeholder credentials', () => {
  assert.throws(
    () => validateProductionEnv({ APP_ENV: 'production', JWT_APP_SECRET: 'change-me-app' }),
    /DATABASE_URL.*JWT_ADMIN_SECRET.*JWT_APP_SECRET.*RESOURCE_PROVIDER_SECRET_KEY.*STORAGE_DRIVER/s
  );
});

test('production object storage requires complete credentials', () => {
  assert.throws(
    () => validateProductionEnv({ ...validProductionEnv, STORAGE_SECRET_KEY: '' }),
    /STORAGE_SECRET_KEY/
  );
  assert.doesNotThrow(() => validateProductionEnv(validProductionEnv));
});
