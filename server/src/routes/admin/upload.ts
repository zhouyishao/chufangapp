import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';

import { Router, type Request } from 'express';

import { config } from '../../config';
import { HttpError } from '../../http/errors';
import { requireAdminAuth } from '../../http/middleware/admin-auth';
import { ok } from '../../http/response';

const maxImageSize = 5 * 1024 * 1024;
const maxMultipartSize = maxImageSize + 1024 * 1024;
const allowedMimeTypes: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp'
};

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

const collectBody = async (req: Request) =>
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
      if (total > maxMultipartSize) {
        fail(new HttpError('图片不能超过 5MB', 400, 400));
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

const extractUploadedFile = (body: Buffer, boundary: string) => {
  const parts = splitBuffer(body, Buffer.from(`--${boundary}`));

  for (const rawPart of parts) {
    const part = trimPart(rawPart);
    const headerEnd = part.indexOf(Buffer.from('\r\n\r\n'));
    if (headerEnd === -1) continue;

    const headerText = part.subarray(0, headerEnd).toString('utf8');
    if (!/name="file"/.test(headerText) || !/filename="/.test(headerText)) continue;

    const mimeMatch = /content-type:\s*([^\r\n]+)/i.exec(headerText);
    const mimeType = mimeMatch?.[1]?.trim().toLowerCase() ?? '';
    const extension = allowedMimeTypes[mimeType];
    if (!extension) throw new HttpError('图片格式不支持', 400, 400);

    const content = trimPart(part.subarray(headerEnd + 4));
    if (!content.length) throw new HttpError('未找到上传图片', 400, 400);
    if (content.length > maxImageSize) throw new HttpError('图片不能超过 5MB', 400, 400);

    return { content, extension };
  }

  throw new HttpError('未找到上传图片', 400, 400);
};

export const adminUploadRouter = Router();

adminUploadRouter.post('/image', requireAdminAuth, async (req, res) => {
  const boundary = getBoundary(req.header('content-type'));
  if (!boundary) throw new HttpError('参数错误', 400, 400);

  const body = await collectBody(req);
  const file = extractUploadedFile(body, boundary);
  const filename = `${Date.now()}-${randomUUID()}.${file.extension}`;
  await fs.mkdir(uploadDir(), { recursive: true });
  await fs.writeFile(path.join(uploadDir(), filename), file.content);

  res.json(ok({ url: `/uploads/${filename}` }));
});
