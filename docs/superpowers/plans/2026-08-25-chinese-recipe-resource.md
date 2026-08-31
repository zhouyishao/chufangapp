# Chinese Recipe Resource Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the overseas-first recipe import flow with a governed Chinese-recipe pipeline that admits, reviews, imports, and publishes traceable Chinese home-cooking recipes.

**Architecture:** Keep the existing Provider → raw record → import batch/item → formal recipe → audit → publish pipeline. Add focused recipe policy modules for provider eligibility, Chinese-content admission, category mapping, quality scoring, and confirmation gates; persist the evaluation on import items and formal recipes so the admin can filter and repair data without deleting history.

**Tech Stack:** Express 5, TypeScript 6, Prisma 7, PostgreSQL, React 18, Ant Design/ProComponents-compatible project components, Node test runner, `tsx`.

## Global Constraints

- Only Chinese household recipes enter the new primary recipe pipeline.
- Do not delete providers, batches, raw responses, recipes, or Git history.
- Do not clear the database or run destructive migrations.
- Third-party API keys remain server-side and must not appear in code, responses, URLs shown to users, or logs.
- Imported recipes remain `auditStatus = PENDING` and `isPublish = false` until explicit review and publish actions.
- `themealdb_recipe` and `mock_recipe` remain available for historical traceability but cannot create new recipe import batches.
- The first publishable catalog target is 100–150 Chinese recipes; the implementation must not auto-publish content to reach that number.
- Do not modify `admin-backend/` or `backend/`.
- Preserve all unrelated dirty-worktree changes and stage only files from the active task.

---

## File Structure

### New files

- `server/src/services/resource-import/chinese-recipe-policy.ts`: title normalization, category mapping, admission rules, and quality scoring.
- `server/src/services/resource-import/recipe-provider-policy.ts`: provider role classification and server-side sync eligibility.
- `server/src/__tests__/chinese-recipe-policy.test.ts`: policy unit tests.
- `server/src/__tests__/recipe-provider-policy.test.ts`: provider eligibility unit tests.
- `server/src/__tests__/chinese-recipe-import-contract.test.ts`: route, importer, and schema contract coverage.
- `server/prisma/migrations/20260825120000_add_recipe_import_quality/migration.sql`: additive import-quality columns and indexes.
- `server/prisma/repair-chinese-recipes.ts`: dry-run-first historical recipe and import-pool repair command.
- `server/src/__tests__/repair-chinese-recipes-contract.test.ts`: repair safety contract.
- `admin-frontend/src/app/pages/chinese-recipe-resource-contract.test.mjs`: admin API/UI contract test.

### Existing files to modify

- `server/prisma/schema.prisma`: persist import evaluation and formal recipe import quality.
- `server/src/services/resource-import/provider-presets.ts`: keep Chinese providers active and idempotently disable known overseas/test recipe providers.
- `server/src/routes/admin/resource-api-providers.ts`: expose provider role and enforce provider eligibility during sync.
- `server/src/routes/admin/resources.ts`: persist quality evaluation, expose filters, add bulk ignore, and enforce confirmation threshold.
- `server/src/services/resource-import/importer.ts`: copy quality score into a formal recipe and preserve current pending/unpublished defaults.
- `server/src/routes/admin/recipes.ts`: block publishing incomplete or unmanaged-media imported recipes.
- `server/package.json`: add dry-run/apply repair scripts.
- `admin-frontend/src/app/types.ts`: add recipe source role and import-quality fields.
- `admin-frontend/src/app/api.ts`: add import quality filters and bulk-ignore request.
- `admin-frontend/src/app/pages/ApiProviderListPage.tsx`: show source role and prevent sync for ineligible providers.
- `admin-frontend/src/app/pages/ApiProviderFormPage.tsx`: capture the source terms URL and reusable-content license/authorization note.
- `admin-frontend/src/app/pages/ResourceAccessCenterPage.tsx`: show and filter Chinese recipe quality; bulk-ignore overseas candidates.
- `admin-frontend/src/app/pages/RecipesPage.tsx`: show source/quality indicators and surface publish validation errors.
- `docs/backend/api-spec.md`: document new query fields, bulk ignore, and publish rules.
- `docs/backend/database-schema.md`: document the additive quality fields and data-repair behavior.

---

### Task 1: Persist Recipe Import Evaluation

**Files:**
- Modify: `server/prisma/schema.prisma`
- Create: `server/prisma/migrations/20260825120000_add_recipe_import_quality/migration.sql`
- Test: `server/src/__tests__/chinese-recipe-import-contract.test.ts`

**Interfaces:**
- Produces: `ResourceImportItem.qualityScore: number | null`, `ResourceImportItem.isChinese: boolean | null`, `ResourceImportItem.qualityIssues: Prisma.JsonValue | null`, `Recipe.importQualityScore: number | null`, `ResourceApiProvider.termsUrl: string | null`, and `ResourceApiProvider.licenseNote: string | null`.
- Consumes: existing `ResourceImportItem.mappedData`, `filterCode`, `status`, and `Recipe.sourceType` fields.

- [ ] **Step 1: Write the failing schema contract test**

```ts
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

test('recipe import quality fields are additive and indexed', () => {
  const schema = readFileSync(resolve(__dirname, '../../prisma/schema.prisma'), 'utf8');
  const migration = readFileSync(
    resolve(__dirname, '../../prisma/migrations/20260825120000_add_recipe_import_quality/migration.sql'),
    'utf8'
  );

  assert.match(schema, /qualityScore\s+Int\?\s+@map\("quality_score"\)/);
  assert.match(schema, /isChinese\s+Boolean\?\s+@map\("is_chinese"\)/);
  assert.match(schema, /qualityIssues\s+Json\?\s+@map\("quality_issues"\)/);
  assert.match(schema, /importQualityScore\s+Int\?\s+@map\("import_quality_score"\)/);
  assert.match(schema, /termsUrl\s+String\?\s+@map\("terms_url"\)/);
  assert.match(schema, /licenseNote\s+String\?\s+@map\("license_note"\)/);
  assert.match(migration, /ADD COLUMN "quality_score" INTEGER/);
  assert.match(migration, /CREATE INDEX "resource_import_items_recipe_quality_idx"/);
  assert.doesNotMatch(migration, /DROP TABLE|TRUNCATE|DELETE FROM/);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd server && npx tsx --test src/__tests__/chinese-recipe-import-contract.test.ts`

Expected: FAIL because the migration and quality fields do not exist.

- [ ] **Step 3: Add the Prisma fields and non-destructive migration**

Add to `Recipe`:

```prisma
  importQualityScore Int? @map("import_quality_score")
```

Add to `ResourceImportItem`:

```prisma
  qualityScore  Int?     @map("quality_score")
  isChinese     Boolean? @map("is_chinese")
  qualityIssues Json?    @map("quality_issues")

  @@index([status, isChinese, qualityScore], map: "resource_import_items_recipe_quality_idx")
```

Add to `ResourceApiProvider`:

```prisma
  termsUrl   String? @map("terms_url") @db.VarChar(500)
  licenseNote String? @map("license_note") @db.Text
```

Create the migration with exactly additive statements:

```sql
ALTER TABLE "recipes"
  ADD COLUMN "import_quality_score" INTEGER;

ALTER TABLE "resource_import_items"
  ADD COLUMN "quality_score" INTEGER,
  ADD COLUMN "is_chinese" BOOLEAN,
  ADD COLUMN "quality_issues" JSONB;

ALTER TABLE "resource_api_providers"
  ADD COLUMN "terms_url" VARCHAR(500),
  ADD COLUMN "license_note" TEXT;

CREATE INDEX "resource_import_items_recipe_quality_idx"
  ON "resource_import_items" ("status", "is_chinese", "quality_score");
```

- [ ] **Step 4: Generate Prisma client and run schema contract**

Run: `cd server && npm run prisma:generate && npx tsx --test src/__tests__/chinese-recipe-import-contract.test.ts`

Expected: Prisma generation succeeds and the schema contract passes.

- [ ] **Step 5: Commit Task 1**

```bash
git add server/prisma/schema.prisma server/prisma/migrations/20260825120000_add_recipe_import_quality/migration.sql server/src/__tests__/chinese-recipe-import-contract.test.ts
git commit -m "feat: persist recipe import quality"
```

---

### Task 2: Implement Chinese Recipe Admission and Quality Scoring

**Files:**
- Create: `server/src/services/resource-import/chinese-recipe-policy.ts`
- Create: `server/src/__tests__/chinese-recipe-policy.test.ts`

**Interfaces:**
- Consumes: `NormalizedResourcePayload` from `server/src/services/resource-import/types.ts`.
- Produces: `containsChineseText(value: string): boolean`, `normalizeImportedRecipeTitle(value: string): string`, `mapChineseRecipeCategory(value: string | null | undefined): string | null`, and `evaluateChineseRecipeCandidate(payload: NormalizedResourcePayload): ChineseRecipeEvaluation`.

- [ ] **Step 1: Write failing policy tests**

```ts
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  containsChineseText,
  evaluateChineseRecipeCandidate,
  mapChineseRecipeCategory,
  normalizeImportedRecipeTitle
} from '../services/resource-import/chinese-recipe-policy';

test('normalizes Chinese recipe titles and rejects test-only titles', () => {
  assert.equal(normalizeImportedRecipeTitle('  E2E_20260825_番茄炒蛋  '), '番茄炒蛋');
  assert.equal(containsChineseText('番茄炒蛋'), true);
  assert.equal(containsChineseText('Chicken Handi'), false);
});

test('maps known Chinese categories without creating overseas categories', () => {
  assert.equal(mapChineseRecipeCategory('蔬菜类'), '素菜');
  assert.equal(mapChineseRecipeCategory('家常菜'), '家常菜');
  assert.equal(mapChineseRecipeCategory('Chicken'), null);
});

test('scores a complete Chinese recipe at or above confirmation threshold', () => {
  const result = evaluateChineseRecipeCandidate({
    name: '番茄炒蛋',
    title: '番茄炒蛋',
    categoryName: '家常菜',
    cover: 'https://example.com/tomato-eggs.webp',
    ingredients: [{ name: '番茄' }, { name: '鸡蛋' }],
    steps: ['番茄切块，鸡蛋打散', '先炒鸡蛋，再加入番茄翻炒'],
    sourceName: '厨房计划 - 中文菜谱 API',
    externalId: 'cn-001',
    externalUrl: 'https://example.com/recipes/cn-001'
  });

  assert.equal(result.isChinese, true);
  assert.equal(result.categoryName, '家常菜');
  assert.equal(result.hardFailure, false);
  assert.ok(result.qualityScore >= 80);
});

test('hard-fails overseas or structurally incomplete recipes', () => {
  const overseas = evaluateChineseRecipeCandidate({
    name: 'Chicken Handi',
    ingredients: [{ name: 'Chicken' }, { name: 'Salt' }],
    steps: ['Cook the chicken'],
    categoryName: 'Chicken'
  });
  const incomplete = evaluateChineseRecipeCandidate({
    name: '番茄炒蛋',
    ingredients: [{ name: '番茄' }],
    steps: []
  });

  assert.equal(overseas.filterCode, 'NON_CHINESE_RECIPE');
  assert.equal(incomplete.filterCode, 'INCOMPLETE_RECIPE');
});

test('requires mapped category and traceable source before confirmation', () => {
  const unmapped = evaluateChineseRecipeCandidate({
    name: '番茄炒蛋', categoryName: 'Chicken',
    ingredients: [{ name: '番茄' }, { name: '鸡蛋' }], steps: ['翻炒'],
    sourceName: '来源', externalId: '1'
  });
  const untraceable = evaluateChineseRecipeCandidate({
    name: '番茄炒蛋', categoryName: '家常菜',
    ingredients: [{ name: '番茄' }, { name: '鸡蛋' }], steps: ['翻炒']
  });

  assert.equal(unmapped.filterCode, 'UNMAPPED_RECIPE_CATEGORY');
  assert.equal(untraceable.filterCode, 'UNTRACEABLE_RECIPE_SOURCE');
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd server && npx tsx --test src/__tests__/chinese-recipe-policy.test.ts`

Expected: FAIL because `chinese-recipe-policy.ts` does not exist.

- [ ] **Step 3: Implement the policy module**

Create these exact public types and exports:

```ts
import type { NormalizedResourcePayload } from './types';

export type ChineseRecipeEvaluation = {
  mappedData: NormalizedResourcePayload;
  isChinese: boolean;
  categoryName: string | null;
  qualityScore: number;
  qualityIssues: string[];
  hardFailure: boolean;
  filterCode: 'NON_CHINESE_RECIPE' | 'INCOMPLETE_RECIPE' | 'INVALID_RECIPE_TITLE' | 'TEST_RECIPE_TITLE' | 'UNMAPPED_RECIPE_CATEGORY' | 'UNTRACEABLE_RECIPE_SOURCE' | null;
  errorMessage: string | null;
};

export const CHINESE_RECIPE_CATEGORIES = [
  '家常菜', '快手菜', '素菜', '荤菜', '汤羹', '凉菜', '主食', '早餐', '烘焙', '地方菜', '节气时令'
] as const;

const CATEGORY_ALIASES: Record<string, (typeof CHINESE_RECIPE_CATEGORIES)[number]> = {
  家常菜: '家常菜',
  家常: '家常菜',
  快手菜: '快手菜',
  素菜: '素菜',
  素食: '素菜',
  蔬菜类: '素菜',
  荤菜: '荤菜',
  肉类: '荤菜',
  汤: '汤羹',
  汤羹: '汤羹',
  凉菜: '凉菜',
  凉拌: '凉菜',
  主食: '主食',
  面食: '主食',
  早餐: '早餐',
  烘焙: '烘焙',
  地方菜: '地方菜',
  时令菜: '节气时令',
  节气时令: '节气时令'
};

export const containsChineseText = (value: string): boolean => /[\u3400-\u9fff]/u.test(value);

export const normalizeImportedRecipeTitle = (value: string): string => value
  .trim()
  .replace(/^(?:E2E[_-]?\d*[_-]?|测试[_-]?)/i, '')
  .replace(/^\d+[._-]?/, '')
  .trim();

export const mapChineseRecipeCategory = (value: string | null | undefined): string | null => {
  const normalized = String(value ?? '').trim();
  return normalized ? CATEGORY_ALIASES[normalized] ?? null : null;
};

const entryCount = (value: unknown): number => Array.isArray(value)
  ? value.filter((item) => {
      if (typeof item === 'string') return item.trim().length > 0;
      return Boolean(item && typeof item === 'object' && String((item as { name?: unknown; description?: unknown }).name ?? (item as { description?: unknown }).description ?? '').trim());
    }).length
  : 0;

export const evaluateChineseRecipeCandidate = (payload: NormalizedResourcePayload): ChineseRecipeEvaluation => {
  const originalTitle = payload.title?.trim() || payload.name.trim();
  const title = normalizeImportedRecipeTitle(originalTitle);
  const isChinese = containsChineseText(title);
  const categoryName = mapChineseRecipeCategory(payload.categoryName);
  const ingredientCount = entryCount(payload.ingredients);
  const stepCount = entryCount(payload.steps);
  const qualityIssues: string[] = [];
  let qualityScore = 0;

  if (isChinese && title.length >= 2 && title.length <= 40) qualityScore += 20;
  else qualityIssues.push('中文标题无效');
  if (categoryName) qualityScore += 15;
  else qualityIssues.push('分类待映射');
  if (ingredientCount >= 2) qualityScore += 20;
  else qualityIssues.push('有效用料少于2项');
  if (stepCount >= 1) qualityScore += 20;
  else qualityIssues.push('制作步骤为空');
  if (payload.cover) qualityScore += 15;
  else qualityIssues.push('缺少封面');
  if ((payload.sourceName && payload.externalId) || payload.externalUrl) qualityScore += 10;
  else qualityIssues.push('来源不可追溯');

  const invalidTitle = !title || title.length < 2 || title.length > 40;
  const incomplete = ingredientCount < 2 || stepCount < 1;
  const testTitle = /(?:E2E|测试|^\d+$)/i.test(originalTitle);
  const traceable = Boolean((payload.sourceName && payload.externalId) || payload.externalUrl);
  const filterCode = testTitle
    ? 'TEST_RECIPE_TITLE'
    : invalidTitle
      ? 'INVALID_RECIPE_TITLE'
      : !isChinese
        ? 'NON_CHINESE_RECIPE'
        : incomplete
          ? 'INCOMPLETE_RECIPE'
          : !categoryName
            ? 'UNMAPPED_RECIPE_CATEGORY'
            : !traceable
              ? 'UNTRACEABLE_RECIPE_SOURCE'
              : null;

  return {
    mappedData: { ...payload, name: title, title, categoryName },
    isChinese,
    categoryName,
    qualityScore,
    qualityIssues,
    hardFailure: filterCode !== null,
    filterCode,
    errorMessage: filterCode ? qualityIssues.join('；') : null
  };
};
```

- [ ] **Step 4: Run policy tests**

Run: `cd server && npx tsx --test src/__tests__/chinese-recipe-policy.test.ts`

Expected: 4 tests pass.

- [ ] **Step 5: Commit Task 2**

```bash
git add server/src/services/resource-import/chinese-recipe-policy.ts server/src/__tests__/chinese-recipe-policy.test.ts
git commit -m "feat: validate Chinese recipe candidates"
```

---

### Task 3: Enforce Recipe Provider Roles

**Files:**
- Create: `server/src/services/resource-import/recipe-provider-policy.ts`
- Create: `server/src/__tests__/recipe-provider-policy.test.ts`
- Modify: `server/src/services/resource-import/provider-presets.ts`
- Modify: `server/src/routes/admin/resource-api-providers.ts`

**Interfaces:**
- Produces: `RecipeProviderRole`, `getRecipeProviderRole(providerCode)`, and `assertRecipeProviderCanSync(provider)`.
- Consumes: Provider objects containing `providerCode`, `resourceType`, and `status`.
- Produces API field: `recipeSourceRole: 'PRIMARY' | 'SUPPLEMENTAL' | 'OVERSEAS' | 'TEST' | null`.
- Persists provider governance fields: `termsUrl` and `licenseNote` through create/update/detail APIs.

- [ ] **Step 1: Write failing provider policy tests**

```ts
import assert from 'node:assert/strict';
import test from 'node:test';

import { assertRecipeProviderCanSync, getRecipeProviderRole } from '../services/resource-import/recipe-provider-policy';

test('classifies known recipe providers', () => {
  assert.equal(getRecipeProviderRole('proj_kitchen'), 'PRIMARY');
  assert.equal(getRecipeProviderRole('tianapi_caipu'), 'SUPPLEMENTAL');
  assert.equal(getRecipeProviderRole('themealdb_recipe'), 'OVERSEAS');
  assert.equal(getRecipeProviderRole('mock_recipe'), 'TEST');
});

test('allows active Chinese providers and rejects disabled or overseas providers', () => {
  assert.doesNotThrow(() => assertRecipeProviderCanSync({
    providerCode: 'proj_kitchen', resourceType: 'RECIPE', status: 'ACTIVE', licenseNote: '已确认允许导入并展示，保留来源署名'
  }));
  assert.throws(() => assertRecipeProviderCanSync({
    providerCode: 'themealdb_recipe', resourceType: 'RECIPE', status: 'ACTIVE', licenseNote: '历史来源'
  }), /不允许同步中国菜谱/);
  assert.throws(() => assertRecipeProviderCanSync({
    providerCode: 'proj_kitchen', resourceType: 'RECIPE', status: 'DISABLED', licenseNote: '已确认'
  }), /Provider 已禁用/);
  assert.throws(() => assertRecipeProviderCanSync({
    providerCode: 'proj_kitchen', resourceType: 'RECIPE', status: 'ACTIVE', licenseNote: null
  }), /未确认内容许可/);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd server && npx tsx --test src/__tests__/recipe-provider-policy.test.ts`

Expected: FAIL because the provider policy module does not exist.

- [ ] **Step 3: Implement provider policy**

```ts
import { HttpError } from '../../http/errors';

export type RecipeProviderRole = 'PRIMARY' | 'SUPPLEMENTAL' | 'OVERSEAS' | 'TEST';

const RECIPE_PROVIDER_ROLES: Record<string, RecipeProviderRole> = {
  proj_kitchen: 'PRIMARY',
  tianapi_caipu: 'SUPPLEMENTAL',
  themealdb_recipe: 'OVERSEAS',
  mock_recipe: 'TEST'
};

export const getRecipeProviderRole = (providerCode: string): RecipeProviderRole | null =>
  RECIPE_PROVIDER_ROLES[providerCode.trim().toLowerCase()] ?? null;

export const assertRecipeProviderCanSync = (provider: {
  providerCode: string;
  resourceType: string;
  status: string;
  licenseNote?: string | null;
}): void => {
  if (provider.status !== 'ACTIVE') throw new HttpError('Provider 已禁用，不能同步', 409, 409);
  if (provider.resourceType !== 'RECIPE') return;
  const role = getRecipeProviderRole(provider.providerCode);
  if (role !== 'PRIMARY' && role !== 'SUPPLEMENTAL') {
    throw new HttpError('该 Provider 不允许同步中国菜谱', 409, 409);
  }
  if (!provider.licenseNote?.trim()) {
    throw new HttpError('该中国菜谱 Provider 未确认内容许可，不能执行生产同步', 409, 409);
  }
};
```

- [ ] **Step 4: Disable known overseas/test providers idempotently and expose roles**

At the end of `ensureDefaultResourceApiProviders`, add:

```ts
await prisma.resourceApiProvider.updateMany({
  where: { providerCode: { in: ['themealdb_recipe', 'mock_recipe'] } },
  data: {
    status: 'DISABLED',
    lastError: '已退出中国菜谱主导入链路，历史数据仅供追溯'
  }
});
```

In `serializeProvider`, add:

```ts
recipeSourceRole: provider.resourceType === 'RECIPE'
  ? getRecipeProviderRole(provider.providerCode)
  : null,
```

Extend `providerSchema`, create, and update mappings with:

```ts
termsUrl: z.string().trim().url().max(500).nullable().optional(),
licenseNote: z.string().trim().max(4000).nullable().optional(),
```

Persist them as `termsUrl: parsed.data.termsUrl ?? null` and `licenseNote: parsed.data.licenseNote ?? null`. Newly created preset rows use the database `null` default; preset refreshes must not overwrite terms or license notes later recorded by an administrator. A missing note must never be interpreted as permission to run a production content sync.

In both saved and draft sync/test paths, call `assertRecipeProviderCanSync` only before a real sync; connection tests remain available for disabled providers so administrators can diagnose historical configurations.

- [ ] **Step 5: Run provider policy and server build**

Run: `cd server && npx tsx --test src/__tests__/recipe-provider-policy.test.ts && npm run build`

Expected: provider policy tests and TypeScript build pass.

- [ ] **Step 6: Commit Task 3**

```bash
git add server/src/services/resource-import/recipe-provider-policy.ts server/src/__tests__/recipe-provider-policy.test.ts server/src/services/resource-import/provider-presets.ts server/src/routes/admin/resource-api-providers.ts
git commit -m "feat: restrict recipe import providers"
```

---

### Task 4: Stage, Filter, and Bulk-Ignore Chinese Recipe Candidates

**Files:**
- Modify: `server/src/routes/admin/resource-api-providers.ts`
- Modify: `server/src/routes/admin/resources.ts`
- Test: `server/src/__tests__/chinese-recipe-import-contract.test.ts`

**Interfaces:**
- Consumes: `evaluateChineseRecipeCandidate(mapped)` from Task 2 and `assertRecipeProviderCanSync(provider)` from Task 3.
- Produces query parameters: `isChinese?: boolean`, `minQuality?: number`, `maxQuality?: number` on `GET /api/admin/resource-imports/items`.
- Produces endpoint: `POST /api/admin/resource-imports/items/bulk-ignore` with `{ itemIds: number[], reason: string }`.

- [ ] **Step 1: Extend the failing contract test for route behavior**

Add:

```ts
test('recipe sync persists Chinese quality and exposes governed filters', () => {
  const providerRoute = readFileSync(resolve(__dirname, '../routes/admin/resource-api-providers.ts'), 'utf8');
  const resourceRoute = readFileSync(resolve(__dirname, '../routes/admin/resources.ts'), 'utf8');

  assert.match(providerRoute, /assertRecipeProviderCanSync\(provider\)/);
  assert.match(providerRoute, /evaluateChineseRecipeCandidate\(mapped\)/);
  assert.match(providerRoute, /qualityScore:/);
  assert.match(providerRoute, /isChinese:/);
  assert.match(providerRoute, /qualityIssues:/);
  assert.match(providerRoute, /status:\s*'FAILED'/);
  assert.match(providerRoute, /lastError:/);
  assert.match(resourceRoute, /minQuality/);
  assert.match(resourceRoute, /maxQuality/);
  assert.match(resourceRoute, /bulk-ignore/);
  assert.match(resourceRoute, /status:\s*'IGNORED'/);
});
```

- [ ] **Step 2: Run the contract to verify it fails**

Run: `cd server && npx tsx --test src/__tests__/chinese-recipe-import-contract.test.ts`

Expected: FAIL on missing policy integration and bulk-ignore route.

- [ ] **Step 3: Persist failed sync attempts without creating empty items**

Wrap `fetchProviderPreview` in the sync route:

```ts
let preview: Awaited<ReturnType<typeof fetchProviderPreview>>;
try {
  preview = await fetchProviderPreview(runtime, parsed.data.limit, parsed.data.params ?? {}, 'sync');
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : '未知同步错误';
  await prisma.$transaction([
    prisma.resourceImportBatch.create({
      data: {
        importType: provider.resourceType,
        sourceType: 'API',
        fileName: `公共资源-${provider.providerName}-${new Date().toISOString().slice(0, 10)}`,
        status: 'FAILED',
        totalCount: 0,
        successCount: 0,
        failedCount: 0,
        errorMessage,
        createdBy: req.admin?.username || 'admin',
        providerId: provider.id,
        sourceName: provider.providerName,
        requestSnapshot: buildRequestSnapshot(
          provider.method,
          provider.endpointUrl,
          provider.dataPath,
          parsed.data.params ?? {},
          provider.providerName
        ) as Prisma.InputJsonValue,
        finishedAt: new Date()
      }
    }),
    prisma.resourceApiProvider.update({
      where: { id: provider.id },
      data: { lastError: errorMessage }
    })
  ]);
  throw new HttpError(`同步失败：${errorMessage}`, 502, 502);
}
```

HTTP 429, timeouts, provider business errors, and mapping-independent transport failures follow this path. No `ResourceImportItem` is created for a zero-row failed batch.

- [ ] **Step 4: Integrate quality evaluation into provider sync**

After `normalizeResourcePayload` and before duplicate checks:

```ts
const baseEvaluation = evaluateResourcePayload(resourceType, mapped);
const recipeEvaluation = resourceType === 'RECIPE'
  ? evaluateChineseRecipeCandidate(mapped)
  : null;
const governedMapped = recipeEvaluation?.mappedData ?? mapped;
let status = baseEvaluation.status;
let errorMessage = baseEvaluation.errorMessage;
let filterCode = baseEvaluation.filterCode;

if (recipeEvaluation?.hardFailure) {
  status = 'FAILED';
  errorMessage = recipeEvaluation.errorMessage;
  filterCode = recipeEvaluation.filterCode;
}
```

Use `governedMapped` for duplicate checks and persistence, and add to staged/createMany data:

```ts
qualityScore: recipeEvaluation?.qualityScore ?? null,
isChinese: recipeEvaluation?.isChinese ?? null,
qualityIssues: recipeEvaluation?.qualityIssues
  ? (recipeEvaluation.qualityIssues as Prisma.InputJsonValue)
  : Prisma.DbNull,
```

- [ ] **Step 5: Add list filters and serialized fields**

Extend the item query schema:

```ts
isChinese: z.coerce.boolean().optional(),
minQuality: z.coerce.number().int().min(0).max(100).optional(),
maxQuality: z.coerce.number().int().min(0).max(100).optional()
```

Add to the Prisma `where` object:

```ts
...(typeof isChinese === 'boolean' ? { isChinese } : {}),
...(minQuality !== undefined || maxQuality !== undefined
  ? { qualityScore: { ...(minQuality !== undefined ? { gte: minQuality } : {}), ...(maxQuality !== undefined ? { lte: maxQuality } : {}) } }
  : {})
```

Return `qualityScore`, `isChinese`, and `qualityIssues` in list and detail serializers.

- [ ] **Step 6: Add safe bulk ignore**

Implement before the parameterized `/:id` import route:

```ts
adminResourcesRouter.post('/resource-imports/items/bulk-ignore', requireAdminAuth, async (req, res) => {
  const parsed = z.object({
    itemIds: z.array(z.coerce.number().int().positive()).min(1).max(500),
    reason: z.string().trim().min(2).max(200)
  }).safeParse(req.body);
  if (!parsed.success) throw formatZodError(parsed);

  const items = await prisma.resourceImportItem.findMany({
    where: { id: { in: parsed.data.itemIds }, status: { in: ['PENDING', 'FAILED'] } },
    include: { batch: { select: { importType: true } } }
  });
  if (items.length !== new Set(parsed.data.itemIds).size || items.some((item) => item.batch.importType !== 'RECIPE')) {
    throw new HttpError('只能批量忽略待处理或失败的菜谱资源', 409, 409);
  }

  await prisma.$transaction(async (tx) => {
    await tx.resourceImportItem.updateMany({
      where: { id: { in: parsed.data.itemIds } },
      data: { status: 'IGNORED', errorMessage: parsed.data.reason, filterCode: 'MANUAL_IGNORE' }
    });
    await writeAdminOperationLog(tx, {
      adminId: req.admin!.id,
      module: 'resource',
      action: 'bulk_ignore_recipe_imports',
      method: req.method,
      path: req.originalUrl,
      detail: { itemIds: parsed.data.itemIds, reason: parsed.data.reason }
    });
  });
  res.json(ok({ updatedCount: items.length }));
});
```

Import `writeAdminOperationLog` from `../../services/admin-operation-log`. Keep the status update and operation log in the same transaction so the audit trail cannot diverge from the mutation.

- [ ] **Step 7: Run contracts and build**

Run: `cd server && npx tsx --test src/__tests__/chinese-recipe-policy.test.ts src/__tests__/recipe-provider-policy.test.ts src/__tests__/chinese-recipe-import-contract.test.ts && npm run build`

Expected: all selected tests and TypeScript build pass.

- [ ] **Step 8: Commit Task 4**

```bash
git add server/src/routes/admin/resource-api-providers.ts server/src/routes/admin/resources.ts server/src/__tests__/chinese-recipe-import-contract.test.ts
git commit -m "feat: stage governed Chinese recipes"
```

---

### Task 5: Enforce Confirmation and Publication Gates

**Files:**
- Modify: `server/src/routes/admin/resources.ts`
- Modify: `server/src/services/resource-import/importer.ts`
- Modify: `server/src/routes/admin/recipes.ts`
- Test: `server/src/__tests__/chinese-recipe-import-contract.test.ts`

**Interfaces:**
- Changes: `createOfficialRecord(db, resourceType, mapped, importItemId, sourceName, sourceUrl, importQualityScore?)`.
- Confirmation threshold: Chinese recipe, no hard failure, quality score at least 80.
- Publication threshold for imported recipes: approved, active, at least two ingredients, at least one step, and `coverFileId` present.

- [ ] **Step 1: Add failing confirmation/publication contracts**

```ts
test('confirmation and publication enforce Chinese recipe readiness', () => {
  const resourceRoute = readFileSync(resolve(__dirname, '../routes/admin/resources.ts'), 'utf8');
  const importer = readFileSync(resolve(__dirname, '../services/resource-import/importer.ts'), 'utf8');
  const recipeRoute = readFileSync(resolve(__dirname, '../routes/admin/recipes.ts'), 'utf8');

  assert.match(resourceRoute, /qualityScore < 80/);
  assert.match(resourceRoute, /evaluateChineseRecipeCandidate/);
  assert.match(importer, /importQualityScore:/);
  assert.match(recipeRoute, /coverFileId/);
  assert.match(recipeRoute, /菜谱发布前必须上传受管封面/);
  assert.match(recipeRoute, /有效用料至少需要2项/);
});
```

- [ ] **Step 2: Run the contract to verify it fails**

Run: `cd server && npx tsx --test src/__tests__/chinese-recipe-import-contract.test.ts`

Expected: FAIL on missing confirmation and publication gates.

- [ ] **Step 3: Re-evaluate candidates during confirmation**

Before calling `createOfficialRecord` for a recipe:

```ts
const recipeEvaluation = batch.importType === 'RECIPE'
  ? evaluateChineseRecipeCandidate(mapped as NormalizedResourcePayload)
  : null;
if (recipeEvaluation?.hardFailure || (recipeEvaluation && recipeEvaluation.qualityScore < 80)) {
  throw new Error(`中国菜谱质量未达标：${recipeEvaluation?.qualityIssues.join('；') || '未知问题'}`);
}
const governedMapped = recipeEvaluation?.mappedData ?? mapped;
```

Pass `recipeEvaluation?.qualityScore ?? null` to the importer and persist refreshed evaluation fields on the import item before or within the successful confirmation transaction.

- [ ] **Step 4: Extend importer signature and formal recipe data**

Change the signature:

```ts
export async function createOfficialRecord(
  db: DbClient,
  resourceType: ResourceImportType,
  mapped: NormalizedResourcePayload,
  importItemId: number,
  sourceName: string | null,
  sourceUrl: string | null,
  importQualityScore: number | null = null
): Promise<number>
```

Add to recipe creation:

```ts
importQualityScore,
```

Keep these existing safety defaults unchanged:

```ts
isDraft: true,
isPublish: false,
auditStatus: 'PENDING',
sourceType: 'IMPORT',
sourceId: importItemId,
```

- [ ] **Step 5: Add imported-recipe publication validation**

In the recipe publish route, load `coverFileId`, `sourceType`, `auditStatus`, `status`, and counts for steps/ingredients. When `isPublish` is true and `sourceType === 'IMPORT'`, enforce:

```ts
if (existing.auditStatus !== 'APPROVED') {
  throw new HttpError('菜谱审核通过后才能发布', 409, 409);
}
if (existing.status !== 'ACTIVE') {
  throw new HttpError('已停用菜谱不能发布', 409, 409);
}
if (!existing.coverFileId) {
  throw new HttpError('菜谱发布前必须上传受管封面', 409, 409);
}
if (existing.ingredients.length < 2) {
  throw new HttpError('菜谱有效用料至少需要2项', 409, 409);
}
if (existing.steps.length < 1) {
  throw new HttpError('菜谱至少需要1个制作步骤', 409, 409);
}
```

- [ ] **Step 6: Run targeted tests and build**

Run: `cd server && npx tsx --test src/__tests__/resource-import-safety.test.ts src/__tests__/chinese-recipe-policy.test.ts src/__tests__/chinese-recipe-import-contract.test.ts && npm run build`

Expected: all selected tests and TypeScript build pass.

- [ ] **Step 7: Commit Task 5**

```bash
git add server/src/routes/admin/resources.ts server/src/services/resource-import/importer.ts server/src/routes/admin/recipes.ts server/src/__tests__/chinese-recipe-import-contract.test.ts
git commit -m "feat: gate imported recipe publication"
```

---

### Task 6: Build a Dry-Run-First Historical Repair Command

**Files:**
- Create: `server/prisma/repair-chinese-recipes.ts`
- Create: `server/src/__tests__/repair-chinese-recipes-contract.test.ts`
- Modify: `server/package.json`

**Interfaces:**
- Produces commands: `npm run data:repair-chinese-recipes` for dry-run and `npm run data:repair-chinese-recipes:apply` for controlled mutation.
- Uses: `containsChineseText`, `normalizeImportedRecipeTitle`, and provider role classification from Tasks 2–3.
- Mutates only `Recipe.isPublish`, `Recipe.rejectReason`, `ResourceImportItem.status/errorMessage/filterCode`, and affected `ResourceImportBatch` counters.

- [ ] **Step 1: Write the failing repair safety contract**

```ts
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

test('Chinese recipe repair is dry-run by default and never deletes rows', () => {
  const script = readFileSync(resolve(__dirname, '../../prisma/repair-chinese-recipes.ts'), 'utf8');
  const packageJson = JSON.parse(readFileSync(resolve(__dirname, '../../package.json'), 'utf8')) as { scripts: Record<string, string> };

  assert.match(script, /const apply = process\.argv\.includes\('--apply'\)/);
  assert.match(script, /themealdb_recipe/);
  assert.match(script, /mock_recipe/);
  assert.match(script, /status:\s*'IGNORED'/);
  assert.match(script, /isPublish:\s*false/);
  assert.doesNotMatch(script, /\.delete\(|\.deleteMany\(|TRUNCATE|DROP TABLE/);
  assert.equal(packageJson.scripts['data:repair-chinese-recipes'], 'tsx prisma/repair-chinese-recipes.ts');
  assert.equal(packageJson.scripts['data:repair-chinese-recipes:apply'], 'tsx prisma/repair-chinese-recipes.ts --apply');
});
```

- [ ] **Step 2: Run the contract to verify it fails**

Run: `cd server && npx tsx --test src/__tests__/repair-chinese-recipes-contract.test.ts`

Expected: FAIL because the repair script and package scripts do not exist.

- [ ] **Step 3: Implement dry-run classification and reporting**

The script must:

```ts
const apply = process.argv.includes('--apply');
const TEST_TITLE = /(?:E2E|测试|^\d+$)/i;

const recipes = await prisma.recipe.findMany({ where: { deletedAt: null } });
const recipesToHide = recipes.filter((recipe) =>
  TEST_TITLE.test(recipe.title) || !containsChineseText(recipe.title)
);
const overseasItems = await prisma.resourceImportItem.findMany({
  where: {
    status: { in: ['PENDING', 'FAILED'] },
    batch: { importType: 'RECIPE', provider: { providerCode: { in: ['themealdb_recipe', 'mock_recipe'] } } }
  },
  select: { id: true, importId: true }
});

console.log(JSON.stringify({
  mode: apply ? 'apply' : 'dry-run',
  recipesToHide: recipesToHide.map((item) => ({ id: item.id, title: item.title })),
  importItemsToIgnore: overseasItems.map((item) => item.id)
}, null, 2));
```

Only inside `if (apply)`, run a transaction that:

```ts
await tx.recipe.updateMany({
  where: { id: { in: recipesToHide.map((item) => item.id) } },
  data: { isPublish: false, rejectReason: '中国菜谱资源治理：海外、英文或测试内容已隐藏' }
});
await tx.resourceImportItem.updateMany({
  where: { id: { in: overseasItems.map((item) => item.id) } },
  data: { status: 'IGNORED', errorMessage: '海外或测试菜谱不进入中国菜谱库', filterCode: 'SOURCE_NOT_ALLOWED' }
});
```

Then recalculate `totalCount`, `successCount`, `failedCount`, `status`, and `finishedAt` for only the distinct affected batch IDs. Count `IMPORTED` as success, `FAILED` as failure, and leave a batch pending only while it contains `PENDING` items.

- [ ] **Step 4: Add package scripts**

```json
"data:repair-chinese-recipes": "tsx prisma/repair-chinese-recipes.ts",
"data:repair-chinese-recipes:apply": "tsx prisma/repair-chinese-recipes.ts --apply"
```

- [ ] **Step 5: Run contract and dry-run**

Run: `cd server && npx tsx --test src/__tests__/repair-chinese-recipes-contract.test.ts && npm run data:repair-chinese-recipes`

Expected: test passes; command prints `"mode": "dry-run"` and proposed IDs without changing counts.

- [ ] **Step 6: Review dry-run output before applying**

Compare the printed recipe IDs and titles against the database audit. Do not run the apply command until the list contains only English/overseas/test recipes and overseas/test import items.

Run after review: `cd server && npm run data:repair-chinese-recipes:apply`

Expected: the same counts are reported with `"mode": "apply"`; no rows are deleted.

- [ ] **Step 7: Commit Task 6**

```bash
git add server/prisma/repair-chinese-recipes.ts server/src/__tests__/repair-chinese-recipes-contract.test.ts server/package.json
git commit -m "feat: repair historical recipe resources"
```

---

### Task 7: Expose Chinese Recipe Governance in the Admin

**Files:**
- Modify: `admin-frontend/src/app/types.ts`
- Modify: `admin-frontend/src/app/api.ts`
- Modify: `admin-frontend/src/app/pages/ApiProviderListPage.tsx`
- Modify: `admin-frontend/src/app/pages/ApiProviderFormPage.tsx`
- Modify: `admin-frontend/src/app/pages/ResourceAccessCenterPage.tsx`
- Modify: `admin-frontend/src/app/pages/RecipesPage.tsx`
- Create: `admin-frontend/src/app/pages/chinese-recipe-resource-contract.test.mjs`

**Interfaces:**
- Consumes API fields from Tasks 3–5: `recipeSourceRole`, `qualityScore`, `isChinese`, `qualityIssues`.
- Produces admin action: `bulkIgnoreImportItems(itemIds: number[], reason: string)`.

- [ ] **Step 1: Write the failing admin contract**

```js
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [types, api, providers, accessCenter, recipes] = await Promise.all([
  readFile(new URL('../types.ts', import.meta.url), 'utf8'),
  readFile(new URL('../api.ts', import.meta.url), 'utf8'),
  readFile(new URL('./ApiProviderListPage.tsx', import.meta.url), 'utf8'),
  readFile(new URL('./ResourceAccessCenterPage.tsx', import.meta.url), 'utf8'),
  readFile(new URL('./RecipesPage.tsx', import.meta.url), 'utf8')
]);

test('admin exposes governed Chinese recipe fields and actions', () => {
  assert.match(types, /recipeSourceRole/);
  assert.match(types, /qualityScore/);
  assert.match(types, /isChinese/);
  assert.match(api, /bulkIgnoreImportItems/);
  assert.match(api, /minQuality/);
  assert.match(providers, /中国菜谱主源/);
  assert.match(providers, /海外历史源/);
  assert.match(types, /termsUrl/);
  assert.match(types, /licenseNote/);
  assert.match(accessCenter, /质量分/);
  assert.match(accessCenter, /批量忽略海外菜谱/);
  assert.match(recipes, /导入质量/);
  assert.match(recipes, /数据来源/);
});
```

- [ ] **Step 2: Run the contract to verify it fails**

Run: `cd admin-frontend && node --test src/app/pages/chinese-recipe-resource-contract.test.mjs`

Expected: FAIL because governed fields/actions are not rendered.

- [ ] **Step 3: Extend admin types and API**

Add to `ResourceApiProviderItem`:

```ts
recipeSourceRole: 'PRIMARY' | 'SUPPLEMENTAL' | 'OVERSEAS' | 'TEST' | null;
termsUrl: string | null;
licenseNote: string | null;
```

Add to `ResourceImportStagedItem`:

```ts
qualityScore: number | null;
isChinese: boolean | null;
qualityIssues: string[] | null;
```

Extend list filters and add:

```ts
export const bulkIgnoreImportItems = async (itemIds: number[], reason: string) =>
  request<{ updatedCount: number }>('/resource-imports/items/bulk-ignore', {
    method: 'POST',
    body: JSON.stringify({ itemIds, reason })
  });
```

- [ ] **Step 4: Update provider list roles and actions**

Render roles with these labels:

```ts
const recipeSourceRoleLabels = {
  PRIMARY: '中国菜谱主源',
  SUPPLEMENTAL: '中国菜谱补充源',
  OVERSEAS: '海外历史源',
  TEST: '测试历史源'
} as const;
```

Disable or hide sync when a recipe provider role is `OVERSEAS` or `TEST`, while retaining View/Test actions.

In `ApiProviderFormPage.tsx`, add optional `来源条款地址` and `内容许可/授权说明` fields, pass them through create/update/test payloads, and show an inline warning when a Chinese recipe provider has no `licenseNote`. Testing a connection remains allowed; production sync remains an operational release gate until the note is completed.

- [ ] **Step 5: Update resource access center**

For recipe items, render Source, Chinese status, quality score, and `qualityIssues`. Add filters for Chinese status and quality range, and add a selected-row action:

```ts
await bulkIgnoreImportItems(selectedIds, '后台批量忽略海外或不符合定位的菜谱');
```

The button label is `批量忽略海外菜谱`, requires selected recipe rows, asks for confirmation, clears selection after success, and refreshes the list.

- [ ] **Step 6: Update formal recipe list**

Render `sourceName ?? '后台创建'` as `数据来源` and `importQualityScore ?? '-'` as `导入质量`. Continue surfacing server error messages when a publish request is rejected.

- [ ] **Step 7: Run contract and production build**

Run: `cd admin-frontend && node --test src/app/pages/chinese-recipe-resource-contract.test.mjs && npm run build`

Expected: contract and TypeScript/Vite production build pass. The existing bundle-size warning may remain; no new build error is acceptable.

- [ ] **Step 8: Commit Task 7**

```bash
git add admin-frontend/src/app/types.ts admin-frontend/src/app/api.ts admin-frontend/src/app/pages/ApiProviderListPage.tsx admin-frontend/src/app/pages/ApiProviderFormPage.tsx admin-frontend/src/app/pages/ResourceAccessCenterPage.tsx admin-frontend/src/app/pages/RecipesPage.tsx admin-frontend/src/app/pages/chinese-recipe-resource-contract.test.mjs
git commit -m "feat: manage Chinese recipe imports"
```

---

### Task 8: Document and Verify the Complete Flow

**Files:**
- Modify: `docs/backend/api-spec.md`
- Modify: `docs/backend/database-schema.md`
- Verify: all files changed in Tasks 1–7

**Interfaces:**
- Documents the final API and data contract used by the admin and future maintenance work.

- [ ] **Step 1: Update backend API documentation**

Document:

```markdown
### 中国菜谱资源治理

- 菜谱同步只允许 `PRIMARY` 和 `SUPPLEMENTAL` Provider。
- `GET /api/admin/resource-imports/items` 支持 `isChinese`、`minQuality`、`maxQuality`。
- `POST /api/admin/resource-imports/items/bulk-ignore` 只批量忽略待处理或失败的菜谱导入项。
- 中国菜谱确认导入要求质量分不低于 80，且标题为中文、至少两个用料、至少一个步骤。
- 导入菜谱发布前必须审核通过、状态启用、上传受管封面，并满足用料/步骤完整性。
```

- [ ] **Step 2: Update database documentation**

Document the exact new fields:

```markdown
- `resource_import_items.quality_score`：0–100 的导入质量分。
- `resource_import_items.is_chinese`：是否通过中文标题识别。
- `resource_import_items.quality_issues`：需要人工修正的字段问题列表。
- `recipes.import_quality_score`：确认导入时复制的质量分。
- `resource_api_providers.terms_url`：来源使用条款或开放数据说明地址。
- `resource_api_providers.license_note`：后台记录的内容许可、授权范围和署名要求。
- 历史修复命令默认 dry-run，只隐藏海外/测试正式菜谱并忽略海外/测试导入项，不删除数据。
```

- [ ] **Step 3: Run server verification**

Run:

```bash
cd server
npm run prisma:generate
npx tsx --test src/__tests__/chinese-recipe-policy.test.ts src/__tests__/recipe-provider-policy.test.ts src/__tests__/chinese-recipe-import-contract.test.ts src/__tests__/repair-chinese-recipes-contract.test.ts src/__tests__/resource-import-safety.test.ts
npm run build
```

Expected: all selected tests pass and TypeScript build exits 0.

- [ ] **Step 4: Run admin verification**

Run:

```bash
cd admin-frontend
node --test src/app/pages/chinese-recipe-resource-contract.test.mjs
npm run build
```

Expected: contract passes and Vite production build exits 0.

- [ ] **Step 5: Verify database migration and repair safety**

Run:

```bash
cd server
npm run prisma:deploy
npm run data:repair-chinese-recipes
```

Expected: migration applies without dropping/deleting data; repair prints dry-run counts only. Review the output, then run `npm run data:repair-chinese-recipes:apply` once and rerun dry-run; the second dry-run reports no additional overseas/test rows requiring changes.

- [ ] **Step 6: Perform manual end-to-end acceptance**

Start:

```bash
cd server && npm run dev
cd admin-frontend && npm run dev
cd frontend && npm run dev:h5
```

Verify in order:

1. API Provider list labels Proj.Kitchen as 中国菜谱主源 and TheMealDB as 海外历史源.
2. TheMealDB cannot sync but historical batches remain viewable.
3. Proj.Kitchen/TianAPI test and sync create a recipe batch.
4. English, missing-step, and missing-ingredient rows show explicit reasons and cannot confirm.
5. A quality-80+ Chinese row confirms into a pending, unpublished formal recipe.
6. Publishing without approval or a managed cover is rejected.
7. After adding a managed cover and approving, publishing succeeds and the C-end recipe list/detail displays the record.

- [ ] **Step 7: Review scoped diff**

Run:

```bash
git diff --stat HEAD~7..HEAD
git status --short
```

Expected: only the files listed in this plan are part of the task commits; unrelated pre-existing changes remain untouched.

- [ ] **Step 8: Commit documentation**

```bash
git add docs/backend/api-spec.md docs/backend/database-schema.md
git commit -m "docs: document Chinese recipe governance"
```

---

## Execution Notes

- Before applying the data repair, capture the dry-run JSON in the task handoff and inspect every formal recipe title proposed for hiding.
- The migration is additive; never edit old migrations or backfill by clearing tables.
- Source licensing/usage permission is an operational release gate. If neither Chinese Provider has confirmed reusable-content permission, complete the governance code but do not perform a production content sync.
- A first batch should contain at most 20 recipes. Increase to 50 only after duplicate rate, category mapping, media completion, and approval rate are measured.
