import type { FamilyMember, FamilyProfile } from '../types/family';

const FAMILIES_STORAGE_KEY = 'recipe-app-families';
const ACTIVE_FAMILY_STORAGE_KEY = 'recipe-app-active-family-id';

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const isFamilyMember = (value: unknown): value is FamilyMember => {
  if (!isRecord(value)) {
    return false;
  }

  const hasOptionalString = (field: unknown) => field === undefined || typeof field === 'string';

  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    (value.role === '管理员' || value.role === '成员') &&
    typeof value.avatar === 'string' &&
    typeof value.note === 'string' &&
    hasOptionalString(value.accountId) &&
    hasOptionalString(value.joinedAt)
  );
};

const isFamilyProfile = (value: unknown): value is FamilyProfile => {
  if (!isRecord(value)) {
    return false;
  }

  const hasOptionalString = (field: unknown) => field === undefined || typeof field === 'string';

  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.description === 'string' &&
    typeof value.commonRecipes === 'number' &&
    typeof value.pendingItems === 'number' &&
    hasOptionalString(value.rules) &&
    Array.isArray(value.members) &&
    value.members.every(isFamilyMember)
  );
};

export const getDefaultFamilies = (): FamilyProfile[] => [
  {
    id: 'weekend-home',
    name: '周末小家',
    description: '3 位成员 · 菜谱和菜篮子共享中',
    commonRecipes: 18,
    pendingItems: 2,
    rules: '',
    members: [
      {
        id: 'member-1',
        accountId: '3171590593',
        name: '我',
        role: '管理员',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=160&q=80',
        note: '我',
        joinedAt: '2026-01-23'
      },
      {
        id: 'member-2',
        accountId: '3171590593',
        name: '家人 A',
        role: '成员',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80',
        note: '负责买菜',
        joinedAt: '2026-01-23'
      },
      {
        id: 'member-3',
        accountId: '3171590593',
        name: '家人 B',
        role: '成员',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=160&q=80',
        note: '清淡口味',
        joinedAt: '2026-01-23'
      }
    ]
  },
  {
    id: 'parents-home',
    name: '爸妈家',
    description: '2 位成员 · 清淡菜谱优先',
    commonRecipes: 9,
    pendingItems: 1,
    rules: '',
    members: [
      {
        id: 'member-parents-1',
        accountId: '3171590593',
        name: '我',
        role: '管理员',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=160&q=80',
        note: '我',
        joinedAt: '2026-01-23'
      },
      {
        id: 'member-parents-2',
        accountId: '3171590593',
        name: '爸妈',
        role: '成员',
        avatar: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=160&q=80',
        note: '口味清淡',
        joinedAt: '2026-01-23'
      }
    ]
  }
];

export const loadFamilies = (): FamilyProfile[] => {
  const storedFamilies = uni.getStorageSync(FAMILIES_STORAGE_KEY) as unknown;
  if (!Array.isArray(storedFamilies)) {
    return getDefaultFamilies();
  }

  const families = storedFamilies.filter(isFamilyProfile);
  return families.length > 0 ? families : getDefaultFamilies();
};

export const saveFamilies = (families: FamilyProfile[]) => {
  uni.setStorageSync(FAMILIES_STORAGE_KEY, families);
};

export const loadActiveFamilyId = () => {
  const storedFamilyId = uni.getStorageSync(ACTIVE_FAMILY_STORAGE_KEY) as unknown;
  const families = loadFamilies();
  if (typeof storedFamilyId === 'string' && families.some((family) => family.id === storedFamilyId)) {
    return storedFamilyId;
  }

  return families[0]?.id ?? 'weekend-home';
};

export const saveActiveFamilyId = (familyId: string) => {
  uni.setStorageSync(ACTIVE_FAMILY_STORAGE_KEY, familyId);
};

export const updateFamily = (family: FamilyProfile) => {
  const nextFamilies = loadFamilies().map((item) => (item.id === family.id ? family : item));
  saveFamilies(nextFamilies);
  return nextFamilies;
};

export const getFamilyById = (familyId: string) => {
  const families = loadFamilies();
  return families.find((family) => family.id === familyId) ?? families[0] ?? getDefaultFamilies()[0];
};

export const updateFamilyMember = (familyId: string, member: FamilyMember) => {
  const family = getFamilyById(familyId);
  const nextFamily: FamilyProfile = {
    ...family,
    members: family.members.map((item) => (item.id === member.id ? { ...member } : item))
  };
  const nextFamilies = updateFamily(nextFamily);
  return {
    family: nextFamily,
    families: nextFamilies
  };
};

export const removeFamilyMember = (familyId: string, memberId: string) => {
  const family = getFamilyById(familyId);
  const nextFamily: FamilyProfile = {
    ...family,
    members: family.members.filter((member) => member.id !== memberId)
  };
  const nextFamilies = updateFamily(nextFamily);
  return {
    family: nextFamily,
    families: nextFamilies
  };
};

export const findCurrentUserMember = (family: FamilyProfile) => {
  return family.members.find((member) => member.name === '我') ?? null;
};

export const canCurrentUserLeaveFamily = (family: FamilyProfile) => {
  const currentUser = findCurrentUserMember(family);
  if (!currentUser) {
    return false;
  }

  const adminCount = family.members.filter((member) => member.role === '管理员').length;
  return currentUser.role !== '管理员' || adminCount > 1 || family.members.length <= 1;
};

export const leaveFamilyAsCurrentUser = (familyId: string) => {
  const family = getFamilyById(familyId);
  const currentUser = findCurrentUserMember(family);
  if (!currentUser) {
    return loadFamilies();
  }

  if (family.members.length <= 1) {
    return deleteFamily(familyId);
  }

  const nextFamily: FamilyProfile = {
    ...family,
    members: family.members.filter((member) => member.id !== currentUser.id)
  };
  const nextFamilies = updateFamily(nextFamily);
  saveActiveFamilyId(nextFamilies[0]?.id ?? 'weekend-home');
  return nextFamilies;
};

export const createFamily = (name: string) => {
  const trimmedName = name.trim() || '新的家庭';
  const family: FamilyProfile = {
    id: `family-${Date.now()}`,
    name: trimmedName,
    description: '1 位成员 · 菜谱和菜篮子共享中',
    commonRecipes: 0,
    pendingItems: 0,
    rules: '',
    members: [
      {
        id: `member-${Date.now()}`,
        accountId: '3171590593',
        name: '我',
        role: '管理员',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=160&q=80',
        note: '我',
        joinedAt: '2026-01-23'
      }
    ]
  };
  const nextFamilies = [family, ...loadFamilies()];
  saveFamilies(nextFamilies);
  saveActiveFamilyId(family.id);
  return family;
};

export const deleteFamily = (familyId: string) => {
  const currentFamilies = loadFamilies();
  if (currentFamilies.length <= 1) {
    return currentFamilies;
  }

  const nextFamilies = currentFamilies.filter((family) => family.id !== familyId);
  saveFamilies(nextFamilies);
  saveActiveFamilyId(nextFamilies[0]?.id ?? 'weekend-home');
  return nextFamilies;
};
