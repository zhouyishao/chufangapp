<template>
  <view class="app-page member-page">
    <view class="safe-top-spacer" aria-hidden="true" />
    <view class="topbar">
      <button class="nav-button" @tap="goBack">
        <app-icon name="arrow-left" size="26rpx" />
      </button>
      <view class="topbar__spacer" />
    </view>

    <view v-if="loading" class="empty-card glass-card">
      <text class="empty-title">正在加载成员</text>
    </view>

    <view v-else-if="loadError" class="empty-card glass-card">
      <text class="empty-title">成员信息加载失败</text>
      <text class="empty-desc">{{ loadError }}</text>
      <button class="primary-button" :disabled="loading" @tap="refreshMember">重新加载</button>
    </view>

    <view v-else-if="member" class="member-hero">
      <image v-if="member.avatar" class="member-avatar" :src="member.avatar" mode="aspectFill" />
      <view v-else class="member-avatar member-avatar--empty">{{ member.name.slice(0, 1) }}</view>
      <view class="member-hero__main">
        <text class="member-name">{{ member.name }}</text>
        <text class="member-account">{{ member.accountId || '-' }}</text>
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
      <view :class="['info-row', { 'info-row--link': canManageMember }]" @tap="openRemarkEditor">
        <text class="info-label">备注</text>
        <view class="info-right">
          <text class="info-value info-value--muted">{{ member.note || '未设置' }}</text>
          <app-icon class="arrow" name="chevron-right" size="22rpx" />
        </view>
      </view>
      <view :class="['info-row', { 'info-row--link': canManageMember }]" @tap="openRoleSelector">
        <text class="info-label">家庭权限</text>
        <view class="info-right">
          <text class="info-value info-value--muted">{{ member.role }}</text>
          <app-icon class="arrow" name="chevron-right" size="22rpx" />
        </view>
      </view>
      <text v-if="permissionMessage" class="permission-message">{{ permissionMessage }}</text>
    </view>

    <view v-if="member && (isCurrentUser || canManageMember)" class="action-section glass-card">
      <button
        v-if="isCurrentUser"
        class="danger-button danger-button--soft"
        :disabled="isRemovingMember"
        @tap="confirmLeaveFamily"
      >
        {{ isRemovingMember ? '处理中…' : '退出家庭' }}
      </button>
      <button
        v-else
        class="danger-button"
        :disabled="isRemovingMember"
        @tap="confirmRemoveMember"
      >
        {{ isRemovingMember ? '移除中…' : '移除成员' }}
      </button>
    </view>

    <view v-else-if="!loading && !loadError && !member" class="empty-card glass-card">
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
          <button class="primary-button" :disabled="isSavingMember" @tap="saveRemark">
            {{ isSavingMember ? '保存中…' : '保存' }}
          </button>
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
          <button class="primary-button" :disabled="isSavingMember" @tap="saveRole">
            {{ isSavingMember ? '保存中…' : '保存权限' }}
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import AppIcon from '../../components/app/app-icon.vue';
import { loadAuthUser } from '../../services/auth';
import {
  canCurrentUserLeaveFamily,
  getFamilyById,
  leaveFamilyAsCurrentUser,
  removeFamilyMember,
  updateFamilyMember
} from '../../services/family';
import type { FamilyMember, FamilyMemberRole, FamilyProfile } from '../../types/family';

const familyId = ref('');
const memberId = ref('');
const member = ref<FamilyMember | null>(null);
const family = ref<FamilyProfile | null>(null);
const loading = ref(false);
const loadError = ref('');
const isSavingMember = ref(false);
const isRemovingMember = ref(false);

const isRemarkEditorVisible = ref(false);
const remarkDraft = ref('');

const isRoleSelectorVisible = ref(false);
const roleDraft = ref<FamilyMemberRole>('成员');
const isCurrentUser = computed(() => {
  const currentUser = loadAuthUser();
  if (!currentUser || !member.value) return false;
  return member.value.userId === currentUser.id || member.value.accountId === currentUser.phone;
});
const currentUserFamilyMember = computed(() => {
  const currentUser = loadAuthUser();
  return family.value?.members.find(
    (item) => item.userId === currentUser?.id || item.accountId === currentUser?.phone
  ) ?? null;
});
const canManageMember = computed(() => {
  return currentUserFamilyMember.value?.role === '管理员' && !isCurrentUser.value;
});
const permissionMessage = computed(() => {
  if (isCurrentUser.value) return '自己的家庭权限需要由其他管理员修改';
  if (!canManageMember.value) return '仅家庭创建者或管理员可以修改备注和权限';
  return '';
});

const joinedText = computed(() => {
  if (!member.value) {
    return '';
  }

  if (!member.value.joinedAt) {
    return '加入时间待补充';
  }
  return `${member.value.joinedAt} 由 家庭管理员 邀请加入家庭`;
});

const goBack = () => {
  uni.navigateBack();
};

const refreshMember = async () => {
  if (!familyId.value || !memberId.value) {
    member.value = null;
    return;
  }

  loading.value = true;
  loadError.value = '';
  try {
    family.value = await getFamilyById(familyId.value);
    member.value = family.value?.members.find((item) => item.id === memberId.value) ?? null;
  } catch (error) {
    family.value = null;
    member.value = null;
    loadError.value = error instanceof Error ? error.message : '成员信息加载失败';
  } finally {
    loading.value = false;
  }
};

const getMemberParamsFromLocation = () => {
  if (typeof window === 'undefined') return { familyId: '', memberId: '' };
  const hash = window.location.hash;
  const queryText = hash.includes('?') ? hash.slice(hash.indexOf('?') + 1) : '';
  const params = new URLSearchParams(queryText);
  return {
    familyId: params.get('familyId') ?? '',
    memberId: params.get('memberId') ?? ''
  };
};

const openRemarkEditor = () => {
  if (!member.value || !canManageMember.value) {
    if (member.value) uni.showToast({ title: permissionMessage.value, icon: 'none' });
    return;
  }

  remarkDraft.value = member.value.note;
  isRemarkEditorVisible.value = true;
};

const closeRemarkEditor = () => {
  isRemarkEditorVisible.value = false;
};

const saveRemark = async () => {
  if (!member.value || !canManageMember.value || isSavingMember.value) {
    return;
  }

  const trimmedRemark = remarkDraft.value.trim();
  isSavingMember.value = true;
  try {
    await updateFamilyMember(familyId.value, member.value, { remark: trimmedRemark });
    await refreshMember();
    closeRemarkEditor();
    uni.showToast({ title: '备注已保存', icon: 'success' });
  } catch (error) {
    uni.showToast({ title: error instanceof Error ? error.message : '备注保存失败', icon: 'none' });
  } finally {
    isSavingMember.value = false;
  }
};

const openRoleSelector = () => {
  if (!member.value || !canManageMember.value) {
    if (member.value) uni.showToast({ title: permissionMessage.value, icon: 'none' });
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

const saveRole = async () => {
  if (!member.value || !canManageMember.value || isSavingMember.value) {
    return;
  }

  isSavingMember.value = true;
  try {
    await updateFamilyMember(familyId.value, member.value, { role: roleDraft.value });
    await refreshMember();
    closeRoleSelector();
    uni.showToast({ title: '权限已保存', icon: 'success' });
  } catch (error) {
    uni.showToast({ title: error instanceof Error ? error.message : '权限保存失败', icon: 'none' });
  } finally {
    isSavingMember.value = false;
  }
};

const confirmLeaveFamily = async () => {
  if (isRemovingMember.value) return;
  const family = await getFamilyById(familyId.value);
  if (!family) return;
  if (!canCurrentUserLeaveFamily(family)) {
    uni.showToast({ title: '请先设置其他管理员', icon: 'none' });
    return;
  }

  uni.showModal({
    title: '退出家庭',
    content: `确认退出「${family.name}」吗？退出后将看不到该家庭的共享内容。`,
    confirmText: '退出',
    confirmColor: '#e5735f',
    success: async (result) => {
      if (!result.confirm) {
        return;
      }

      isRemovingMember.value = true;
      try {
        await leaveFamilyAsCurrentUser(family.id);
        uni.showToast({ title: '已退出家庭', icon: 'none' });
        uni.navigateBack();
      } catch (error) {
        uni.showToast({ title: error instanceof Error ? error.message : '退出失败', icon: 'none' });
      } finally {
        isRemovingMember.value = false;
      }
    }
  });
};

const confirmRemoveMember = () => {
  if (!member.value || !canManageMember.value || isRemovingMember.value) {
    return;
  }

  const targetName = member.value.note || member.value.name;
  uni.showModal({
    title: '移除成员',
    content: `确认将「${targetName}」移出当前家庭吗？`,
    confirmText: '移除',
    confirmColor: '#e5735f',
    success: async (result) => {
      if (!result.confirm || !member.value) {
        return;
      }

      isRemovingMember.value = true;
      try {
        await removeFamilyMember(familyId.value, member.value.id);
        uni.showToast({ title: '已移除成员', icon: 'none' });
        uni.navigateBack();
      } catch (error) {
        uni.showToast({ title: error instanceof Error ? error.message : '移除失败', icon: 'none' });
      } finally {
        isRemovingMember.value = false;
      }
    }
  });
};

onLoad((options) => {
  familyId.value = typeof options?.familyId === 'string' ? options.familyId : '';
  memberId.value = typeof options?.memberId === 'string' ? options.memberId : '';
  void refreshMember().catch(() => undefined);
});

onMounted(() => {
  if (!familyId.value || !memberId.value) {
    const params = getMemberParamsFromLocation();
    familyId.value = familyId.value || params.familyId;
    memberId.value = memberId.value || params.memberId;
  }
  void refreshMember().catch(() => undefined);
});
</script>

<style scoped lang="scss">
.member-page {
  padding-bottom: calc(80rpx + var(--app-safe-area-bottom));
}

.safe-top-spacer {
  height: calc(var(--app-safe-area-top) + 8rpx);
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

.member-avatar--empty {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--app-primary-soft);
  color: var(--app-primary);
  font-size: var(--font-size-section-title);
  font-weight: var(--font-semibold);
}

.permission-message {
  display: block;
  padding: 18rpx 24rpx;
  color: var(--app-text-tertiary);
  font-size: var(--font-size-tag);
  line-height: var(--line-tag);
}

.member-name,
.member-account,
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

.member-account {
  margin-top: 8rpx;
  color: var(--app-text-secondary);
  font-size: var(--font-size-caption);
  line-height: var(--line-caption);
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
