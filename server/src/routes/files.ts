import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';

import type { Prisma } from '@prisma/client';
import { Router, type Request, type Response } from 'express';
import { z } from 'zod';

import { config } from '../config';
import { HttpError } from '../http/errors';
import { requireAdminAuth } from '../http/middleware/admin-auth';
import { requireAppAuth } from '../http/middleware/app-auth';
import { ok } from '../http/response';
import { prisma } from '../prisma';
import {
  buildFileReadWhere,
  buildStoredFileSha256,
  createOrLoadUploadedFile,
  loadKnownUploadedFile,
  lockFileForMutation,
  prepareFileRemoval
} from '../services/file-mutation';
import { mediaRules } from '../services/media-file';
import { readUploadedMedia } from './admin/upload';

const uploadDir = () => path.resolve(process.cwd(), config.uploadDir);
const avatarMultipartLimit = mediaRules.image.maxSize + 1024 * 1024;
const fileSelect = {
  id: true,
  url: true,
  mimeType: true,
  size: true,
  width: true,
  height: true,
  durationSeconds: true,
  storageKind: true,
  status: true,
  createdAt: true
} as const;

const idParam = (value: unknown) => {
  const id = Number.parseInt(String(value), 10);
  if (!Number.isFinite(id)) throw new HttpError('参数错误', 400, 400);
  return id;
};

const upload = async (req: Request, res: Response) => {
  if (config.storageDriver !== 'local') {
    throw new HttpError('对象存储尚未配置完成', 503, 503);
  }

  const parsedPurpose = z.enum(['content', 'avatar', 'family-avatar']).default('content').safeParse(req.query.purpose);
  if (!parsedPurpose.success) throw new HttpError('上传用途不支持', 400, 400);
  const purpose = parsedPurpose.data;
  const media = purpose === 'content'
    ? await readUploadedMedia(req)
    : await readUploadedMedia(req, 'image', { maxBodySize: avatarMultipartLimit });
  const storedSha256 = buildStoredFileSha256(media.sha256, req.appUser?.id);
  if (purpose !== 'content') {
    if (media.type !== 'image') throw new HttpError('头像必须是图片', 400, 400);
    if (!media.width || !media.height) throw new HttpError('无法识别头像尺寸', 400, 400);
    if (media.width < 512 || media.height < 512) throw new HttpError('头像尺寸至少为 512×512', 400, 400);
  }

  const knownFile = await prisma.file.findFirst({
    where: { sha256: storedSha256, deletedAt: null, status: 'ACTIVE' },
    select: { ...fileSelect, deletedAt: true }
  });
  if (knownFile) {
    const reusableKnownFile = await loadKnownUploadedFile({
      runExclusive: async <Result>(operation: (transaction: Prisma.TransactionClient) => Promise<Result>) =>
        prisma.$transaction(async (transaction) => {
          await lockFileForMutation(transaction, knownFile!.id);
          return operation(transaction);
        }),
      load: async (transaction) => transaction.file.findUnique({
        where: { id: knownFile!.id },
        select: { ...fileSelect, deletedAt: true }
      })
    });
    if (reusableKnownFile) {
      const { deletedAt: _deletedAt, ...duplicate } = reusableKnownFile;
      res.json(ok(duplicate));
      return;
    }
  }

  const filename = `${Date.now()}-${randomUUID()}.${media.extension}`;
  const relativePath = path.posix.join('uploads', filename);
  await fs.mkdir(uploadDir(), { recursive: true });
  const absolutePath = path.join(uploadDir(), filename);
  await fs.writeFile(absolutePath, media.content, { flag: 'wx' });

  const data = {
    url: `/${relativePath}`,
    path: relativePath,
    mimeType: media.mimeType,
    size: media.size,
    width: media.width,
    height: media.height,
    sha256: storedSha256,
    storageKind: 'LOCAL' as const,
    uploaderId: req.appUser?.id ?? null,
    createdBy: req.admin ? Number.parseInt(req.admin.sub, 10) || null : null
  };

  const persisted = await createOrLoadUploadedFile({
    load: async () => prisma.file.findFirst({
      where: { sha256: storedSha256, deletedAt: null, status: 'ACTIVE' },
      select: fileSelect
    }),
    create: async () => prisma.file.create({ data, select: fileSelect }),
    cleanup: async () => {
      await fs.unlink(absolutePath).catch(() => undefined);
    },
    isCurrentUpload: (record) => record.url === data.url
  });
  res.status(persisted.created ? 201 : 200).json(ok(persisted.record));
};

const getFile = async (req: Request, res: Response) => {
  const file = await prisma.file.findFirst({
    where: buildFileReadWhere(idParam(req.params.id), req.appUser?.id),
    select: fileSelect
  });
  if (!file) throw new HttpError('文件不存在', 404, 404);
  res.json(ok(file));
};

const removeFile = async (req: Request, res: Response) => {
  const id = idParam(req.params.id);
  const file = await prepareFileRemoval({
    runExclusive: async <Result>(operation: (transaction: Prisma.TransactionClient) => Promise<Result>) =>
      prisma.$transaction(async (transaction) => {
        await lockFileForMutation(transaction, id);
        return operation(transaction);
      }),
    load: async (transaction) => {
      const lockedFile = await transaction.file.findFirst({
        where: { id },
        include: { _count: { select: { references: true, recipeSteps: true, beverageSteps: true } } }
      });
      if (!lockedFile) return null;
      return {
        ...lockedFile,
        referenceCount: lockedFile._count.references
          + lockedFile._count.recipeSteps
          + lockedFile._count.beverageSteps
      };
    },
    softDelete: async (transaction) => {
      await transaction.file.update({
        where: { id },
        data: { deletedAt: new Date(), status: 'DISABLED', sha256: null }
      });
    },
    appUserId: req.appUser?.id
  });

  if (file.storageKind === 'LOCAL') {
    await fs.unlink(path.resolve(process.cwd(), file.path)).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== 'ENOENT') throw error;
    });
  }
  res.json(ok({ id, deleted: true }));
};

const listFiles = async (req: Request, res: Response) => {
  const parsed = z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    q: z.string().trim().optional(),
    type: z.enum(['image', 'video']).optional()
  }).safeParse(req.query);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const { page, pageSize, q, type } = parsed.data;
  const where = {
    deletedAt: null,
    status: 'ACTIVE' as const,
    ...(type ? { mimeType: { startsWith: `${type}/` } } : {}),
    ...(q ? { OR: [{ path: { contains: q, mode: 'insensitive' as const } }, { mimeType: { contains: q, mode: 'insensitive' as const } }] } : {})
  };
  const [rows, total] = await Promise.all([
    prisma.file.findMany({
      where,
      include: { _count: { select: { references: true, recipeSteps: true, beverageSteps: true } } },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.file.count({ where })
  ]);
  res.json(ok({
    list: rows.map((file) => ({
      id: file.id,
      name: path.basename(file.path),
      url: file.url,
      mimeType: file.mimeType,
      size: file.size,
      storageKind: file.storageKind,
      uploaderId: file.uploaderId,
      referenceCount: file._count.references + file._count.recipeSteps + file._count.beverageSteps,
      createdAt: file.createdAt
    })),
    total,
    page,
    pageSize
  }));
};

const makeRouter = (auth: typeof requireAppAuth | typeof requireAdminAuth, allowList = false) => {
  const router = Router();
  router.post('/', auth, upload);
  if (allowList) router.get('/', auth, listFiles);
  router.get('/:id', auth, getFile);
  router.delete('/:id', auth, removeFile);
  return router;
};

export const filesRouter = makeRouter(requireAppAuth);
export const adminFilesRouter = makeRouter(requireAdminAuth, true);
