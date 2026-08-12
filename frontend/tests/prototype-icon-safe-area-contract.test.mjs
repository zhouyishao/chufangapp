import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const iconSource = await readFile(new URL('../src/components/app/app-icon.vue', import.meta.url), 'utf8');
const tabBarSource = await readFile(new URL('../src/components/home/home-tab-bar.vue', import.meta.url), 'utf8');
const mainSource = await readFile(new URL('../src/main.ts', import.meta.url), 'utf8');
const globalSource = await readFile(new URL('../src/styles/global.scss', import.meta.url), 'utf8');

test('bottom navigation uses the frozen prototype SVG geometry', () => {
  assert.match(iconSource, /M4 10\.5 12 4l8 6\.5v8\.25A1\.25 1\.25 0 0 1 18\.75 20H5\.25A1\.25 1\.25 0 0 1 4 18\.75Z/);
  assert.match(iconSource, /x="3\.5" y="3\.5" width="6\.5" height="6\.5" rx="1\.2"/);
  assert.match(iconSource, /M4 9h16l-1\.3 10H5\.3Z/);
  assert.match(iconSource, /cx="12" cy="7\.5" r="3\.5"/);
  assert.match(iconSource, /M5 20c\.35-4 2\.7-6 7-6s6\.65 2 7 6Z/);
});

test('active navigation fills only prototype fillable shapes', () => {
  assert.match(iconSource, /fill="none"/);
  assert.match(iconSource, /class="fillable"/);
  assert.match(iconSource, /\.app-icon--filled \.fillable\s*\{\s*fill: currentColor;/);
  assert.doesNotMatch(iconSource, /:fill="filled \? 'currentColor' : 'none'"/);
  assert.match(tabBarSource, /:filled="tab\.active"/);
});

test('scan and basket icons match the prototype line set', () => {
  assert.match(iconSource, /M8 3H5a2 2 0 0 0-2 2v3/);
  assert.match(iconSource, /M6 12h12/);
  assert.doesNotMatch(iconSource, /name === 'scan'[\s\S]*?<rect x="8\.3"/);
  assert.match(iconSource, /M4\.5 9\.75h15l-1\.1 7\.85a2 2 0 0 1-2 1\.7H7\.6a2 2 0 0 1-2-1\.7L4\.5 9\.75Z/);
});

test('H5 always exposes the frozen prototype status-bar space', () => {
  assert.match(mainSource, /document\.documentElement\.classList\.add\('safe-area-preview'\)/);
  assert.doesNotMatch(mainSource, /window\.innerWidth >= 390/);
  assert.match(globalSource, /\.safe-area-preview[\s\S]*--app-safe-area-top: 59px;/);
});
