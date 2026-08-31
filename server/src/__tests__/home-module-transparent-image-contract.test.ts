import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const source = readFileSync(resolve('src/routes/api/app-home-shared.ts'), 'utf8');

test('home ingredient modules prefer transparent product images for every content source', () => {
  const transparentImageSelections = source.match(/select:\s*\{[^}]*transparentImage:\s*true[^}]*\}/gs) ?? [];
  const compactImageMappings = source.match(
    /cover:\s*(?:ingredient|ing)\.transparentImage\s*\?\?\s*(?:ingredient|ing)\.cover/g
  ) ?? [];

  assert.equal(transparentImageSelections.length, 5);
  assert.equal(compactImageMappings.length, 5);
});
