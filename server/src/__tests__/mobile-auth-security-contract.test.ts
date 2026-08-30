import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const mobileRoute = readFileSync(resolve('src/routes/api/mobile.ts'), 'utf8');
const adminRoute = readFileSync(resolve('src/routes/admin/users.ts'), 'utf8');

test('mobile login requires and compares a password without creating users', () => {
  const loginBlock = mobileRoute.slice(
    mobileRoute.indexOf("apiMobileRouter.post('/auth/login'"),
    mobileRoute.indexOf("apiMobileRouter.get('/home'")
  );

  assert.match(loginBlock, /password:/);
  assert.match(loginBlock, /compareMobilePassword/);
  assert.match(loginBlock, /findFirst|findUnique/);
  assert.doesNotMatch(loginBlock, /upsert|create:/);
  assert.match(loginBlock, /手机号或密码错误/);
  assert.match(loginBlock, /账号尚未设置密码，请联系管理员/);
});

test('admin create and update hash credentials but never serialize hashes', () => {
  assert.match(adminRoute, /hashMobilePassword/);
  assert.match(adminRoute, /passwordHash/);
  assert.match(adminRoute, /hasPassword:\s*Boolean\(user\.passwordHash\)/);

  const formatter = adminRoute.slice(
    adminRoute.indexOf('const formatUser'),
    adminRoute.indexOf('export const adminUsersRouter')
  );
  assert.doesNotMatch(formatter, /passwordHash:/);
});
