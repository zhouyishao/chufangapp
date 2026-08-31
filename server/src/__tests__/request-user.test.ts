import assert from 'node:assert/strict';
import test from 'node:test';

type RequestUserModule = typeof import('../http/request-user');

async function loadRequestUserModule(): Promise<RequestUserModule> {
  try {
    return await import('../http/request-user');
  } catch {
    assert.fail('Token 与兼容 userId 的身份校验尚未实现');
  }
}

test('没有旧 userId 时使用 Token 用户', async () => {
  const { resolveRequestUserId } = await loadRequestUserModule();
  assert.equal(resolveRequestUserId(12), 12);
});

test('旧 userId 与 Token 一致时保持兼容', async () => {
  const { resolveRequestUserId } = await loadRequestUserModule();
  assert.equal(resolveRequestUserId(12, 12), 12);
});

test('旧 userId 与 Token 不一致时拒绝冒用', async () => {
  const { resolveRequestUserId } = await loadRequestUserModule();
  assert.throws(
    () => resolveRequestUserId(12, 99),
    (error: unknown) => error instanceof Error && error.message === '登录身份与请求用户不一致'
  );
});
