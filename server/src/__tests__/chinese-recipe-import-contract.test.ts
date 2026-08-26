import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

import {
  buildSafeRequestSnapshot,
  sanitizeResourceImportError
} from '../services/resource-import/safe-serialization';

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

test('recipe sync persists Chinese quality and exposes governed filters', () => {
  const providerRoute = readFileSync(resolve(__dirname, '../routes/admin/resource-api-providers.ts'), 'utf8');
  const resourceRoute = readFileSync(resolve(__dirname, '../routes/admin/resources.ts'), 'utf8');

  assert.match(providerRoute, /assertRecipeProviderCanSync\(provider\)/);
  assert.match(providerRoute, /evaluateStagedResourceCandidate\(prisma, resourceType, mapped\)/);
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

test('resource import snapshots and errors redact sensitive query and parameter values', () => {
  const snapshot = buildSafeRequestSnapshot(
    'GET',
    'https://provider.example/recipes?apiKey=real-key&word=%E9%B1%BC',
    'data.list',
    { token: 'real-token', nested: { sign: 'real-sign' }, Cookie: 'session=real-cookie' },
    '可信来源'
  );
  const error = sanitizeResourceImportError('拉取失败 https://provider.example/data?secret=real-secret cookie=real-cookie');

  assert.doesNotMatch(JSON.stringify(snapshot), /real-key|real-token|real-sign|real-cookie/);
  assert.match(snapshot.endpointUrl, /apiKey=\*\*\*/);
  assert.doesNotMatch(error, /real-secret|real-cookie/);
});

test('retrying failed recipes re-applies Chinese admission before it can persist official records', () => {
  const resourceRoute = readFileSync(resolve(__dirname, '../routes/admin/resources.ts'), 'utf8');
  const retryRoute = resourceRoute.slice(resourceRoute.indexOf("adminResourcesRouter.post('/resource-imports/:id/retry-failed'"));

  assert.match(retryRoute, /\$transaction\(async \(tx\)/);
  assert.match(retryRoute, /status:\s*'PROCESSING'/);
  assert.match(retryRoute, /evaluateStagedResourceCandidate\(tx, resourceType, mapped(?: as any)?\)/);
  assert.match(retryRoute, /getRecipeImportAdmissionFailure\(candidate\)/);
  assert.match(retryRoute, /status:\s*'FAILED'/);
  assert.match(retryRoute, /createOfficialRecord\(\s*tx,/);
  assert.match(retryRoute, /refreshImportBatchStats\(tx, \[id\]\)/);
  assert.ok(
    retryRoute.indexOf('getRecipeImportAdmissionFailure(candidate)')
      < retryRoute.indexOf('createOfficialRecord('),
    'Chinese admission must run before official persistence'
  );
});

test('governed recipe staging centralizes all paths and bulk-ignore retains transactional eligibility', () => {
  const providerRoute = readFileSync(resolve(__dirname, '../routes/admin/resource-api-providers.ts'), 'utf8');
  const resourceRoute = readFileSync(resolve(__dirname, '../routes/admin/resources.ts'), 'utf8');

  assert.match(providerRoute, /evaluateStagedResourceCandidate\(prisma, resourceType, mapped\)/);
  assert.equal((resourceRoute.match(/evaluateStagedResourceCandidate\(prisma, resourceType, mapped\)/g) ?? []).length, 3);
  assert.match(resourceRoute, /minQuality > maxQuality/);
  assert.match(resourceRoute, /\$transaction\(async \(tx\)/);
  assert.match(resourceRoute, /batch:\s*\{\s*is:\s*\{\s*importType:\s*'RECIPE'/);
  assert.match(resourceRoute, /updated\.count !== uniqueItemIds\.length/);
  assert.match(resourceRoute, /refreshImportBatchStats\(tx,/);
  assert.match(resourceRoute, /status:\s*'PROCESSING'/);
  assert.match(resourceRoute, /claimed\.count !== requestedItemIds\.length/);
  assert.match(resourceRoute, /createOfficialRecord\(\s*tx,/);
});

test('confirmation and publication enforce Chinese recipe readiness', () => {
  const resourceRoute = readFileSync(resolve(__dirname, '../routes/admin/resources.ts'), 'utf8');
  const importer = readFileSync(resolve(__dirname, '../services/resource-import/importer.ts'), 'utf8');
  const recipeRoute = readFileSync(resolve(__dirname, '../routes/admin/recipes.ts'), 'utf8');

  assert.match(resourceRoute, /getRecipeImportAdmissionFailure\(candidate\)/);
  assert.match(resourceRoute, /recipeEvaluation\?\.qualityScore/);
  assert.match(importer, /importQualityScore:/);
  assert.match(recipeRoute, /coverFileId/);
  assert.match(recipeRoute, /菜谱发布前必须上传受管封面/);
  assert.match(recipeRoute, /有效用料至少需要2项/);
});

test('import item edits and manual status changes use a closed state machine', () => {
  const resourceRoute = readFileSync(resolve(__dirname, '../routes/admin/resources.ts'), 'utf8');
  const editRoute = resourceRoute.slice(
    resourceRoute.indexOf("adminResourcesRouter.put('/resource-imports/items/:id'"),
    resourceRoute.indexOf('// 8. PATCH /resource-imports/items/:id/status')
  );
  const statusRoute = resourceRoute.slice(
    resourceRoute.indexOf("adminResourcesRouter.patch('/resource-imports/items/:id/status'"),
    resourceRoute.indexOf('// 9. POST /resource-imports/confirm')
  );

  assert.match(editRoute, /assertImportItemCanBeEdited\(existing\.status\)/);
  assert.match(editRoute, /\$transaction\(async \(tx\)/);
  assert.match(editRoute, /tx\.resourceImportItem\.updateMany/);
  assert.match(editRoute, /status:\s*\{\s*in:\s*\[\.\.\.EDITABLE_IMPORT_ITEM_STATUSES\]/);
  assert.match(editRoute, /refreshImportBatchStats\(tx,/);
  assert.match(statusRoute, /z\.literal\('IGNORED'\)/);
  assert.match(statusRoute, /assertManualImportItemTransition\(existing\.status, parsed\.data\.status\)/);
  assert.match(statusRoute, /tx\.resourceImportItem\.updateMany/);
  assert.match(statusRoute, /filterCode:\s*'MANUAL_IGNORE'/);
  assert.match(statusRoute, /refreshImportBatchStats\(tx,/);
  assert.doesNotMatch(statusRoute, /z\.enum\(\['PENDING', 'IMPORTED', 'FAILED', 'IGNORED'\]\)/);
});

test('confirmation and retry revalidate the current recipe provider before claiming rows', () => {
  const resourceRoute = readFileSync(resolve(__dirname, '../routes/admin/resources.ts'), 'utf8');
  const confirmRoute = resourceRoute.slice(
    resourceRoute.indexOf("adminResourcesRouter.post('/resource-imports/confirm'"),
    resourceRoute.indexOf('// 10. POST /resource-imports/:id/retry-failed')
  );
  const retryRoute = resourceRoute.slice(
    resourceRoute.indexOf("adminResourcesRouter.post('/resource-imports/:id/retry-failed'")
  );

  for (const route of [confirmRoute, retryRoute]) {
    assert.match(route, /assertRecipeImportBatchCanFinalize\(batch\)/);
    assert.ok(
      route.indexOf('assertRecipeImportBatchCanFinalize(batch)') < route.indexOf("data: { status: 'PROCESSING' }"),
      'provider eligibility must be checked before rows are claimed'
    );
  }
});

test('file upload and provider sync persist their complete staging graph atomically', () => {
  const resourceRoute = readFileSync(resolve(__dirname, '../routes/admin/resources.ts'), 'utf8');
  const providerRoute = readFileSync(resolve(__dirname, '../routes/admin/resource-api-providers.ts'), 'utf8');
  const uploadRoute = resourceRoute.slice(
    resourceRoute.indexOf("adminResourcesRouter.post('/resource-imports/upload'"),
    resourceRoute.indexOf('const batchListQuerySchema')
  );
  const syncRoute = providerRoute.slice(providerRoute.indexOf("adminResourceApiProvidersRouter.post('/:id/sync'"));

  assert.match(uploadRoute, /prisma\.\$transaction\(async \(tx\)/);
  assert.match(uploadRoute, /tx\.resourceImportBatch\.create/);
  assert.match(uploadRoute, /tx\.resourceImportItem\.createMany/);
  assert.doesNotMatch(uploadRoute, /await prisma\.resourceImportBatch\.create/);

  assert.match(syncRoute, /prisma\.\$transaction\(async \(tx\)/);
  assert.match(syncRoute, /tx\.resourceImportBatch\.create/);
  assert.match(syncRoute, /tx\.resourceImportItem\.createMany/);
  assert.match(syncRoute, /tx\.rawImportRecord\.createMany/);
  assert.match(syncRoute, /tx\.resourceApiProvider\.update/);
  assert.doesNotMatch(syncRoute, /await prisma\.resourceImportItem\.createMany/);
  assert.doesNotMatch(syncRoute, /await \(prisma as any\)\.rawImportRecord\.createMany/);
});

test('import item list accepts an exact filter code query', () => {
  const resourceRoute = readFileSync(resolve(__dirname, '../routes/admin/resources.ts'), 'utf8');

  assert.match(resourceRoute, /filterCode:\s*z\.string\(\)\.trim\(\)\.min\(1\)\.max\(64\)\.optional\(\)/);
  assert.match(resourceRoute, /\.\.\.\(filterCode \? \{ filterCode \} : \{\}\)/);
});
