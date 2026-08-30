import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(new URL('../src/main.ts', import.meta.url), 'utf8');

test('H5 uses a client mount instead of hydrating an empty shell', () => {
  assert.match(source, /createClientApp/);
  assert.match(source, /typeof window !== 'undefined'/);
});
