import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

import { ADMIN_PERMISSION_CATALOG, SYSTEM_ROLE_PRESETS } from '../security/admin-permissions';

test('RBAC schema and migration are additive and catalog keys are unique', async () => {
  const schema = await readFile(path.resolve(process.cwd(), 'prisma/schema.prisma'), 'utf8');
  const migration = await readFile(
    path.resolve(process.cwd(), 'prisma/migrations/20260813160000_admin_rbac_foundation/migration.sql'),
    'utf8'
  );

  assert.match(schema, /lastLoginAt\s+DateTime\?/);
  assert.match(schema, /code\s+String\s+@unique/);
  assert.match(schema, /isSystem\s+Boolean/);
  assert.match(schema, /module\s+String/);
  assert.match(schema, /action\s+String/);
  assert.doesNotMatch(migration, /DROP TABLE|TRUNCATE/i);
  assert.equal(new Set(ADMIN_PERMISSION_CATALOG.map((item) => item.key)).size, ADMIN_PERMISSION_CATALOG.length);
  assert.deepEqual(
    SYSTEM_ROLE_PRESETS.map((role) => role.code),
    ['SUPER_ADMIN', 'CONTENT_OPERATOR', 'READ_ONLY']
  );
});

test('role presets keep system administration away from content operators and writes away from read-only users', () => {
  const contentOperator = SYSTEM_ROLE_PRESETS.find((role) => role.code === 'CONTENT_OPERATOR');
  const readOnly = SYSTEM_ROLE_PRESETS.find((role) => role.code === 'READ_ONLY');

  assert.ok(contentOperator);
  assert.ok(readOnly);
  assert.equal(contentOperator.permissions.includes('content:recipe:update'), true);
  assert.equal(contentOperator.permissions.some((key) => key.startsWith('system:')), false);
  assert.equal(readOnly.permissions.every((key) => key.endsWith(':view')), true);
});
