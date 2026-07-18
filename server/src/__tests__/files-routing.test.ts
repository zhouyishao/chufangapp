import assert from 'node:assert/strict';
import test from 'node:test';

import { createApp } from '../app';

test('file upload, query and deletion require authentication', async () => {
  const server = createApp().listen(0);
  try {
    const address = server.address();
    assert.ok(address && typeof address === 'object');
    for (const [method, path] of [['POST', '/api/files'], ['GET', '/api/files/1'], ['DELETE', '/api/files/1']] as const) {
      const response: globalThis.Response = await fetch(`http://127.0.0.1:${address.port}${path}`, { method });
      assert.equal(response.status, 401, `${method} ${path} should require App JWT`);
    }
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test('admin file inventory requires administrator authentication', async () => {
  const server = createApp().listen(0);
  try {
    const address = server.address();
    assert.ok(address && typeof address === 'object');
    const response: globalThis.Response = await fetch(`http://127.0.0.1:${address.port}/api/admin/files`);
    assert.equal(response.status, 401);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});
