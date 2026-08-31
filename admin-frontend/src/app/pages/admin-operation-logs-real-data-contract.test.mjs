import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(new URL('./SettingsLogsPage.tsx', import.meta.url), 'utf8');

test('operation logs page reads the real paginated endpoint and has no mock mutations', () => {
  assert.match(source, /listAdminOperationLogs/);
  assert.match(source, /pageSize/);
  assert.match(source, /startDate/);
  assert.match(source, /endDate/);
  assert.doesNotMatch(source, /GenericMockListPage|initialItems|resolveMockList/);
  assert.doesNotMatch(source, /新增|编辑|删除/);
});
