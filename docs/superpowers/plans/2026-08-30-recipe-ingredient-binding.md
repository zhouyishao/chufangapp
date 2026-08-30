# 菜谱用料真实关联与透明图展示 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让菜谱用料真实绑定食材资源，发布时强制校验关联与透明图，并在 C 端以无底色横向卡片展示及跳转对应详情。

**Architecture:** 保留 `RecipeIngredient.ingredientId` 可空以兼容存量草稿，在后端集中实现发布质量校验。管理端只在用户明确选择资源库记录后建立关联；C 端菜谱详情直接消费后端序列化的关联对象，不再按名称搜索或用普通封面冒充透明图。

**Tech Stack:** Express 5、TypeScript、Prisma 7、PostgreSQL、React 18、Ant Design/Tailwind、uni-app、Vue 3、Node test runner。

## Global Constraints

- 不修改 `admin-backend/` 或 `backend/`。
- `RecipeIngredient.ingredientId` 本轮保持可空；草稿可保存未绑定用料。
- 菜谱提交审核、审核通过或发布时，每条有效用料必须绑定启用食材且具有 `transparentImage`。
- C 端菜谱用料只使用关联食材的 `transparentImage`，不得按名称补图，也不得回退 `cover`。
- C 端透明图及其卡片容器不设置底色，使用 `aspectFit`，布局为横向滚动。
- 未关联、缺图或图片加载失败时显示无底色文字占位，不允许白屏。
- 所有新增行为必须先写失败测试并确认 RED，再实现 GREEN。
- 不清空数据库，不自动创建食材，不对多命中名称进行自动关联。
- 当前工作区的 `frontend/components.d.ts`、`server/package.json` 和食材发布脚本改动属于既有工作，不得覆盖或混入本功能提交。

---

## File Structure

- `server/src/services/recipe-ingredient-quality.ts`：纯函数校验菜谱用料是否满足发布条件。
- `server/src/__tests__/recipe-ingredient-quality.test.ts`：发布质量单元测试。
- `server/src/routes/admin/recipes.ts`：规范化关联食材、草稿兼容、发布强校验、管理端关联摘要。
- `server/src/__tests__/recipe-ingredient-admin-contract.test.ts`：管理端路由契约测试。
- `server/src/routes/api/recipes.ts`：序列化 C 端需要的稳定食材 ID、规范名称、透明图和分类类型。
- `server/src/__tests__/recipe-ingredient-public-contract.test.ts`：C 端菜谱详情响应契约测试。
- `server/src/scripts/backfill-recipe-ingredient-links.ts`：唯一精确匹配的 dry-run/显式执行修复工具。
- `server/src/__tests__/backfill-recipe-ingredient-links.test.ts`：匹配策略和默认 dry-run 测试。
- `admin-frontend/src/app/types.ts`：管理端关联摘要类型。
- `admin-frontend/src/app/pages/RecipeFormPage.tsx`：关联选择、失效清除、状态与透明图预览。
- `admin-frontend/src/app/pages/recipe-ingredient-binding-contract.test.mjs`：后台交互契约测试。
- `frontend/src/services/public-api.ts`：C 端菜谱详情关联食材类型和透明图 URL 解析。
- `frontend/src/pages/recipe-detail/index.vue`：无底色横向用料卡片、降级占位和详情跳转。
- `frontend/tests/recipe-ingredient-binding-contract.test.mjs`：C 端数据与视觉契约测试。
- `docs/backend/api-spec.md`：记录管理端发布约束和 C 端用料响应字段。
- `docs/backend/database-schema.md`：记录 nullable 外键与业务发布强校验的职责边界。

---

### Task 1: 发布质量纯函数

**Files:**
- Create: `server/src/services/recipe-ingredient-quality.ts`
- Create: `server/src/__tests__/recipe-ingredient-quality.test.ts`

**Interfaces:**
- Consumes: 菜谱用料及其可空关联摘要。
- Produces: `getRecipeIngredientPublishIssues(items): RecipeIngredientPublishIssue[]` 和 `formatRecipeIngredientPublishError(issues): string`。

- [ ] **Step 1: Write the failing unit test**

```ts
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  formatRecipeIngredientPublishError,
  getRecipeIngredientPublishIssues
} from '../services/recipe-ingredient-quality';

test('reports unlinked, inactive and transparent-image issues by ingredient name', () => {
  const issues = getRecipeIngredientPublishIssues([
    { name: '盐', ingredientId: null, ingredient: null },
    { name: '番茄', ingredientId: 2, ingredient: { status: 'ACTIVE', deletedAt: null, transparentImage: null } },
    { name: '牛腩', ingredientId: 3, ingredient: { status: 'DISABLED', deletedAt: null, transparentImage: '/beef.webp' } }
  ]);

  assert.deepEqual(issues, [
    { name: '盐', reason: '未关联食材' },
    { name: '番茄', reason: '缺少透明实物图' },
    { name: '牛腩', reason: '关联食材不可用' }
  ]);
  assert.equal(
    formatRecipeIngredientPublishError(issues),
    '菜谱用料未满足发布要求：盐未关联食材；番茄缺少透明实物图；牛腩关联食材不可用'
  );
});

test('accepts active linked ingredients with transparent images', () => {
  assert.deepEqual(getRecipeIngredientPublishIssues([
    { name: '黄瓜', ingredientId: 8, ingredient: { status: 'ACTIVE', deletedAt: null, transparentImage: '/cucumber.webp' } }
  ]), []);
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `cd server && npx tsx --test src/__tests__/recipe-ingredient-quality.test.ts`

Expected: FAIL because `recipe-ingredient-quality.ts` does not exist.

- [ ] **Step 3: Implement the minimal pure service**

```ts
export type RecipeIngredientQualityCandidate = {
  name: string;
  ingredientId: number | null;
  ingredient: {
    status: 'ACTIVE' | 'DISABLED';
    deletedAt: Date | null;
    transparentImage: string | null;
  } | null;
};

export type RecipeIngredientPublishIssue = {
  name: string;
  reason: '未关联食材' | '关联食材不可用' | '缺少透明实物图';
};

export const getRecipeIngredientPublishIssues = (
  items: RecipeIngredientQualityCandidate[]
): RecipeIngredientPublishIssue[] => items.flatMap((item) => {
  if (!item.ingredientId || !item.ingredient) return [{ name: item.name, reason: '未关联食材' as const }];
  if (item.ingredient.deletedAt || item.ingredient.status !== 'ACTIVE') {
    return [{ name: item.name, reason: '关联食材不可用' as const }];
  }
  if (!item.ingredient.transparentImage?.trim()) {
    return [{ name: item.name, reason: '缺少透明实物图' as const }];
  }
  return [];
});

export const formatRecipeIngredientPublishError = (issues: RecipeIngredientPublishIssue[]) =>
  `菜谱用料未满足发布要求：${issues.map((item) => `${item.name}${item.reason}`).join('；')}`;
```

- [ ] **Step 4: Run the unit test and verify GREEN**

Run: `cd server && npx tsx --test src/__tests__/recipe-ingredient-quality.test.ts && npm run build`

Expected: 2 tests PASS and TypeScript build succeeds.

- [ ] **Step 5: Commit the unit**

```bash
git add server/src/services/recipe-ingredient-quality.ts server/src/__tests__/recipe-ingredient-quality.test.ts
git commit -m "feat: validate recipe ingredient publish quality"
```

---

### Task 2: 管理端菜谱接口强制真实关联

**Files:**
- Modify: `server/src/routes/admin/recipes.ts`
- Create: `server/src/__tests__/recipe-ingredient-admin-contract.test.ts`

**Interfaces:**
- Consumes: Task 1 的 `getRecipeIngredientPublishIssues` 与 `formatRecipeIngredientPublishError`。
- Produces: 草稿兼容写入、发布 422 校验、管理端 `ingredient` 关联摘要。

- [ ] **Step 1: Write the failing route contract test**

```ts
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';

const readSource = (path: string) => readFile(join(process.cwd(), path), 'utf8');

test('admin recipe writes canonical linked ingredient data and validates publish attempts', async () => {
  const source = await readSource('src/routes/admin/recipes.ts');
  assert.match(source, /const resolveIngredient = async/);
  assert.match(source, /name:\s*ingredient\?\.name\s*\?\?\s*item\.name/);
  assert.match(source, /getRecipeIngredientPublishIssues/);
  assert.match(source, /parsed\.data\.isPublish\s*\|\|\s*parsed\.data\.auditStatus\s*===\s*'APPROVED'/);
  assert.match(source, /throw new HttpError\(formatRecipeIngredientPublishError\(issues\), 422, 422\)/);
});

test('admin recipe detail includes linked ingredient presentation data', async () => {
  const source = await readSource('src/routes/admin/recipes.ts');
  assert.match(source, /transparentImage:\s*true/);
  assert.match(source, /category:\s*\{\s*select:\s*\{\s*type:\s*true/);
  assert.match(source, /ingredientStatus/);
});
```

- [ ] **Step 2: Run the contract test and verify RED**

Run: `cd server && npx tsx --test src/__tests__/recipe-ingredient-admin-contract.test.ts`

Expected: FAIL because the route neither loads the full association nor calls the quality service.

- [ ] **Step 3: Load canonical associations and enforce publish validation**

In `server/src/routes/admin/recipes.ts`:

```ts
const resolveIngredient = async (value: number | string | null | undefined) => {
  if (value === undefined || value === null || value === '') return null;
  const item = await prisma.ingredient.findFirst({
    where: { ...buildPublicIdWhere(value), deletedAt: null },
    select: {
      id: true,
      bizId: true,
      code: true,
      name: true,
      transparentImage: true,
      status: true,
      deletedAt: true,
      category: { select: { type: true } }
    }
  });
  if (!item) throw new HttpError('食材不存在', 422, 422);
  return item;
};

const resolveRecipeIngredients = async (items: z.infer<typeof ingredientSchema>[]) =>
  Promise.all(items.map(async ({ ingredientId, ...item }) => {
    const ingredient = await resolveIngredient(ingredientId);
    return {
      ...item,
      name: ingredient?.name ?? item.name,
      ingredientId: ingredient?.id ?? null,
      ingredient
    };
  }));

const assertPublishableIngredients = (
  parsed: z.infer<typeof upsertSchema>,
  items: Awaited<ReturnType<typeof resolveRecipeIngredients>>
) => {
  if (!parsed.isPublish && parsed.auditStatus !== 'APPROVED') return;
  const issues = getRecipeIngredientPublishIssues(items);
  if (issues.length > 0) {
    throw new HttpError(formatRecipeIngredientPublishError(issues), 422, 422);
  }
};
```

Before Prisma create/update, call `resolveRecipeIngredients`, call `assertPublishableIngredients`, and strip the temporary `ingredient` property before nested `create`. Extend `includeRecipeRelations.ingredients` with the association select and serialize `ingredientStatus` as `LINKED`, `UNLINKED`, or `MISSING_TRANSPARENT_IMAGE`.

- [ ] **Step 4: Run focused tests and build**

Run: `cd server && npx tsx --test src/__tests__/recipe-ingredient-quality.test.ts src/__tests__/recipe-ingredient-admin-contract.test.ts && npm run build`

Expected: all focused tests PASS and build succeeds.

- [ ] **Step 5: Commit the API behavior**

```bash
git add server/src/routes/admin/recipes.ts server/src/__tests__/recipe-ingredient-admin-contract.test.ts
git commit -m "feat: require linked ingredients for recipe publishing"
```

---

### Task 3: C 端菜谱详情返回稳定关联对象

**Files:**
- Modify: `server/src/routes/api/recipes.ts`
- Create: `server/src/__tests__/recipe-ingredient-public-contract.test.ts`
- Modify: `docs/backend/api-spec.md`
- Modify: `docs/backend/database-schema.md`

**Interfaces:**
- Consumes: Prisma `Ingredient` 关系与业务 ID 工具。
- Produces: `ingredient: { id, name, transparentImage, categoryType } | null`，并以关联名称覆盖历史快照名称。

- [ ] **Step 1: Write the failing public response contract**

```ts
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';

test('public recipe detail serializes the linked ingredient as the source of truth', async () => {
  const source = await readFile(join(process.cwd(), 'src/routes/api/recipes.ts'), 'utf8');
  assert.match(source, /serializeRecipeIngredient/);
  assert.match(source, /getPublicId\('ingredient', item\.ingredient\)/);
  assert.match(source, /name:\s*item\.ingredient\.name/);
  assert.match(source, /transparentImage:\s*item\.ingredient\.transparentImage/);
  assert.match(source, /categoryType:\s*item\.ingredient\.category\?\.type/);
  assert.doesNotMatch(source, /ingredient:\s*\{\s*select:\s*\{\s*cover:\s*true/);
});
```

- [ ] **Step 2: Run the contract and verify RED**

Run: `cd server && npx tsx --test src/__tests__/recipe-ingredient-public-contract.test.ts`

Expected: FAIL because the current response only includes `cover` and `transparentImage`.

- [ ] **Step 3: Add the public serializer and association select**

```ts
const serializeRecipeIngredient = (item: any) => {
  if (!item.ingredient) return { ...item, ingredientId: null, ingredient: null };
  const publicId = getPublicId('ingredient', item.ingredient);
  return {
    ...item,
    name: item.ingredient.name,
    ingredientId: publicId,
    ingredient: {
      id: publicId,
      name: item.ingredient.name,
      transparentImage: item.ingredient.transparentImage,
      categoryType: item.ingredient.category?.type ?? 'INGREDIENT'
    }
  };
};
```

Extend the Prisma select with `id`, `bizId`, `code`, `name`, `transparentImage`, and `category.type`, then map `ingredients` through `serializeRecipeIngredient` in `serializeRecipe`. Update both backend docs with the nullable-storage/strong-publish rule and exact response fields.

- [ ] **Step 4: Run server contracts and build**

Run: `cd server && npx tsx --test src/__tests__/recipe-ingredient-public-contract.test.ts src/__tests__/transparent-product-image-contract.test.ts && npm run build`

Expected: tests PASS and build succeeds. Update the older transparent image contract so it asserts the new select without `cover`.

- [ ] **Step 5: Commit the public contract**

```bash
git add server/src/routes/api/recipes.ts server/src/__tests__/recipe-ingredient-public-contract.test.ts server/src/__tests__/transparent-product-image-contract.test.ts docs/backend/api-spec.md docs/backend/database-schema.md
git commit -m "feat: expose linked recipe ingredients to mobile"
```

---

### Task 4: 安全补绑存量用料

**Files:**
- Create: `server/src/scripts/backfill-recipe-ingredient-links.ts`
- Create: `server/src/__tests__/backfill-recipe-ingredient-links.test.ts`

**Interfaces:**
- Consumes: 未关联 `RecipeIngredient` 和有效 `Ingredient` 列表。
- Produces: `planRecipeIngredientBackfill(rows, ingredients)` 纯匹配计划；CLI 默认 dry-run，只有 `--execute` 写库。

- [ ] **Step 1: Write failing matching tests**

```ts
import assert from 'node:assert/strict';
import test from 'node:test';

import { planRecipeIngredientBackfill } from '../scripts/backfill-recipe-ingredient-links';

test('backfill only links unique normalized exact matches', () => {
  const plan = planRecipeIngredientBackfill(
    [{ id: 1, name: ' 黄瓜 ' }, { id: 2, name: '盐' }, { id: 3, name: '测试食材' }],
    [{ id: 10, name: '黄瓜', transparentImage: '/cucumber.webp' }, { id: 11, name: '盐', transparentImage: null }, { id: 12, name: '盐', transparentImage: '/salt.webp' }]
  );

  assert.deepEqual(plan.links, [{ recipeIngredientId: 1, ingredientId: 10, missingTransparentImage: false }]);
  assert.deepEqual(plan.skipped, [
    { recipeIngredientId: 2, name: '盐', reason: 'MULTIPLE_MATCHES' },
    { recipeIngredientId: 3, name: '测试食材', reason: 'NO_MATCH' }
  ]);
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `cd server && npx tsx --test src/__tests__/backfill-recipe-ingredient-links.test.ts`

Expected: FAIL because the script module does not exist.

- [ ] **Step 3: Implement pure planning and guarded CLI execution**

```ts
export const normalizeIngredientName = (value: string) =>
  value.trim().replace(/\s+/g, '').toLocaleLowerCase('zh-CN');

export const planRecipeIngredientBackfill = (rows: Row[], ingredients: IngredientRow[]) => {
  const index = new Map<string, IngredientRow[]>();
  for (const ingredient of ingredients) {
    const key = normalizeIngredientName(ingredient.name);
    index.set(key, [...(index.get(key) ?? []), ingredient]);
  }
  const links: LinkPlan[] = [];
  const skipped: SkipPlan[] = [];
  for (const row of rows) {
    const matches = index.get(normalizeIngredientName(row.name)) ?? [];
    if (matches.length !== 1) {
      skipped.push({
        recipeIngredientId: row.id,
        name: row.name,
        reason: matches.length === 0 ? 'NO_MATCH' : 'MULTIPLE_MATCHES'
      });
      continue;
    }
    links.push({
      recipeIngredientId: row.id,
      ingredientId: matches[0].id,
      missingTransparentImage: !matches[0].transparentImage?.trim()
    });
  }
  return { links, skipped };
};
```

The CLI reads only active, undeleted ingredients and unlinked, undeleted recipe ingredients. Without `--execute`, print aggregate counts and exit without mutations. With `--execute`, update only planned row IDs inside one Prisma transaction. Do not add a package script because `server/package.json` has pre-existing uncommitted work.

- [ ] **Step 4: Verify dry-run and tests**

Run: `cd server && npx tsx --test src/__tests__/backfill-recipe-ingredient-links.test.ts && npx tsx src/scripts/backfill-recipe-ingredient-links.ts`

Expected: test PASS; CLI prints planned, missing-image, and skipped counts and reports `mode: dry-run`. Database counts do not change.

- [ ] **Step 5: Commit the repair tool without executing writes**

```bash
git add server/src/scripts/backfill-recipe-ingredient-links.ts server/src/__tests__/backfill-recipe-ingredient-links.test.ts
git commit -m "feat: add recipe ingredient link backfill"
```

---

### Task 5: 后台菜谱表单显示并维护真实关联

**Files:**
- Modify: `admin-frontend/src/app/types.ts`
- Modify: `admin-frontend/src/app/pages/RecipeFormPage.tsx`
- Create: `admin-frontend/src/app/pages/recipe-ingredient-binding-contract.test.mjs`

**Interfaces:**
- Consumes: 管理端菜谱详情中的 `ingredient` 和 `ingredientStatus`。
- Produces: 输入修改清空关联、选择结果建立关联、透明图预览和具体状态文案。

- [ ] **Step 1: Write the failing admin UI contract**

```js
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const readSource = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('recipe ingredient editor never treats free text as a resource link', async () => {
  const page = await readSource('./RecipeFormPage.tsx');
  assert.match(page, /ingredientId:\s*null/);
  assert.match(page, /transparentImage/);
  assert.match(page, /请选择资源库食材/);
  assert.match(page, /食材缺少透明图/);
  assert.match(page, /已关联/);
});

test('recipe ingredient selection returns presentation fields', async () => {
  const page = await readSource('./RecipeFormPage.tsx');
  assert.match(page, /onSelectIngredient:\s*\(ing:\s*\{[\s\S]*transparentImage/);
  assert.match(page, /resolveAssetUrl\(item\.transparentImage/);
});
```

- [ ] **Step 2: Run the contract and verify RED**

Run: `cd admin-frontend && node --test src/app/pages/recipe-ingredient-binding-contract.test.mjs`

Expected: FAIL because the draft has no presentation fields or association status UI.

- [ ] **Step 3: Extend types and implement association-safe editing**

Extend each recipe ingredient type and `IngredientDraft` with:

```ts
ingredient?: {
  id: string;
  name: string;
  transparentImage: string | null;
  categoryType: IngredientCategory['type'];
} | null;
ingredientStatus?: 'LINKED' | 'UNLINKED' | 'MISSING_TRANSPARENT_IMAGE';
transparentImage: string | null;
```

When typing, clear the association explicitly:

```tsx
onChange={(val) => updateIngredient(index, {
  name: val,
  ingredientId: null,
  transparentImage: null,
  type: isSeasoning ? '调料' : '主料'
})}
```

When selecting, save the stable ID, canonical name, unit and resolved transparent image. Render a small `aspect-contain` preview without a colored tile and one of the exact labels `已关联`, `请选择资源库食材`, or `食材缺少透明图`. Extend `validateTab` so publish/approved drafts identify the first non-qualified row before submission; keep backend 422 as the authority.

- [ ] **Step 4: Run admin contract and build**

Run: `cd admin-frontend && node --test src/app/pages/recipe-ingredient-binding-contract.test.mjs && npm run build`

Expected: contract PASS and production build succeeds.

- [ ] **Step 5: Commit the admin editor**

```bash
git add admin-frontend/src/app/types.ts admin-frontend/src/app/pages/RecipeFormPage.tsx admin-frontend/src/app/pages/recipe-ingredient-binding-contract.test.mjs
git commit -m "feat: bind recipe ingredients in admin"
```

---

### Task 6: C 端无底色透明用料卡片

**Files:**
- Modify: `frontend/src/services/public-api.ts`
- Modify: `frontend/src/pages/recipe-detail/index.vue`
- Create: `frontend/tests/recipe-ingredient-binding-contract.test.mjs`
- Modify: `frontend/tests/transparent-product-image-contract.test.mjs`

**Interfaces:**
- Consumes: Task 3 的 `ingredient: { id, name, transparentImage, categoryType } | null`。
- Produces: 横向滚动、透明图、无底色降级占位、分类详情跳转；不再调用 `listIngredients` 补图。

- [ ] **Step 1: Write the failing C-end contract**

```js
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const readSource = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('recipe ingredients use only linked transparent images', async () => {
  const page = await readSource('../src/pages/recipe-detail/index.vue');
  assert.doesNotMatch(page, /enrichIngredientCovers/);
  assert.doesNotMatch(page, /listIngredients/);
  assert.doesNotMatch(page, /item\.ingredient\?\.cover/);
  assert.match(page, /item\.ingredient\?\.transparentImage/);
  assert.match(page, /mode="aspectFit"/);
});

test('recipe ingredient strip is horizontal, transparent and navigable', async () => {
  const page = await readSource('../src/pages/recipe-detail/index.vue');
  assert.match(page, /<scroll-view[\s\S]*scroll-x/);
  assert.match(page, /goToIngredientDetail\(item\)/);
  assert.match(page, /categoryType\s*===\s*'FRUIT'/);
  assert.match(page, /categoryType\s*===\s*'SEASONING'/);
  assert.match(page, /\.ingredient-card\s*\{[\s\S]*background:\s*transparent/);
  assert.match(page, /\.ingredient-img\s*\{[\s\S]*background:\s*transparent/);
});
```

- [ ] **Step 2: Run the contract and verify RED**

Run: `cd frontend && node --test tests/recipe-ingredient-binding-contract.test.mjs`

Expected: FAIL because the page still performs name lookup, accepts cover fallback, uses a grid and opens local guide data.

- [ ] **Step 3: Map only linked transparent media**

Update `ApiRecipeDetail.ingredients`:

```ts
ingredients: Array<{
  id: number;
  sortIndex: number;
  ingredientId: string | null;
  name: string;
  amount: string | null;
  unit?: string | null;
  ingredient: {
    id: string;
    name: string;
    transparentImage: string | null;
    categoryType: 'INGREDIENT' | 'FRUIT' | 'SEASONING';
  } | null;
}>;
```

In `getRecipe`, resolve only `ingredient.transparentImage` through `resolveAssetUrl`. Remove `listIngredients` from the recipe page import, delete `enrichIngredientCovers`, and map `cover` from only `item.ingredient?.transparentImage`.

- [ ] **Step 4: Implement horizontal transparent cards and routing**

Replace the fixed grid wrapper with:

```vue
<scroll-view scroll-x class="ingredients-scroll" :show-scrollbar="false">
  <view class="ingredients-strip">
    <view
      v-for="item in visibleIngredients"
      :key="item.id || item.name"
      class="ingredient-card"
      :class="{ 'is-linked': Boolean(item.ingredientId) }"
      @click="goToIngredientDetail(item)"
    >
      <image
        v-if="item.cover && !failedIngredientCovers[item.name]"
        class="ingredient-img"
        :src="item.cover"
        mode="aspectFit"
        @error="failedIngredientCovers[item.name] = true"
      />
      <view v-else class="ingredient-img ingredient-img-fallback" aria-hidden="true">
        <text>{{ item.name.slice(0, 1) }}</text>
      </view>
      <text class="ingredient-name-label">{{ item.name }}</text>
      <text class="ingredient-amount-label">{{ scaleAmountText(item.amount, servingsScale) }}</text>
    </view>
  </view>
</scroll-view>
```

Add `categoryType` to the local type and route using:

```ts
const goToIngredientDetail = (item: Ingredient) => {
  if (!item.ingredientId) return;
  const route = item.categoryType === 'FRUIT'
    ? '/pages/fruit-detail/index'
    : item.categoryType === 'SEASONING'
      ? '/pages/seasoning-detail/index'
      : '/pages/ingredient-detail/index';
  uni.navigateTo({ url: `${route}?id=${encodeURIComponent(String(item.ingredientId))}` });
};
```

Use fixed item width with `display: inline-flex` or a flex strip. Set `.ingredient-card`, `.ingredient-img`, and `.ingredient-img-fallback` to `background: transparent`; keep typography on global tokens and retain no colored tile, border, or shadow.

- [ ] **Step 5: Run C-end contracts, type-check and build**

Run: `cd frontend && node --test tests/recipe-ingredient-binding-contract.test.mjs tests/transparent-product-image-contract.test.mjs && npm run type-check && npm run build`

Expected: contracts PASS, Vue type-check succeeds, and H5 production build succeeds without new warnings.

- [ ] **Step 6: Commit the C-end experience**

```bash
git add frontend/src/services/public-api.ts frontend/src/pages/recipe-detail/index.vue frontend/tests/recipe-ingredient-binding-contract.test.mjs frontend/tests/transparent-product-image-contract.test.mjs
git commit -m "feat: show linked transparent recipe ingredients"
```

---

### Task 7: Full verification and safe data handoff

**Files:**
- Verify only; no unrelated source changes.

**Interfaces:**
- Consumes: Tasks 1–6 complete vertical slice.
- Produces: test/build evidence and a dry-run repair report; database remains unchanged unless the user separately authorizes `--execute`.

- [ ] **Step 1: Run the complete server test and build suite**

Run: `cd server && npx tsx --test src/__tests__/*.test.ts && npm run build`

Expected: all server tests PASS and TypeScript build succeeds.

- [ ] **Step 2: Run the complete admin contract and build suite**

Run: `cd admin-frontend && node --test src/app/pages/*.test.mjs src/app/pages/**/*.test.mjs && npm run build`

Expected: all admin contracts PASS and Vite production build succeeds.

- [ ] **Step 3: Run the complete frontend contract, type and build suite**

Run: `cd frontend && node --test tests/*.test.mjs && npm run type-check && npm run build`

Expected: all frontend contracts PASS, Vue type-check succeeds, and H5 build succeeds.

- [ ] **Step 4: Run the repair tool in dry-run mode**

Run: `cd server && npx tsx src/scripts/backfill-recipe-ingredient-links.ts`

Expected: output includes `mode: dry-run`, linkable count, missing-transparent-image count, skipped count, and zero database mutations.

- [ ] **Step 5: Inspect the final diff and unrelated changes**

Run: `git status --short && git diff --check`

Expected: no whitespace errors; pre-existing changes remain present but absent from this feature's commits.

- [ ] **Step 6: Optional browser acceptance after automated verification**

Run backend, admin and H5 with the documented project commands. In a 393×852 viewport, verify one linked ingredient with transparent WebP, one historical missing-image placeholder, horizontal scrolling, amount scaling, and detail navigation. Do not execute the backfill write mode during browser acceptance.

---

## Execution Notes

- The implementation should be performed in an isolated worktree if the user approves one; the current checkout contains unrelated uncommitted changes.
- The data repair write command `npx tsx src/scripts/backfill-recipe-ingredient-links.ts --execute` is intentionally excluded from automatic execution. It requires a separate review of the dry-run report and explicit user authorization.
- If existing published recipes fail the new rule, do not silently unpublish them. The rule applies when they are next submitted, approved, or published.
