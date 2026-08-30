import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const dashboard = await readFile(new URL('./DashboardPage.tsx', import.meta.url), 'utf8');
const overview = await readFile(new URL('./ReportsOverviewPage.tsx', import.meta.url), 'utf8');

test('fixed metric surfaces disclose that they are not live business data', () => {
  for (const source of [dashboard, overview]) {
    assert.match(source, /样例数据/);
    assert.match(source, /尚未接入实时统计接口/);
  }
});
