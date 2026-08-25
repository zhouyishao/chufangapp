import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

test('Chinese recipe repair is dry-run by default and never deletes rows', () => {
  const script = readFileSync(resolve(__dirname, '../../prisma/repair-chinese-recipes.ts'), 'utf8');
  const packageJson = JSON.parse(readFileSync(resolve(__dirname, '../../package.json'), 'utf8')) as { scripts: Record<string, string> };

  assert.match(script, /const apply = process\.argv\.includes\('--apply'\)/);
  assert.match(script, /themealdb_recipe/);
  assert.match(script, /mock_recipe/);
  assert.match(script, /status:\s*'IGNORED'/);
  assert.match(script, /isPublish:\s*false/);
  assert.doesNotMatch(script, /\.delete\(|\.deleteMany\(|TRUNCATE|DROP TABLE/);
  assert.equal(packageJson.scripts['data:repair-chinese-recipes'], 'tsx prisma/repair-chinese-recipes.ts');
  assert.equal(packageJson.scripts['data:repair-chinese-recipes:apply'], 'tsx prisma/repair-chinese-recipes.ts --apply');
});
