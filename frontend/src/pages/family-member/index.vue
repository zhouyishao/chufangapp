<template>
  <view class="app-page member-page">
    <view class="topbar">
      <button class="nav-button" @tap="goBack">←</button>
      <view class="topbar__spacer" />
    </view>

    <view v-if="member" class="member-hero">
      <image class="member-avatar" :src="member.avatar" mode="aspectFill" />
      <view class="member-hero__main">
        <text class="member-name">{{ member.accountId || member.name }}</text>
        <text class="member-joined">{{ joinedText }}</text>
      </view>
    </view>

    <view v-if="member" class="info-section glass-card">
      <view class="info-row">
        <text class="info-label">小米ID</text>
        <text class="info-value">{{ member.accountId || '-' }}</text>
      </view>
      <view class="info-row">
        <text class="info-label">昵称</text>
        <text class="info-value">{{ member.name }}</text>
      </view>
      <view class="info-row info-row--link" @tap="openRemarkEditor">
        <text class="info-label">备注</text>
        <view class="info-right">
          <text class="info-value info-value--muted">{{ member.note || '未设置' }}</text>
          <text class="arrow">›</text>
        </view>
      </view>
      <view class="info-row info-row--link" @tap="openRoleSelector">
        <text class="info-label">家庭权限</text>
        <view class="info-right">
          <text class="info-value info-value--muted">{{ member.role }}</text>
          <text class="arrow">›</text>
        </view>
      </view>
    </view>

    <view v-if="member" class="action-section glass-card">
      <button
        v-if="isCurrentUser"
        class="danger-button danger-button--soft"
        @tap="confirmLeaveFamily"
      >
        退出家庭
      </button>
      <button
        v-else
        class="danger-button"
        @tap="confirmRemoveMember"
      >
        移除成员
      </button>
    </view>

    <view v-else class="empty-card glass-card">
      <text class="empty-title">未找到成员</text>
      <text class="empty-desc">请返回家庭页面重新选择成员。</text>
      <button class="primary-button" @tap="goBack">返回</button>
    </view>

    <view v-if="isRemarkEditorVisible" class="mask" @tap="closeRemarkEditor">
      <view class="panel glass-card" @tap.stop>
        <view class="panel-head">
          <text class="panel-title">编辑备注</text>
          <text class="panel-close" @tap="closeRemarkEditor">×</text>
        </view>
        <input v-model="remarkDraft" class="text-input" placeholder="例如：负责买菜" confirm-type="done" />
        <view class="panel-actions">
          <button class="ghost-button" @tap="closeRemarkEditor">取消</button>
          <button class="primary-button" @tap="saveRemark">保存</button>
        </view>
      </view>
    </view>

    <view v-if="isRoleSelectorVisible" class="mask" @tap="closeRoleSelector">
      <view class="panel glass-card" @tap.stop>
        <text class="panel-title center-title">请选择家人权限</text>

        <view class="role-list">
          <view class="role-item" @tap="setRole('成员')">
            <view class="role-main">
              <text class="role-title">成员</text>
              <text class="role-desc">可以使用家庭中的共享菜谱与菜篮子</text>
            </view>
            <view :class="['radio', { 'is-checked': roleDraft === '成员' }]" />
          </view>
          <view class="role-item" @tap="setRole('管理员')">
            <view class="role-main">
              <text class="role-title">管理员</text>
              <text class="role-desc">可邀请/移除家人，修改家人权限，进行家庭管理</text>
            </view>
            <view :class="['radio', { 'is-checked': roleDraft === '管理员' }]" />
          </view>
        </view>

        <view class="panel-actions two-col">
          <button class="ghost-button" @tap="closeRoleSelector">取消</button>
          <button class="primary-button" @tap="saveRole">下一步</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import {
  canCurrentUserLeaveFamily,
  getFamilyById,
  leaveFamilyAsCurrentUser,
  removeFamilyMember,
  updateFamilyMember
} from '../../services/family';
import type { FamilyMember, FamilyMemberRole } from '../../types/family';

const familyId = ref('');
const memberId = ref('');
const member = ref<FamilyMember | null>(null);

const isRemarkEditorVisible = ref(false);
const remarkDraft = ref('');

const isRoleSelectorVisible = ref(false);
const roleDraft = ref<FamilyMemberRole>('成员');
const isCurrentUser = computed(() => member.value?.name === '我');

const joinedText = computed(() => {
  if (!member.value) {
    return '';
  }

  const joinedAt = member.value.joinedAt ? member.value.joinedAt : '2026-01-23';
  return `${joinedAt} 由 家庭管理员 邀请加入家庭`;
});

const goBack = () => {
  uni.navigateBack();
};

const refreshMember = () => {
  if (!familyId.value || !memberId.value) {
    member.value = null;
    return;
  }

  const family = getFamilyById(familyId.value);
  member.value = family.members.find((item) => item.id === memberId.value) ?? null;
};

const openRemarkEditor = () => {
  if (!member.value) {
    return;
  }

  remarkDraft.value = member.value.note;
  isRemarkEditorVisible.value = true;
};

const closeRemarkEditor = () => {
  isRemarkEditorVisible.value = false;
};

const saveRemark = () => {
  if (!member.value) {
    return;
  }

  const nextMember: FamilyMember = {
    ...member.value,
    note: remarkDraft.value.trim()
  };
  updateFamilyMember(familyId.value, nextMember);
  member.value = nextMember;
  closeRemarkEditor();
  uni.showToast({ title: '已保存', icon: 'success' });
};

const openRoleSelector = () => {
  if (!member.value) {
    return;
  }

  roleDraft.value = member.value.role;
  isRoleSelectorVisible.value = true;
};

const closeRoleSelector = () => {
  isRoleSelectorVisible.value = false;
};

const setRole = (role: FamilyMemberRole) => {
  roleDraft.value = role;
};

const saveRole = () => {
  if (!member.value) {
    return;
  }

  const nextMember: FamilyMember = {
    ...member.value,
    role: roleDraft.value
  };
  updateFamilyMember(familyId.value, nextMember);
  member.value = nextMember;
  closeRoleSelector();
  uni.showToast({ title: '已保存', icon: 'success' });
};

const confirmLeaveFamily = () => {
  const family = getFamilyById(familyId.value);
  if (!canCurrentUserLeaveFamily(family)) {
    uni.showToast({ title: '请先设置其他管理员', icon: 'none' });
    return;
  }

  uni.showModal({
    title: '退出家庭',
    content: `确认退出「${family.name}」吗？退出后将看不到该家庭的共享内容。`,
    confirmText: '退出',
    confirmColor: '#e5735f',
    success: (result) => {
      if (!result.confirm) {
        return;
      }

      leaveFamilyAsCurrentUser(family.id);
      uni.showToast({ title: '已退出家庭', icon: 'none' });
      uni.navigateBack();
    }
  });
};

const confirmRemoveMember = () => {
  if (!member.value) {
    return;
  }

  const targetName = member.value.note || member.value.name;
  uni.showModal({
    title: '移除成员',
    content: `确认将「${targetName}」移出当前家庭吗？`,
    confirmText: '移除',
    confirmColor: '#e5735f',
    success: (result) => {
      if (!result.confirm || !member.value) {
        return;
      }

      removeFamilyMember(familyId.value, member.value.id);
      uni.showToast({ title: '已移除成员', icon: 'none' });
      uni.navigateBack();
    }
  });
};

onLoad((options) => {
  familyId.value = typeof options?.familyId === 'string' ? options.familyId : '';
  memberId.value = typeof options?.memberId === 'string' ? options.memberId : '';
  refreshMember();
});
</script>

<style scoped lang="scss">
.member-page {
  padding-bottom: calc(80rpx + env(safe-area-inset-bottom, 0));
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18rpx;
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

.topbar__spacer {
  width: 74rpx;
  height: 74rpx;
}

.member-hero {
  display: flex;
  align-items: center;
  gap: 22rpx;
  margin-top: 10rpx;
  padding: 16rpx 8rpx;
}

.member-avatar {
  width: 122rpx;
  height: 122rpx;
  border-radius: 50%;
  background: var(--app-accent-soft);
}

.member-name,
.member-joined,
.info-label,
.info-value,
.empty-title,
.empty-desc {
  display: block;
}

.member-name {
  color: var(--app-text);
  font-size: var(--font-size-hero);
  font-weight: var(--font-semibold);
  letter-spacing: 0;
  line-height: var(--line-hero);
}

.member-joined {
  margin-top: 12rpx;
  color: var(--app-text-tertiary);
  font-size: var(--font-size-tabbar);
  font-weight: var(--font-semibold);
}

.info-section {
  margin-top: 18rpx;
  padding: 10rpx 22rpx;
  border-radius: var(--app-radius-card);
  background: rgba(255, 253, 252, 0.92);
}

.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
  min-height: 108rpx;
  border-bottom: 1rpx solid var(--app-border);
}

.info-row:last-child {
  border-bottom: 0;
}

.info-label {
  color: var(--app-text);
  font-size: var(--font-size-body);
  font-weight: var(--font-semibold);
}

.info-right {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.info-value {
  color: var(--app-text-secondary);
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-semibold);
}

.info-value--muted {
  max-width: 360rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.arrow {
  color: var(--app-text-tertiary);
  font-size: var(--font-size-detail-title);
}

.action-section {
  margin-top: 18rpx;
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

.empty-card {
  margin-top: 24rpx;
  padding: 26rpx;
  border-radius: var(--app-radius-card);
  background: rgba(255, 253, 252, 0.92);
}

.empty-title {
  color: var(--app-text);
  font-size: var(--font-size-body);
  font-weight: var(--font-semibold);
}

.empty-desc {
  margin-top: 10rpx;
  color: var(--app-text-secondary);
  font-size: var(--font-size-tabbar);
  line-height: var(--line-body-sm);
}

.mask {
  position: fixed;
  inset: 0;
  z-index: 40;
  display: flex;
  align-items: flex-end;
  padding: 24rpx;
  background: rgba(47, 47, 47, 0.28);
  backdrop-filter: blur(10rpx);
  -webkit-backdrop-filter: blur(10rpx);
}

.panel {
  width: 100%;
  padding: 26rpx;
  border-radius: var(--app-radius-card);
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14rpx;
}

.panel-title {
  display: block;
  color: var(--app-text);
  font-size: var(--font-size-body);
  font-weight: var(--font-semibold);
}

.center-title {
  text-align: center;
}

.panel-close {
  color: var(--app-text-tertiary);
  font-size: var(--font-size-detail-title);
  line-height: var(--line-tabbar);
}

.text-input {
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

.panel-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12rpx;
  margin-top: 18rpx;
}

.two-col {
  grid-template-columns: repeat(2, 1fr);
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

.role-list {
  margin-top: 18rpx;
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.role-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
  padding: 18rpx 16rpx;
  border-radius: 28rpx;
  background: rgba(255, 253, 252, 0.72);
}

.role-main {
  min-width: 0;
  flex: 1;
}

.role-title,
.role-desc {
  display: block;
}

.role-title {
  color: var(--app-text);
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-semibold);
}

.role-desc {
  margin-top: 8rpx;
  color: var(--app-text-secondary);
  font-size: var(--font-size-tabbar);
  line-height: var(--line-body-sm);
}

.radio {
  width: 34rpx;
  height: 34rpx;
  border-radius: 50%;
  border: 4rpx solid rgba(47, 47, 47, 0.18);
  background: transparent;
}

.radio.is-checked {
  border-color: rgba(47, 47, 47, 0.18);
  background: radial-gradient(circle, var(--app-accent) 46%, transparent 48%);
}
</style>
