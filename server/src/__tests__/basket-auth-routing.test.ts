import assert from 'node:assert/strict';
import test from 'node:test';

import { createApp } from '../app';

test('未登录不能读取菜篮', async () => {
  const server = createApp().listen(0);

  try {
    const address = server.address();
    assert.ok(address && typeof address === 'object');
    const response = await fetch(`http://127.0.0.1:${address.port}/api/mobile/basket-items`);
    const body = await response.json() as { code: number };

    assert.equal(response.status, 401);
    assert.equal(body.code, 401);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
});
