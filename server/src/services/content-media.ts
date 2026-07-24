import type { Prisma } from '@prisma/client';

type MediaDatabase = Pick<Prisma.TransactionClient, 'file'>;

const normalizeUrl = (value: unknown) => typeof value === 'string' && value.trim() ? value.trim() : null;

export const findActiveFileIdByUrl = async (database: MediaDatabase, value: unknown) => {
  const url = normalizeUrl(value);
  if (!url) return null;
  const file = await database.file.findFirst({
    where: { url, deletedAt: null, status: 'ACTIVE' },
    select: { id: true }
  });
  return file?.id ?? null;
};

export const resolveActiveFileId = async (
  database: MediaDatabase,
  fileId: number | null | undefined,
  legacyUrl: unknown
) => {
  if (fileId !== undefined && fileId !== null) return fileId;
  return findActiveFileIdByUrl(database, legacyUrl);
};

export const resolveActiveFileIds = async (
  database: MediaDatabase,
  fileIds: number[] | null | undefined,
  legacyUrls: unknown
) => {
  if (fileIds) return fileIds;
  if (!Array.isArray(legacyUrls)) return [];
  const resolved = await Promise.all(legacyUrls.map((url) => findActiveFileIdByUrl(database, url)));
  return resolved.filter((id): id is number => id !== null);
};
