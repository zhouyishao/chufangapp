import { createHash } from 'node:crypto';

import { HttpError } from '../http/errors';

export type MediaType = 'image' | 'video';

export const mediaRules: Record<MediaType, { maxSize: number; mimeTypes: Record<string, string> }> = {
  image: {
    maxSize: 5 * 1024 * 1024,
    mimeTypes: { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }
  },
  video: {
    maxSize: 50 * 1024 * 1024,
    mimeTypes: { 'video/mp4': 'mp4', 'video/quicktime': 'mov', 'video/webm': 'webm' }
  }
};

const isJpeg = (buffer: Buffer) => buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
const isPng = (buffer: Buffer) => buffer.length >= 24 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
const isWebp = (buffer: Buffer) => buffer.length >= 16 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
const isIsoVideo = (buffer: Buffer) => buffer.length >= 12 && buffer.toString('ascii', 4, 8) === 'ftyp';
const isWebm = (buffer: Buffer) => buffer.length >= 4 && buffer.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));

const jpegSize = (buffer: Buffer) => {
  let offset = 2;
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) { offset += 1; continue; }
    const marker = buffer[offset + 1]!;
    const length = buffer.readUInt16BE(offset + 2);
    if (length < 2) break;
    if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
      return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
    }
    offset += 2 + length;
  }
  return null;
};

const webpSize = (buffer: Buffer) => {
  if (!isWebp(buffer) || buffer.length < 20) return null;
  const riffPayloadSize = buffer.readUInt32LE(4);
  if (riffPayloadSize !== buffer.length - 8) return null;
  const chunkSize = buffer.readUInt32LE(16);
  const chunkEnd = 20 + chunkSize;
  const paddedChunkEnd = chunkEnd + (chunkSize % 2);
  if (chunkSize === 0 || chunkEnd > buffer.length || paddedChunkEnd > buffer.length) return null;

  const chunkType = buffer.toString('ascii', 12, 16);
  if (chunkType === 'VP8X') {
    if (chunkSize < 10) return null;
    return {
      width: buffer.readUIntLE(24, 3) + 1,
      height: buffer.readUIntLE(27, 3) + 1
    };
  }

  if (chunkType === 'VP8 ') {
    if (
      chunkSize < 10
      || buffer[23] !== 0x9d
      || buffer[24] !== 0x01
      || buffer[25] !== 0x2a
    ) return null;
    const width = buffer.readUInt16LE(26) & 0x3fff;
    const height = buffer.readUInt16LE(28) & 0x3fff;
    return width > 0 && height > 0 ? { width, height } : null;
  }

  if (chunkType === 'VP8L') {
    if (chunkSize < 5 || buffer[20] !== 0x2f) return null;
    const dimensions = buffer.readUInt32LE(21);
    return {
      width: (dimensions & 0x3fff) + 1,
      height: ((dimensions >>> 14) & 0x3fff) + 1
    };
  }

  return null;
};

export const getImageSize = (buffer: Buffer, mimeType: string) => {
  if (mimeType === 'image/png' && isPng(buffer)) {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }
  if (mimeType === 'image/jpeg' && isJpeg(buffer)) return jpegSize(buffer);
  if (mimeType === 'image/webp') return webpSize(buffer);
  return null;
};

export const validateMediaFile = (content: Buffer, mimeType: string) => {
  const normalized = mimeType.trim().toLowerCase();
  const type: MediaType | null = mediaRules.image.mimeTypes[normalized]
    ? 'image'
    : mediaRules.video.mimeTypes[normalized]
      ? 'video'
      : null;
  if (!type) throw new HttpError('文件格式不支持', 400, 400);
  if (!content.length) throw new HttpError('未找到上传文件', 400, 400);
  if (content.length > mediaRules[type].maxSize) throw new HttpError(type === 'image' ? '图片不能超过 5MB' : '视频不能超过 50MB', 400, 400);

  const signatureMatches = normalized === 'image/jpeg' ? isJpeg(content)
    : normalized === 'image/png' ? isPng(content)
      : normalized === 'image/webp' ? isWebp(content)
        : normalized === 'video/webm' ? isWebm(content)
          : isIsoVideo(content);
  if (!signatureMatches) throw new HttpError('文件内容与格式不一致', 400, 400);

  const dimensions = type === 'image' ? getImageSize(content, normalized) : null;
  if (type === 'image' && !dimensions) throw new HttpError('无法识别图片尺寸', 400, 400);
  return {
    type,
    extension: mediaRules[type].mimeTypes[normalized],
    mimeType: normalized,
    size: content.length,
    sha256: createHash('sha256').update(content).digest('hex'),
    width: dimensions?.width ?? null,
    height: dimensions?.height ?? null
  };
};
