import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(
  new URL('../src/pages/beverage-detail/index.vue', import.meta.url),
  'utf8'
);

test('beverage ingredients stay on one continuous paper surface', () => {
  assert.match(
    source,
    /\.mix-section \.ingredient-grid[\s\S]*?background:\s*transparent/
  );
  assert.match(
    source,
    /\.mix-section \.ingredient-item[\s\S]*?border-radius:\s*0[\s\S]*?background:\s*transparent/
  );
});
