import crypto from 'node:crypto';

import { config } from '../../config';

const algorithm = 'aes-256-gcm';

const deriveKey = () => crypto.createHash('sha256').update(config.resourceProviderSecretKey).digest();

export function encryptSecret(secret: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(algorithm, deriveKey(), iv);
  const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

export function decryptSecret(payload: string): string {
  const raw = Buffer.from(payload, 'base64');
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const encrypted = raw.subarray(28);
  const decipher = crypto.createDecipheriv(algorithm, deriveKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}

export function maskSecret(secret?: string | null): string | null {
  if (!secret) return null;
  if (secret.length <= 8) return '********';
  return `${secret.slice(0, 4)}********${secret.slice(-4)}`;
}

