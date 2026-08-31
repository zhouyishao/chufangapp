import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const migrationPath = resolve(
  __dirname,
  '../../prisma/migrations/20260706090000_add_resource_api_provider_code/migration.sql'
);
const migrationSql = readFileSync(migrationPath, 'utf8');

test('provider code backfill covers arbitrary historical rows without fixed IDs', () => {
  assert.doesNotMatch(migrationSql, /WHERE\s+"id"\s*=\s*\d+/i);
  assert.match(migrationSql, /UPDATE\s+"resource_api_providers"/i);
  assert.match(migrationSql, /WHERE\s+"provider_code"\s+IS\s+NULL/i);
});

test('provider code backfill is deterministic, non-empty, and collision-safe', () => {
  assert.match(migrationSql, /md5\s*\(/i);
  assert.match(migrationSql, /row_number\s*\(\s*\)\s+over\s*\(\s*partition\s+by/i);
  assert.match(migrationSql, /ALTER\s+COLUMN\s+"provider_code"\s+SET\s+NOT\s+NULL/i);
  assert.match(migrationSql, /UNIQUE\s*\(\s*"provider_code"\s*\)/i);
  assert.match(migrationSql, /ORDER\s+BY\s+row_id/i);
  assert.doesNotMatch(migrationSql, /ctid/i);
});
