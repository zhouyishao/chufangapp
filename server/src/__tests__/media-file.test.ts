import assert from 'node:assert/strict';
import test from 'node:test';

import { getImageSize, validateMediaFile } from '../services/media-file';

const png = Buffer.alloc(24);
Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(png);
png.writeUInt32BE(512, 16);
png.writeUInt32BE(512, 20);

test('validates image signature, dimensions and hash', () => {
  const file = validateMediaFile(png, 'image/png');
  assert.equal(file.type, 'image');
  assert.equal(file.width, 512);
  assert.equal(file.height, 512);
  assert.equal(file.sha256.length, 64);
});

test('rejects forged mime type and unsupported content', () => {
  assert.throws(() => validateMediaFile(Buffer.from('not a png'), 'image/png'), /内容与格式不一致/);
  assert.throws(() => validateMediaFile(png, 'application/pdf'), /格式不支持/);
});

const webpContainer = (chunk: 'VP8X' | 'VP8 ' | 'VP8L', payload: Buffer) => {
  const buffer = Buffer.alloc(20 + payload.length + (payload.length % 2));
  buffer.write('RIFF', 0, 'ascii');
  buffer.writeUInt32LE(buffer.length - 8, 4);
  buffer.write('WEBP', 8, 'ascii');
  buffer.write(chunk, 12, 'ascii');
  buffer.writeUInt32LE(payload.length, 16);
  payload.copy(buffer, 20);
  return buffer;
};

test('parses VP8X WebP canvas dimensions', () => {
  const payload = Buffer.alloc(10);
  payload.writeUIntLE(639, 4, 3);
  payload.writeUIntLE(479, 7, 3);

  assert.deepEqual(getImageSize(webpContainer('VP8X', payload), 'image/webp'), {
    width: 640,
    height: 480
  });
});

test('parses VP8 lossy WebP frame dimensions', () => {
  const payload = Buffer.alloc(10);
  Buffer.from([0x9d, 0x01, 0x2a]).copy(payload, 3);
  payload.writeUInt16LE(800, 6);
  payload.writeUInt16LE(600, 8);

  assert.deepEqual(getImageSize(webpContainer('VP8 ', payload), 'image/webp'), {
    width: 800,
    height: 600
  });
});

test('parses VP8L lossless WebP frame dimensions', () => {
  const width = 512;
  const height = 513;
  const packedDimensions = (width - 1) | ((height - 1) << 14);
  const payload = Buffer.alloc(5);
  payload[0] = 0x2f;
  payload.writeUInt32LE(packedDimensions, 1);

  const file = validateMediaFile(webpContainer('VP8L', payload), 'image/webp');
  assert.equal(file.width, width);
  assert.equal(file.height, height);
});

test('malformed or truncated WebP dimensions return null without throwing', () => {
  const malformed = webpContainer('VP8X', Buffer.alloc(2));
  assert.doesNotThrow(() => getImageSize(malformed, 'image/webp'));
  assert.equal(getImageSize(malformed, 'image/webp'), null);
  assert.equal(getImageSize(Buffer.from('RIFF'), 'image/webp'), null);
});

test('rejects WebP with invalid RIFF length, chunk boundary or zero VP8 dimensions', () => {
  const wrongRiffLength = webpContainer('VP8X', Buffer.alloc(10));
  wrongRiffLength.writeUInt32LE(1, 4);

  const oversizedChunk = webpContainer('VP8X', Buffer.alloc(10));
  oversizedChunk.writeUInt32LE(100, 16);

  const zeroVp8 = webpContainer('VP8 ', Buffer.alloc(10));
  Buffer.from([0x9d, 0x01, 0x2a]).copy(zeroVp8, 23);

  for (const malformed of [wrongRiffLength, oversizedChunk, zeroVp8]) {
    assert.equal(getImageSize(malformed, 'image/webp'), null);
    assert.throws(() => validateMediaFile(malformed, 'image/webp'), /无法识别图片尺寸/);
  }
});
