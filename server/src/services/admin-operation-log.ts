import type { Prisma } from '@prisma/client';

const secretKeys = new Set(['password', 'passwordhash', 'authorization', 'token']);

export const sanitizeOperationDetail = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(sanitizeOperationDetail);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !secretKeys.has(key.toLowerCase()))
      .map(([key, item]) => [key, sanitizeOperationDetail(item)])
  );
};

export const writeAdminOperationLog = async (
  tx: Prisma.TransactionClient,
  input: { adminId: number; module: string; action: string; method: string; path: string; detail?: unknown }
) => {
  await tx.operationLog.create({
    data: {
      adminId: input.adminId,
      module: input.module,
      action: input.action,
      method: input.method,
      path: input.path,
      requestBody: sanitizeOperationDetail(input.detail ?? {}) as Prisma.InputJsonValue,
      responseCode: 0,
      responseMessage: 'success'
    }
  });
};
