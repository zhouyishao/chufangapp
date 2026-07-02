import { loadAuthUser, syncAuthUserWithBackend } from './auth';
import {
  createMobileFamily,
  createMobileFamilyInvite,
  getMobileFamily,
  getMobileFamilyInvite,
  joinMobileFamilyInvite,
  listMobileFamilies,
  removeMobileFamilyMember,
  saveMobileFamilyPreferences,
  updateMobileFamilyMember,
  updateMobileFamily,
  type ApiFamily,
  type ApiFamilyInvite
} from './public-api';
import type { FamilyMember, FamilyProfile } from '../types/family';

const ACTIVE_FAMILY_STORAGE_KEY = 'recipe-app-active-family-id';

const roleText = (role: 'CREATOR' | 'ADMIN' | 'MEMBER') => (role === 'MEMBER' ? '成员' : '管理员');

const unwrapStoredValue = (value: unknown): unknown => {
  if (typeof value === 'string') {
    try {
      return unwrapStoredValue(JSON.parse(value));
    } catch {
      return value;
    }
  }
  if (typeof value === 'object' && value !== null && 'data' in value && typeof (value as { type?: unknown }).type === 'string') {
    return unwrapStoredValue((value as { data?: unknown }).data);
  }
  return value;
};

export const mapApiFamily = (family: ApiFamily): FamilyProfile => ({
  id: String(family.id),
  name: family.name,
  description: family.description || `${family.memberCount} 位成员 · 菜谱和菜篮子共享中`,
  commonRecipes: 0,
  pendingItems: family.pendingItems,
  rules: family.preferences.note ?? '',
  preferences: family.preferences,
  members: family.members.map<FamilyMember>((member) => ({
    id: String(member.id),
    accountId: member.user.phone ?? String(member.user.id),
    name: member.user.nickname || member.user.phone || '家人',
    role: roleText(member.role),
    avatar: member.user.avatar || '',
    note: (member.remark ?? member.user.nickname) || '',
    joinedAt: member.joinedAt.slice(0, 10),
    userId: member.user.id
  }))
});

export const loadActiveFamilyId = () => {
  const storedFamilyId = uni.getStorageSync(ACTIVE_FAMILY_STORAGE_KEY) as unknown;
  const unwrappedFamilyId = unwrapStoredValue(storedFamilyId);
  return typeof unwrappedFamilyId === 'string' ? unwrappedFamilyId : '';
};

export const saveActiveFamilyId = (familyId: string) => {
  uni.setStorageSync(ACTIVE_FAMILY_STORAGE_KEY, familyId);
};

const requireUser = async () => {
  const user = await syncAuthUserWithBackend(loadAuthUser());
  if (!user?.id) {
    throw new Error('请先登录');
  }
  return { ...user, id: user.id };
};

export const loadFamilies = async (): Promise<FamilyProfile[]> => {
  const user = await requireUser();
  const families = (await listMobileFamilies(user.id)).map(mapApiFamily);
  const activeId = loadActiveFamilyId();
  if ((!activeId || !families.some((family) => family.id === activeId)) && families[0]) {
    saveActiveFamilyId(families[0].id);
  }
  return families;
};

export const getDefaultFamilies = (): FamilyProfile[] => [];

export const getFamilyById = async (familyId: string) => {
  if (!familyId) {
    const families = await loadFamilies();
    return families[0] ?? null;
  }
  return mapApiFamily(await getMobileFamily(Number(familyId)));
};

export const createFamily = async (name: string, options: { city?: string; district?: string; description?: string } = {}) => {
  const user = await requireUser();
  const family = mapApiFamily(await createMobileFamily({
    userId: user.id,
    name: name.trim() || '新的家庭',
    city: options.city?.trim() || undefined,
    district: options.district?.trim() || undefined,
    description: options.description?.trim() || undefined
  }));
  saveActiveFamilyId(family.id);
  return family;
};

export const updateFamily = async (family: FamilyProfile) => {
  const user = await requireUser();
  await updateMobileFamily(Number(family.id), {
    userId: user.id,
    name: family.name,
    description: family.description
  });
  await saveMobileFamilyPreferences(Number(family.id), {
    userId: user.id,
    avoidItems: family.preferences?.avoidItems ?? [],
    allergies: family.preferences?.allergies ?? [],
    preferences: family.preferences?.preferences ?? [],
    taste: family.preferences?.taste ?? null,
    note: family.rules ?? ''
  });
  return loadFamilies();
};

export const updateFamilyMember = async (
  familyId: string,
  member: FamilyMember,
  payload: { remark?: string | null; role?: '管理员' | '成员' }
) => {
  const user = await requireUser();
  const apiRole = payload.role === '管理员' ? 'ADMIN' : payload.role === '成员' ? 'MEMBER' : undefined;
  await updateMobileFamilyMember(Number(member.id), {
    userId: user.id,
    remark: payload.remark,
    role: apiRole
  });
  return getFamilyById(familyId);
};

export const removeFamilyMember = async (_familyId: string, memberId: string) => {
  const user = await requireUser();
  await removeMobileFamilyMember(Number(memberId), user.id);
  return loadFamilies();
};

export const canCurrentUserLeaveFamily = (family: FamilyProfile) => {
  const user = loadAuthUser();
  const currentUser = family.members.find((member) => member.userId === user?.id || member.accountId === user?.phone);
  if (!currentUser) return false;
  const adminCount = family.members.filter((member) => member.role === '管理员').length;
  return currentUser.role !== '管理员' || adminCount > 1 || family.members.length <= 1;
};

export const leaveFamilyAsCurrentUser = async (familyId: string) => {
  const user = await requireUser();
  const family = await getFamilyById(familyId);
  const currentUser = family?.members.find((member) => member.userId === user.id || member.accountId === user.phone);
  if (currentUser) {
    await removeMobileFamilyMember(Number(currentUser.id), user.id);
  }
  const families = await loadFamilies();
  saveActiveFamilyId(families[0]?.id ?? '');
  return families;
};

export const deleteFamily = leaveFamilyAsCurrentUser;

export const createFamilyInvite = async (familyId: string) => {
  const user = await requireUser();
  return createMobileFamilyInvite(Number(familyId), user.id);
};

export const getFamilyInvite = async (token: string): Promise<ApiFamilyInvite> => {
  return getMobileFamilyInvite(token);
};

export const joinFamilyInvite = async (token: string) => {
  const user = await requireUser();
  const family = mapApiFamily(await joinMobileFamilyInvite(token, user.id));
  saveActiveFamilyId(family.id);
  return family;
};
