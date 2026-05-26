import { z } from 'zod';

import { HttpError } from '../../http/errors';

export const parseId = (value: unknown) => {
  if (Array.isArray(value)) throw new HttpError('参数错误', 400, 400);
  const id = Number.parseInt(String(value), 10);
  if (!Number.isFinite(id)) throw new HttpError('参数错误', 400, 400);
  return id;
};

export const baseListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  q: z.string().trim().optional(),
  status: z.enum(['ACTIVE', 'DISABLED']).optional(),
  isPublish: z.coerce.boolean().optional(),
  isRecommend: z.coerce.boolean().optional()
});

export const baseContentSchema = z.object({
  sort: z.coerce.number().int().min(0).default(0),
  status: z.enum(['ACTIVE', 'DISABLED']).default('ACTIVE'),
  isPublish: z.coerce.boolean().default(true),
  isRecommend: z.coerce.boolean().default(false)
});
