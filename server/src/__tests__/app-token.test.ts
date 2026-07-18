import assert from 'node:assert/strict';
import test from 'node:test';
import jwt from 'jsonwebtoken';

type AppTokenModule = typeof import('../services/app-token');

async function loadAppTokenModule(): Promise<AppTokenModule> {
  try {
    return await import('../services/app-token');
  } catch {
    assert.fail('C 端 App Token 服务尚未实现');
  }
}

test('App Token 可以还原用户身份', async () => {
  const { signAppAccessToken, verifyAppAccessToken } = await loadAppTokenModule();
  const session = signAppAccessToken(12, 'test-app-secret');
  const payload = verifyAppAccessToken(session.accessToken, 'test-app-secret');

  assert.equal(payload.sub, '12');
  assert.equal(payload.type, 'app');
  assert.equal(session.expiresIn, 604800);
});

test('后台或其他类型 Token 不能冒充 App Token', async () => {
  const { verifyAppAccessToken } = await loadAppTokenModule();
  const token = jwt.sign({ sub: '12', type: 'admin' }, 'test-app-secret');

  assert.throws(() => verifyAppAccessToken(token, 'test-app-secret'));
});

test('Bearer Header 必须完整且非空', async () => {
  const { parseBearerToken } = await loadAppTokenModule();

  assert.equal(parseBearerToken('Bearer abc.def.ghi'), 'abc.def.ghi');
  assert.equal(parseBearerToken('Basic abc'), null);
  assert.equal(parseBearerToken('Bearer   '), null);
  assert.equal(parseBearerToken(undefined), null);
});

test('登录会话同时返回用户、Token 和过期时间', async () => {
  const module = (await loadAppTokenModule()) as AppTokenModule & {
    buildAppAuthSession?: <T extends { id: number }>(user: T, secret?: string) => {
      user: T;
      accessToken: string;
      expiresIn: number;
    };
  };

  assert.equal(typeof module.buildAppAuthSession, 'function');
  const user = { id: 12, nickname: '小周' };
  const session = module.buildAppAuthSession!(user, 'test-app-secret');

  assert.deepEqual(session.user, user);
  assert.equal(module.verifyAppAccessToken(session.accessToken, 'test-app-secret').sub, '12');
  assert.equal(session.expiresIn, 604800);
});
