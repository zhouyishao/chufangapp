export type FamilyMemberRole = '管理员' | '成员';

export interface FamilyMember {
  id: string;
  accountId?: string;
  userId?: number;
  name: string;
  role: FamilyMemberRole;
  avatar: string;
  note: string;
  joinedAt?: string;
}

export interface FamilyPreference {
  avoidItems: string[];
  allergies: string[];
  preferences: string[];
  taste: string | null;
  note: string | null;
}

export interface FamilyProfile {
  id: string;
  name: string;
  description: string;
  commonRecipes: number;
  pendingItems: number;
  members: FamilyMember[];
  rules?: string;
  preferences?: FamilyPreference;
}
