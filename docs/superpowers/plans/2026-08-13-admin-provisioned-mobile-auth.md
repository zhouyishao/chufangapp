# Admin-Provisioned Mobile Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the mobile account-takeover vulnerability by requiring a backend-provisioned phone/password account, while keeping SMS registration and password recovery explicitly unavailable until a paid SMS provider is introduced.

**Architecture:** Keep `User.passwordHash` as the sole mobile password credential and centralize bcrypt hashing/comparison in a focused service. Admin create/update routes provision or reset the credential; the mobile login route performs lookup-only authentication and issues the existing seven-day App JWT. The C app sends the password once at login, never silently re-authenticates from a stored phone number, and replaces fake registration/recovery flows with an honest unavailable state.

**Tech Stack:** Express 5, TypeScript, Prisma/PostgreSQL, Zod, bcryptjs, React/Ant Design admin, uni-app/Vue 3 C app, Node test runner, source-contract tests, built-in browser regression.

## Global Constraints

- No SMS, email, OAuth, fixed verification code, or local-only password flow in this phase.
- New admin-provisioned users require an 11-digit mainland mobile number and a password of at least 8 characters containing both a letter and a digit.
- bcrypt cost factor is exactly `10`; plaintext passwords and `passwordHash` must never be returned by APIs or logged.
- Unknown phone and incorrect password both return HTTP 401 with `手机号或密码错误`.
- Existing users with no password hash return HTTP 403 with `账号尚未设置密码，请联系管理员`.
- Disabled users return HTTP 403 and receive no App JWT.
- Editing a user with an omitted or blank password preserves the old hash; a valid non-blank password replaces it.
- Registration and forgot-password pages say the feature is unavailable and direct users to an administrator.
- Preserve all unrelated dirty-worktree changes and do not edit legacy `admin-backend/` or `backend/`.
- Follow `/Users/oooz/Desktop/Z_ou/chufangapp/AGENTS.md`, project docs, and existing C-app typography/safe-area tokens.

---

## File Map

- Create `server/src/services/mobile-password.ts`: validate, hash, and compare mobile account passwords.
- Create `server/src/__tests__/mobile-password-auth.test.ts`: executable password-service tests.
- Create `server/src/__tests__/mobile-auth-security-contract.test.ts`: route/admin response security contract.
- Create `frontend/tests/mobile-auth-security-contract.test.mjs`: C-app login and unavailable-flow contract.
- Create `admin-frontend/src/app/pages/users-password-contract.test.mjs`: admin create/reset UI contract.
- Modify `server/src/routes/api/mobile.ts`: replace phone/openid upsert with phone/password authentication.
- Modify `server/src/routes/admin/users.ts`: require credentials on create, support password reset on update, expose only `hasPassword`.
- Modify `server/prisma/seed.ts`: assign a development-only initial password to `13956785678`.
- Modify `frontend/src/services/public-api.ts`: require `{ phone, password }` for mobile login.
- Modify `frontend/src/services/auth.ts`: add explicit credential login and remove local register/reset credential helpers.
- Modify `frontend/src/pages/phone-login/index.vue`: submit the real password with loading/error handling.
- Modify `frontend/src/pages/register/index.vue`: show registration unavailable.
- Modify `frontend/src/pages/forgot-password/index.vue`: show password recovery unavailable.
- Modify `admin-frontend/src/app/types.ts`: add `hasPassword` to the sanitized user shape.
- Modify `admin-frontend/src/app/pages/UsersPage.tsx`: require an initial password and allow an optional reset password while editing.
- Modify `docs/backend/api-spec.md`, `docs/backend/auth.md`, `docs/backend/database-schema.md`: document the implemented contract.
- Modify `docs/testing/2026-08-12-e2e-full-acceptance-report.md`: record evidence for BUG-001 and BUG-007.

---

### Task 1: Lock the Security Contract with Failing Tests

**Files:**
- Create: `server/src/__tests__/mobile-auth-security-contract.test.ts`
- Create: `frontend/tests/mobile-auth-security-contract.test.mjs`
- Create: `admin-frontend/src/app/pages/users-password-contract.test.mjs`

**Interfaces:**
- Consumes: the current source files only.
- Produces: red tests that name every security boundary before implementation.

- [ ] **Step 1: Write the backend failing contract test**

```ts
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const mobileRoute = await readFile(new URL('../routes/api/mobile.ts', import.meta.url), 'utf8');
const adminRoute = await readFile(new URL('../routes/admin/users.ts', import.meta.url), 'utf8');

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
  const formatter = adminRoute.slice(adminRoute.indexOf('const formatUser'), adminRoute.indexOf('export const adminUsersRouter'));
  assert.doesNotMatch(formatter, /passwordHash:/);
});
```

- [ ] **Step 2: Write the C-app failing contract test**

```js
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
```

- [ ] **Step 3: Write the admin failing contract test**

```js
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const usersPage = await readFile(new URL('./UsersPage.tsx', import.meta.url), 'utf8');

test('admin create requires an initial password and edit can reset it', () => {
  assert.match(usersPage, /初始密码/);
  assert.match(usersPage, /重置密码（留空不修改）/);
  assert.doesNotMatch(usersPage, /drawerMode === 'edit' \|\| !payload\.password/);
  assert.doesNotMatch(usersPage, /delete password from payload on edit/);
});
```

- [ ] **Step 4: Run the three tests and verify RED**

Run:

```bash
cd server && npx tsx --test src/__tests__/mobile-auth-security-contract.test.ts
cd frontend && node --test tests/mobile-auth-security-contract.test.mjs
cd admin-frontend && node --test src/app/pages/users-password-contract.test.mjs
```

Expected: each suite fails on the current insecure behavior, not on a syntax or test-runner error.

---

### Task 2: Implement Backend Password Authentication

**Files:**
- Create: `server/src/services/mobile-password.ts`
- Create: `server/src/__tests__/mobile-password-auth.test.ts`
- Modify: `server/src/routes/api/mobile.ts`

**Interfaces:**
- Produces: `isValidMobilePassword(password: string): boolean`, `hashMobilePassword(password: string): Promise<string>`, `compareMobilePassword(password: string, hash: string): Promise<boolean>`.
- Consumes: `buildAppAuthSession(user)` and `prisma.user.findFirst`.

- [ ] **Step 1: Add a failing behavior test for the password service**

```ts
import assert from 'node:assert/strict';
import test from 'node:test';
import { compareMobilePassword, hashMobilePassword, isValidMobilePassword } from '../services/mobile-password';

test('mobile password rule requires 8+ chars with a letter and digit', () => {
  assert.equal(isValidMobilePassword('abcdefg1'), true);
  assert.equal(isValidMobilePassword('abcdefgh'), false);
  assert.equal(isValidMobilePassword('12345678'), false);
  assert.equal(isValidMobilePassword('abc123'), false);
});

test('mobile passwords are bcrypt hashed and compared', async () => {
  const hash = await hashMobilePassword('secure123');
  assert.notEqual(hash, 'secure123');
  assert.equal(await compareMobilePassword('secure123', hash), true);
  assert.equal(await compareMobilePassword('wrong123', hash), false);
});
```

- [ ] **Step 2: Run the service test and verify RED**

Run: `cd server && npx tsx --test src/__tests__/mobile-password-auth.test.ts`

Expected: FAIL because `../services/mobile-password` does not exist.

- [ ] **Step 3: Implement the password service**

```ts
import bcrypt from 'bcryptjs';

export const MOBILE_PASSWORD_BCRYPT_COST = 10;
export const isValidMobilePassword = (password: string) =>
  password.length >= 8 && password.length <= 72 && /[A-Za-z]/.test(password) && /\d/.test(password);
export const hashMobilePassword = (password: string) => bcrypt.hash(password, MOBILE_PASSWORD_BCRYPT_COST);
export const compareMobilePassword = (password: string, passwordHash: string) => bcrypt.compare(password, passwordHash);
```

- [ ] **Step 4: Replace mobile login upsert with lookup and verification**

Use a Zod request of `{ phone: /^1[3-9]\d{9}$/, password: 8..72 }`, then:

```ts
const user = await prisma.user.findFirst({
  where: { phone: parsed.data.phone, deletedAt: null }
});
if (!user) throw new HttpError('手机号或密码错误', 401, 401);
if (user.status === 'DISABLED') throw new HttpError('该账户已被禁用，无法登录，请联系管理员。', 403, 403);
if (!user.passwordHash) throw new HttpError('账号尚未设置密码，请联系管理员', 403, 403);
if (!(await compareMobilePassword(parsed.data.password, user.passwordHash))) {
  throw new HttpError('手机号或密码错误', 401, 401);
}
await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
res.json(ok(buildAppAuthSession(user)));
```

- [ ] **Step 5: Run backend tests and build GREEN**

Run:

```bash
cd server && npx tsx --test src/__tests__/mobile-password-auth.test.ts src/__tests__/mobile-auth-security-contract.test.ts src/__tests__/app-token.test.ts
cd server && npm run build
```

Expected: all named tests pass; TypeScript build exits 0.

---

### Task 3: Make Admin Provisioning and Reset Complete

**Files:**
- Modify: `server/src/routes/admin/users.ts`
- Modify: `admin-frontend/src/app/types.ts`
- Modify: `admin-frontend/src/app/pages/UsersPage.tsx`

**Interfaces:**
- Consumes: password-service functions from Task 2.
- Produces: admin create/update behavior and sanitized `hasPassword: boolean` response field.

- [ ] **Step 1: Tighten admin request schemas**

Set create `phone` and `password` as required, and update `password` as optional/blank:

```ts
phone: z.string().trim().regex(/^1[3-9]\d{9}$/, '手机号格式不正确'),
password: z.string().min(8).max(72).refine(isValidMobilePassword, '密码至少 8 位且必须包含字母和数字')
```

```ts
password: z.string().max(72).refine((value) => value === '' || isValidMobilePassword(value), '密码至少 8 位且必须包含字母和数字').optional()
```

- [ ] **Step 2: Hash on create/reset and preserve on blank update**

Create uses `await hashMobilePassword(password)`. Update destructures `password` and spreads only a non-blank hash:

```ts
const passwordUpdate = password?.trim()
  ? { passwordHash: await hashMobilePassword(password) }
  : {};
```

- [ ] **Step 3: Sanitize and expose password status**

Add only:

```ts
hasPassword: Boolean(user.passwordHash),
```

to `formatUser`, and add `hasPassword: boolean` to `AdminUserListItem`.

- [ ] **Step 4: Update admin form validation and reset UI**

Require phone/password on create, validate the same 8-character letter+digit rule, render the password input in both create and edit modes, and omit the field only when edit input is blank. Use labels `初始密码` and `重置密码（留空不修改）`.

- [ ] **Step 5: Run the admin contract and build GREEN**

Run:

```bash
cd admin-frontend && node --test src/app/pages/users-password-contract.test.mjs
cd admin-frontend && npm run build
cd server && npx tsx --test src/__tests__/mobile-auth-security-contract.test.ts
```

Expected: contract tests pass; admin and server builds exit 0.

---

### Task 4: Connect the C App to Real Password Login

**Files:**
- Modify: `frontend/src/services/public-api.ts`
- Modify: `frontend/src/services/auth.ts`
- Modify: `frontend/src/pages/phone-login/index.vue`
- Modify: `frontend/src/pages/register/index.vue`
- Modify: `frontend/src/pages/forgot-password/index.vue`

**Interfaces:**
- Consumes: `POST /api/mobile/auth/login { phone, password }`.
- Produces: `loginAuthUser(phone: string, password: string): Promise<AuthUser>` and a non-refreshing `syncAuthUserWithBackend` guard for existing callers.

- [ ] **Step 1: Make the API payload require phone/password**

```ts
export const loginMobileAuth = async (payload: { phone: string; password: string }) =>
  request<ApiMobileAuthSession>('/mobile/auth/login', { method: 'POST', data: payload, auth: false, handleAuthExpired: false });
```

- [ ] **Step 2: Add explicit login and remove implicit phone re-authentication**

```ts
export const loginAuthUser = async (phone: string, password: string) => {
  const normalizedPhone = phone.trim();
  const session = await loginMobileAuth({ phone: normalizedPhone, password });
  const user: AuthUser = {
    id: session.user.id,
    phone: normalizedPhone,
    nickname: session.user.nickname || maskPhone(normalizedPhone),
    token: session.accessToken
  };
  saveAuthUser(user);
  return user;
};

export const syncAuthUserWithBackend = async (user: AuthUser | null = loadAuthUser()) => {
  if (!user?.id || user.token.split('.').length !== 3) return null;
  return user;
};
```

Delete `registerAuthAccount`, `resetAuthPassword`, and any local password object creation.

- [ ] **Step 3: Update login page behavior**

Use `isSubmitting` to guard repeat taps, call `loginAuthUser(phone.value, password.value)`, display `ApiError.message` via `uni.showToast`, and navigate only after success. Bind `:loading` and `:disabled` on the button.

- [ ] **Step 4: Replace fake registration/recovery flows**

Each page keeps its safe-area top bar and legal links but displays a concise card:

```vue
<text class="title">暂未开放</text>
<text class="desc">当前由管理员统一开通账号，请联系管理员获取手机号和初始密码。</text>
<button class="primary-button" @tap="goToPhoneLogin">返回账号登录</button>
```

The forgot-password copy says the administrator can reset the password. Remove all fake code inputs, timers, and success toasts.

- [ ] **Step 5: Run the frontend contract, type-check, and build GREEN**

Run:

```bash
cd frontend && node --test tests/mobile-auth-security-contract.test.mjs
cd frontend && npm run type-check
cd frontend && npm run build
```

Expected: contract passes; type-check and build exit 0.

---

### Task 5: Seed and Document the Development Account

**Files:**
- Modify: `server/prisma/seed.ts`
- Modify: `docs/backend/api-spec.md`
- Modify: `docs/backend/auth.md`
- Modify: `docs/backend/database-schema.md`

**Interfaces:**
- Produces: seed account `13956785678` with development password `user12345` stored only as bcrypt hash.

- [ ] **Step 1: Hash the development password once in seed**

```ts
const mobileTestPasswordHash = await bcrypt.hash('user12345', 10);
```

Set `passwordHash: mobileTestPasswordHash` in both the create and update branches for phone `13956785678` only. Do not print the plaintext password.

- [ ] **Step 2: Document the exact API and phased availability**

Document request/response errors, admin create/reset rules, nullable historical hashes, and that SMS registration/recovery is not currently available. Mark `13956785678 / user12345` explicitly as a local-development/acceptance credential, never a production default.

- [ ] **Step 3: Build and seed the local database**

Run:

```bash
cd server && npm run build
cd server && npm run prisma:seed
```

Expected: build and seed succeed without destructive schema operations.

---

### Task 6: End-to-End Verification and Report Update

**Files:**
- Modify: `docs/testing/2026-08-12-e2e-full-acceptance-report.md`

**Interfaces:**
- Consumes: running server, admin, and C-app H5.
- Produces: browser evidence and updated BUG-001/BUG-007 status.

- [ ] **Step 1: Run the three applications**

```bash
cd server && npm run dev
cd admin-frontend && npm run dev
cd frontend && npm run dev:h5
```

Expected: API on 3002, admin on 5174, H5 on 5175 (or the existing configured ports shown by each process).

- [ ] **Step 2: Verify backend error matrix directly**

Use HTTP requests without logging passwords and confirm: wrong password 401/no token; unknown phone 401/no new user; null hash 403; disabled account 403; correct password 200/App JWT.

- [ ] **Step 3: Verify admin provision/reset in the built-in browser**

Create a temporary account with phone and initial password; confirm the list shows password set. Edit with blank password and verify the old password still works. Reset to a new password and verify the old one fails while the new one succeeds.

- [ ] **Step 4: Verify C-app behavior in the built-in browser**

Confirm wrong password stays on login and shows the backend error; correct password reaches Mine and protected data; Register and Forgot Password both show `暂未开放` with no code-success flow.

- [ ] **Step 5: Run the final regression bundle**

```bash
cd server && npx tsx --test src/__tests__/mobile-password-auth.test.ts src/__tests__/mobile-auth-security-contract.test.ts src/__tests__/app-token.test.ts
cd server && npm run build
cd admin-frontend && node --test src/app/pages/users-password-contract.test.mjs && npm run build
cd frontend && node --test tests/mobile-auth-security-contract.test.mjs && npm run type-check && npm run build
```

Expected: every command exits 0.

- [ ] **Step 6: Update the acceptance report**

Add the verification date, changed files, automated command results, and browser observations under BUG-001 and BUG-007. Mark them fixed only if the entire matrix above passes; otherwise leave them open with the exact failing evidence.

---

## Self-Review Result

- Spec coverage: all authentication, admin provisioning/reset, historical-account, disabled-account, no-enumeration, C-app unavailable-flow, seed, documentation, and browser-acceptance requirements map to Tasks 1–6.
- Placeholder scan: no deferred implementation markers are present; every test/build/browser step includes an exact target and expected result.
- Type consistency: the plan consistently uses `loginAuthUser(phone, password)`, `hashMobilePassword`, `compareMobilePassword`, `isValidMobilePassword`, and `hasPassword` across server, admin, C app, and tests.
