# Admin RBAC Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace mock administrator and role management with a real, immediately effective RBAC system enforced by both the Express API and React admin UI.

**Architecture:** Keep the existing `Admin → AdminRole → Role → RolePermission → Permission` schema and add only stable role/permission metadata plus last-login time. JWTs continue to contain identity only; a request-scoped access loader resolves the current active administrator, one active role, and permissions on every request. A centralized route-policy table maps live `/api/admin` requests to permission keys, while dedicated administrator and role routers own CRUD and safety invariants.

**Tech Stack:** Express 5, TypeScript, Prisma 7, PostgreSQL, bcryptjs, JWT, React 18, React Router, existing admin components, Node test runner, built-in browser.

## Global Constraints

- Do not modify `admin-backend/`, `backend/`, `.env`, or C-end code.
- Do not clear or destructively rewrite existing database records.
- Every administrator has exactly one active role in the MVP UI and API, while the existing many-to-many tables remain.
- JWT stores identity only; roles and permissions are reloaded per request so changes take effect immediately.
- The final authorization boundary is the server; front-end hiding is only an experience layer.
- Preserve at least one active `SUPER_ADMIN`; the current administrator cannot disable or delete themself.
- Passwords require at least 8 characters with a letter and digit, use bcrypt cost 10, and never enter responses or operation logs.
- Use HTTP 400 for invalid input, 401 for invalid/inactive identity, 403 for missing permission, 404 for missing resources, and 409 for business conflicts.
- Use TDD for every behavior change: write and run the failing test before production code.
- Do not use TypeScript `any`.

## File Structure

### Server

- `server/prisma/schema.prisma`: adds stable RBAC metadata and last-login field.
- `server/prisma/migrations/20260813160000_admin_rbac_foundation/migration.sql`: non-destructive backfill and constraints.
- `server/prisma/seed.ts`: idempotently seeds the permission catalog, three system roles, role permissions, and the seed administrator assignment.
- `server/src/security/admin-permissions.ts`: permission constants, catalog, role presets, and typed permission key.
- `server/src/security/admin-access.ts`: loads active administrator, single role, and effective permissions.
- `server/src/security/admin-route-policy.ts`: pure method/path-to-permission matching.
- `server/src/http/middleware/admin-auth.ts`: validates JWT and active administrator, exposes `req.adminAccess`.
- `server/src/http/middleware/admin-permission.ts`: checks one permission or wildcard.
- `server/src/services/admin-operation-log.ts`: sanitizes and writes RBAC mutation logs.
- `server/src/services/admin-rbac-guards.ts`: transactional self/last-super-admin/system-role invariants.
- `server/src/routes/admin/auth.ts`: login/profile return role and permissions; login updates last-login time.
- `server/src/routes/admin/admins.ts`: real administrator list and mutations.
- `server/src/routes/admin/roles.ts`: real role and permission catalog endpoints.
- `server/src/routes/admin/operation-logs.ts`: paginated read-only RBAC operation log endpoint.
- `server/src/app.ts`: mounts the new routers and centralized authorization policy.
- `server/src/__tests__/admin-rbac-*.test.ts`: schema, access, policies, CRUD, safety, and logging tests.

### Admin frontend

- `admin-frontend/src/app/types.ts`: RBAC DTOs and profile shape.
- `admin-frontend/src/app/api.ts`: administrator, role, permission, and profile requests.
- `admin-frontend/src/app/storage.ts`: validates and persists role/permission data.
- `admin-frontend/src/app/permissions.ts`: reads real permissions instead of returning `['*']`.
- `admin-frontend/src/app/navigation.ts`: maps navigation to canonical permission constants and filters empty parents.
- `admin-frontend/src/app/components/RequirePermission.tsx`: preserves direct-URL 403 behavior.
- `admin-frontend/src/app/components/PermissionGate.tsx`: hides or disables action controls.
- `admin-frontend/src/app/pages/SettingsPage.tsx`: real administrator management.
- `admin-frontend/src/app/pages/RolesPage.tsx`: real role list and permission tree.
- `admin-frontend/src/app/pages/SettingsLogsPage.tsx`: real read-only operation log list.
- `admin-frontend/src/app/pages/LoginPage.tsx`: stores the enriched login profile.
- `admin-frontend/src/app/pages/admin-rbac-*.test.mjs`: real-data and access contracts.

### Documentation

- `docs/backend/auth.md`, `docs/backend/api-spec.md`, `docs/backend/database-schema.md`: final RBAC contract.
- `docs/testing/2026-08-12-e2e-full-acceptance-report.md`: browser evidence and BUG-006/014 progress.

---

### Task 1: RBAC schema, migration, and canonical catalog

**Files:**
- Modify: `server/prisma/schema.prisma`
- Create: `server/prisma/migrations/20260813160000_admin_rbac_foundation/migration.sql`
- Create: `server/src/security/admin-permissions.ts`
- Modify: `server/prisma/seed.ts`
- Test: `server/src/__tests__/admin-rbac-schema-contract.test.ts`

**Interfaces:**
- Produces: `AdminPermissionKey`, `ADMIN_PERMISSION_CATALOG`, `SYSTEM_ROLE_PRESETS`.
- Produces schema fields: `Admin.lastLoginAt`, `Role.code`, `Role.isSystem`, `Permission.module`, `Permission.action`.

- [ ] **Step 1: Write the failing schema/catalog contract**

```ts
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { ADMIN_PERMISSION_CATALOG, SYSTEM_ROLE_PRESETS } from '../security/admin-permissions';

test('RBAC schema and migration are additive and catalog keys are unique', async () => {
  const schema = await readFile(new URL('../../prisma/schema.prisma', import.meta.url), 'utf8');
  const migration = await readFile(new URL('../../prisma/migrations/20260813160000_admin_rbac_foundation/migration.sql', import.meta.url), 'utf8');
  assert.match(schema, /lastLoginAt\s+DateTime\?/);
  assert.match(schema, /code\s+String\s+@unique/);
  assert.match(schema, /isSystem\s+Boolean/);
  assert.match(schema, /module\s+String/);
  assert.match(schema, /action\s+String/);
  assert.doesNotMatch(migration, /DROP TABLE|TRUNCATE/i);
  assert.equal(new Set(ADMIN_PERMISSION_CATALOG.map((item) => item.key)).size, ADMIN_PERMISSION_CATALOG.length);
  assert.deepEqual(SYSTEM_ROLE_PRESETS.map((role) => role.code), ['SUPER_ADMIN', 'CONTENT_OPERATOR', 'READ_ONLY']);
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `cd server && node --import tsx --test src/__tests__/admin-rbac-schema-contract.test.ts`

Expected: FAIL because `admin-permissions.ts` and migration fields do not exist.

- [ ] **Step 3: Add the schema and additive SQL migration**

Add these Prisma fields:

```prisma
model Admin {
  // existing fields
  lastLoginAt DateTime? @map("last_login_at")
}

model Role {
  // existing fields
  code     String  @unique @db.VarChar(64)
  isSystem Boolean @default(false) @map("is_system")
}

model Permission {
  // existing fields
  module String @db.VarChar(64)
  action String @db.VarChar(32)
}
```

Use this migration ordering so historical rows are backfilled before `NOT NULL`:

```sql
ALTER TABLE "admins" ADD COLUMN "last_login_at" TIMESTAMP(3);
ALTER TABLE "roles" ADD COLUMN "code" VARCHAR(64), ADD COLUMN "is_system" BOOLEAN NOT NULL DEFAULT false;
UPDATE "roles" SET "code" = CASE WHEN "name" = 'SUPER_ADMIN' THEN 'SUPER_ADMIN' ELSE 'LEGACY_' || "id"::text END WHERE "code" IS NULL;
ALTER TABLE "roles" ALTER COLUMN "code" SET NOT NULL;
CREATE UNIQUE INDEX "roles_code_key" ON "roles"("code");
ALTER TABLE "permissions" ADD COLUMN "module" VARCHAR(64), ADD COLUMN "action" VARCHAR(32);
UPDATE "permissions" SET "module" = split_part("key", ':', 1), "action" = regexp_replace("key", '^.*:', '') WHERE "module" IS NULL OR "action" IS NULL;
ALTER TABLE "permissions" ALTER COLUMN "module" SET NOT NULL, ALTER COLUMN "action" SET NOT NULL;
```

- [ ] **Step 4: Define the typed permission catalog and role presets**

The catalog must include view/create/update/delete/status/publish actions for currently live home, recipe, ingredient, beverage, taxonomy, user, family, audit, file, resource, comment, search, purchase, administrator, role, log, and base-settings surfaces. Use this structure:

```ts
export const ADMIN_PERMISSION_CATALOG = [
  { key: 'dashboard:view', name: '查看工作台', module: 'dashboard', action: 'view', sort: 10 },
  { key: 'content:recipe:view', name: '查看菜谱', module: 'content', action: 'view', sort: 100 },
  { key: 'content:recipe:create', name: '新增菜谱', module: 'content', action: 'create', sort: 101 },
  { key: 'content:recipe:update', name: '编辑菜谱', module: 'content', action: 'update', sort: 102 },
  { key: 'content:recipe:publish', name: '发布菜谱', module: 'content', action: 'publish', sort: 103 },
  { key: 'content:recipe:delete', name: '删除菜谱', module: 'content', action: 'delete', sort: 104 },
  { key: 'system:admin:view', name: '查看管理员', module: 'system', action: 'view', sort: 900 },
  { key: 'system:admin:manage', name: '管理管理员', module: 'system', action: 'manage', sort: 901 },
  { key: 'system:role:view', name: '查看角色', module: 'system', action: 'view', sort: 910 },
  { key: 'system:role:manage', name: '管理角色', module: 'system', action: 'manage', sort: 911 }
] as const;

export type AdminPermissionKey = (typeof ADMIN_PERMISSION_CATALOG)[number]['key'];

export const SYSTEM_ROLE_PRESETS = [
  { code: 'SUPER_ADMIN', name: '超级管理员', description: '拥有全部后台权限', permissions: ['*'] as const },
  { code: 'CONTENT_OPERATOR', name: '内容运营', description: '管理首页、内容、用户和审核', permissions: ADMIN_PERMISSION_CATALOG.filter((item) => !item.key.startsWith('system:')).map((item) => item.key) },
  { code: 'READ_ONLY', name: '只读人员', description: '只读查看已开放数据', permissions: ADMIN_PERMISSION_CATALOG.filter((item) => item.action === 'view').map((item) => item.key) }
] as const;
```

- [ ] **Step 5: Make seed idempotently upsert catalog, roles, and assignments**

Use `code` for role upsert, `key` for permission upsert, replace each system role’s active permission rows in a transaction, and ensure the seed `admin` has only the active `SUPER_ADMIN` role. Do not reset existing administrator passwords on seed updates.

- [ ] **Step 6: Verify GREEN, generate Prisma client, and build**

Run:

```bash
cd server
npm run prisma:generate
node --import tsx --test src/__tests__/admin-rbac-schema-contract.test.ts
npm run build
```

Expected: 1/1 tests pass; Prisma generation and TypeScript build exit 0.

- [ ] **Step 7: Commit Task 1**

```bash
git add server/prisma/schema.prisma server/prisma/migrations/20260813160000_admin_rbac_foundation/migration.sql server/prisma/seed.ts server/src/security/admin-permissions.ts server/src/__tests__/admin-rbac-schema-contract.test.ts
git commit -m "feat(server): add admin rbac foundation"
```

### Task 2: Request-scoped administrator access and enriched authentication

**Files:**
- Create: `server/src/security/admin-access.ts`
- Modify: `server/src/http/middleware/admin-auth.ts`
- Modify: `server/src/routes/admin/auth.ts`
- Test: `server/src/__tests__/admin-rbac-access.test.ts`

**Interfaces:**
- Consumes: `AdminPermissionKey` from Task 1.
- Produces: `AdminAccessContext` and `loadAdminAccess(adminId: number): Promise<AdminAccessContext | null>`.
- Produces: `req.adminAccess` after `requireAdminAuth`.

- [ ] **Step 1: Write failing access/auth tests**

Test the pure serializer and source contract:

```ts
test('effective access exposes one role and no password data', () => {
  const access = serializeAdminAccess({
    id: 1, username: 'operator', nickname: '运营', status: 'ACTIVE',
    roles: [{ role: { id: 2, code: 'CONTENT_OPERATOR', name: '内容运营', status: 'ACTIVE', permissions: [{ permission: { key: 'content:recipe:view', status: 'ACTIVE' } }] } }]
  });
  assert.deepEqual(access.permissions, ['content:recipe:view']);
  assert.equal(JSON.stringify(access).includes('password'), false);
});
```

Also assert that auth login updates `lastLoginAt`, JWT signing payload contains only `sub` and `username`, and profile selects roles/permissions.

- [ ] **Step 2: Run and verify RED**

Run: `cd server && node --import tsx --test src/__tests__/admin-rbac-access.test.ts`

Expected: FAIL because access loader and enriched profile do not exist.

- [ ] **Step 3: Implement access loading and request typing**

```ts
export type AdminAccessContext = {
  admin: { id: number; username: string; nickname: string | null; lastLoginAt: Date | null };
  role: { id: number; code: string; name: string; isSystem: boolean };
  permissions: string[];
};

export const loadAdminAccess = async (adminId: number): Promise<AdminAccessContext | null> => {
  const admin = await prisma.admin.findFirst({
    where: { id: adminId, deletedAt: null, status: 'ACTIVE' },
    include: { roles: { where: { deletedAt: null, status: 'ACTIVE' }, include: { role: { include: { permissions: { where: { deletedAt: null, status: 'ACTIVE' }, include: { permission: true } } } } } } }
  });
  if (!admin || admin.roles.length !== 1 || admin.roles[0].role.status !== 'ACTIVE' || admin.roles[0].role.deletedAt) return null;
  return serializeAdminAccess(admin);
};
```

`SUPER_ADMIN` serializes to `permissions: ['*']`; all other roles return unique active permission keys. Extend Express `Request` with `adminAccess?: AdminAccessContext`.

- [ ] **Step 4: Make auth middleware invalidate stale/inactive identities**

Convert `requireAdminAuth` to `async`, verify the JWT, load access, return 401 when missing/inactive/malformed, otherwise set `req.admin` and `req.adminAccess` before `next()`.

- [ ] **Step 5: Enrich login/profile**

After bcrypt succeeds, load access, reject an account without exactly one active role with 403, update `lastLoginAt`, and return:

```ts
{
  token,
  admin: access.admin,
  role: access.role,
  permissions: access.permissions
}
```

Profile returns the same shape without a new Token.

- [ ] **Step 6: Verify GREEN and build**

Run: `cd server && node --import tsx --test src/__tests__/admin-rbac-access.test.ts src/__tests__/admin-auth-middleware.test.ts && npm run build`

Expected: all selected tests pass and build exits 0.

- [ ] **Step 7: Commit Task 2**

```bash
git add server/src/security/admin-access.ts server/src/http/middleware/admin-auth.ts server/src/routes/admin/auth.ts server/src/__tests__/admin-rbac-access.test.ts
git commit -m "feat(server): resolve live admin access"
```

### Task 3: Central permission middleware and route-policy matrix

**Files:**
- Create: `server/src/security/admin-route-policy.ts`
- Create: `server/src/http/middleware/admin-permission.ts`
- Modify: `server/src/app.ts`
- Test: `server/src/__tests__/admin-rbac-route-policy.test.ts`

**Interfaces:**
- Produces: `permissionForAdminRequest(method: string, path: string): AdminPermissionKey | null`.
- Produces: `requireAdminPermission(permission: AdminPermissionKey)` and `requireAdminRouteAccess`.

- [ ] **Step 1: Write the failing policy matrix test**

Use table-driven cases that include reads and writes:

```ts
const cases = [
  ['GET', '/recipes', 'content:recipe:view'],
  ['POST', '/recipes', 'content:recipe:create'],
  ['PUT', '/recipes/recipe_1', 'content:recipe:update'],
  ['PATCH', '/recipes/recipe_1/publish', 'content:recipe:publish'],
  ['DELETE', '/recipes/recipe_1', 'content:recipe:delete'],
  ['GET', '/admins', 'system:admin:view'],
  ['POST', '/admins', 'system:admin:manage'],
  ['GET', '/roles', 'system:role:view'],
  ['PUT', '/roles/2/permissions', 'system:role:manage']
] as const;
for (const [method, path, expected] of cases) assert.equal(permissionForAdminRequest(method, path), expected);
```

Add a coverage assertion that every mounted live admin prefix in `app.ts` appears in the policy table. Auth login/profile are explicit public/authenticated exceptions, not `null` fallthrough.

- [ ] **Step 2: Run and verify RED**

Run: `cd server && node --import tsx --test src/__tests__/admin-rbac-route-policy.test.ts`

Expected: FAIL because the policy module does not exist.

- [ ] **Step 3: Implement ordered route policies**

Define typed policies with specific patterns before generic ones:

```ts
type AdminRoutePolicy = {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  pattern: RegExp;
  permission: AdminPermissionKey;
};

export const ADMIN_ROUTE_POLICIES: readonly AdminRoutePolicy[] = [
  { method: 'PATCH', pattern: /^\/recipes\/[^/]+\/publish$/, permission: 'content:recipe:publish' },
  { method: 'GET', pattern: /^\/recipes(?:\/.*)?$/, permission: 'content:recipe:view' },
  { method: 'POST', pattern: /^\/recipes$/, permission: 'content:recipe:create' },
  { method: 'PUT', pattern: /^\/recipes\/[^/]+$/, permission: 'content:recipe:update' },
  { method: 'DELETE', pattern: /^\/recipes\/[^/]+$/, permission: 'content:recipe:delete' }
];
```

The final table must explicitly cover these mounted prefixes, with `GET` mapped to the corresponding `view` key and mutations mapped to `create/update/status/delete/publish/manage` as applicable:

| Mounted prefix | Canonical permission family |
|---|---|
| `/categories`, `/tags`, `/cuisines` | `taxonomy:*` |
| `/ingredients`, `/seasonal-foods` | `content:ingredient:*` |
| `/recipes`, `/recommendations` | `content:recipe:*` |
| `/beverages` | `content:beverage:*` |
| `/banners`, `/home/top-navs`, nested hero-banners/modules | `home:configuration:*` |
| `/menus`, `/channels` | `content:configuration:*` |
| `/families` | `family:*` |
| `/users` | `user:account:*` or `user:behavior:view` for `/behavior`, `/favorites`, `/recent-views` |
| `/posts`, `/audits` | `audit:*` |
| `/comments` | `comment:*` |
| `/purchase-lists` | `purchase:view` |
| `/search-logs` | `search:log:view` |
| `/upload`, `/files` | `file:*` |
| `/resource-api-providers`, `/resource-apps`, `/resource-api-keys`, `/resource-permissions`, `/resource-logs`, `/resource-imports`, `/content-selector` | `resource:*` |
| `/admins` | `system:admin:*` |
| `/roles`, `/permissions` | `system:role:*` |
| `/operation-logs` | `system:log:view` |

The test must enumerate every `app.use('/api/admin/...')` mount and fail if a new mounted prefix has no family entry. Within each family, explicitly test at least every distinct HTTP method plus special action suffixes such as `/publish`, `/recommend`, `/status`, `/enable`, `/disable`, `/reset`, `/confirm`, and `/retry-failed` that exist in its router.

Unknown `/api/admin` routes must not silently pass. `requireAdminRouteAccess` returns 403 for an authenticated request without a mapped policy, except `/auth/profile` and the already-mounted `/auth/login`.

- [ ] **Step 4: Implement middleware and mount it once**

Mount `adminAuthRouter` first, then:

```ts
app.use('/api/admin', requireAdminAuth, requireAdminRouteAccess);
```

Mount all remaining admin routers afterward. Existing per-route `requireAdminAuth` calls can remain during this task; request-scoped access prevents duplicate database loading by returning early when `req.adminAccess` already exists.

- [ ] **Step 5: Verify GREEN and existing auth regression**

Run: `cd server && node --import tsx --test src/__tests__/admin-rbac-route-policy.test.ts src/__tests__/admin-auth-middleware.test.ts src/__tests__/basket-auth-routing.test.ts && npm run build`

Expected: policy/auth tests pass; build exits 0.

- [ ] **Step 6: Commit Task 3**

```bash
git add server/src/security/admin-route-policy.ts server/src/http/middleware/admin-permission.ts server/src/app.ts server/src/__tests__/admin-rbac-route-policy.test.ts
git commit -m "feat(server): enforce admin route permissions"
```

### Task 4: Administrator CRUD, password reset, and safety guards

**Files:**
- Create: `server/src/services/admin-rbac-guards.ts`
- Create: `server/src/services/admin-operation-log.ts`
- Create: `server/src/routes/admin/admins.ts`
- Modify: `server/src/app.ts`
- Test: `server/src/__tests__/admin-rbac-admins.test.ts`

**Interfaces:**
- Produces REST endpoints under `/api/admin/admins`.
- Produces `assertAdminMutationAllowed(tx, actorId, targetId, mutation)`.
- Produces `writeAdminOperationLog(tx, input)` with sensitive-data sanitization.

- [ ] **Step 1: Write failing CRUD and invariant tests**

Test source contracts plus pure guards for:

- list pagination and `q/roleId/status` filters;
- create requires username, nickname, valid password, and one active role;
- update atomically replaces the active role;
- password reset hashes instead of serializing plaintext;
- self-disable/self-delete returns 409;
- changing/disabling/deleting the final active super administrator returns 409;
- returned DTO never contains `passwordHash`;
- operation-log sanitizer removes `password`, `passwordHash`, `authorization`, and `token` recursively.

- [ ] **Step 2: Run and verify RED**

Run: `cd server && node --import tsx --test src/__tests__/admin-rbac-admins.test.ts`

Expected: FAIL because router, guards, and log service do not exist.

- [ ] **Step 3: Implement schemas and DTO**

```ts
const passwordSchema = z.string().min(8).max(128).regex(/[A-Za-z]/).regex(/\d/);
const createAdminSchema = z.object({
  username: z.string().trim().min(3).max(32),
  nickname: z.string().trim().min(1).max(32),
  password: passwordSchema,
  roleId: z.coerce.number().int().positive(),
  status: z.enum(['ACTIVE', 'DISABLED']).default('ACTIVE')
});
```

Serialize only `id`, `username`, `nickname`, `status`, `lastLoginAt`, `createdAt`, and single `role`.

- [ ] **Step 4: Implement transactional safety guards**

For dangerous super-admin mutations, acquire a PostgreSQL transaction advisory lock with a fixed RBAC key, count active admins whose sole active role code is `SUPER_ADMIN`, then reject when the target is the last one. Perform the mutation in the same transaction. Reject self-disable and self-delete before mutation.

- [ ] **Step 5: Implement endpoints and sanitized logs**

Create list/detail/create/update/password/status/delete handlers. Map unique constraint failures to 409. Every mutation writes an operation log in the same transaction with a non-sensitive summary such as `{ targetAdminId, roleId, status }`; password reset logs `{ targetAdminId, passwordReset: true }` only.

- [ ] **Step 6: Verify GREEN and build**

Run: `cd server && node --import tsx --test src/__tests__/admin-rbac-admins.test.ts src/__tests__/mobile-auth-security-contract.test.ts && npm run build`

Expected: selected tests pass and build exits 0.

- [ ] **Step 7: Commit Task 4**

```bash
git add server/src/services/admin-rbac-guards.ts server/src/services/admin-operation-log.ts server/src/routes/admin/admins.ts server/src/app.ts server/src/__tests__/admin-rbac-admins.test.ts
git commit -m "feat(server): add administrator management"
```

### Task 5: Role CRUD and permission replacement

**Files:**
- Create: `server/src/routes/admin/roles.ts`
- Test: `server/src/__tests__/admin-rbac-roles.test.ts`
- Modify: `server/src/app.ts`

**Interfaces:**
- Produces `/api/admin/roles` and `/api/admin/permissions` endpoints.
- Consumes operation logging and system-role guards from Task 4.

- [ ] **Step 1: Write failing role tests**

Cover list counts, permission grouping, custom-role creation, full permission replacement, immutable codes, fixed super-admin permissions, used-role delete/disable conflicts, and soft deletion.

```ts
test('permission replacement rejects unknown or inactive ids and removes omitted permissions', async () => {
  const result = validatePermissionReplacement([1, 2], [{ id: 1, status: 'ACTIVE' }, { id: 2, status: 'ACTIVE' }]);
  assert.deepEqual(result, [1, 2]);
  assert.throws(() => validatePermissionReplacement([1, 9], [{ id: 1, status: 'ACTIVE' }]), /权限不存在/);
});
```

- [ ] **Step 2: Run and verify RED**

Run: `cd server && node --import tsx --test src/__tests__/admin-rbac-roles.test.ts`

Expected: FAIL because role endpoints and validator do not exist.

- [ ] **Step 3: Implement permission catalog endpoint**

Return:

```ts
type PermissionGroupDto = {
  module: string;
  moduleName: string;
  permissions: Array<{ id: number; key: string; name: string; action: string; sort: number }>;
};
```

Only active, non-deleted permissions are included, ordered by module sort and permission sort.

- [ ] **Step 4: Implement role mutations**

Use schemas with immutable `code` after creation. Permission replacement validates a complete unique ID list and transactionally soft-deletes omitted active links while creating/restoring selected links. `SUPER_ADMIN` rejects permission replacement; all system roles reject deletion and code mutation. Any active administrator assignment blocks role disable/delete with 409.

- [ ] **Step 5: Verify GREEN and build**

Run: `cd server && node --import tsx --test src/__tests__/admin-rbac-roles.test.ts src/__tests__/admin-rbac-admins.test.ts && npm run build`

Expected: selected tests pass and build exits 0.

- [ ] **Step 6: Commit Task 5**

```bash
git add server/src/routes/admin/roles.ts server/src/app.ts server/src/__tests__/admin-rbac-roles.test.ts
git commit -m "feat(server): add role permission management"
```

### Task 6: Real operation-log read path

**Files:**
- Create: `server/src/routes/admin/operation-logs.ts`
- Modify: `server/src/app.ts`
- Test: `server/src/__tests__/admin-rbac-operation-logs.test.ts`
- Modify: `admin-frontend/src/app/types.ts`
- Modify: `admin-frontend/src/app/api.ts`
- Replace: `admin-frontend/src/app/pages/SettingsLogsPage.tsx`
- Create: `admin-frontend/src/app/pages/admin-operation-logs-real-data-contract.test.mjs`

**Interfaces:**
- Produces `GET /api/admin/operation-logs` with `page`, `pageSize`, `q`, `module`, `action`, `startDate`, and `endDate` filters.
- Produces `AdminOperationLogItem` and `listAdminOperationLogs()`.

- [ ] **Step 1: Write failing server and page contracts**

Server test asserts pagination/filter schema, administrator join, descending creation order, and that `requestBody` is sanitized before serialization. Frontend test asserts the page no longer imports `GenericMockListPage`, contains no `initialItems`, and calls `listAdminOperationLogs` with search/filter/page state.

- [ ] **Step 2: Run and verify RED**

Run:

```bash
cd server && node --import tsx --test src/__tests__/admin-rbac-operation-logs.test.ts
cd ../admin-frontend && node --test src/app/pages/admin-operation-logs-real-data-contract.test.mjs
```

Expected: both commands fail because the endpoint and real page do not exist.

- [ ] **Step 3: Implement the read-only endpoint**

Return only:

```ts
type AdminOperationLogDto = {
  id: number;
  admin: { id: number; username: string; nickname: string | null } | null;
  module: string | null;
  action: string | null;
  method: string | null;
  path: string | null;
  ip: string | null;
  responseCode: number | null;
  responseMessage: string | null;
  detail: Record<string, unknown> | null;
  createdAt: Date;
};
```

Before returning `detail`, run the same recursive sanitizer used by writes. The endpoint never returns user-agent or raw sensitive values unless separately approved later.

- [ ] **Step 4: Implement the real admin log page**

Use existing `PageHeader`, `FilterPanel`, `DataTable`, loading/error/retry, date inputs, module/action filters, and pagination. It is read-only: no create/edit/delete buttons. Render response status as success/error tags and display sanitized detail as concise key/value text.

- [ ] **Step 5: Verify GREEN and builds**

Run:

```bash
cd server && node --import tsx --test src/__tests__/admin-rbac-operation-logs.test.ts src/__tests__/admin-rbac-admins.test.ts && npm run build
cd ../admin-frontend && node --test src/app/pages/admin-operation-logs-real-data-contract.test.mjs && npm run build
```

Expected: selected tests pass and both builds exit 0.

- [ ] **Step 6: Commit Task 6**

```bash
git add server/src/routes/admin/operation-logs.ts server/src/app.ts server/src/__tests__/admin-rbac-operation-logs.test.ts admin-frontend/src/app/types.ts admin-frontend/src/app/api.ts admin-frontend/src/app/pages/SettingsLogsPage.tsx admin-frontend/src/app/pages/admin-operation-logs-real-data-contract.test.mjs
git commit -m "feat: expose sanitized admin operation logs"
```

### Task 7: Frontend RBAC types, session, API, and error semantics

**Files:**
- Modify: `admin-frontend/src/app/types.ts`
- Modify: `admin-frontend/src/app/storage.ts`
- Modify: `admin-frontend/src/app/api.ts`
- Modify: `admin-frontend/src/app/permissions.ts`
- Modify: `admin-frontend/src/app/pages/LoginPage.tsx`
- Create: `admin-frontend/src/app/pages/admin-rbac-session-contract.test.mjs`

**Interfaces:**
- Produces `AdminRoleSummary`, `AdminPermissionGroup`, `AdminAccountItem`, `AdminRoleItem`, enriched `AdminUser/LoginResult`.
- Produces typed API functions for all Task 4/5 endpoints; operation-log types and API from Task 6 remain compatible.

- [ ] **Step 1: Write failing session/API contract**

Assert that permissions no longer returns unconditional wildcard, storage validates `role` and `permissions`, API exposes typed administrator/role functions, and login stores the enriched admin object.

- [ ] **Step 2: Run and verify RED**

Run: `cd admin-frontend && node --test src/app/pages/admin-rbac-session-contract.test.mjs`

Expected: FAIL on unconditional `return ['*']` and missing API functions.

- [ ] **Step 3: Add DTO types and storage validation**

```ts
export type AdminRoleSummary = { id: number; code: string; name: string; isSystem: boolean };
export type AdminUser = {
  id: number;
  username: string;
  nickname: string | null;
  lastLoginAt: string | null;
  role: AdminRoleSummary;
  permissions: string[];
};
export type LoginResult = { token: string; admin: AdminUser };
```

If the server keeps `role` and `permissions` alongside `admin`, normalize them into one stored `AdminUser` in `login()` before returning. Storage rejects malformed permissions rather than granting wildcard.

- [ ] **Step 4: Implement typed APIs**

Add `listAdmins`, `createAdmin`, `updateAdmin`, `resetAdminPassword`, `setAdminStatus`, `deleteAdmin`, `listRoles`, `createRole`, `updateRole`, `replaceRolePermissions`, `setRoleStatus`, `deleteRole`, and `listAdminPermissions` using exact DTOs rather than `Record<string, any>`.

- [ ] **Step 5: Handle 401 and preserve 403/409**

Keep 401 session clearing. Do not clear session for 403. Preserve `ApiError.code` so pages can show “无权限执行此操作” for 403 and the server conflict message for 409.

- [ ] **Step 6: Verify GREEN and build**

Run: `cd admin-frontend && node --test src/app/pages/admin-rbac-session-contract.test.mjs && npm run build`

Expected: contract passes and Vite build exits 0.

- [ ] **Step 7: Commit Task 7**

```bash
git add admin-frontend/src/app/types.ts admin-frontend/src/app/storage.ts admin-frontend/src/app/api.ts admin-frontend/src/app/permissions.ts admin-frontend/src/app/pages/LoginPage.tsx admin-frontend/src/app/pages/admin-rbac-session-contract.test.mjs
git commit -m "feat(admin): consume live rbac session"
```

### Task 8: Real administrator management page

**Files:**
- Replace: `admin-frontend/src/app/pages/SettingsPage.tsx`
- Create: `admin-frontend/src/app/pages/admin-management-real-data-contract.test.mjs`

**Interfaces:**
- Consumes Task 7 APIs and `system:admin:manage`.
- Produces real administrator list/create/edit/reset/status/delete UI.

- [ ] **Step 1: Write failing page contract**

Assert no `initialAdmins`, `resolveMockList`, fixed “今日操作”, or local-only mutation remains; assert real API calls, role/status filters, password reset, 403/409 handling, and manage permission gates exist.

- [ ] **Step 2: Run and verify RED**

Run: `cd admin-frontend && node --test src/app/pages/admin-management-real-data-contract.test.mjs`

Expected: FAIL because the current page uses fixed arrays and mock pagination.

- [ ] **Step 3: Implement real list and filters**

Load `listAdmins` and `listRoles` with loading/error/retry states. Show only real totals: total administrators, active accounts from returned overview or current filtered result, and active roles. Do not retain “今日操作”.

- [ ] **Step 4: Implement mutation drawers and confirmations**

Create requires username/nickname/password/role; edit keeps username read-only and changes nickname/role/status; reset password uses a dedicated drawer. Disable buttons while submitting. On failure retain draft and render `ApiError.message`. Disable self and last-super-admin actions based on server DTO capability flags such as `canDisable`, `canDelete`, `canChangeRole`, while still handling 409 from the server.

- [ ] **Step 5: Gate actions with real permission**

Only render create/edit/reset/status/delete controls when `canAccess('system:admin:manage')`; view-only users keep list and filters.

- [ ] **Step 6: Verify GREEN and build**

Run: `cd admin-frontend && node --test src/app/pages/admin-management-real-data-contract.test.mjs src/app/pages/admin-rbac-session-contract.test.mjs && npm run build`

Expected: selected contracts pass and build exits 0.

- [ ] **Step 7: Commit Task 8**

```bash
git add admin-frontend/src/app/pages/SettingsPage.tsx admin-frontend/src/app/pages/admin-management-real-data-contract.test.mjs
git commit -m "feat(admin): connect administrator management"
```

### Task 9: Real role and permission-tree page

**Files:**
- Replace: `admin-frontend/src/app/pages/RolesPage.tsx`
- Create: `admin-frontend/src/app/pages/admin-roles-real-data-contract.test.mjs`

**Interfaces:**
- Consumes Task 7 role/permission APIs and `system:role:manage`.
- Produces role CRUD and grouped permission replacement UI.

- [ ] **Step 1: Write failing page contract**

Assert no `initialRoles`, `permissionGroups`, `resolveMockList`, or “权限树占位” remains; assert real APIs, module-select logic, used-role/system-role guards, and submit protection exist.

- [ ] **Step 2: Run and verify RED**

Run: `cd admin-frontend && node --test src/app/pages/admin-roles-real-data-contract.test.mjs`

Expected: FAIL on fixed arrays and placeholder tree.

- [ ] **Step 3: Implement role list and selection**

Load paginated roles and the permission catalog. Selecting a role loads its current permission IDs. Display system tag, administrator count, permission count, status, and last update. Keep loading/error/empty states separate.

- [ ] **Step 4: Implement grouped permission tree**

Use controlled checkboxes. A module checkbox selects/deselects all IDs in that module; indeterminate state is true when some but not all are selected. `SUPER_ADMIN` renders all selected and read-only. Saving calls `replaceRolePermissions(role.id, { permissionIds: [...selectedIds] })` once with duplicate protection.

- [ ] **Step 5: Implement role create/edit/status/delete**

System code is read-only. Custom role code is required on create and immutable on edit. Disable delete for `isSystem` or `adminCount > 0`. Show server 409 without discarding form state. Gate all writes with `system:role:manage`.

- [ ] **Step 6: Verify GREEN and build**

Run: `cd admin-frontend && node --test src/app/pages/admin-roles-real-data-contract.test.mjs src/app/pages/admin-management-real-data-contract.test.mjs && npm run build`

Expected: selected contracts pass and build exits 0.

- [ ] **Step 7: Commit Task 9**

```bash
git add admin-frontend/src/app/pages/RolesPage.tsx admin-frontend/src/app/pages/admin-roles-real-data-contract.test.mjs
git commit -m "feat(admin): connect role permission management"
```

### Task 10: Navigation, direct-route, and action-button enforcement

**Files:**
- Modify: `admin-frontend/src/app/navigation.ts`
- Modify: `admin-frontend/src/app/permissions.ts`
- Create: `admin-frontend/src/app/components/PermissionGate.tsx`
- Modify: `admin-frontend/src/app/App.tsx`
- Modify: live mutation pages under `admin-frontend/src/app/pages/` only where a write button is currently exposed.
- Create: `admin-frontend/src/app/pages/admin-rbac-ui-matrix.test.mjs`

**Interfaces:**
- Produces `filterNavigationByAccess(items, permissions)`.
- Produces `<PermissionGate permission mode="hide|disable">`.

- [ ] **Step 1: Write failing three-role UI matrix**

Test pure navigation filtering with `['*']`, content-operator permissions, and read-only permissions. Assert empty parent groups disappear, `/settings/admins` routes to 403 without its view permission, content operator retains content write buttons, and read-only users do not render mutation buttons.

- [ ] **Step 2: Run and verify RED**

Run: `cd admin-frontend && node --test src/app/pages/admin-rbac-ui-matrix.test.mjs`

Expected: FAIL because current navigation permission keys are inconsistent and buttons are not gated.

- [ ] **Step 3: Normalize navigation and route permissions**

Replace legacy keys such as `recipe:view` with canonical keys such as `content:recipe:view`. Filter children first, then hide a parent when neither its own route nor any child is accessible. Keep `RequirePermission` redirecting direct unauthorized routes to `/403`.

- [ ] **Step 4: Add reusable action gate**

```tsx
export const PermissionGate = ({ permission, mode = 'hide', children }: Props) => {
  const allowed = canAccess(permission);
  if (allowed) return <>{children}</>;
  if (mode === 'hide') return null;
  return <span aria-disabled="true" title="无权限执行此操作">{children}</span>;
};
```

For disable mode, pages must pass `disabled={!allowed || existingDisabled}` to the actual control; the wrapper alone is not a click blocker.

- [ ] **Step 5: Gate live write surfaces**

Apply canonical create/update/publish/delete/status keys to currently live home, recipe, ingredient, beverage, taxonomy, user, family, audit, file, resource-provider, and comment mutation controls. Do not add controls to read-only demo pages.

- [ ] **Step 6: Verify GREEN and full admin contracts**

Run: `cd admin-frontend && node --test src/app/pages/*.test.mjs src/app/pages/**/*.test.mjs && npm run build`

Expected: all admin contracts pass and build exits 0.

- [ ] **Step 7: Commit Task 10**

```bash
git add admin-frontend/src/app/navigation.ts admin-frontend/src/app/permissions.ts admin-frontend/src/app/components/PermissionGate.tsx admin-frontend/src/app/App.tsx admin-frontend/src/app/pages
git commit -m "feat(admin): enforce rbac navigation and actions"
```

### Task 11: Database deployment, full regression, browser acceptance, and docs

**Files:**
- Modify: `docs/backend/auth.md`
- Modify: `docs/backend/api-spec.md`
- Modify: `docs/backend/database-schema.md`
- Modify: `docs/testing/2026-08-12-e2e-full-acceptance-report.md`

**Interfaces:**
- Verifies all previous tasks as one release candidate.

- [ ] **Step 1: Apply migration and seed to the development database**

Run:

```bash
cd server
npm run prisma:deploy
npm run prisma:seed
```

Expected: migration applies once, seed completes without deleting existing content, and a second seed run is idempotent.

- [ ] **Step 2: Run full server regression**

Run: `cd server && node --import tsx --test src/__tests__/*.test.ts && npm run build`

Expected: zero failed tests and build exit 0. If sandbox blocks temporary ports, rerun the same command with approved local-listen escalation; do not reinterpret EPERM as an assertion failure.

- [ ] **Step 3: Run full admin regression**

Run: `cd admin-frontend && node --test src/app/pages/*.test.mjs src/app/pages/**/*.test.mjs && npm run build`

Expected: zero failed tests and build exit 0.

- [ ] **Step 4: Start services and perform built-in-browser role matrix**

Start:

```bash
cd server && npm run dev
cd admin-frontend && npm run dev
```

Using only the built-in browser for UI actions:

1. Log in as the seed super administrator.
2. Create `E2E-RBAC-20260813-operator` with `CONTENT_OPERATOR` and `E2E-RBAC-20260813-readonly` with `READ_ONLY`.
3. Log in as operator: verify content edit is available, system menus are absent, and direct `/api/admin/admins` access returns 403.
4. Log in as read-only: verify content lists load, mutation buttons are absent, and direct recipe POST returns 403.
5. As super administrator, modify a test custom role and verify the already logged-in target account sees the new permission on its next request without logging in again.
6. Verify self-disable and final-super-admin downgrade/delete return 409 with clear UI messages.
7. Verify a used role cannot be deleted and operation-log rows contain no password, hash, Authorization value, or Token.
8. Clean up only the two `E2E-RBAC-20260813-*` administrators and any unassigned custom test role through the UI.

- [ ] **Step 5: Update documentation with exact final behavior and evidence**

Document endpoint tables, permission semantics, migration fields, seed roles, test counts, browser evidence, and remaining risks. Update BUG-006/014 only for administrator/RBAC scope; do not mark unrelated reports, price, or AI modules complete.

- [ ] **Step 6: Final hygiene verification**

Run:

```bash
git diff --check
git status --short
```

Restore build-only `admin-frontend/tsconfig.tsbuildinfo` if modified. Verify no `.env`, Token, password, `dist`, or unrelated user changes are staged.

- [ ] **Step 7: Commit Task 11**

```bash
git add docs/backend/auth.md docs/backend/api-spec.md docs/backend/database-schema.md docs/testing/2026-08-12-e2e-full-acceptance-report.md
git commit -m "docs: record admin rbac acceptance"
```

## Final Acceptance Checklist

- [ ] One active role per administrator is enforced by API transactions.
- [ ] Role and permission changes take effect on the next request without JWT refresh.
- [ ] Server returns 403 for direct unauthorized API calls.
- [ ] Current administrator and last active super administrator protections return 409.
- [ ] System-role and used-role protections return 409.
- [ ] Passwords, hashes, Tokens, and Authorization headers do not appear in API responses or operation logs.
- [ ] Administrator and role pages contain no fixed arrays, mock pagination, or fake success messages.
- [ ] Super administrator, content operator, and read-only browser matrices all match the specification.
- [ ] Server and admin full test suites and builds pass with fresh output.
- [ ] BUG-006/014 remain open only for unrelated unimplemented modules.
