import assert from 'node:assert/strict';
import test from 'node:test';

import { validateMediaFile } from '../services/media-file';

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
