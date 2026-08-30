import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const readSource = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('home compact cards explicitly prefer transparent product images', async () => {
  const api = await readSource('../src/services/public-api.ts');
  const mediaTile = await readSource('../src/components/home-modules/PrototypeMediaTile.vue');

  assert.match(api, /export type HomeModuleItem[\s\S]*transparentImage\?: string \| null/);
  assert.match(api, /export type HomeModuleItem[\s\S]*displayImage\?: string \| null/);
  assert.match(api, /transparentImage: item\.transparentImage \? resolveAssetUrl\(item\.transparentImage, ''\) : null/);
  assert.match(api, /displayImage: item\.displayImage \? resolveAssetUrl\(item\.displayImage, ''\) : null/);
  assert.match(mediaTile, /props\.item\?\.transparentImage\s*\|\|\s*props\.item\?\.displayImage\s*\|\|\s*props\.item\?\.cover/);
  assert.match(mediaTile, /:mode="usesCompactImage \? 'aspectFit' : 'aspectFill'"/);
});
