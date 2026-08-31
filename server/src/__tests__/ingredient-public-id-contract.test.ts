import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

test('ingredient detail route resolves numeric and public business ids', async () => {
  const source = await readFile(resolve(process.cwd(), 'src/routes/api/ingredients.ts'), 'utf8');

  assert.match(source, /buildPublicIdWhere\(req\.params\.id\)/);
  assert.doesNotMatch(source, /Number\.parseInt\(String\(req\.params\.id\)/);
});
