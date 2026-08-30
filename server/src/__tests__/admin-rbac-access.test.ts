import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

import { serializeAdminAccess } from '../security/admin-access';

test('effective access exposes exactly one role and never serializes password data', () => {
  const access = serializeAdminAccess({
    id: 1,
    username: 'operator',
    nickname: '运营',
    lastLoginAt: null,
    roles: [
      {
        role: {
          id: 2,
          code: 'CONTENT_OPERATOR',
          name: '内容运营',
          isSystem: true,
          status: 'ACTIVE',
          deletedAt: null,
          permissions: [
            {
              permission: {
                key: 'content:recipe:view',
                status: 'ACTIVE',
                deletedAt: null
              }
            }
          ]
        }
      }
    ]
  });

  assert.ok(access);
  assert.deepEqual(access.permissions, ['content:recipe:view']);
  assert.equal(access.role.code, 'CONTENT_OPERATOR');
  assert.equal(JSON.stringify(access).toLowerCase().includes('password'), false);
});

test('super administrators receive wildcard and ambiguous roles are rejected', () => {
  const role = {
    id: 1,
    code: 'SUPER_ADMIN',
    name: '超级管理员',
    isSystem: true,
    status: 'ACTIVE' as const,
    deletedAt: null,
    permissions: []
  };
  const base = { id: 1, username: 'admin', nickname: '管理员', lastLoginAt: null };

  assert.deepEqual(serializeAdminAccess({ ...base, roles: [{ role }] })?.permissions, ['*']);
  assert.equal(serializeAdminAccess({ ...base, roles: [] }), null);
  assert.equal(serializeAdminAccess({ ...base, roles: [{ role }, { role: { ...role, id: 2 } }] }), null);
});

test('auth endpoints update last login and return live role permissions without hashes', async () => {
  const authSource = await readFile(path.resolve(process.cwd(), 'src/routes/admin/auth.ts'), 'utf8');
  const middlewareSource = await readFile(path.resolve(process.cwd(), 'src/http/middleware/admin-auth.ts'), 'utf8');

  assert.match(authSource, /lastLoginAt:\s*new Date\(\)/);
  assert.match(authSource, /loadAdminAccess/);
  assert.match(authSource, /permissions/);
  assert.doesNotMatch(authSource, /passwordHash\s*[,}]/);
  assert.match(middlewareSource, /loadAdminAccess/);
  assert.match(middlewareSource, /req\.adminAccess\s*=/);
});
