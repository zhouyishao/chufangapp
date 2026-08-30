import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('家庭管理保持列表到家庭详情再到成员资料的三级结构', async () => {
  const directory = await read('../src/pages/family/index.vue');
  const family = await read('../src/pages/family-manage/index.vue');
  const member = await read('../src/pages/family-member/index.vue');

  assert.match(directory, /家庭管理/);
  assert.match(directory, /pages\/family-manage\/index\?id=/);
  assert.match(family, /家庭成员/);
  assert.match(family, /家庭码/);
  assert.match(family, /pages\/family-member\/index\?familyId=/);
  assert.match(member, /成员资料/);
  assert.match(member, /备注名/);
  assert.match(member, /不会修改对方账号昵称/);
});

test('家庭成员页不承担家庭切换，并分开呈现成员目录和资料编辑', async () => {
  const source = await read('../src/pages/family-manage/index.vue');

  assert.doesNotMatch(source, /切换家庭/);
  assert.doesNotMatch(source, /isFamilySelectVisible/);
  assert.match(source, /family-member-directory/);
  assert.match(source, /sheet-avatar-editor/);
  assert.match(source, /name-field/);
});

test('家庭码三级页保留二维码、分享和复制邀请链接能力', async () => {
  const source = await read('../src/pages/family-invite/index.vue');

  assert.match(source, /家庭码/);
  assert.match(source, /qr-image/);
  assert.match(source, /copyLink/);
  assert.match(source, /分享/);
});

test('家庭口味与个人口味职责分离，不再复用个人编辑页', async () => {
  const familyPreferences = await read('../src/pages/family-preferences/index.vue');

  assert.match(familyPreferences, /家庭口味/);
  assert.match(familyPreferences, /忌口/);
  assert.match(familyPreferences, /喜欢/);
  assert.match(familyPreferences, /过敏/);
  assert.match(familyPreferences, /pages\/personal-preferences\/index/);
  assert.doesNotMatch(familyPreferences, /replaceMobileUserPreferences/);
});
