import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const app = await readFile(new URL('../App.tsx', import.meta.url), 'utf8');
const generic = await readFile(new URL('../components/GenericMockListPage.tsx', import.meta.url), 'utf8');

test('router opts into v7 behavior and generic page avoids any', () => {
  assert.match(app, /v7_startTransition: true/);
  assert.match(app, /v7_relativeSplatPath: true/);
  assert.doesNotMatch(generic, /\bany\b/);
});
