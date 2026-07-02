<template>
  <view class="app-page family-detail-page">
    <view class="topbar">
      <button class="nav-button" @tap="goBack">
        <app-icon name="arrow-left" size="26rpx" />
      </button>
      <button class="nav-button" @tap="goToInvite">
        <app-icon name="plus" size="26rpx" />
      </button>
    </view>

    <view class="title-block" @tap="toggleFamilySelect">
      <view class="title-row">
        <text class="family-title">{{ currentFamily.name }}</text>
        <app-icon :class="['title-arrow', { 'is-open': isFamilySelectVisible }]" name="chevron-down" size="22rpx" />
      </view>
      <text class="family-subtitle">
        {{ currentFamily.members.length }} 位成员 · {{ currentFamily.commonRecipes }} 道常做菜
      </text>
    </view>

    <view v-if="isFamilySelectVisible" class="select-mask" @tap="closeFamilySelect">
      <view class="select-sheet glass-card" @tap.stop>
        <text class="sheet-title">切换家庭</text>
        <view class="sheet-list">
          <view
            v-for="family in families"
            :key="family.id"
            :class="['sheet-item', { 'is-active': family.id === currentFamily.id }]"
            @tap="selectFamily(family.id)"
          >
            <view>
              <text class="sheet-item__name">{{ family.name }}</text>
              <text class="sheet-item__desc">{{ family.members.length }} 位成员</text>
            </view>
            <app-icon v-if="family.id === currentFamily.id" class="sheet-item__check" name="check" size="20rpx" />
          </view>
        </view>
      </view>
    </view>

    <view class="section glass-card">
      <text class="section-label">家庭成员（{{ currentFamily.members.length }}）</text>
      <view class="cell-list">
        <view
          v-for="member in currentFamily.members"
          :key="member.id"
          class="cell"
          @tap="openMember(member.id)"
        >
          <image class="cell-avatar" :src="member.avatar" mode="aspectFill" />
          <view class="cell-main">
            <text class="cell-title">{{ formatMemberTitle(member) }}</text>
            <text class="cell-subtitle">{{ member.role }}</text>
          </view>
          <app-icon class="cell-arrow" name="chevron-right" size="22rpx" />
        </view>

        <view class="cell cell--invite" @tap="goToInvite">
          <view class="cell-icon">
            <app-icon name="plus" size="22rpx" />
          </view>
          <view class="cell-main">
            <text class="cell-title">邀请家人</text>
            <text class="cell-subtitle">二维码或链接加入当前家庭</text>
          </view>
          <app-icon class="cell-arrow" name="chevron-right" size="22rpx" />
        </view>
      </view>
    </view>

    <view class="section glass-card">
      <text class="section-label">家庭</text>
      <view class="cell-list">
        <view class="cell" @tap="openEdit('name')">
          <text class="cell-left">家庭名称</text>
          <view class="cell-right">
            <text class="cell-value">{{ currentFamily.name }}</text>
            <app-icon class="cell-arrow" name="chevron-right" size="22rpx" />
          </view>
        </view>
        <view class="cell" @tap="goToPreferences">
          <text class="cell-left">家庭偏好</text>
          <view class="cell-right">
            <text class="cell-value">{{ currentFamily.rules || '未设置' }}</text>
            <app-icon class="cell-arrow" name="chevron-right" size="22rpx" />
          </view>
        </view>
      </view>
    </view>

    <view class="action-section glass-card">
      <button class="danger-button danger-button--soft" @tap="confirmLeaveFamily">退出家庭</button>
    </view>

    <view v-if="isEditPanelVisible" class="edit-mask" @tap="closeEdit">
      <view class="edit-panel glass-card" @tap.stop>
        <view class="edit-head">
          <text class="edit-title">{{ editTitle }}</text>
          <text class="edit-close" @tap="closeEdit">×</text>
        </view>
        <textarea
          v-if="editingField === 'rules'"
          v-model="editValue"
          class="edit-textarea"
          :placeholder="editPlaceholder"
          maxlength="80"
        />
        <input
          v-else
          v-model="editValue"
          class="edit-input"
          :placeholder="editPlaceholder"
          confirm-type="done"
        />
        <view class="edit-actions">
          <button class="ghost-button" @tap="closeEdit">取消</button>
          <button class="primary-button" @tap="saveEdit">保存</button>
        </view>
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
import type { FamilyProfile } from '../../types/family';

type EditField = 'name' | 'rules';

const families = ref<FamilyProfile[]>([]);
const activeFamilyId = ref(loadActiveFamilyId());
const isFamilySelectVisible = ref(false);
const isEditPanelVisible = ref(false);
const editingField = ref<EditField>('name');
const editValue = ref('');

const currentFamily = computed<FamilyProfile>(() => {
  return families.value.find((family) => family.id === activeFamilyId.value) ?? families.value[0] ?? {
    id: '',
    name: '家庭管理',
    description: '',
    commonRecipes: 0,
    pendingItems: 0,
    members: []
  };
});

const editTitle = computed(() => (editingField.value === 'name' ? '家庭名称' : '家庭规矩'));
const editPlaceholder = computed(() => (editingField.value === 'name' ? '例如：周末小家' : '例如：少油少盐，晚餐不吃太辣'));

const goBack = () => {
  uni.navigateBack();
};

const toggleFamilySelect = () => {
  isFamilySelectVisible.value = !isFamilySelectVisible.value;
};

const closeFamilySelect = () => {
  isFamilySelectVisible.value = false;
};

const selectFamily = (familyId: string) => {
  activeFamilyId.value = familyId;
  saveActiveFamilyId(familyId);
  closeFamilySelect();
};

const isCurrentUserMember = (member: { userId?: number; accountId?: string }) => {
  const currentUser = loadAuthUser();
  if (!currentUser) return false;
  return member.userId === currentUser.id || member.accountId === currentUser.phone;
};

const formatMemberTitle = (member: { name: string; userId?: number; accountId?: string }) => {
  return isCurrentUserMember(member) ? `${member.name}（我）` : member.name;
};

const openMember = (memberId: string) => {
  uni.navigateTo({
    url: `/pages/family-member/index?familyId=${encodeURIComponent(activeFamilyId.value)}&memberId=${encodeURIComponent(memberId)}`
  });
};

const goToInvite = () => {
  uni.navigateTo({ url: `/pages/family-invite/index?familyId=${encodeURIComponent(activeFamilyId.value)}` });
};

const goToPreferences = () => {
  uni.navigateTo({ url: `/pages/family-preferences/index?familyId=${encodeURIComponent(activeFamilyId.value)}` });
};

const openEdit = (field: EditField) => {
  editingField.value = field;
  editValue.value = field === 'name' ? currentFamily.value.name : currentFamily.value.rules ?? '';
  isEditPanelVisible.value = true;
};

const closeEdit = () => {
  isEditPanelVisible.value = false;
};

const saveEdit = async () => {
  const trimmedValue = editValue.value.trim();
  if (editingField.value === 'name' && !trimmedValue) {
    uni.showToast({ title: '请填写家庭名称', icon: 'none' });
    return;
  }

  const nextFamily: FamilyProfile = {
    ...currentFamily.value,
    name: editingField.value === 'name' ? trimmedValue : currentFamily.value.name,
    rules: editingField.value === 'rules' ? trimmedValue : currentFamily.value.rules
  };
  families.value = await updateFamily(nextFamily);
  closeEdit();
  uni.showToast({ title: '已保存', icon: 'success' });
};

const getFamilyIdFromLocation = () => {
  if (typeof window === 'undefined') return '';
  const hash = window.location.hash;
  const queryText = hash.includes('?') ? hash.slice(hash.indexOf('?') + 1) : '';
  return new URLSearchParams(queryText).get('id') ?? '';
};

const refreshFamilyPage = async (familyId = '') => {
  families.value = await loadFamilies();
  if (familyId && families.value.some((family) => family.id === familyId)) {
    activeFamilyId.value = familyId;
    saveActiveFamilyId(familyId);
  } else {
    activeFamilyId.value = loadActiveFamilyId();
  }
};

const confirmLeaveFamily = () => {
  if (!canCurrentUserLeaveFamily(currentFamily.value)) {
    uni.showToast({ title: '请先设置其他管理员', icon: 'none' });
    return;
  }

  uni.showModal({
    title: '退出家庭',
    content: `确认退出「${currentFamily.value.name}」吗？退出后将看不到该家庭的菜篮子和共享菜谱。`,
    confirmText: '退出',
    confirmColor: '#e5735f',
    success: async (result) => {
      if (!result.confirm) {
        return;
      }

      families.value = await leaveFamilyAsCurrentUser(currentFamily.value.id);
      activeFamilyId.value = loadActiveFamilyId();
      uni.showToast({ title: '已退出家庭', icon: 'none' });
      uni.navigateBack();
    }
  });
};

onLoad(async (options) => {
  const familyId = typeof options?.id === 'string' ? options.id : '';
  await refreshFamilyPage(familyId);
});

onMounted(() => {
  void refreshFamilyPage(getFamilyIdFromLocation()).catch((error) => {
    uni.showToast({ title: error instanceof Error ? error.message : '家庭加载失败', icon: 'none' });
  });
});

onShow(async () => {
  await refreshFamilyPage(getFamilyIdFromLocation());
});
</script>

<style scoped lang="scss">
.family-detail-page {
  padding-bottom: calc(80rpx + env(safe-area-inset-bottom, 0));
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: calc(-32rpx + env(safe-area-inset-top, 0));
}

.nav-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 74rpx;
  height: 74rpx;
  border: 0;
  border-radius: 50%;
  background: rgba(255, 253, 252, 0.92);
  color: var(--app-text);
  font-size: var(--font-size-section-title);
  font-weight: var(--font-medium);
  box-shadow: 0 12rpx 30rpx rgba(0, 0, 0, 0.04);
}

.nav-button::after,
.ghost-button::after,
.primary-button::after,
.danger-button::after {
  border: 0;
}

.title-block {
  margin-top: 18rpx;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.family-title {
  display: block;
  color: var(--app-text);
  font-size: var(--font-size-page-title);
  font-weight: var(--font-semibold);
  letter-spacing: 0;
}

.title-arrow {
  color: var(--app-text-secondary);
  font-size: var(--font-size-body);
  transform: translateY(4rpx);
  transition: transform 160ms ease;
}

.title-arrow.is-open {
  transform: translateY(4rpx) rotate(180deg);
}

.family-subtitle {
  display: block;
  margin-top: 10rpx;
  color: var(--app-text-tertiary);
  font-size: var(--font-size-tag);
  font-weight: var(--font-semibold);
}

.section {
  margin-top: 22rpx;
  padding: 26rpx;
  border-radius: var(--app-radius-card);
  background: rgba(255, 253, 252, 0.92);
}

.action-section {
  display: grid;
  gap: 14rpx;
  margin-top: 22rpx;
  padding: 20rpx;
  border-radius: var(--app-radius-card);
  background: rgba(255, 253, 252, 0.92);
}

.danger-button {
  width: 100%;
  height: 82rpx;
  border: 0;
  border-radius: var(--app-radius-button);
  background: rgba(229, 115, 95, 0.12);
  color: var(--app-danger);
  font-size: var(--font-size-caption);
  font-weight: var(--font-semibold);
}

.danger-button--soft {
  background: #e9e2d6;
  color: var(--app-text);
}

.section-label {
  display: block;
  margin-bottom: 18rpx;
  color: var(--app-text-tertiary);
  font-size: var(--font-size-tag);
  font-weight: var(--font-medium);
}

.cell-list {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.cell {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  min-height: 106rpx;
  padding: 18rpx 12rpx;
  border-radius: 28rpx;
  background: rgba(255, 253, 252, 0.7);
}

.cell-avatar {
  width: 78rpx;
  height: 78rpx;
  border-radius: 50%;
  background: var(--app-accent-soft);
}

.cell-main {
  min-width: 0;
  flex: 1;
}

.cell-title,
.cell-subtitle,
.cell-left,
.cell-value {
  display: block;
}

.cell-title,
.cell-left {
  color: var(--app-text);
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-semibold);
}

.cell-subtitle {
  margin-top: 6rpx;
  color: var(--app-text-secondary);
  font-size: var(--font-size-tabbar);
}

.cell-arrow {
  color: var(--app-text-tertiary);
  font-size: var(--font-size-detail-title);
}

.cell--invite {
  background: rgba(245, 241, 234, 0.92);
}

.cell-icon {
  width: 78rpx;
  height: 78rpx;
  border-radius: 50%;
  background: rgba(47, 47, 47, 0.06);
  color: var(--app-text);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-section-title);
  font-weight: var(--font-medium);
}

.cell-right {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.cell-value {
  max-width: 320rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--app-text-secondary);
  font-size: var(--font-size-tag);
  font-weight: var(--font-semibold);
}

.select-mask {
  position: fixed;
  inset: 0;
  z-index: 30;
  display: flex;
  align-items: flex-end;
  padding: 24rpx;
  background: rgba(47, 47, 47, 0.28);
  backdrop-filter: blur(10rpx);
  -webkit-backdrop-filter: blur(10rpx);
}

.edit-mask {
  position: fixed;
  inset: 0;
  z-index: 30;
  display: flex;
  align-items: flex-start;
  padding: 260rpx 24rpx 24rpx;
  background: rgba(47, 47, 47, 0.28);
  backdrop-filter: blur(10rpx);
  -webkit-backdrop-filter: blur(10rpx);
}

.select-sheet,
.edit-panel {
  width: 100%;
  padding: 26rpx;
  border-radius: var(--app-radius-card);
}

.edit-panel {
  background: rgba(255, 253, 252, 0.96);
}

.sheet-title {
  display: block;
  color: var(--app-text);
  font-size: var(--font-size-body);
  font-weight: var(--font-semibold);
}

.sheet-list {
  margin-top: 18rpx;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.sheet-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18rpx 16rpx;
  border-radius: 26rpx;
  background: rgba(255, 253, 252, 0.72);
}

.sheet-item.is-active {
  background: var(--app-accent-soft);
}

.sheet-item__name,
.sheet-item__desc,
.sheet-item__check {
  display: block;
}

.sheet-item__name {
  color: var(--app-text);
  font-size: var(--font-size-caption);
  font-weight: var(--font-semibold);
}

.sheet-item__desc {
  margin-top: 6rpx;
  color: var(--app-text-secondary);
  font-size: var(--font-size-tabbar);
}

.sheet-item__check {
  color: var(--app-text);
  font-size: var(--font-size-caption);
  font-weight: var(--font-semibold);
}

.edit-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14rpx;
}

.edit-title {
  display: block;
  color: var(--app-text);
  font-size: var(--font-size-body);
  font-weight: var(--font-semibold);
}

.edit-close {
  color: var(--app-text-tertiary);
  font-size: var(--font-size-detail-title);
  line-height: var(--line-tabbar);
}

.edit-input {
  width: 100%;
  height: 80rpx;
  margin-top: 18rpx;
  padding: 0 22rpx;
  border: 1rpx solid var(--app-border);
  border-radius: 24rpx;
  background: rgba(255, 253, 252, 0.86);
  color: var(--app-text);
  font-size: var(--font-size-tag);
}

.edit-textarea {
  display: block;
  box-sizing: border-box;
  width: 100%;
  height: 190rpx;
  margin-top: 18rpx;
  padding: 20rpx 22rpx;
  border: 1rpx solid var(--app-border);
  border-radius: 24rpx;
  background: rgba(255, 253, 252, 0.86);
  color: var(--app-text);
  font-size: var(--font-size-caption);
  line-height: var(--line-body-sm);
}

.edit-textarea :deep(textarea),
.edit-textarea :deep(.uni-textarea-textarea) {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  min-height: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--app-text);
  font-size: var(--font-size-caption);
  line-height: var(--line-body-sm);
  resize: none;
}

.edit-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12rpx;
  margin-top: 18rpx;
}

.ghost-button,
.primary-button {
  height: 76rpx;
  border: 0;
  border-radius: var(--app-radius-button);
  font-size: var(--font-size-tag);
  font-weight: var(--font-semibold);
}

.ghost-button {
  background: rgba(255, 253, 252, 0.74);
  color: var(--app-text);
}

.primary-button {
  background: var(--app-accent);
  color: var(--text-white);
}
</style>
