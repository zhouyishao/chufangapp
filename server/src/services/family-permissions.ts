import type { FamilyMemberRole } from '@prisma/client';

export const canInviteFamilyMember = (role: FamilyMemberRole) => role === 'CREATOR' || role === 'ADMIN';

export const canRemoveFamilyMember = (
  operatorRole: FamilyMemberRole,
  targetRole: FamilyMemberRole,
  isSelf: boolean
) => {
  if (isSelf) return targetRole !== 'CREATOR';
  if (targetRole === 'CREATOR') return false;
  if (operatorRole === 'CREATOR') return true;
  return operatorRole === 'ADMIN' && targetRole === 'MEMBER';
};

export const canChangeFamilyRole = (
  operatorRole: FamilyMemberRole,
  targetRole: FamilyMemberRole,
  nextRole: FamilyMemberRole,
  isSelf: boolean
) => operatorRole === 'CREATOR'
  && !isSelf
  && targetRole !== 'CREATOR'
  && nextRole !== 'CREATOR';
