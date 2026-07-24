import { createHash } from 'node:crypto';

import { HttpError } from '../http/errors';
import { createOrLoadByUniqueKey } from './idempotent-create';

const FILE_MUTATION_LOCK_NAMESPACE = 727001;

type FileLockDatabase = {
  $executeRawUnsafe(query: string, ...values: unknown[]): Promise<unknown>;
};

export const buildStoredFileSha256 = (rawSha256: string, appUserId?: number) => {
  if (appUserId === undefined) return rawSha256;
  return createHash('sha256')
    .update(`${rawSha256}:app-user:${appUserId}`)
    .digest('hex');
};

export const lockFileForMutation = async (
  database: FileLockDatabase,
  fileId: number
) => {
  await database.$executeRawUnsafe(
    'SELECT pg_advisory_xact_lock($1, $2)',
    FILE_MUTATION_LOCK_NAMESPACE,
    fileId
  );
};

type ActiveMediaFileDatabase = FileLockDatabase & {
  file: {
    findFirst(args: {
      where: { id: number; deletedAt: null; status: 'ACTIVE' };
      select: { id: true };
    }): Promise<{ id: number } | null>;
  };
};

export const lockActiveMediaFiles = async (
  database: ActiveMediaFileDatabase,
  fileIds: Array<number | null | undefined>
) => {
  const uniqueIds = [...new Set(fileIds.filter((id): id is number => typeof id === 'number'))].sort((a, b) => a - b);
  for (const fileId of uniqueIds) {
    await lockFileForMutation(database, fileId);
    const file = await database.file.findFirst({
      where: { id: fileId, deletedAt: null, status: 'ACTIVE' },
      select: { id: true }
    });
    if (!file) throw new HttpError('步骤媒体文件无效', 422, 422);
  }
};

export const buildFileReadWhere = (fileId: number, appUserId?: number) => ({
  id: fileId,
  deletedAt: null as null,
  status: 'ACTIVE' as const,
  ...(appUserId === undefined ? {} : { uploaderId: appUserId })
});

type CreateOrLoadUploadedFileOptions<T> = {
  load: () => Promise<T | null>;
  create: () => Promise<T>;
  cleanup: () => Promise<void>;
  isCurrentUpload: (record: T) => boolean;
};

export const createOrLoadUploadedFile = async <T>({
  load,
  create,
  cleanup,
  isCurrentUpload
}: CreateOrLoadUploadedFileOptions<T>) => {
  let cleaned = false;
  const cleanupOnce = async () => {
    if (cleaned) return;
    cleaned = true;
    await cleanup();
  };

  try {
    const record = await createOrLoadByUniqueKey({ load, create });
    const created = isCurrentUpload(record);
    if (!created) await cleanupOnce();
    return { record, created };
  } catch (error) {
    await cleanupOnce();
    throw error;
  }
};

type LoadKnownUploadedFileOptions<
  Database,
  Record extends { deletedAt: Date | null; status: string }
> = {
  runExclusive: <Result>(operation: (database: Database) => Promise<Result>) => Promise<Result>;
  load: (database: Database) => Promise<Record | null>;
};

export const loadKnownUploadedFile = async <
  Database,
  Record extends { deletedAt: Date | null; status: string }
>({
  runExclusive,
  load
}: LoadKnownUploadedFileOptions<Database, Record>) => {
  const record = await runExclusive((database) => load(database));
  return record?.deletedAt === null && record.status === 'ACTIVE' ? record : null;
};

type RemovableFile = {
  id: number;
  uploaderId: number | null;
  deletedAt: Date | null;
  referenceCount: number;
};

type PrepareFileRemovalOptions<Database, Record extends RemovableFile> = {
  runExclusive: <Result>(operation: (database: Database) => Promise<Result>) => Promise<Result>;
  load: (database: Database) => Promise<Record | null>;
  softDelete: (database: Database, record: Record) => Promise<void>;
  appUserId?: number;
};

export const prepareFileRemoval = async <
  Database,
  Record extends RemovableFile
>({
  runExclusive,
  load,
  softDelete,
  appUserId
}: PrepareFileRemovalOptions<Database, Record>) => runExclusive(async (database) => {
  const file = await load(database);
  if (!file) throw new HttpError('文件不存在', 404, 404);
  if (appUserId !== undefined && file.uploaderId !== appUserId) {
    throw new HttpError('无权删除该文件', 403, 403);
  }
  if (file.referenceCount > 0) {
    throw new HttpError('文件正在被内容引用，不能删除', 409, 409);
  }
  if (file.deletedAt === null) await softDelete(database, file);
  return file;
});
