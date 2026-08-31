# Transparent Product Image Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an optional transparent product image for ingredients, fruits, seasonings, and beverages, and use it for compact recipe ingredient imagery with cover-image fallback.

**Architecture:** Store the new URL and managed file reference beside the existing cover fields on `Ingredient` and `Beverage`. Admin forms upload and preview the transparent asset separately. Public recipe data exposes the ingredient field, while the C-end maps `transparentImage ?? cover` without changing list/detail cover behavior.

**Tech Stack:** Prisma/PostgreSQL, Express/Zod, React/TypeScript/Tailwind, uni-app/Vue 3/TypeScript, Node test runner.

## Global Constraints

- Preserve existing cover behavior and existing records.
- The new field is optional and falls back to the ordinary cover.
- Do not modify `admin-backend/` or `backend/`.
- Do not overwrite unrelated dirty-worktree changes.
- Do not apply destructive database operations.

---

### Task 1: Contract tests

**Files:**
- Create: `server/src/__tests__/transparent-product-image-contract.test.ts`
- Create: `frontend/tests/transparent-product-image-contract.test.mjs`

**Interfaces:**
- Produces: assertions for `transparentImage`, `transparentImageFileId`, admin persistence, upload controls, and C-end fallback.

- [ ] Write source-contract tests for schema, migration, admin routes/forms, recipe API selection, and C-end mapping.
- [ ] Run the focused tests and confirm they fail because the fields do not exist.

### Task 2: Database and backend persistence

**Files:**
- Modify: `server/prisma/schema.prisma`
- Create: `server/prisma/migrations/20260812143000_add_transparent_product_images/migration.sql`
- Modify: `server/src/routes/admin/ingredients.ts`
- Modify: `server/src/routes/admin/beverages.ts`
- Modify: `server/src/routes/api/recipes.ts`

**Interfaces:**
- Consumes: `transparentImage?: string | null`, `transparentImageFileId?: number | null`.
- Produces: persisted URL/file reference and recipe ingredient response containing `ingredient.transparentImage`.

- [ ] Add nullable columns and file relations for Ingredient and Beverage.
- [ ] Resolve and lock uploaded transparent-image files in create/update routes.
- [ ] Select transparent ingredient images in recipe detail responses.
- [ ] Regenerate Prisma Client and run server contract/build checks.

### Task 3: Admin configuration

**Files:**
- Modify: `admin-frontend/src/app/types.ts`
- Modify: `admin-frontend/src/app/api.ts`
- Modify: `admin-frontend/src/app/pages/IngredientFormPage.tsx`
- Modify: `admin-frontend/src/app/pages/SeasoningFormPage.tsx`
- Modify: `admin-frontend/src/app/pages/BeverageFormPage.tsx`

**Interfaces:**
- Consumes/produces: `transparentImage: string | null` through existing ingredient and beverage endpoints.

- [ ] Add the field to API and draft types and serialization.
- [ ] Add separate upload/delete controls to the ingredient/fruit, seasoning, and beverage forms.
- [ ] Preview on a checkerboard surface and explain PNG/WebP, square composition, and fallback behavior.
- [ ] Run the admin build.

### Task 4: C-end preference and fallback

**Files:**
- Modify: `frontend/src/services/public-api.ts`
- Modify: `frontend/src/pages/recipe-detail/index.vue`
- Modify: `frontend/src/dev/detail-preview-fixtures.ts`

**Interfaces:**
- Consumes: `ingredient.transparentImage?: string | null`.
- Produces: compact ingredient `cover` resolved as `transparentImage ?? cover`.

- [ ] Normalize transparent asset URLs in recipe detail data.
- [ ] Prefer transparent images in recipe ingredient mapping and name-based enrichment.
- [ ] Keep the current `aspectFit`/`contain` and cover fallback.
- [ ] Run frontend contract tests and type-check.

### Task 5: Verification and documentation

**Files:**
- Modify: `docs/backend/api-spec.md`
- Modify: `docs/backend/database-schema.md`

**Interfaces:**
- Produces: documented field semantics and fallback rule.

- [ ] Document the new optional fields and intended use.
- [ ] Run focused tests plus server, admin, and frontend builds/type checks.
- [ ] Review the scoped diff and confirm unrelated working-tree files were preserved.
