# C 端鉴权基础设施与家庭菜篮迁移 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 登录签发真实 App JWT，C 端自动携带 Token，并让家庭菜篮接口只使用服务端认证身份。

**Architecture:** 服务端将 Token 签发/校验、HTTP 鉴权和兼容 `userId` 校验拆成三个小单元；登录接口只负责用户登录和返回会话。C 端把会话存储从 `auth.ts` 中拆出，统一请求层读取 Token；菜篮调用暂时保留旧 `userId` 参数，但服务端只接受与 Token 相同的值。

**Tech Stack:** Express 5、TypeScript、jsonwebtoken、Prisma、Node test runner、uni-app、Vue 3。

## Global Constraints

- Access Token 使用 `JWT_APP_SECRET`，有效期固定 7 天（604800 秒）。
- Token `sub` 是正整数用户 ID，payload 必须包含 `type: "app"`。
- 缺失、过期、签名错误、类型错误或禁用用户统一返回 HTTP 401。
- Token 与兼容 `userId` 不一致返回 HTTP 403。
- 本计划只迁移家庭菜篮；公开内容接口和页面视觉不变。
- 不修改数据库 Schema，不新增依赖，不修改 `backend/` 与 `admin-backend/`。
- 保留当前工作区已有修改，只触碰任务列出的文件。

---

## File Map

- Create `server/src/services/app-token.ts`: App JWT 签发、校验和 Bearer Header 解析。
- Create `server/src/http/middleware/app-auth.ts`: 校验 Token 和 ACTIVE 用户，写入 `req.appUser`。
- Create `server/src/http/request-user.ts`: Token 身份与旧 `userId` 的兼容校验。
- Create `server/src/__tests__/app-token.test.ts`: Token 服务测试。
- Create `server/src/__tests__/request-user.test.ts`: 兼容身份测试。
- Modify `server/src/routes/api/mobile.ts`: 登录返回真实会话，菜篮四个接口接入鉴权。
- Create `frontend/src/services/auth-session.ts`: C 端会话类型、存储、失效跳转锁。
- Modify `frontend/src/services/auth.ts`: 使用真实登录响应，兼容升级旧伪 Token。
- Modify `frontend/src/services/public-api.ts`: 自动 Authorization、401 处理和登录响应 DTO。
- Modify `docs/backend/api-spec.md`: 记录登录响应和菜篮鉴权要求。

---

### Task 1: App JWT 服务

**Files:**
- Create: `server/src/services/app-token.ts`
- Test: `server/src/__tests__/app-token.test.ts`

**Interfaces:**
- Consumes: `config.jwtAppSecret`。
- Produces: `signAppAccessToken(userId: number, secret?: string): { accessToken: string; expiresIn: number }`。
- Produces: `verifyAppAccessToken(token: string, secret?: string): AppJwtPayload`。
- Produces: `parseBearerToken(header: string | undefined): string | null`。

- [ ] **Step 1: Write the failing Token tests**

```ts
import assert from 'node:assert/strict';
import test from 'node:test';
import jwt from 'jsonwebtoken';

import {
  parseBearerToken,
  signAppAccessToken,
  verifyAppAccessToken
} from '../services/app-token';

test('App Token 可以还原用户身份', () => {
  const session = signAppAccessToken(12, 'test-app-secret');
  const payload = verifyAppAccessToken(session.accessToken, 'test-app-secret');
  assert.equal(payload.sub, '12');
  assert.equal(payload.type, 'app');
  assert.equal(session.expiresIn, 604800);
});

test('后台或其他类型 Token 不能冒充 App Token', () => {
  const token = jwt.sign({ sub: '12', type: 'admin' }, 'test-app-secret');
  assert.throws(() => verifyAppAccessToken(token, 'test-app-secret'));
});

test('Bearer Header 必须完整且非空', () => {
  assert.equal(parseBearerToken('Bearer abc.def.ghi'), 'abc.def.ghi');
  assert.equal(parseBearerToken('Basic abc'), null);
  assert.equal(parseBearerToken('Bearer   '), null);
  assert.equal(parseBearerToken(undefined), null);
});
```

- [ ] **Step 2: Run tests and verify RED**

Run:

```bash
cd server
npx tsx --test src/__tests__/app-token.test.ts
```

Expected: FAIL because `services/app-token` does not exist.

- [ ] **Step 3: Implement the minimal Token service**

```ts
import jwt from 'jsonwebtoken';

import { config } from '../config';

export const APP_ACCESS_TOKEN_EXPIRES_IN = 60 * 60 * 24 * 7;

export type AppJwtPayload = {
  sub: string;
  type: 'app';
};

export const signAppAccessToken = (userId: number, secret = config.jwtAppSecret) => ({
  accessToken: jwt.sign(
    { sub: String(userId), type: 'app' } satisfies AppJwtPayload,
    secret,
    { expiresIn: APP_ACCESS_TOKEN_EXPIRES_IN }
  ),
  expiresIn: APP_ACCESS_TOKEN_EXPIRES_IN
});

export const verifyAppAccessToken = (token: string, secret = config.jwtAppSecret): AppJwtPayload => {
  const payload = jwt.verify(token, secret) as Partial<AppJwtPayload>;
  const userId = Number(payload.sub);
  if (payload.type !== 'app' || !Number.isInteger(userId) || userId <= 0) {
    throw new Error('invalid app token');
  }
  return { sub: String(userId), type: 'app' };
};

export const parseBearerToken = (header: string | undefined) => {
  if (!header?.toLowerCase().startsWith('bearer ')) return null;
  const token = header.slice('bearer '.length).trim();
  return token || null;
};
```

- [ ] **Step 4: Run Token tests and verify GREEN**

Run: `cd server && npx tsx --test src/__tests__/app-token.test.ts`  
Expected: 3 tests PASS.

- [ ] **Step 5: Commit Token service**

```bash
git add server/src/services/app-token.ts server/src/__tests__/app-token.test.ts
git commit -m "feat: add C-end app token service"
```

---

### Task 2: 服务端认证身份与兼容校验

**Files:**
- Create: `server/src/http/middleware/app-auth.ts`
- Create: `server/src/http/request-user.ts`
- Test: `server/src/__tests__/request-user.test.ts`

**Interfaces:**
- Consumes: `parseBearerToken()`、`verifyAppAccessToken()` 和 `prisma.user`。
- Produces: Express `req.appUser?: { id: number }`。
- Produces: `requireAppAuth(req, res, next): Promise<void>`。
- Produces: `resolveRequestUserId(authenticatedUserId: number, legacyUserId?: number): number`。

- [ ] **Step 1: Write failing compatibility tests**

```ts
import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveRequestUserId } from '../http/request-user';

test('没有旧 userId 时使用 Token 用户', () => {
  assert.equal(resolveRequestUserId(12), 12);
});

test('旧 userId 与 Token 一致时保持兼容', () => {
  assert.equal(resolveRequestUserId(12, 12), 12);
});

test('旧 userId 与 Token 不一致时拒绝冒用', () => {
  assert.throws(
    () => resolveRequestUserId(12, 99),
    (error: unknown) => error instanceof Error && error.message === '登录身份与请求用户不一致'
  );
});
```

- [ ] **Step 2: Run tests and verify RED**

Run: `cd server && npx tsx --test src/__tests__/request-user.test.ts`  
Expected: FAIL because `http/request-user` does not exist.

- [ ] **Step 3: Implement compatibility resolver**

```ts
import { HttpError } from './errors';

export const resolveRequestUserId = (authenticatedUserId: number, legacyUserId?: number) => {
  if (legacyUserId !== undefined && legacyUserId !== authenticatedUserId) {
    throw new HttpError('登录身份与请求用户不一致', 403, 403);
  }
  return authenticatedUserId;
};
```

- [ ] **Step 4: Implement App auth middleware**

```ts
import type { NextFunction, Request, Response } from 'express';

import { prisma } from '../../prisma';
import { parseBearerToken, verifyAppAccessToken } from '../../services/app-token';
import { fail } from '../response';

declare module 'express-serve-static-core' {
  interface Request {
    appUser?: { id: number };
  }
}

export const requireAppAuth = async (req: Request, res: Response, next: NextFunction) => {
  const token = parseBearerToken(req.header('authorization'));
  if (!token) {
    res.status(401).json(fail(401, 'unauthorized'));
    return;
  }
  try {
    const payload = verifyAppAccessToken(token);
    const id = Number(payload.sub);
    const user = await prisma.user.findFirst({
      where: { id, deletedAt: null, status: 'ACTIVE' },
      select: { id: true }
    });
    if (!user) throw new Error('inactive app user');
    req.appUser = user;
    next();
  } catch {
    res.status(401).json(fail(401, 'unauthorized'));
  }
};
```

- [ ] **Step 5: Run tests and build**

Run:

```bash
cd server
npx tsx --test src/__tests__/request-user.test.ts
npm run build
```

Expected: 3 tests PASS and TypeScript build PASS.

- [ ] **Step 6: Commit identity infrastructure**

```bash
git add server/src/http/middleware/app-auth.ts server/src/http/request-user.ts server/src/__tests__/request-user.test.ts
git commit -m "feat: add C-end auth middleware"
```

---

### Task 3: 登录返回真实会话

**Files:**
- Modify: `server/src/routes/api/mobile.ts:265-292`

**Interfaces:**
- Consumes: `signAppAccessToken(user.id)`。
- Produces: `{ user, accessToken, tokenType: 'Bearer', expiresIn }`。

- [ ] **Step 1: Add a failing login response assertion**

在 `server/src/__tests__/app-token.test.ts` 增加纯映射测试所需导出：

```ts
import { buildAppAuthSession } from '../services/app-token';

test('登录会话响应包含用户和 Bearer Token 元数据', () => {
  const session = buildAppAuthSession({ id: 12, phone: '13800000000' }, 'test-app-secret');
  assert.equal(session.user.id, 12);
  assert.equal(session.tokenType, 'Bearer');
  assert.equal(session.expiresIn, 604800);
  assert.ok(session.accessToken);
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `cd server && npx tsx --test src/__tests__/app-token.test.ts`  
Expected: FAIL because `buildAppAuthSession` is not exported.

- [ ] **Step 3: Add the session builder and update login route**

在 `server/src/services/app-token.ts` 增加：

```ts
export const buildAppAuthSession = <TUser extends { id: number }>(user: TUser, secret = config.jwtAppSecret) => {
  const token = signAppAccessToken(user.id, secret);
  return { user, ...token, tokenType: 'Bearer' as const };
};
```

在登录路由将 `res.json(ok(user))` 替换为：

```ts
res.json(ok(buildAppAuthSession(user)));
```

- [ ] **Step 4: Run tests and build**

Run:

```bash
cd server
npx tsx --test src/__tests__/app-token.test.ts
npm run build
```

Expected: all App Token tests PASS and build PASS.

- [ ] **Step 5: Commit login session**

```bash
git add server/src/services/app-token.ts server/src/routes/api/mobile.ts server/src/__tests__/app-token.test.ts
git commit -m "feat: return JWT from C-end login"
```

---

### Task 4: 家庭菜篮使用 Token 身份

**Files:**
- Modify: `server/src/routes/api/mobile.ts:923-1070`
- Create: `server/src/__tests__/basket-auth-routing.test.ts`

**Interfaces:**
- Consumes: `requireAppAuth`、`resolveRequestUserId` 和已有 `buildBasketListWhere`。
- Produces: 四个受保护菜篮接口；客户端 `userId` 仅作兼容一致性校验。

- [ ] **Step 1: Write a failing route protection test**

```ts
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import test from 'node:test';

import { createApp } from '../app';

test('家庭菜篮缺少 App Token 时返回 401', async () => {
  const server = createApp().listen(0);
  try {
    const address = server.address() as AddressInfo;
    const response = await fetch(`http://127.0.0.1:${address.port}/api/mobile/basket-items`);
    assert.equal(response.status, 401);
    const body = await response.json() as { code: number };
    assert.equal(body.code, 401);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
});
```

- [ ] **Step 2: Run test and verify RED**

Run: `cd server && npx tsx --test src/__tests__/basket-auth-routing.test.ts`  
Expected: FAIL because the current route returns 400 instead of 401.

- [ ] **Step 3: Protect basket routes and make legacy userId optional**

对四个现有路由签名执行以下精确替换，路由函数体保持原样：

```ts
apiMobileRouter.get('/basket-items', async (req, res) => {
// 替换为
apiMobileRouter.get('/basket-items', requireAppAuth, async (req, res) => {

apiMobileRouter.post('/basket-items', async (req, res) => {
// 替换为
apiMobileRouter.post('/basket-items', requireAppAuth, async (req, res) => {

apiMobileRouter.put('/basket-items/:id', async (req, res) => {
// 替换为
apiMobileRouter.put('/basket-items/:id', requireAppAuth, async (req, res) => {

apiMobileRouter.delete('/basket-items/:id', async (req, res) => {
// 替换为
apiMobileRouter.delete('/basket-items/:id', requireAppAuth, async (req, res) => {
```

把各 schema 的 `userId` 改为 optional，并在解析后统一取得：

```ts
const userId = resolveRequestUserId(req.appUser!.id, parsed.data.userId);
```

路由中的 `parsed.data.userId` 全部替换为 `userId`。DELETE 不再复用必填 `userIdSchema`，改为：

```ts
const parsed = z.object({ userId: z.coerce.number().int().positive().optional() }).safeParse(req.body);
```

- [ ] **Step 4: Run basket tests and server build**

Run:

```bash
cd server
npx tsx --test src/__tests__/basket-access.test.ts src/__tests__/request-user.test.ts src/__tests__/basket-auth-routing.test.ts
npm run build
```

Expected: all tests PASS and build PASS.

- [ ] **Step 5: Commit basket auth migration**

```bash
git add server/src/routes/api/mobile.ts server/src/__tests__/basket-auth-routing.test.ts
git commit -m "feat: protect family basket with app auth"
```

---

### Task 5: C 端保存并自动携带真实 Token

**Files:**
- Create: `frontend/src/services/auth-session.ts`
- Modify: `frontend/src/services/auth.ts:1-125`
- Modify: `frontend/src/services/public-api.ts:1-80,427-447`

**Interfaces:**
- Produces: `AuthUser`、`loadAuthUser()`、`saveAuthUser()`、`clearAuthUser()`、`getAuthToken()`、`handleAuthExpired()`。
- Consumes: `ApiMobileAuthSession` returned by `loginMobileAuth()`。

- [ ] **Step 1: Create the independent session store**

```ts
export interface AuthUser {
  id?: number;
  phone: string;
  nickname: string;
  token: string;
}

const AUTH_STORAGE_KEY = 'recipe-app-auth-user';
let isRedirectingToLogin = false;

export const loadAuthUser = (): AuthUser | null => {
  const value = uni.getStorageSync(AUTH_STORAGE_KEY) as unknown;
  if (!value || typeof value !== 'object') return null;
  const user = value as Partial<AuthUser>;
  return typeof user.phone === 'string' && typeof user.nickname === 'string' && typeof user.token === 'string'
    ? user as AuthUser
    : null;
};

export const saveAuthUser = (user: AuthUser) => uni.setStorageSync(AUTH_STORAGE_KEY, user);
export const clearAuthUser = () => uni.removeStorageSync(AUTH_STORAGE_KEY);
export const getAuthToken = () => loadAuthUser()?.token || '';

export const handleAuthExpired = () => {
  clearAuthUser();
  if (isRedirectingToLogin) return;
  isRedirectingToLogin = true;
  uni.reLaunch({
    url: '/pages/login/index',
    complete: () => { isRedirectingToLogin = false; }
  });
};
```

迁移 `auth.ts` 现有兼容解包逻辑到该文件时必须原样保留，避免旧存储格式升级失败；上方代码只描述最终接口，不允许删除 `unwrapStoredValue()` 行为。

- [ ] **Step 2: Update login DTO and request headers**

在 `public-api.ts` 增加：

```ts
import { getAuthToken, handleAuthExpired } from './auth-session';

export type ApiMobileAuthSession = {
  user: ApiMobileUser;
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
};
```

`RequestOptions` 增加 `auth?: boolean`。请求头改为：

```ts
const token = options.auth === false ? '' : getAuthToken();
const header = {
  ...options.header,
  ...(token ? { Authorization: `Bearer ${token}` } : {})
};
```

保留 `statusCode`，当 HTTP 状态或业务 code 为 401 时执行 `handleAuthExpired()` 后抛出 `ApiError`。登录请求设置 `auth: false`。

- [ ] **Step 3: Update backend sync and remove fake token**

`auth.ts` 从 `auth-session.ts` 导入并重新导出会话 API。同步条件改为：

```ts
const hasRealToken = user.token.split('.').length === 3;
if (user.id && hasRealToken) return user;

const session = await loginMobileAuth({ phone: user.phone, nickname: user.nickname });
const nextUser: AuthUser = {
  ...user,
  id: session.user.id,
  nickname: session.user.nickname || user.nickname,
  token: session.accessToken
};
```

删除 `mobile-user-${remoteUser.id}` 伪 Token。

- [ ] **Step 4: Run C-end type check**

Run: `cd frontend && npm run type-check`  
Expected: PASS;允许现有 npm 配置警告，不允许 TypeScript 错误。

- [ ] **Step 5: Commit C-end session integration**

```bash
git add frontend/src/services/auth-session.ts frontend/src/services/auth.ts frontend/src/services/public-api.ts
git commit -m "feat: attach C-end auth token to requests"
```

---

### Task 6: 文档与全量验证

**Files:**
- Modify: `docs/backend/api-spec.md`
- Modify: `docs/app/c-end-stage-1-data-contract.md`

**Interfaces:**
- Documents login response, 401/403 semantics, protected basket endpoints and remaining migration scope.

- [ ] **Step 1: Update API documentation**

在 C 端接口章节明确写入：

```markdown
- `POST /api/mobile/auth/login` 返回 `{ user, accessToken, tokenType, expiresIn }`。
- 以下接口必须携带 `Authorization: Bearer <accessToken>`：
  - `GET/POST /api/mobile/basket-items`
  - `PUT/DELETE /api/mobile/basket-items/:id`
- Token 缺失或失效返回 401；无家庭权限返回 403。
```

在阶段 1 数据契约中将“真实 C 端鉴权”标记为“基础设施与菜篮已完成；家庭、收藏、历史、资料待迁移”。

- [ ] **Step 2: Run full verification**

```bash
cd server
npx tsx --test src/__tests__/*.test.ts
npm run build

cd ../frontend
npm run type-check

cd ..
git diff --check
```

Expected: all server tests PASS, server build PASS, frontend type check PASS, diff check has no output.

- [ ] **Step 3: Manual smoke test**

```bash
cd server && npm run dev
cd frontend && npm run dev:h5
```

Verify:

1. 未登录首页可打开。
2. 登录后本地保存 JWT 格式 Token。
3. 登录用户可读取个人和所属家庭菜篮。
4. 删除 Authorization 后菜篮返回 401 并跳回登录。
5. 把请求中的旧 `userId` 改成其他用户后返回 403。

- [ ] **Step 4: Commit documentation**

```bash
git add docs/backend/api-spec.md docs/app/c-end-stage-1-data-contract.md
git commit -m "docs: document C-end basket authentication"
```

---

## Follow-up Plans

该计划通过后，按相同模式分别生成并执行：

1. 家庭与邀请接口鉴权迁移。
2. 收藏与浏览历史鉴权迁移。
3. 个人资料读取与更新鉴权迁移。
4. 移除全部兼容 `userId` 参数。
