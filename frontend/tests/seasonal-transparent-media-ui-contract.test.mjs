import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const readSource = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('seasonal transparent images have no tile while fallback content stays legible', async () => {
  const modules = await readSource('../src/components/home-modules/PrototypeHomeModules.vue');
  const mediaTile = await readSource('../src/components/home-modules/PrototypeMediaTile.vue');

  assert.match(mediaTile, /'is-media-fallback': !mediaSource \|\| failed/);
  assert.match(
    modules,
    /\.seasonal-item__media\s*\{[\s\S]*?background:\s*transparent;/
  );
  assert.match(
    modules,
    /\.seasonal-item__media\.is-media-fallback\s*\{[\s\S]*?background:\s*var\(--app-muted\);/
  );
});

test('seasonal image and label use one compact vertical rhythm', async () => {
  const modules = await readSource('../src/components/home-modules/PrototypeHomeModules.vue');

  assert.match(modules, /\.seasonal-item\s*\{[\s\S]*?gap:\s*0;/);
  assert.match(modules, /\.seasonal-item__name\s*\{[\s\S]*?margin-top:\s*6px;/);
});
