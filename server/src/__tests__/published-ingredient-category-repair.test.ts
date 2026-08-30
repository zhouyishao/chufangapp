import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';

test('published ingredient category repair covers meat, fish, rice and noodles without changing publish status', async () => {
  const sql = await readFile(
    join(process.cwd(), 'prisma/migrations/20260813173000_repair_published_ingredient_categories/migration.sql'),
    'utf8'
  );

  assert.match(sql, /'猪肉', '牛肉'/);
  assert.match(sql, /"name" = '畜肉'/);
  assert.match(sql, /WHERE "name" = '鱼'/);
  assert.match(sql, /"name" = '鱼类'/);
  assert.match(sql, /WHERE "name" = '米饭'/);
  assert.match(sql, /"name" = '谷物'/);
  assert.match(sql, /WHERE "name" = '面条'/);
  assert.match(sql, /"name" = '面制品'/);
  assert.doesNotMatch(sql, /"is_publish"\s*=/);
});
