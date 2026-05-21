export type FamilyMemberRole = '管理员' | '成员';

export interface FamilyMember {
  id: string;
  accountId?: string;
  name: string;
  role: FamilyMemberRole;
  avatar: string;
  note: string;
  joinedAt?: string;
}

export interface FamilyProfile {
  id: string;
  name: string;
  description: string;
  commonRecipes: number;
  pendingItems: number;
  members: FamilyMember[];
  rules?: string;
}
