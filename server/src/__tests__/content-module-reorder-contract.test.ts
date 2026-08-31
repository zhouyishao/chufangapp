import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const routeSource = readFileSync(resolve('src/routes/admin/content-modules.ts'), 'utf8');

test('content module reorder is an atomic, complete-list operation', () => {
  const reorderBlock = routeSource.slice(
    routeSource.indexOf("adminContentModulesRouter.patch('/reorder'"),
    routeSource.indexOf("adminContentModulesRouter.get('/:moduleId'")
  );

  assert.notEqual(reorderBlock, '');
  assert.match(reorderBlock, /reorderSchema/);
  assert.match(reorderBlock, /new Set/);
  assert.match(reorderBlock, /现有模块完整列表/);
  assert.match(reorderBlock, /prisma\.\$transaction/);
  assert.match(reorderBlock, /contentModule\.update/);
  assert.match(reorderBlock, /orderBy:\s*\[\{ sortOrder: 'asc' \}, \{ id: 'asc' \}\]/);
});
