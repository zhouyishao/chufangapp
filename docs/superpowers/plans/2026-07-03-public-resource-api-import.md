# Public Resource API Import Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 接入公共资源 API，把菜谱、蔬菜、水果、调料、酒水从外部接口拉取到导入隔离池，经过清洗、筛选、人工确认后进入正式业务表，并能在后台和 C 端完整验收。

**Architecture:** 复用现有 `ResourceImportBatch` / `ResourceImportItem` 作为隔离池，新增“外部 API Provider”配置和同步服务。外部 API 数据永远不直接写 `recipes`、`ingredients`、`beverages`，必须先生成导入批次和导入条目，再通过现有确认入库流程进入正式表。

**Tech Stack:** Express + TypeScript + Prisma + PostgreSQL；后台 React + TypeScript；验证使用 `npm run build`、`npx tsx` 轻量测试脚本和本地 API curl。

---

## Current State

- 后端已有统一资源路由：[server/src/routes/admin/resources.ts](/Users/oooz/Desktop/Z_ou/chufangapp/server/src/routes/admin/resources.ts)
- 后端已有隔离导入表：`ResourceImportBatch`、`ResourceImportItem`，定义在 [server/prisma/schema.prisma](/Users/oooz/Desktop/Z_ou/chufangapp/server/prisma/schema.prisma)
- 已有文件/JSON 导入能力：
  - `POST /api/admin/resource-imports/preview`
  - `POST /api/admin/resource-imports/upload`
  - `GET /api/admin/resource-imports`
  - `GET /api/admin/resource-imports/items`
  - `PUT /api/admin/resource-imports/items/:id`
  - `PATCH /api/admin/resource-imports/items/:id/status`
  - `POST /api/admin/resource-imports/confirm`
  - `POST /api/admin/resource-imports/:id/retry-failed`
- 后台已有资源导入页面：
  - [admin-frontend/src/app/pages/ResourceAccessCenterPage.tsx](/Users/oooz/Desktop/Z_ou/chufangapp/admin-frontend/src/app/pages/ResourceAccessCenterPage.tsx)
  - [admin-frontend/src/app/pages/ResourceImportRecordsPage.tsx](/Users/oooz/Desktop/Z_ou/chufangapp/admin-frontend/src/app/pages/ResourceImportRecordsPage.tsx)
- 后台已有 `ApiProvider*` 页面，但目前只做本地状态和占位提示，未接真实后端。
- 当前正式业务表映射：
  - 菜谱：`Recipe`、`RecipeStep`、`RecipeIngredient`
  - 蔬菜：复用 `Ingredient`，导入类型用 `INGREDIENT`
  - 水果：复用 `Ingredient`，分类类型用 `FRUIT`
  - 调料：复用 `Ingredient`，分类类型用 `SEASONING`
  - 酒水：`Beverage`

## Scope Decisions

- 不新增独立“蔬菜表”。MVP 中“蔬菜”进入 `ingredients`，导入类型仍使用已有 `INGREDIENT`，后台展示文案可以叫“蔬菜/食材”。
- 不让 C 端调用外部公共 API。C 端继续读取本项目正式表接口。
- 不引入队列系统。第一版同步由管理员手动触发，请求完成后直接创建导入批次。
- 不自动发布到 C 端。确认入库时正式表默认按现有逻辑设置 `isPublish`，如需更严格审核，在任务 6 调整默认状态。
- 外部 API token 不写死在代码里，不提交 `.env`。Provider 保存时对敏感字段加密；本地只更新 `.env.example` 的字段名。

## Target Flow

```text
管理员配置 API Provider
  ↓
后台点击“测试连接”
  ↓
后台点击“同步到导入池”
  ↓
后端请求外部 API
  ↓
提取 dataPath 指向的列表
  ↓
按资源类型映射字段
  ↓
校验必填、类型、重复、内容有效性
  ↓
写 ResourceImportBatch / ResourceImportItem
  ↓
管理员在资源接入中心查看、编辑、忽略、批量确认
  ↓
进入 recipes / ingredients / beverages
  ↓
后台内容页可见
  ↓
C 端接口可见
```

## Data Model Plan

### Task 1: Add External API Provider Model

**Files:**
- Modify: `server/prisma/schema.prisma`
- Create: `server/prisma/migrations/20260703110000_add_resource_api_providers/migration.sql`
- Modify: `.env.example` if present

- [ ] Add `ResourceApiProvider` model:

```prisma
model ResourceApiProvider {
  id             Int      @id @default(autoincrement())
  name           String   @db.VarChar(120)
  providerName   String   @map("provider_name") @db.VarChar(120)
  resourceType   String   @map("resource_type") @db.VarChar(32)
  method         String   @default("GET") @db.VarChar(16)
  endpointUrl    String   @map("endpoint_url") @db.VarChar(500)
  authType       String   @default("NONE") @map("auth_type") @db.VarChar(32)
  appKey         String?  @map("app_key") @db.VarChar(255)
  encryptedSecret String? @map("encrypted_secret") @db.Text
  defaultHeaders Json?    @map("default_headers")
  defaultParams  Json?    @map("default_params")
  dataPath       String   @default("data.list") @map("data_path") @db.VarChar(120)
  timeoutMs      Int      @default(10000) @map("timeout_ms")
  dailyLimit     Int      @default(10000) @map("daily_limit")
  description    String?  @db.Text
  status         RecordStatus @default(ACTIVE)
  lastSyncedAt   DateTime? @map("last_synced_at")
  lastTestedAt   DateTime? @map("last_tested_at")
  lastError       String?   @map("last_error") @db.Text
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  importBatches ResourceImportBatch[]

  @@index([resourceType])
  @@index([status])
  @@map("resource_api_providers")
}
```

- [ ] Extend `ResourceImportBatch`:

```prisma
providerId      Int?                 @map("provider_id")
provider        ResourceApiProvider? @relation(fields: [providerId], references: [id], onDelete: SetNull)
sourceName      String?              @map("source_name") @db.VarChar(120)
requestSnapshot Json?                @map("request_snapshot")
```

- [ ] Extend `ResourceImportItem`:

```prisma
externalId        String? @map("external_id") @db.VarChar(120)
externalUrl       String? @map("external_url") @db.VarChar(500)
filterCode        String? @map("filter_code") @db.VarChar(64)
duplicateTargetId Int?    @map("duplicate_target_id")
```

- [ ] Add migration SQL matching the Prisma model.

- [ ] Add `.env.example` key if missing:

```bash
RESOURCE_PROVIDER_SECRET_KEY=replace-with-32-byte-secret
```

## Backend Service Plan

### Task 2: Extract Import Core From Route Into Service

**Files:**
- Create: `server/src/services/resource-import/types.ts`
- Create: `server/src/services/resource-import/mapper.ts`
- Create: `server/src/services/resource-import/validator.ts`
- Create: `server/src/services/resource-import/importer.ts`
- Modify: `server/src/routes/admin/resources.ts`

- [ ] Move these responsibilities out of `resources.ts`:
  - `mapRowData`
  - duplicate checks
  - `resolveCategory`
  - `importRecipe`
  - `importIngredient`
  - `importBeverage`

- [ ] Keep public behavior unchanged for existing file import endpoints.

- [ ] Define explicit resource type:

```ts
export const resourceImportTypes = ['RECIPE', 'INGREDIENT', 'FRUIT', 'SEASONING', 'BEVERAGE'] as const;
export type ResourceImportType = typeof resourceImportTypes[number];
```

- [ ] Define normalized payload shape:

```ts
export type NormalizedResourcePayload = {
  name: string;
  title?: string;
  subtitle?: string;
  description?: string;
  cover?: string;
  coverImage?: string;
  categoryName?: string;
  cuisineName?: string;
  cookTime?: number | null;
  servings?: number | null;
  calories?: number | null;
  difficulty?: string;
  taste?: string;
  scene?: string;
  tips?: string;
  steps?: Array<string | { sortIndex?: number; description: string; image?: string | null }>;
  ingredients?: Array<string | { name: string; amount?: string; unit?: string; sortIndex?: number }>;
  seasonMonth?: string;
  nutrition?: string;
  selectionTips?: string;
  storageMethod?: string;
  taboo?: string;
  currentPrice?: number | null;
  priceUnit?: string;
  priceSource?: string;
  priceDate?: string | null;
  beverageType?: string;
  isAlcoholic?: boolean;
  alcoholDegree?: number | null;
  externalId?: string;
  externalUrl?: string;
  sourceName?: string;
};
```

### Task 3: Implement Filter Rules

**Files:**
- Modify: `server/src/services/resource-import/validator.ts`
- Modify: `server/src/services/resource-import/importer.ts`

- [ ] Use these statuses in `ResourceImportItem.status`:
  - `PENDING`: 通过隔离筛选，等待人工确认
  - `FAILED`: 筛选失败、重复、字段缺失或请求失败
  - `IGNORED`: 管理员手动忽略
  - `IMPORTED`: 已进入正式业务表

- [ ] Use these `filterCode` values:
  - `MISSING_NAME`
  - `MISSING_RECIPE_STEPS`
  - `MISSING_RECIPE_INGREDIENTS`
  - `INVALID_RESOURCE_TYPE`
  - `DUPLICATE_NAME`
  - `DUPLICATE_EXTERNAL_ID`
  - `INVALID_IMAGE_URL`
  - `INVALID_PRICE`
  - `INVALID_ALCOHOL_DEGREE`

- [ ] Validation matrix:

| 类型 | 必填 | 进入正式表 | 重复判断 |
|---|---|---|---|
| `RECIPE` | `name/title`，至少 1 个步骤，至少 1 个用料 | `recipes` + steps + ingredients | `sourceName + externalId`，否则 `title` |
| `INGREDIENT` | `name` | `ingredients` | `name` |
| `FRUIT` | `name` | `ingredients`，分类类型 `FRUIT` | `name` |
| `SEASONING` | `name` | `ingredients`，分类类型 `SEASONING` | `name` |
| `BEVERAGE` | `name` | `beverages` | `name` |

- [ ] Do not fail a row only because image is empty. Empty image should be allowed but visible in `mappedData`; invalid URL should fail only when a non-empty value is not `http://`, `https://`, or `/uploads/`.

### Task 4: Add Public API Client

**Files:**
- Create: `server/src/services/resource-import/provider-client.ts`
- Create: `server/src/services/resource-import/json-path.ts`
- Create: `server/src/services/resource-import/secret.ts`
- Modify: `server/src/config.ts`

- [ ] Implement `json-path.ts` with dot-path extraction:

```ts
export function getByPath(input: unknown, path: string): unknown {
  return path.split('.').filter(Boolean).reduce<unknown>((current, key) => {
    if (current && typeof current === 'object' && key in current) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, input);
}
```

- [ ] Support `GET` and `POST`.

- [ ] Support auth modes:
  - `NONE`
  - `HEADER_TOKEN`: inject `Authorization: Bearer <secret>`
  - `QUERY_KEY`: inject `appKey` and decrypted secret into query params
  - `CUSTOM_HEADERS`: merge `defaultHeaders`

- [ ] Enforce timeout with `AbortController`.

- [ ] Reject response bodies over Express JSON limit expectations by limiting imported rows in sync payload. MVP limit: maximum 500 rows per sync.

## Backend API Plan

### Task 5: Add API Provider Routes

**Files:**
- Create: `server/src/routes/admin/resource-api-providers.ts`
- Modify: `server/src/app.ts`
- Modify: `server/src/swagger.ts` if API docs are maintained there

- [ ] Mount route:

```ts
app.use('/api/admin/resource-api-providers', adminResourceApiProvidersRouter);
```

- [ ] Add endpoints:

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/admin/resource-api-providers` | Provider list with search, type, status, pagination |
| `GET` | `/api/admin/resource-api-providers/:id` | Provider detail, secret masked |
| `POST` | `/api/admin/resource-api-providers` | Create provider |
| `PUT` | `/api/admin/resource-api-providers/:id` | Update provider |
| `PATCH` | `/api/admin/resource-api-providers/:id/status` | Enable/disable |
| `DELETE` | `/api/admin/resource-api-providers/:id` | Delete only if no import batch exists |
| `POST` | `/api/admin/resource-api-providers/test` | Test unsaved draft config |
| `POST` | `/api/admin/resource-api-providers/:id/test` | Test saved config |
| `POST` | `/api/admin/resource-api-providers/:id/sync` | Fetch external API and create import batch |

- [ ] Sync endpoint request:

```json
{
  "limit": 100,
  "params": { "page": 1, "pageSize": 100 }
}
```

- [ ] Sync endpoint response:

```json
{
  "batch": {
    "id": 12,
    "importType": "RECIPE",
    "sourceType": "API",
    "fileName": "公共资源-菜谱-2026-07-03"
  },
  "summary": {
    "total": 100,
    "pending": 82,
    "failed": 18,
    "imported": 0,
    "ignored": 0
  }
}
```

### Task 6: Update Existing Import Batch APIs

**Files:**
- Modify: `server/src/routes/admin/resources.ts`
- Modify: `server/src/services/resource-import/importer.ts`

- [ ] Make `/resource-imports` support filters:
  - `providerId`
  - `sourceType=API|JSON|XLSX|CSV`
  - `importType`
  - `status`

- [ ] Make `/resource-imports/items` return:
  - `externalId`
  - `externalUrl`
  - `filterCode`
  - `duplicateTargetId`

- [ ] Keep existing file import compatible.

- [ ] During confirm import:
  - create official records in one transaction per item
  - set imported official records `sourceType: IMPORT`
  - store import item ID in official record `sourceId`
  - for imported recipes, fill `importSourceType`, `sourceName`, `sourceRecipeId`, `sourceUrl`

## Admin Frontend Plan

### Task 7: Wire API Provider Pages To Backend

**Files:**
- Modify: `admin-frontend/src/app/types.ts`
- Modify: `admin-frontend/src/app/api.ts`
- Modify: `admin-frontend/src/app/pages/ApiProviderListPage.tsx`
- Modify: `admin-frontend/src/app/pages/ApiProviderFormPage.tsx`
- Modify: `admin-frontend/src/app/navigation.ts`

- [ ] Add type:

```ts
export type ResourceApiProviderItem = {
  id: number;
  name: string;
  providerName: string;
  resourceType: 'RECIPE' | 'INGREDIENT' | 'FRUIT' | 'SEASONING' | 'BEVERAGE';
  method: 'GET' | 'POST';
  endpointUrl: string;
  authType: 'NONE' | 'HEADER_TOKEN' | 'QUERY_KEY' | 'CUSTOM_HEADERS';
  appKey: string | null;
  defaultHeaders: Record<string, unknown> | null;
  defaultParams: Record<string, unknown> | null;
  dataPath: string;
  timeoutMs: number;
  dailyLimit: number;
  description: string | null;
  status: 'ACTIVE' | 'DISABLED';
  lastSyncedAt: string | null;
  lastTestedAt: string | null;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
};
```

- [ ] Add API functions:
  - `listResourceApiProviders`
  - `getResourceApiProvider`
  - `createResourceApiProvider`
  - `updateResourceApiProvider`
  - `setResourceApiProviderStatus`
  - `deleteResourceApiProvider`
  - `testResourceApiProvider`
  - `syncResourceApiProvider`

- [ ] Replace local-only demo state in `ApiProviderListPage` with backend pagination.

- [ ] Replace current save/test warning behavior in `ApiProviderFormPage` with real create/update/test calls.

- [ ] Add navigation child under “资源管理”:

```ts
{ label: 'API 接口管理', path: '/resources/api-providers', permission: 'resource:provider:view' }
```

### Task 8: Add API Sync Entry In Resource Access Center

**Files:**
- Modify: `admin-frontend/src/app/pages/ResourceAccessCenterPage.tsx`
- Modify: `admin-frontend/src/app/types.ts`
- Modify: `admin-frontend/src/app/api.ts`

- [ ] Add a “从 API 同步” panel beside file upload:
  - Provider select
  - limit input, default 100, max 500
  - optional JSON params textarea
  - “测试连接” button
  - “同步到导入池” button

- [ ] After sync success:
  - show batch ID
  - route to `/resource-management/access-center?batchId=<id>`
  - refresh staged items

- [ ] Show per-row fields:
  - `externalId`
  - `filterCode`
  - `duplicateTargetId`
  - existing `errorMessage`

### Task 9: Improve Import Record Filters

**Files:**
- Modify: `admin-frontend/src/app/pages/ResourceImportRecordsPage.tsx`
- Modify: `admin-frontend/src/app/api.ts`

- [ ] Add filters:
  - import type
  - source type
  - provider

- [ ] In batch table show:
  - source type
  - provider/source name
  - total/success/failed
  - createdBy
  - createdAt/finishedAt

## End-to-End Verification Plan

### Task 10: Add Lightweight Integration Script

**Files:**
- Create: `server/src/__tests__/resource-api-import.test.ts`

- [ ] The script should use existing style from [server/src/__tests__/page-modules.test.ts](/Users/oooz/Desktop/Z_ou/chufangapp/server/src/__tests__/page-modules.test.ts).

- [ ] Test sequence:
  - login admin and get token, or read `ADMIN_TOKEN` from env for local runs
  - create provider pointing to a local mock endpoint or a simple known JSON fixture endpoint
  - call provider test
  - call provider sync
  - assert import batch exists
  - assert items include `PENDING` and `FAILED` cases
  - confirm pending items
  - assert formal table count increased
  - assert C端 list API returns imported item when publish rules allow it

- [ ] Run command:

```bash
cd server
npx tsx src/__tests__/resource-api-import.test.ts
```

### Task 11: Manual Local Acceptance

**Commands:**

```bash
cd server
npm run prisma:generate
npm run prisma:deploy
npm run build
npm run dev
```

```bash
cd admin-frontend
npm run build
npm run dev
```

**Acceptance checklist:**

- [ ] Admin can create a provider for each type: 菜谱、蔬菜、水果、调料、酒水.
- [ ] Provider test shows fetched count and first 3 mapped rows.
- [ ] Sync creates one `ResourceImportBatch` and multiple `ResourceImportItem` rows.
- [ ] Invalid rows stay in the 隔离池 as `FAILED` with clear `filterCode` and `errorMessage`.
- [ ] Duplicate rows do not enter official tables.
- [ ] Admin can edit a failed row and make it `PENDING`.
- [ ] Admin can ignore a row.
- [ ] Admin can batch confirm `PENDING` rows.
- [ ] Confirmed菜谱进入 `recipes`、`recipe_steps`、`recipe_ingredients`.
- [ ] Confirmed蔬菜/水果/调料进入 `ingredients` with correct category type.
- [ ] Confirmed酒水进入 `beverages`.
- [ ] C端接口 can list imported published records:
  - `GET /api/recipes`
  - `GET /api/ingredients`
  - `GET /api/beverages`

## Risk Notes

- 外部 API 返回结构未知。Provider 必须支持 `dataPath` 和 `defaultParams`，并在测试连接中展示解析结果。
- 敏感字段不能明文返回前端。详情接口只能返回 masked secret state.
- 当前 `resources.ts` 已经较大，直接继续堆逻辑会变难维护。实施时优先抽 service，再接 API Provider。
- `INGREDIENT` 同时承载蔬菜和普通食材。后台文案要解释清楚，避免运营以为有独立蔬菜表。
- 如果外部 API 图片是防盗链或临时 URL，第一版只保存 URL，不下载图片；后续再做图片转存。
- 如果需要定时同步，后面再加 cron 或任务表；MVP 只做手动同步。

## Recommended Implementation Order

1. 数据库 Provider 模型和 import batch/item 扩展。
2. 抽离现有导入 mapper/validator/importer，保持文件导入不破。
3. 接 Provider CRUD/test/sync 后端接口。
4. 接后台 API Provider 列表和表单。
5. 在资源接入中心加“从 API 同步”。
6. 增强导入记录和隔离条目展示。
7. 跑后端 build、后台 build、轻量集成脚本。
8. 用一组真实或模拟公共资源 API 跑通端到端。
