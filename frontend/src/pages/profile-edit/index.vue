<template>
  <view class="app-page profile-edit-page">
    <view class="topbar">
      <button class="back-button" @tap="goBack">
        <app-icon name="arrow-left" size="26rpx" />
      </button>
      <text class="page-title">个人信息</text>
      <view class="topbar-spacer" />
    </view>

    <view class="profile-hero glass-card">
      <view class="avatar-stage" @tap="chooseAvatar">
        <image class="avatar" :src="draft.avatarUrl" mode="aspectFill" />
        <text class="avatar-action">更换</text>
      </view>
      <text class="preview-name">{{ draft.nickname || '未设置昵称' }}</text>
      <text class="preview-bio">{{ draft.bio || '填写一句自己的厨房签名' }}</text>
    </view>

    <view class="form-card glass-card">
      <view class="form-row">
        <text class="field-label">昵称</text>
        <input
          v-model="draft.nickname"
          class="text-input"
          placeholder="输入昵称"
          maxlength="16"
          confirm-type="done"
        />
      </view>

      <view class="form-row">
        <view class="row-copy">
          <text class="field-label">个性签名</text>
          <text class="field-count">{{ bioCount }}/40</text>
        </view>
        <textarea
          v-model="draft.bio"
          class="text-area"
          placeholder="例如：周末一起下厨"
          maxlength="40"
        />
      </view>
    </view>

    <view class="actions glass-card">
      <button class="primary-button" :disabled="isSaving" @tap="save">保存</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import AppIcon from '../../components/app/app-icon.vue';
import { getDefaultUserProfile, loadUserProfile, saveUserProfile } from '../../services/profile';
import type { UserProfile } from '../../types/profile';

const isSaving = ref(false);
const draft = ref<UserProfile>(loadUserProfile());

const bioCount = computed(() => draft.value.bio.trim().length);

const goBack = () => {
  uni.navigateBack();
};

const chooseAvatar = async () => {
  try {
    const result = await uni.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera']
    });
    const avatarPath = result.tempFilePaths[0];
    if (!avatarPath) {
      return;
    }
    draft.value.avatarUrl = avatarPath;
  } catch {
    uni.showToast({ title: '未选择头像', icon: 'none' });
  }
};

const normalizeProfile = (profile: UserProfile): UserProfile => {
  return {
    nickname: profile.nickname.trim() || getDefaultUserProfile().nickname,
    avatarUrl: profile.avatarUrl.trim() || getDefaultUserProfile().avatarUrl,
    bio: profile.bio.trim()
  };
};

const save = async () => {
  if (isSaving.value) {
    return;
  }

  const normalized = normalizeProfile(draft.value);
  if (!normalized.nickname) {
    uni.showToast({ title: '请填写昵称', icon: 'none' });
    return;
  }

  isSaving.value = true;
  try {
    saveUserProfile(normalized);
    uni.showToast({ title: '已保存', icon: 'success' });
    await new Promise<void>((resolve) => setTimeout(resolve, 450));
    uni.navigateBack();
  } finally {
    isSaving.value = false;
  }
};

</script>

<style scoped lang="scss">
.profile-edit-page {
  min-height: 100vh;
  padding-bottom: calc(180rpx + env(safe-area-inset-bottom, 0));
}

.topbar {
  display: grid;
  grid-template-columns: 72rpx 1fr 72rpx;
  align-items: center;
  margin-bottom: 24rpx;
}

.back-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72rpx;
  height: 72rpx;
  border: 0;
  border-radius: 50%;
  background: #fffdfc;
  color: var(--app-text);
  font-size: var(--font-size-card-title);
  font-weight: var(--font-semibold);
  box-shadow: 0 12rpx 30rpx rgba(0, 0, 0, 0.04);
}

.back-button::after {
  border: 0;
}

.page-title,
.field-label,
.field-desc,
.field-count,
.preview-name,
.preview-bio,
.avatar-action {
  display: block;
}

.page-title {
  color: var(--app-text);
  font-size: var(--font-size-list-title);
  font-weight: var(--font-semibold);
  text-align: center;
}

.topbar-spacer {
  width: 72rpx;
  height: 72rpx;
}

.profile-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 44rpx 34rpx 38rpx;
  border-radius: var(--app-radius-card);
  background: #fffdfc;
}

.avatar-stage {
  position: relative;
  width: 150rpx;
  height: 150rpx;
  margin-bottom: 24rpx;
}

.avatar {
  width: 150rpx;
  height: 150rpx;
  border: 6rpx solid #fffdfc;
  border-radius: 50%;
  background: #e9e2d6;
  box-shadow: 0 18rpx 44rpx rgba(0, 0, 0, 0.06);
}

.avatar-action {
  position: absolute;
  right: -10rpx;
  bottom: 2rpx;
  padding: 8rpx 14rpx;
  border-radius: var(--app-radius-button);
  background: var(--app-accent);
  color: var(--text-white);
  font-size: var(--font-size-tabbar);
  font-weight: var(--font-semibold);
}

.preview-name {
  max-width: 100%;
  color: var(--app-text);
  font-size: var(--font-size-section-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-card-title);
  text-align: center;
}

.preview-bio {
  max-width: 520rpx;
  margin-top: 12rpx;
  color: var(--app-text-secondary);
  font-size: var(--font-size-caption);
  line-height: var(--line-body-sm);
  text-align: center;
}

.form-card {
  margin-top: 22rpx;
  padding: 26rpx 26rpx 28rpx;
  border-radius: var(--app-radius-card);
  background: #fffdfc;
}

.form-row {
  padding-top: 0;
}

.form-row + .form-row {
  margin-top: 24rpx;
  border-top: 1rpx solid var(--app-border);
}

.row-copy {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20rpx;
}

.field-label {
  color: var(--app-text);
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-semibold);
}

.field-count {
  flex-shrink: 0;
  color: var(--app-text-tertiary);
  font-size: var(--font-size-tabbar);
  font-weight: var(--font-medium);
}

.text-input {
  width: 100%;
  height: 92rpx;
  margin-top: 16rpx;
  padding: 0 26rpx;
  border: 0;
  border-radius: 28rpx;
  background: #e9e2d6;
  color: var(--app-text);
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-medium);
}

.text-area {
  width: 100%;
  min-height: 176rpx;
  margin-top: 16rpx;
  padding: 22rpx 26rpx;
  border: 0;
  border-radius: 28rpx;
  background: #e9e2d6;
  color: var(--app-text);
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-semibold);
  line-height: var(--line-body-sm);
}

.actions {
  position: fixed;
  right: 24rpx;
  bottom: calc(24rpx + env(safe-area-inset-bottom, 0));
  left: 24rpx;
  z-index: 20;
  display: flex;
  padding: 16rpx;
  border-radius: var(--app-radius-card);
  background: rgba(255, 253, 252, 0.94);
}

.primary-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 84rpx;
  border: 0;
  border-radius: var(--app-radius-button);
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-semibold);
  background: var(--app-accent);
  color: var(--text-white);
}

.primary-button::after {
  border: 0;
}
</style>
