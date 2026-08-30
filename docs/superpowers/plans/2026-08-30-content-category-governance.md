# Content Category Governance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the admin content-category page reflect the real hierarchy and C-end visibility, enforce safe category writes, and hide empty legacy categories without deleting data.

**Architecture:** Add a pure category-metrics service that aggregates direct and descendant counts from route-provided count maps. Extend the existing admin category API with hierarchy/publication filters, summary metadata, write guards, and transactional sibling reorder. Update the React page to consume these fields, then run a guarded dry-run/apply cleanup script and verify the C-end category contract.

**Tech Stack:** Express 5, TypeScript 6, Prisma 7, PostgreSQL, React 18, TypeScript 5, node:test contract tests.

## Global Constraints

- Modify only `server/`, `admin-frontend/`, and the approved `docs/superpowers/` plan/spec files.
- Do not modify historical `admin-backend/` or `backend/`.
- Do not physically delete categories or content.
- Category hierarchy is limited to two levels.
- `Ordinary Drink` remains published in this phase because it has public content.
- Data cleanup may only hide a candidate whose public-content subtree count is zero.
- Existing dirty-worktree changes belong to the user and must be preserved.
- Production code changes must follow failing-test-first TDD.

---

### Task 1: Pure hierarchy and content-count metrics

**Files:**
- Create: `server/src/services/admin-category-metrics.ts`
- Create: `server/src/__tests__/admin-category-metrics.test.ts`

**Interfaces:**
- Produces: `buildCategoryMetrics(nodes, directTotalCounts, directPublicCounts): Map<number, CategoryMetric>`.
- Produces: `getCategoryLevel(node): 1 | 2`.
- `CategoryMetric` contains `level`, `childCount`, `directContentCount`, `descendantContentCount`, and `publicContentCount`.

- [ ] **Step 1: Write the failing unit tests**

```ts
import assert from 'node:assert/strict';
import test from 'node:test';
import { buildCategoryMetrics, getCategoryLevel } from '../services/admin-category-metrics';

test('category metrics aggregate descendants without double counting', () => {
  const nodes = [
    { id: 1, parentId: null },
    { id: 2, parentId: 1 },
    { id: 3, parentId: 1 },
  ];
  const metrics = buildCategoryMetrics(nodes, new Map([[1, 2], [2, 3], [3, 4]]), new Map([[2, 1], [3, 2]]));
  assert.deepEqual(metrics.get(1), {
    level: 1,
    childCount: 2,
    directContentCount: 2,
    descendantContentCount: 9,
    publicContentCount: 3,
  });
});

test('category level is derived from parent id', () => {
  assert.equal(getCategoryLevel({ id: 1, parentId: null }), 1);
  assert.equal(getCategoryLevel({ id: 2, parentId: 1 }), 2);
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `cd server && npx tsx --test src/__tests__/admin-category-metrics.test.ts`

Expected: FAIL because `admin-category-metrics` does not exist.

- [ ] **Step 3: Implement the pure metrics service**

```ts
export type CategoryMetricNode = { id: number; parentId: number | null };

export type CategoryMetric = {
  level: 1 | 2;
  childCount: number;
  directContentCount: number;
  descendantContentCount: number;
  publicContentCount: number;
};

export const getCategoryLevel = (node: CategoryMetricNode): 1 | 2 => node.parentId == null ? 1 : 2;

export const buildCategoryMetrics = (
  nodes: CategoryMetricNode[],
  directTotalCounts: ReadonlyMap<number, number>,
  directPublicCounts: ReadonlyMap<number, number>,
) => {
  const children = new Map<number, number[]>();
  for (const node of nodes) {
    if (node.parentId == null) continue;
    children.set(node.parentId, [...(children.get(node.parentId) ?? []), node.id]);
  }
  const collect = (rootId: number, source: ReadonlyMap<number, number>) => {
    const queue = [rootId];
    const visited = new Set<number>();
    let count = 0;
    while (queue.length > 0) {
      const id = queue.shift();
      if (id == null || visited.has(id)) continue;
      visited.add(id);
      count += source.get(id) ?? 0;
      queue.push(...(children.get(id) ?? []));
    }
    return count;
  };
  return new Map(nodes.map((node) => [node.id, {
    level: getCategoryLevel(node),
    childCount: children.get(node.id)?.length ?? 0,
    directContentCount: directTotalCounts.get(node.id) ?? 0,
    descendantContentCount: collect(node.id, directTotalCounts),
    publicContentCount: collect(node.id, directPublicCounts),
  }]));
};
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `cd server && npx tsx --test src/__tests__/admin-category-metrics.test.ts`

Expected: 2 passing tests.

- [ ] **Step 5: Commit the focused change**

```bash
git add server/src/services/admin-category-metrics.ts server/src/__tests__/admin-category-metrics.test.ts
git commit -m "feat: add category hierarchy metrics"
```

### Task 2: Admin category list filters, summary, and write protection

**Files:**
- Modify: `server/src/routes/admin/categories.ts`
- Modify: `server/src/__tests__/category-hierarchy-admin-contract.test.ts`
- Modify: `docs/backend/api-spec.md`

**Interfaces:**
- Consumes: `buildCategoryMetrics` and `getCategoryLevel` from Task 1.
- Produces: `GET /api/admin/categories?level=1|2&isPublish=true|false` response with `summary` and per-row metric fields.
- Produces: `canChangeType` on list/detail rows.

- [ ] **Step 1: Add failing route-contract assertions**

```ts
test('admin category list exposes hierarchy, publication filters and truthful metrics', async () => {
  const source = await readSource('src/routes/admin/categories.ts');
  assert.match(source, /level:\s*z\.coerce\.number\(\).*optional/);
  assert.match(source, /isPublish:\s*z\.enum\(\['true', 'false'\]\)/);
  assert.match(source, /buildCategoryMetrics/);
  for (const field of ['directContentCount', 'descendantContentCount', 'publicContentCount', 'childCount', 'summary']) {
    assert.match(source, new RegExp(field));
  }
});

test('admin category writes prevent third levels and referenced type changes', async () => {
  const source = await readSource('src/routes/admin/categories.ts');
  assert.match(source, /分类最多支持两级/);
  assert.match(source, /已有内容或子分类，不能修改分类类型/);
});
```

- [ ] **Step 2: Run the contract test and verify RED**

Run: `cd server && npx tsx --test src/__tests__/category-hierarchy-admin-contract.test.ts`

Expected: FAIL on missing query fields and messages.

- [ ] **Step 3: Extend the list query and count loading**

Implement these exact query fields and resource-publicity rules:

```ts
const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  q: z.string().trim().optional(),
  type: categoryTypeSchema.optional(),
  status: z.enum(['ACTIVE', 'DISABLED']).optional(),
  level: z.coerce.number().int().min(1).max(2).optional(),
  isPublish: z.enum(['true', 'false']).transform((value) => value === 'true').optional(),
});

const publicRecipeWhere = { deletedAt: null, status: 'ACTIVE' as const, isPublish: true, auditStatus: 'APPROVED' as const };
const publicIngredientWhere = { deletedAt: null, status: 'ACTIVE' as const, isPublish: true };
const publicBeverageWhere = { deletedAt: null, status: 'ACTIVE' as const, isPublish: true };
```

Load all non-deleted category nodes and six `groupBy` count sets (total/public for recipe, ingredient, beverage). Select the count map by category type, call `buildCategoryMetrics`, and serialize:

```ts
{
  ...serializeCategory(item),
  ...metrics.get(item.id),
  relatedCount: metrics.get(item.id)?.directContentCount ?? 0,
  canChangeType: (metrics.get(item.id)?.descendantContentCount ?? 0) === 0
    && (metrics.get(item.id)?.childCount ?? 0) === 0,
}
```

Return `summary` alongside `list`, `total`, `page`, and `pageSize`. Summary values must be computed from all categories matching the current filters, not the current page.

- [ ] **Step 4: Add the two-level and type-change guards**

In `resolveParentId`, reject a parent that already has a parent:

```ts
if (parent.parentId != null) throw new HttpError('分类最多支持两级', 422, 422);
```

Before `PUT` changes `existing.type`, count recipes, ingredients, beverages, and children using `deletedAt: null`. Reject when their sum is non-zero:

```ts
if (parsed.data.type !== existing.type && referenceCount > 0) {
  throw new HttpError('已有内容或子分类，不能修改分类类型', 422, 422);
}
```

- [ ] **Step 5: Document the extended API**

Add to `docs/backend/api-spec.md`:

```md
- `GET /api/admin/categories` 支持 `level=1|2`、`isPublish=true|false`，并返回直属、子树、C端公开内容数及筛选结果汇总。
- 已有关联内容或子分类的分类禁止修改类型；分类层级最多两级。
```

- [ ] **Step 6: Run tests and build**

Run: `cd server && npx tsx --test src/__tests__/category-hierarchy-admin-contract.test.ts src/__tests__/admin-category-metrics.test.ts && npm run build`

Expected: all tests pass; TypeScript build exits 0.

- [ ] **Step 7: Commit**

```bash
git add server/src/routes/admin/categories.ts server/src/__tests__/category-hierarchy-admin-contract.test.ts docs/backend/api-spec.md
git commit -m "feat: expose truthful category administration"
```

### Task 3: Transactional sibling reorder

**Files:**
- Modify: `server/src/routes/admin/categories.ts`
- Create: `server/src/__tests__/category-reorder-contract.test.ts`
- Modify: `admin-frontend/src/app/api.ts`

**Interfaces:**
- Produces: `PATCH /api/admin/categories/reorder` with `{ type, parentId, orderedIds }`.
- Produces: `reorderCategories(payload)` in the admin API client.

- [ ] **Step 1: Write the failing reorder contract test**

```ts
test('category reorder requires a complete same-parent sibling set and writes transactionally', async () => {
  const source = await readSource('src/routes/admin/categories.ts');
  assert.match(source, /adminCategoriesRouter\.patch\('\/reorder'/);
  assert.match(source, /orderedIds/);
  assert.match(source, /排序列表必须包含同级全部分类/);
  assert.match(source, /prisma\.\$transaction/);
});
```

- [ ] **Step 2: Run and verify RED**

Run: `cd server && npx tsx --test src/__tests__/category-reorder-contract.test.ts`

Expected: FAIL because the route does not exist.

- [ ] **Step 3: Implement the reorder endpoint before `/:id` routes**

Use a Zod body with the existing category type enum, nullable public `parentId`, and 1–100 unique public IDs. Resolve the parent and each ID, then load all non-deleted siblings for `{ type, parentId }`. Compare sorted numeric IDs; reject differences with HTTP 409 and `排序列表必须包含同级全部分类`. Write descending continuous values in one transaction:

```ts
await prisma.$transaction(
  resolvedIds.map((id, index) => prisma.category.update({
    where: { id },
    data: { sort: resolvedIds.length - index, sortOrder: resolvedIds.length - index },
  })),
);
```

- [ ] **Step 4: Add the client method**

```ts
export const reorderCategories = (payload: {
  type: IngredientCategory['type'];
  parentId: string | null;
  orderedIds: string[];
}) => request<IngredientCategory[]>('/categories/reorder', {
  method: 'PATCH',
  body: JSON.stringify(payload),
});
```

- [ ] **Step 5: Run focused tests and both builds**

Run: `cd server && npx tsx --test src/__tests__/category-reorder-contract.test.ts && npm run build`

Run: `cd admin-frontend && npm run build`

Expected: test passes; both builds exit 0.

- [ ] **Step 6: Commit**

```bash
git add server/src/routes/admin/categories.ts server/src/__tests__/category-reorder-contract.test.ts admin-frontend/src/app/api.ts
git commit -m "feat: reorder category siblings safely"
```

### Task 4: Truthful admin category page and edit form

**Files:**
- Modify: `admin-frontend/src/app/types.ts`
- Modify: `admin-frontend/src/app/api.ts`
- Modify: `admin-frontend/src/app/pages/CategoriesPage.tsx`
- Modify: `admin-frontend/src/app/pages/CategoryFormPage.tsx`
- Create: `admin-frontend/src/app/pages/category-governance-contract.test.mjs`

**Interfaces:**
- Consumes: category metric fields, `summary`, `canChangeType`, filters, and `reorderCategories` from Tasks 2–3.
- Produces: correct hierarchy/publication UI and same-parent-only sorting.

- [ ] **Step 1: Write the failing UI contract test**

```js
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('category page exposes real hierarchy, app visibility and subtree counts', async () => {
  const page = await read('./CategoriesPage.tsx');
  assert.match(page, /levelFilter/);
  assert.match(page, /publishFilter/);
  assert.match(page, /publicContentCount/);
  assert.match(page, /descendantContentCount/);
  assert.match(page, /item\.parent\?\.name/);
  assert.doesNotMatch(page, /当前分类接口为一级扁平分类/);
  assert.doesNotMatch(page, />1<\/td>/);
});

test('category edit form removes fake fields and locks referenced category type', async () => {
  const form = await read('./CategoryFormPage.tsx');
  assert.doesNotMatch(form, /description:/);
  assert.doesNotMatch(form, /remark:/);
  assert.match(form, /disabled={!draft\.canChangeType}/);
});
```

- [ ] **Step 2: Run and verify RED**

Run: `cd admin-frontend && node --test src/app/pages/category-governance-contract.test.mjs`

Expected: FAIL on missing filters and stale flat-category copy.

- [ ] **Step 3: Extend admin types and list response**

Add to `IngredientCategory`:

```ts
level: 1 | 2;
childCount: number;
directContentCount: number;
descendantContentCount: number;
publicContentCount: number;
canChangeType: boolean;
```

Add:

```ts
export type CategorySummary = {
  total: number;
  firstLevel: number;
  secondLevel: number;
  active: number;
  disabled: number;
  published: number;
  hidden: number;
  emptyPublic: number;
};
```

Change `listCategories` to return `PageResult<IngredientCategory> & { summary: CategorySummary }` and accept `level?: 1 | 2`, `isPublish?: boolean`.

- [ ] **Step 4: Correct list filters, stats, columns, and sorting**

In `CategoriesPage.tsx`:

- Add `levelFilter` and `publishFilter` state and pass them to `listCategories`.
- Use `data.summary`; remove current-page stats calculations.
- Render `item.level === 1 ? '一级' : '二级'` and `item.parent?.name`.
- Render `公开 ${item.publicContentCount} / 总计 ${item.descendantContentCount}` plus `直属 ${item.directContentCount}`.
- Add a separate App-display status tag.
- Remove the stale flat-category notice.
- Use `reorderCategories` with the complete `items.filter(candidate => candidate.type === item.type && candidate.parentId === item.parentId)` sibling sequence.
- Disable sorting unless a concrete type is selected and `total <= pageSize`; add `100 条/页`.

- [ ] **Step 5: Correct the edit form**

Remove `description` and `remark` from `Draft` and the JSX. Store `canChangeType` from `getCategory`, disable the type selector when false, and display `该分类已有内容或子分类，不能修改分类类型` below it.

- [ ] **Step 6: Run the UI test and build**

Run: `cd admin-frontend && node --test src/app/pages/category-governance-contract.test.mjs && npm run build`

Expected: both tests pass; Vite build exits 0.

- [ ] **Step 7: Commit**

```bash
git add admin-frontend/src/app/types.ts admin-frontend/src/app/api.ts admin-frontend/src/app/pages/CategoriesPage.tsx admin-frontend/src/app/pages/CategoryFormPage.tsx admin-frontend/src/app/pages/category-governance-contract.test.mjs
git commit -m "fix: make category management truthful"
```

### Task 5: Controlled seed taxonomy and guarded cleanup script

**Files:**
- Modify: `server/prisma/seed.ts`
- Create: `server/src/scripts/cleanup-content-categories.ts`
- Create: `server/src/__tests__/category-cleanup-contract.test.ts`
- Modify: `server/package.json`

**Interfaces:**
- Produces: `npm run categories:cleanup` dry-run and `npm run categories:cleanup -- --apply` transactional apply.
- The script exits non-zero when any selected category has public subtree content.

- [ ] **Step 1: Write the failing cleanup/seed contract test**

```ts
test('seed uses controlled production taxonomies', async () => {
  const seed = await readSource('prisma/seed.ts');
  assert.doesNotMatch(seed, /'时令水果'/);
  assert.doesNotMatch(seed, /'应季食材'/);
  assert.match(seed, /'苹果类'/);
  assert.match(seed, /'盐类'/);
});

test('cleanup defaults to dry-run and refuses categories with public content', async () => {
  const source = await readSource('src/scripts/cleanup-content-categories.ts');
  assert.match(source, /process\.argv\.includes\('--apply'\)/);
  assert.match(source, /公开内容不为 0，已取消整理/);
  assert.match(source, /isPublish:\s*false/);
  assert.match(source, /prisma\.\$transaction/);
});
```

- [ ] **Step 2: Run and verify RED**

Run: `cd server && npx tsx --test src/__tests__/category-cleanup-contract.test.ts`

Expected: FAIL because the cleanup script is missing and seed still contains legacy names.

- [ ] **Step 3: Replace legacy seed lists with the controlled taxonomy**

Use exact canonical arrays:

```ts
const recipeCategoryNames = ['热菜', '凉菜', '汤羹', '主食', '早餐', '烘焙甜点'];
const ingredientCategoryNames = ['蔬菜', '菌菇', '豆制品', '肉禽蛋', '水产海鲜', '主食粮油', '干货', '奶制品', '半成品'];
const fruitCategoryNames = ['苹果类', '梨类', '桃类', '李杏梅樱桃类', '柑橘类', '葡萄类', '浆果及猕猴桃类', '瓜果类', '香蕉芒果类', '热带水果', '亚热带及特色水果'];
const seasoningCategoryNames = ['盐类', '糖与甜味剂', '酱油与咸鲜液体调味', '醋类', '中式酱料与发酵调味', '基础香辛料', '辣椒与辣味香辛料', '香草与芳香叶', '复合香辛料', '鲜味与汤料', '食用油与动物油脂', '烹调酒与酒味调料', '西式与国际酱料', '日韩调味', '东南亚与南亚调味', '烘焙与甜点调味', '火锅与复合底料', '腌渍与调味配料'];
const beverageCategoryNames = ['茶饮', '咖啡', '果蔬饮', '乳饮', '调制饮品', '自制饮品', '酒类'];
```

Do not change `ensureCategory` update behavior, so repeated seed runs do not republish manually hidden legacy rows.

- [ ] **Step 4: Implement guarded cleanup**

The script must:

1. Load non-deleted category nodes and public category IDs for each resource type.
2. Build public subtree metrics using `buildCategoryMetrics`.
3. Select explicit seasoning/ingredient/test candidates plus currently published `RECIPE` and `BEVERAGE` rows whose public subtree count is zero.
4. Print `{ type, name, publicContentCount, action: 'HIDE' }` in dry-run mode.
5. Abort if any selected metric is non-zero.
6. With `--apply`, run one Prisma transaction updating only `isPublish: false`.

Add scripts:

```json
"categories:cleanup": "tsx src/scripts/cleanup-content-categories.ts"
```

- [ ] **Step 5: Run tests, build, and dry-run**

Run: `cd server && npx tsx --test src/__tests__/category-cleanup-contract.test.ts && npm run build && npm run categories:cleanup`

Expected: tests/build pass; dry-run prints candidates and explicitly says no database changes were made.

- [ ] **Step 6: Commit**

```bash
git add server/prisma/seed.ts server/src/scripts/cleanup-content-categories.ts server/src/__tests__/category-cleanup-contract.test.ts server/package.json
git commit -m "chore: govern production category taxonomy"
```

### Task 6: Apply reversible cleanup and end-to-end verification

**Files:**
- No new production files.
- Data change: `categories.is_publish` only for guarded candidates.

**Interfaces:**
- Consumes: cleanup script from Task 5 and all prior API/UI behavior.
- Produces: cleaned local database and verification evidence.

- [ ] **Step 1: Capture the dry-run candidate list**

Run: `cd server && npm run categories:cleanup`

Expected: candidate rows all have `publicContentCount: 0`; `Ordinary Drink` is absent.

- [ ] **Step 2: Apply the reversible cleanup**

Run: `cd server && npm run categories:cleanup -- --apply`

Expected: one transaction completes and reports the exact number of categories changed to `isPublish=false`.

- [ ] **Step 3: Re-run dry-run for idempotence**

Run: `cd server && npm run categories:cleanup`

Expected: no remaining published candidates.

- [ ] **Step 4: Run backend category tests and build**

Run: `cd server && npx tsx --test src/__tests__/admin-category-metrics.test.ts src/__tests__/category-hierarchy-admin-contract.test.ts src/__tests__/category-reorder-contract.test.ts src/__tests__/category-cleanup-contract.test.ts src/__tests__/category-navigation.test.ts src/__tests__/category-resource-list-contract.test.ts && npm run build`

Expected: all tests pass and build exits 0.

- [ ] **Step 5: Run admin tests and build**

Run: `cd admin-frontend && node --test src/app/pages/category-governance-contract.test.mjs && npm run build`

Expected: tests and build pass.

- [ ] **Step 6: Verify C-end category behavior**

Start backend: `cd server && npm run dev`

Start C-end in another terminal: `cd frontend && npm run dev:h5`

Verify the category page API still returns only active/published categories with public resources and preserves populated ancestors. Confirm empty legacy categories do not appear and fruit retains 11 populated browse groups.

- [ ] **Step 7: Inspect scoped diff and working tree**

Run: `git diff --check && git status --short`

Expected: no whitespace errors; unrelated pre-existing user changes remain untouched.
