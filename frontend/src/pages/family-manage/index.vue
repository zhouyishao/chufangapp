<template>
  <view class="app-page family-manage-page">
    <view class="safe-top-spacer" aria-hidden="true" />
    <view class="page-topbar">
      <button class="topbar-button" aria-label="返回家庭管理" @tap="goBack">
        <app-icon name="arrow-left" size="26rpx" />
      </button>
      <text class="topbar-title">家庭成员</text>
      <button v-if="canRenameFamily" class="topbar-action" @tap="openEdit">编辑</button>
      <view v-else class="topbar-spacer" />
    </view>

    <view v-if="isLoading" class="state-panel">
      <text class="state-title">正在加载家庭</text>
    </view>
    <view v-else-if="errorMessage" class="state-panel">
      <text class="state-title">家庭暂时没有加载出来</text>
      <text class="state-copy">{{ errorMessage }}</text>
      <button class="primary-action state-action" @tap="retryLoadFamilies">重新加载</button>
    </view>
    <view v-else-if="!hasFamilies" class="state-panel">
      <text class="state-title">还没有家庭</text>
      <text class="state-copy">请返回家庭管理，创建或加入一个家庭。</text>
      <button class="primary-action state-action" @tap="goToCreateFamily">创建家庭</button>
    </view>

    <template v-else>
      <view class="family-member-summary">
        <view class="summary-copy-block">
          <text class="summary-title">{{ currentFamily.members.length }} 位成员</text>
          <text class="summary-copy">我的身份：{{ currentRole }}</text>
        </view>
        <button class="family-code-entry" @tap="goToInvite">
          <app-icon name="qr-code" size="24rpx" />
          <text>家庭码</text>
        </button>
      </view>

      <view class="family-member-directory">
        <button
          v-for="member in currentFamily.members"
          :key="member.id"
          class="member-row"
          @tap="openMember(member.id)"
        >
          <image v-if="member.avatar" class="member-avatar" :src="member.avatar" mode="aspectFill" />
          <view v-else :class="['member-avatar', 'member-avatar--empty', { 'is-self': isCurrentUserMember(member) }]">
            {{ formatMemberName(member).slice(0, 1) }}
          </view>
          <view class="member-copy">
            <text class="member-name">{{ formatMemberName(member) }}{{ isCurrentUserMember(member) ? '（我）' : '' }}</text>
            <text class="member-note">{{ member.note ? `账号昵称：${member.name}` : '未设置备注名' }}</text>
          </view>
          <text class="member-role">{{ member.role }}</text>
          <app-icon class="row-chevron" name="chevron-right" size="20rpx" />
        </button>
      </view>

      <button v-if="canManageMembers" class="invite-action" @tap="goToInvite">
        <app-icon name="plus" size="22rpx" />
        <text>邀请新成员</text>
      </button>

      <view class="family-danger-zone">
        <button v-if="currentRole !== '创建者'" class="danger-action" :disabled="isLeaving" @tap="confirmLeaveFamily">
          {{ isLeaving ? '退出中…' : '退出家庭' }}
        </button>
      </view>
    </template>

    <view v-if="isEditPanelVisible" class="sheet-mask" @tap="closeEdit">
      <view class="edit-sheet" @tap.stop>
        <view class="sheet-handle" aria-hidden="true" />
        <text class="sheet-eyebrow">家庭资料</text>
        <text class="sheet-title">编辑家庭资料</text>
        <button class="sheet-avatar-editor" :disabled="isUploadingAvatar" @tap="chooseFamilyAvatar">
          <image v-if="currentFamily.avatar" class="sheet-family-avatar" :src="currentFamily.avatar" mode="aspectFill" />
          <view v-else class="sheet-family-avatar sheet-family-avatar--empty">{{ currentFamily.name.slice(0, 1) }}</view>
          <view class="sheet-avatar-copy">
            <text>{{ isUploadingAvatar ? '上传中…' : '更换家庭头像' }}</text>
            <text>JPG/PNG/WebP，至少 512×512，不超过 5MB</text>
          </view>
          <app-icon name="chevron-right" size="20rpx" />
        </button>
        <view class="name-field">
          <text>家庭名称</text>
          <input v-model="editValue" maxlength="12" placeholder="例如：周家" confirm-type="done" />
          <text class="name-field__hint">家庭成员都会看到这个名称</text>
        </view>
        <button class="primary-action" :disabled="isSaving" @tap="saveEdit">
          {{ isSaving ? '保存中…' : '保存名称' }}
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import AppIcon from '../../components/app/app-icon.vue';
import { loadAuthUser } from '../../services/auth';
import {
  canCurrentUserLeaveFamily,
  leaveFamilyAsCurrentUser,
  loadActiveFamilyId,
  loadFamilies,
  saveActiveFamilyId,
  updateFamily
} from '../../services/family';
import type { FamilyMember, FamilyProfile } from '../../types/family';
import {
  enqueuePendingFileCleanup,
  handlePendingFileCleanupFailure,
  deleteUploadedFile,
  removePendingFileCleanup,
  uploadAvatarFile
} from '../../services/file-upload';

type RefreshOptions = { showLoading?: boolean };

const families = ref<FamilyProfile[]>([]);
const activeFamilyId = ref(loadActiveFamilyId());
const isLoading = ref(false);
const hasLoaded = ref(false);
const isSaving = ref(false);
const isLeaving = ref(false);
const errorMessage = ref('');
const isEditPanelVisible = ref(false);
const isUploadingAvatar = ref(false);
const editValue = ref('');

const emptyFamily: FamilyProfile = {
  id: '', name: '', description: '', commonRecipes: 0, pendingItems: 0,
  members: [], avatar: '', avatarFileId: null
};

const currentFamily = computed<FamilyProfile>(() =>
  families.value.find((family) => family.id === activeFamilyId.value) ?? families.value[0] ?? emptyFamily
);
const hasFamilies = computed(() => families.value.length > 0 && Boolean(currentFamily.value.id));
const currentMember = computed(() => currentFamily.value.members.find(isCurrentUserMember));
const currentRole = computed(() => currentMember.value?.role ?? '成员');
const canRenameFamily = computed(() => currentRole.value === '创建者');
const canManageMembers = computed(() => currentRole.value === '创建者' || currentRole.value === '管理员');

function isCurrentUserMember(member: Pick<FamilyMember, 'userId' | 'accountId'>) {
  const currentUser = loadAuthUser();
  if (!currentUser) return false;
  return member.userId === currentUser.id || member.accountId === currentUser.phone;
}

const formatMemberName = (member: FamilyMember) => member.note || member.name;
const goBack = () => uni.navigateBack();

const requireCurrentFamilyId = () => {
  if (currentFamily.value.id) return currentFamily.value.id;
  uni.showToast({ title: '请先创建家庭', icon: 'none' });
  return '';
};

const openMember = (memberId: string) => {
  const familyId = requireCurrentFamilyId();
  if (!familyId) return;
  uni.navigateTo({
    url: `/pages/family-member/index?familyId=${encodeURIComponent(familyId)}&memberId=${encodeURIComponent(memberId)}`
  });
};

const goToInvite = () => {
  const familyId = requireCurrentFamilyId();
  if (familyId) uni.navigateTo({ url: `/pages/family-invite/index?familyId=${encodeURIComponent(familyId)}` });
};

const goToCreateFamily = () => uni.navigateTo({ url: '/pages/family-create/index' });
const openEdit = () => {
  if (!requireCurrentFamilyId()) return;
  editValue.value = currentFamily.value.name;
  isEditPanelVisible.value = true;
};
const closeEdit = () => { isEditPanelVisible.value = false; };

const saveEdit = async () => {
  const name = editValue.value.trim();
  if (!name) return uni.showToast({ title: '请填写家庭名称', icon: 'none' });
  if (isSaving.value) return;
  isSaving.value = true;
  try {
    families.value = await updateFamily({ ...currentFamily.value, name });
    closeEdit();
    uni.showToast({ title: '名称已更新', icon: 'success' });
  } catch (error) {
    uni.showToast({ title: error instanceof Error ? error.message : '保存失败', icon: 'none' });
  } finally {
    isSaving.value = false;
  }
};

const chooseFamilyAvatar = () => {
  if (!currentFamily.value.id || isUploadingAvatar.value) return;
  uni.chooseImage({
    count: 1, sizeType: ['compressed'], sourceType: ['album', 'camera'],
    success: ({ tempFilePaths }) => {
      const filePath = tempFilePaths?.[0];
      if (filePath) void uploadFamilyAvatar(filePath);
    }
  });
};

const uploadFamilyAvatar = async (filePath: string) => {
  isUploadingAvatar.value = true;
  const previous = currentFamily.value;
  const owner = loadAuthUser();
  let uploadedFileId: number | null = null;
  try {
    const uploaded = await uploadAvatarFile(filePath, {}, 'family-avatar').promise;
    uploadedFileId = uploaded.id;
    families.value = await updateFamily({ ...previous, avatar: uploaded.url, avatarFileId: uploaded.id });
    uploadedFileId = null;
    uni.showToast({ title: '家庭头像已更新', icon: 'success' });
  } catch (error) {
    if (uploadedFileId !== null && owner?.id) {
      enqueuePendingFileCleanup(owner.id, uploadedFileId);
      try {
        await deleteUploadedFile(uploadedFileId);
        removePendingFileCleanup(owner.id, uploadedFileId);
      } catch (cleanupError) {
        handlePendingFileCleanupFailure(owner.id, uploadedFileId, cleanupError);
      }
    }
    uni.showToast({ title: error instanceof Error ? error.message : '头像上传失败', icon: 'none' });
  } finally {
    isUploadingAvatar.value = false;
  }
};

const resolveActiveFamilyId = (requestedId = '') => {
  const stored = loadActiveFamilyId();
  if (requestedId && families.value.some(({ id }) => id === requestedId)) return requestedId;
  if (stored && families.value.some(({ id }) => id === stored)) return stored;
  return families.value[0]?.id ?? '';
};

const refreshFamilyPage = async (familyId = '', options: RefreshOptions = {}) => {
  if (options.showLoading ?? !hasLoaded.value) isLoading.value = true;
  errorMessage.value = '';
  try {
    families.value = await loadFamilies();
    activeFamilyId.value = resolveActiveFamilyId(familyId);
    if (activeFamilyId.value) saveActiveFamilyId(activeFamilyId.value);
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '家庭加载失败';
    families.value = [];
  } finally {
    isLoading.value = false;
    hasLoaded.value = true;
  }
};

const getFamilyIdFromLocation = () => {
  if (typeof window === 'undefined') return '';
  const query = window.location.hash.split('?')[1] ?? '';
  return new URLSearchParams(query).get('id') ?? '';
};
const retryLoadFamilies = () => void refreshFamilyPage(getFamilyIdFromLocation(), { showLoading: true });

const confirmLeaveFamily = () => {
  const familyId = requireCurrentFamilyId();
  if (!familyId || isLeaving.value) return;
  if (!canCurrentUserLeaveFamily(currentFamily.value)) {
    uni.showToast({ title: '请先设置其他管理员', icon: 'none' });
    return;
  }
  uni.showModal({
    title: '退出家庭', content: `确认退出「${currentFamily.value.name}」吗？`,
    confirmText: '退出', confirmColor: '#C86F4A',
    success: async ({ confirm }) => {
      if (!confirm) return;
      isLeaving.value = true;
      try {
        await leaveFamilyAsCurrentUser(familyId);
        uni.showToast({ title: '已退出家庭', icon: 'none' });
        uni.navigateBack();
      } catch (error) {
        uni.showToast({ title: error instanceof Error ? error.message : '退出失败', icon: 'none' });
      } finally { isLeaving.value = false; }
    }
  });
};

onLoad((options) => void refreshFamilyPage(typeof options?.id === 'string' ? options.id : '', { showLoading: true }));
onMounted(() => { if (!hasLoaded.value) void refreshFamilyPage(getFamilyIdFromLocation(), { showLoading: true }); });
onShow(() => { if (hasLoaded.value) void refreshFamilyPage(getFamilyIdFromLocation()); });
</script>

<style scoped lang="scss">
.family-manage-page { padding-right: 40rpx; padding-bottom: calc(80rpx + var(--app-safe-area-bottom)); padding-left: 40rpx; }
.safe-top-spacer { height: calc(var(--app-safe-area-top) + 8rpx); }
.page-topbar { position: sticky; z-index: var(--z-sticky); top: 0; display: grid; grid-template-columns: 128rpx 1fr 128rpx; align-items: center; min-height: 112rpx; margin-bottom: 48rpx; border-bottom: 1rpx solid var(--app-border); background: rgba(245, 241, 234, .92); backdrop-filter: blur(18px); }
.topbar-button, .topbar-action, .family-code-entry, .member-row, .invite-action, .danger-action, .sheet-avatar-editor, .primary-action { border: 0; }
.topbar-button::after, .topbar-action::after, .family-code-entry::after, .member-row::after, .invite-action::after, .danger-action::after, .sheet-avatar-editor::after, .primary-action::after { border: 0; }
.topbar-button { display: flex; align-items: center; justify-content: center; width: 88rpx; height: 88rpx; padding: 0; border-radius: 50%; background: transparent; color: var(--app-text); }
.topbar-title { color: var(--app-text); font-size: var(--font-size-section-title); font-weight: var(--font-semibold); line-height: var(--line-section-title); text-align: center; }
.topbar-action { min-height: 88rpx; padding: 0; background: transparent; color: var(--app-primary); font-size: var(--font-size-body); line-height: var(--line-body); }
.topbar-spacer { width: 128rpx; height: 88rpx; }
.summary-title, .summary-copy, .member-name, .member-note { display: block; }
.family-member-summary { display: flex; align-items: center; justify-content: space-between; min-height: 116rpx; margin-bottom: 24rpx; padding: 20rpx 28rpx; border: 1rpx solid var(--app-border); border-radius: 26rpx; background: var(--app-surface); }
.summary-copy-block { min-width: 0; }
.summary-title { color: var(--app-text); font-size: var(--font-size-card-title); font-weight: var(--font-semibold); line-height: var(--line-card-title); }
.summary-copy { margin-top: 4rpx; color: var(--text-tertiary); font-size: var(--font-size-caption); line-height: var(--line-caption); }
.family-code-entry { display: flex; align-items: center; gap: 8rpx; min-height: 88rpx; margin: 0; padding: 0 20rpx; border-radius: 22rpx; background: var(--app-primary-soft); color: var(--app-primary); font-size: var(--font-size-caption); font-weight: var(--font-medium); }
.family-member-directory { overflow: hidden; border: 1rpx solid var(--app-border); border-radius: 30rpx; background: var(--app-surface); }
.member-row { display: grid; grid-template-columns: 80rpx minmax(0, 1fr) auto 28rpx; align-items: center; gap: 22rpx; width: 100%; min-height: 140rpx; margin: 0; padding: 22rpx 28rpx; border-radius: 0; background: transparent; text-align: left; }
.member-row + .member-row { border-top: 1rpx solid var(--app-border); }
.member-avatar { width: 80rpx; height: 80rpx; border-radius: 20rpx; background: var(--app-surface-strong); }
.member-avatar--empty { display: flex; align-items: center; justify-content: center; border: 1rpx solid var(--app-border); color: var(--text-tertiary); font-size: var(--font-size-card-title); font-weight: var(--font-semibold); }
.member-avatar--empty.is-self { border-color: transparent; background: var(--app-primary); color: var(--text-white); }
.member-copy { min-width: 0; }
.member-name { overflow: hidden; color: var(--app-text); font-size: var(--font-size-list-title); font-weight: var(--font-medium); line-height: var(--line-list-title); text-overflow: ellipsis; white-space: nowrap; }
.member-note { margin-top: 4rpx; overflow: hidden; color: var(--text-tertiary); font-size: var(--font-size-caption); line-height: var(--line-caption); text-overflow: ellipsis; white-space: nowrap; }
.member-role { color: var(--text-tertiary); font-size: var(--font-size-tag); line-height: var(--line-tag); }
.row-chevron { color: var(--text-placeholder); }
.invite-action { display: flex; align-items: center; justify-content: center; gap: 8rpx; width: 100%; min-height: 92rpx; margin-top: 32rpx; border-radius: 20rpx; background: var(--app-primary); color: var(--text-white); font-size: var(--font-size-body); font-weight: var(--font-semibold); }
.family-danger-zone { display: flex; justify-content: center; gap: 36rpx; margin-top: 36rpx; }
.danger-action { min-height: 88rpx; margin: 0; padding: 0 24rpx; background: transparent; color: var(--app-warning); font-size: var(--font-size-body); }
.state-panel { margin-top: 32rpx; padding: 36rpx 24rpx; text-align: center; }
.state-title, .state-copy { display: block; }
.state-title { color: var(--app-text); font-size: var(--font-size-card-title); font-weight: var(--font-semibold); }
.state-copy { margin-top: 10rpx; color: var(--text-tertiary); font-size: var(--font-size-caption); }
.state-action { margin-top: 24rpx; }
.sheet-mask { position: fixed; z-index: var(--z-sheet); inset: 0; display: flex; align-items: flex-end; background: rgba(47, 47, 47, .22); }
.edit-sheet { width: 100%; padding: 16rpx 32rpx calc(32rpx + var(--app-safe-area-bottom)); border-radius: 36rpx 36rpx 0 0; background: var(--app-surface-strong); }
.sheet-handle { width: 72rpx; height: 8rpx; margin: 0 auto 24rpx; border-radius: var(--radius-pill); background: var(--app-border); }
.sheet-eyebrow { display: block; color: var(--app-primary); font-size: var(--font-size-tag); line-height: var(--line-tag); }
.sheet-title { display: block; margin-top: 6rpx; color: var(--app-text); font-size: var(--font-size-page-title); font-weight: var(--font-semibold); line-height: var(--line-page-title); }
.sheet-avatar-editor { display: grid; grid-template-columns: 96rpx minmax(0, 1fr) 28rpx; align-items: center; gap: 20rpx; width: 100%; min-height: 128rpx; margin: 24rpx 0 0; padding: 16rpx 20rpx; border: 1rpx solid var(--app-border); border-radius: 24rpx; background: var(--app-background); text-align: left; }
.sheet-family-avatar { width: 96rpx; height: 96rpx; border-radius: 22rpx; background: var(--app-surface); }
.sheet-family-avatar--empty { display: flex; align-items: center; justify-content: center; color: var(--app-primary); font-size: var(--font-size-section-title); font-weight: var(--font-semibold); }
.sheet-avatar-copy text { display: block; color: var(--app-text); font-size: var(--font-size-body-sm); line-height: var(--line-body-sm); }
.sheet-avatar-copy text + text { margin-top: 4rpx; color: var(--text-tertiary); font-size: var(--font-size-tag); line-height: var(--line-tag); }
.name-field { display: block; margin-top: 28rpx; }
.name-field > text, .name-field__hint { display: block; }
.name-field > text { color: var(--text-tertiary); font-size: var(--font-size-caption); }
.name-field input { height: 92rpx; margin-top: 10rpx; padding: 0 22rpx; border: 1rpx solid var(--app-border); border-radius: var(--app-radius-button); background: var(--app-background); color: var(--app-text); font-size: var(--font-size-body); }
.name-field__hint { margin-top: 8rpx; color: var(--text-tertiary); font-size: var(--font-size-tag); }
.primary-action { width: 100%; min-height: 88rpx; margin-top: 28rpx; border-radius: var(--app-radius-button); background: var(--app-primary); color: var(--text-white); font-size: var(--font-size-body); font-weight: var(--font-semibold); }

@media (max-width: 375px) {
  .member-row { grid-template-columns: 80rpx minmax(0, 1fr) 28rpx; }
  .member-role { display: none; }
}
</style>
