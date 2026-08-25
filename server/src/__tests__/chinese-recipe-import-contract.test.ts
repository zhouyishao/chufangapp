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
    { token: 'real-token', nested: { sign: 'real-sign' } },
    '可信来源'
  );
  const error = sanitizeResourceImportError('拉取失败 https://provider.example/data?secret=real-secret');

  assert.doesNotMatch(JSON.stringify(snapshot), /real-key|real-token|real-sign/);
  assert.match(snapshot.endpointUrl, /apiKey=\*\*\*/);
  assert.doesNotMatch(error, /real-secret/);
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
