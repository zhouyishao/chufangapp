import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(new URL('./FamiliesPage.tsx', import.meta.url), 'utf8');

test('family identity does not nest buttons and overview has no fake deltas', () => {
  assert.match(source, /const FamilyIdentity[\s\S]*?<div className="flex items-center gap-3 text-left">/);
  assert.doesNotMatch(source, /较昨日|delta="\+[0-9]+"/);
});
