import { z } from 'zod';

const placeholderHosts = new Set(['example.com', 'www.example.com']);
const placeholderPathPattern = /(?:^|[\/_-])placeholder(?:[\/_-]|\.|$)/i;

export const isPlaceholderMediaUrl = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return false;

  if (placeholderPathPattern.test(trimmed)) return true;

  try {
    return placeholderHosts.has(new URL(trimmed).hostname.toLowerCase());
  } catch {
    return false;
  }
};

export const optionalContentMediaUrl = (maxLength = 255) =>
  z
    .string()
    .trim()
    .max(maxLength)
    .refine((value) => !isPlaceholderMediaUrl(value), '不能使用 example.com 或 placeholder 占位图片')
    .nullable()
    .optional();
