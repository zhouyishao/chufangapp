import assert from 'node:assert/strict';
import test from 'node:test';

import { canChangeFamilyRole, canInviteFamilyMember, canRemoveFamilyMember } from '../services/family-permissions';

test('only creator and admin can invite members', () => {
  assert.equal(canInviteFamilyMember('CREATOR'), true);
  assert.equal(canInviteFamilyMember('ADMIN'), true);
  assert.equal(canInviteFamilyMember('MEMBER'), false);
});

test('creator manages admins and members; admin only removes members', () => {
  assert.equal(canRemoveFamilyMember('CREATOR', 'ADMIN', false), true);
  assert.equal(canRemoveFamilyMember('CREATOR', 'MEMBER', false), true);
  assert.equal(canRemoveFamilyMember('ADMIN', 'MEMBER', false), true);
  assert.equal(canRemoveFamilyMember('ADMIN', 'ADMIN', false), false);
  assert.equal(canRemoveFamilyMember('ADMIN', 'CREATOR', false), false);
  assert.equal(canRemoveFamilyMember('MEMBER', 'MEMBER', true), true);
  assert.equal(canRemoveFamilyMember('CREATOR', 'CREATOR', true), false);
});

test('only creator can grant or revoke admin and creator role cannot be reassigned', () => {
  assert.equal(canChangeFamilyRole('CREATOR', 'MEMBER', 'ADMIN', false), true);
  assert.equal(canChangeFamilyRole('CREATOR', 'ADMIN', 'MEMBER', false), true);
  assert.equal(canChangeFamilyRole('ADMIN', 'MEMBER', 'ADMIN', false), false);
  assert.equal(canChangeFamilyRole('CREATOR', 'MEMBER', 'CREATOR', false), false);
  assert.equal(canChangeFamilyRole('CREATOR', 'CREATOR', 'MEMBER', true), false);
});
