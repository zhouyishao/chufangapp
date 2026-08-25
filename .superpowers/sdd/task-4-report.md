# Task 4 Report — Stage, Filter, and Bulk-Ignore Chinese Recipe Candidates

## Commit

- `8db711a feat: stage governed Chinese recipes`

## Changes

- `server/src/routes/admin/resource-api-providers.ts`
  - Records provider transport/business/empty-result sync failures as zero-row `FAILED` batches and updates `provider.lastError` atomically.
  - Applies `evaluateChineseRecipeCandidate(mapped)` before duplicate checks and persists its mapped category, quality score, Chinese flag, and quality issues.
  - Preserves Chinese-policy hard-failure reasons instead of overwriting them with duplicate errors.
- `server/src/routes/admin/resources.ts`
  - Adds safe `isChinese`, minimum-quality, and maximum-quality import-item filters; the parser preserves `isChinese=false`.
  - Serializes import-quality fields for both item list and batch detail responses.
  - Adds transactional, recipe-only `POST /resource-imports/items/bulk-ignore`, including an `OperationLog` entry in the same transaction.
  - The requested shared `admin-operation-log` service does not exist in this codebase, so the route contains a small typed local writer to keep this task within its three approved files.
- `server/src/__tests__/chinese-recipe-import-contract.test.ts`
  - Adds route-contract assertions for policy evaluation, quality persistence, failed sync tracking, governed filters, and bulk ignore.

## TDD evidence

- RED: `npx tsx --test src/__tests__/chinese-recipe-import-contract.test.ts` failed on the missing `evaluateChineseRecipeCandidate(mapped)` integration assertion.
- GREEN: `npx tsx --test src/__tests__/chinese-recipe-policy.test.ts src/__tests__/recipe-provider-policy.test.ts src/__tests__/chinese-recipe-import-contract.test.ts` passed: 9 tests, 0 failures.
- Build: `npm run build` passed (`tsc -p tsconfig.json`).

## Risk / follow-up

- This task stages and governs candidates only; it deliberately does not confirm, publish, or repair historical recipes.
- The audit log assumes the admin JWT `sub` contains the numeric admin ID, as established by the login route; malformed legacy tokens produce a log with a null `adminId` rather than failing the requested mutation.

## Review hardening follow-up

- Added a centralized governed-staging service so resource preview, upload, provider sync, and item editing use the same Chinese-recipe evaluation, mapped data, duplicate detection, and quality-field persistence.
- Added centralized safe serialization for request snapshots, returned request URLs, raw-record source URLs, headers/body previews, and persisted sync errors. Sensitive keys, tokens, signatures, and URL query values are replaced with `***`.
- Reworked bulk ignore into one transaction: it deduplicates IDs, reads eligible recipe rows, conditionally updates only still-eligible rows, checks the affected count, refreshes every affected batch's counts/status, and writes the operation log before committing.
- Added an explicit `minQuality > maxQuality` validation failure.
- A full-server regression run initially exposed a minimal-fixture compatibility issue in Provider serialization. The serializer now leaves a missing optional fixture field unchanged while sanitizing real endpoint URLs.

### Follow-up verification

- Focused policy/contract/provider tests: 12 passed, 0 failed.
- Full server test suite: 113 passed, 0 failed.
- `npm run build`: passed.

## Second review hardening follow-up

- Dataset raw records now sanitize each persisted `sourceUrl`; regression coverage verifies `token` and `signature` never reach the DB-facing raw-record value.
- Provider serialization now redacts credential-bearing `defaultHeaders` and `defaultParams`. Update handling preserves masked `***` values (including sensitive URL query values) from the existing server-side configuration, while explicit `null` clears the relevant JSON configuration.
- Provider endpoint URLs follow the same placeholder-preservation rule so a masked query credential cannot overwrite the stored value on a normal form round trip.
- Confirmation now runs in one transaction. It conditionally claims only still-`PENDING` import items as `PROCESSING` before creating official records; competing bulk-ignore or state changes cause a 409 and roll back before an official record can be created.

### Second follow-up verification

- Focused policy/contract/provider tests: 16 passed, 0 failed.
- Full server test suite: 115 passed, 0 failed.
- `npm run build`: passed.

## Final review hardening follow-up

- Failed-row retry now conditionally claims rows as `PROCESSING` within its transaction, so retry cannot race with confirm or bulk-ignore. It re-evaluates every recipe with the governed mapped payload before any official record is created.
- Confirmation and retry share the same Chinese-recipe admission helper: hard failures (including `NON_CHINESE_RECIPE` and `UNMAPPED_RECIPE_CATEGORY`) and scores below 80 are restored to `FAILED`, retaining quality/filter details and never creating a formal recipe.
- `Cookie`, `Set-Cookie`, session, CSRF/XSRF equivalents are now redacted in request snapshots, provider serialization, URL/error sanitization, and retain their stored values when the admin form returns `***`.

### Final follow-up TDD and verification

- RED: focused regression tests failed before implementation because Cookie values were serialized and retry did not run a transaction or admission check.
- GREEN: focused policy/contract/provider tests: 14 passed, 0 failed.
- Full server test suite: 117 passed, 0 failed.
- `npm run build`: passed.
