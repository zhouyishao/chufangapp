import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';

import { prisma } from '../../prisma';
import { Router, type Request, type Response } from 'express';

import { config } from '../../config';
import { HttpError } from '../../http/errors';
import { requireAdminAuth } from '../../http/middleware/admin-auth';
import { ok } from '../../http/response';
import { mediaRules, type MediaType, validateMediaFile } from '../../services/media-file';
import { createOrLoadUploadedFile } from '../../services/file-mutation';

const maxMultipartSize = mediaRules.video.maxSize + 1024 * 1024;
const uploadDir = () => path.resolve(process.cwd(), config.uploadDir);

const splitBuffer = (buffer: Buffer, separator: Buffer) => {
  const parts: Buffer[] = [];
  let start = 0;
  let index = buffer.indexOf(separator, start);
  while (index !== -1) {
    parts.push(buffer.subarray(start, index));
    start = index + separator.length;
    index = buffer.indexOf(separator, start);
  }
  parts.push(buffer.subarray(start));
  return parts;
};

const collectBody = async (req: Request, maxBodySize: number) =>
  new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    let total = 0;
    let settled = false;

    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      reject(error);
      req.destroy();
    };

    req.on('data', (chunk: Buffer) => {
      total += chunk.length;
      if (total > maxBodySize) {
        fail(new HttpError('上传请求体过大', 400, 400));
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (settled) return;
      settled = true;
      resolve(Buffer.concat(chunks));
    });
    req.on('error', (error) => fail(error));
  });

const getBoundary = (contentType: string | undefined) => {
  const match = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType ?? '');
  return match?.[1] ?? match?.[2] ?? null;
};

const trimPart = (part: Buffer) => {
  let next = part;
  if (next.subarray(0, 2).equals(Buffer.from('\r\n'))) next = next.subarray(2);
  if (next.subarray(-2).equals(Buffer.from('\r\n'))) next = next.subarray(0, -2);
  return next;
};

const getMediaType = (mimeType: string): MediaType | null => {
  if (mediaRules.image.mimeTypes[mimeType]) return 'image';
  if (mediaRules.video.mimeTypes[mimeType]) return 'video';
  return null;
};

const extractUploadedFile = (body: Buffer, boundary: string, expectedType: MediaType | 'media') => {
  const parts = splitBuffer(body, Buffer.from(`--${boundary}`));

  for (const rawPart of parts) {
    const part = trimPart(rawPart);
    const headerEnd = part.indexOf(Buffer.from('\r\n\r\n'));
    if (headerEnd === -1) continue;

    const headerText = part.subarray(0, headerEnd).toString('utf8');
    if (!/name="file"/.test(headerText) || !/filename="/.test(headerText)) continue;

    const mimeMatch = /content-type:\s*([^\r\n]+)/i.exec(headerText);
    const nameMatch = /filename="([^"]+)"/i.exec(headerText);
    const mimeType = mimeMatch?.[1]?.trim().toLowerCase() ?? '';
    const detectedType = getMediaType(mimeType);
    const mediaType = expectedType === 'media' ? detectedType : expectedType;
    if (!detectedType || !mediaType || detectedType !== mediaType) {
      throw new HttpError(expectedType === 'video' ? '视频格式不支持' : expectedType === 'image' ? '图片格式不支持' : '文件格式不支持', 400, 400);
    }

    const content = trimPart(part.subarray(headerEnd + 4));
    const validated = validateMediaFile(content, mimeType);

    return {
      content,
      extension: validated.extension,
      mimeType: validated.mimeType,
      name: nameMatch?.[1] ?? `upload.${validated.extension}`,
      size: validated.size,
      type: mediaType,
      sha256: validated.sha256,
      width: validated.width,
      height: validated.height
    };
  }

  throw new HttpError('未找到上传文件', 400, 400);
};

export const readUploadedMedia = async (
  req: Request,
  expectedType: MediaType | 'media' = 'media',
  options: { maxBodySize?: number } = {}
) => {
  const boundary = getBoundary(req.header('content-type'));
  if (!boundary) throw new HttpError('参数错误', 400, 400);
  return extractUploadedFile(await collectBody(req, options.maxBodySize ?? maxMultipartSize), boundary, expectedType);
};

const handleUpload = (expectedType: MediaType | 'media') => async (req: Request, res: Response) => {
  const file = await readUploadedMedia(req, expectedType);
  const filename = `${Date.now()}-${randomUUID()}.${file.extension}`;
  await fs.mkdir(uploadDir(), { recursive: true });
  const relativePath = path.posix.join('uploads', filename);
  const absolutePath = path.join(uploadDir(), filename);
  await fs.writeFile(absolutePath, file.content, { flag: 'wx' });

  const url = `/${relativePath}`;
  const persisted = await createOrLoadUploadedFile({
    load: async () => prisma.file.findFirst({
      where: { sha256: file.sha256, deletedAt: null, status: 'ACTIVE' },
      select: { id: true, url: true, mimeType: true, size: true, width: true, height: true, durationSeconds: true }
    }),
    create: async () => prisma.file.create({
      data: {
        url,
        path: relativePath,
        mimeType: file.mimeType,
        size: file.size,
        width: file.width,
        height: file.height,
        sha256: file.sha256,
        storageKind: 'LOCAL',
        createdBy: Number.parseInt(req.admin?.sub ?? '', 10) || null
      },
      select: { id: true, url: true, mimeType: true, size: true, width: true, height: true, durationSeconds: true }
    }),
    cleanup: async () => fs.unlink(absolutePath).catch(() => undefined),
    isCurrentUpload: (record) => record.url === url
  });

  res.json(ok({
    id: persisted.record.id,
    url: persisted.record.url,
    type: file.type,
    name: file.name,
    size: persisted.record.size,
    mimeType: persisted.record.mimeType,
    width: persisted.record.width,
    height: persisted.record.height
  }));
};

export const adminUploadRouter = Router();

adminUploadRouter.post('/image', requireAdminAuth, handleUpload('image'));
adminUploadRouter.post('/video', requireAdminAuth, handleUpload('video'));
adminUploadRouter.post('/media', requireAdminAuth, handleUpload('media'));
