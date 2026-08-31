import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const source = readFileSync(resolve(__dirname, '../routes/api/app-home.ts'), 'utf8');

test('home channel fallback normalizes navigation content types', () => {
  assert.match(source, /contentType:\s*\(nav\.contentType\s*\?\?\s*'RECIPE'\)\.toUpperCase\(\)/);
});

test('home channels preserve freely configured cross-type modules and fall back when empty', () => {
  assert.match(source, /const sourceModules = modules\.length \? modules : \[fallbackModule\(nav\)\]/);
  assert.doesNotMatch(source, /const compatibleModules/);
  assert.match(source, /resolved\.some\(\(module\)\s*=>\s*module\.items\.length\s*>\s*0\)/);
  assert.match(source, /serializeModuleForApp\(fallbackModule\(nav\)\)/);
});

test('home modules show the whole channel by default and filter only when a secondary category is requested', () => {
  assert.match(source, /\.\.\.\(placementCategory\s*\?\s*\{\s*categoryId:\s*placementCategory\.id\s*\}\s*:\s*\{\}\)/);
  assert.match(source, /buildPublicIdWhere\(query\.data\.categoryId\)/);
});

test('home channel banner stays empty when no banner is configured', () => {
  const heroRoute = source.slice(
    source.indexOf("apiAppHomeRouter.get('/top-navs/:navId/hero-banners'"),
    source.indexOf('// ====== 内容模块 ======')
  );
  assert.doesNotMatch(heroRoute, /configuredModulesForBanner/);
  assert.doesNotMatch(heroRoute, /configuredBannerSeed/);
  assert.doesNotMatch(heroRoute, /serializeModuleForApp\(fallbackModule\(nav\)\)/);
  assert.match(heroRoute, /res\.json\(ok\(serialized\)\)/);
});
