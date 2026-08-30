import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const loginPage = await readFile(new URL('../src/pages/phone-login/index.vue', import.meta.url), 'utf8');
const authService = await readFile(new URL('../src/services/auth.ts', import.meta.url), 'utf8');
const registerPage = await readFile(new URL('../src/pages/register/index.vue', import.meta.url), 'utf8');
const forgotPage = await readFile(new URL('../src/pages/forgot-password/index.vue', import.meta.url), 'utf8');

test('phone login submits the entered password and guards repeated taps', () => {
  assert.match(loginPage, /loginAuthUser\(phone\.value, password\.value\)/);
  assert.match(loginPage, /isSubmitting/);
  assert.doesNotMatch(loginPage, /createAuthUser/);
});

test('stored phone identity cannot silently obtain a new token', () => {
  assert.doesNotMatch(authService, /loginMobileAuth\(\{\s*phone:\s*user\.phone/);
});

test('registration and recovery are explicitly unavailable', () => {
  assert.match(registerPage, /暂未开放/);
  assert.match(forgotPage, /暂未开放/);
  assert.doesNotMatch(registerPage, /验证码已发送|注册成功/);
  assert.doesNotMatch(forgotPage, /验证码已发送|密码已修改/);
});
