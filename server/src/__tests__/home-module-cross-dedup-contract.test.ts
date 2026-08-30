import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const route = readFileSync(resolve('src/routes/api/app-home.ts'), 'utf8');

test('home modules remove repeated content identities across sections', () => {
  assert.match(route, /dedupeModuleItems/);
  assert.match(route, /seenContentIds/);
  assert.match(route, /module\.items\.filter/);
});
