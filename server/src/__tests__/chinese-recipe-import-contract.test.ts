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
