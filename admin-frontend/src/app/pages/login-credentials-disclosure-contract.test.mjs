import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(new URL('./LoginPage.tsx', import.meta.url), 'utf8');

test('admin login never pre-fills or prints default credentials', () => {
  assert.match(source, /useState\(''\)/);
  assert.doesNotMatch(source, /admin123|默认账号/);
});
