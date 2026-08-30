<template>
  <view class="app-page create-page">
    <view class="safe-top-spacer" aria-hidden="true" />
    <view class="topbar">
      <button class="app-icon-button nav-button" aria-label="返回" @tap="goBack">
        <app-icon name="arrow-left" size="40rpx" />
      </button>
      <text class="topbar-title">创建家庭</text>
      <view class="topbar-spacer" />
    </view>

    <view class="hero">
      <text class="hero-title">建一个家人的共享空间</text>
      <text class="hero-desc">创建后会生成家庭码，家人扫一扫即可加入。</text>
    </view>

    <view class="form-card">
      <text class="field-label">家庭名称</text>
      <input v-model="name" class="field-input" placeholder="例如：周家" maxlength="12" />
      <text class="field-hint">建议使用家人熟悉的称呼</text>

      <text class="field-label avatar-label">家庭头像</text>
      <view class="avatar-upload-row">
        <button class="avatar-preview" :disabled="submitting" @tap="chooseAvatar">
          <image v-if="avatarPreview" class="avatar-image" :src="avatarPreview" mode="aspectFill" />
          <text v-else>{{ name.trim().slice(0, 1) || '家' }}</text>
        </button>
        <view class="avatar-upload-copy">
          <button class="upload-button" :disabled="submitting" @tap="chooseAvatar">上传图片</button>
          <button v-if="avatarPreview" class="reset-button" :disabled="submitting" @tap="clearAvatar">恢复文字头像</button>
          <text class="field-hint">JPG、PNG 或 WebP；建议正方形且不小于 512×512px；不超过 5MB</text>
        </view>
      </view>

      <button class="primary-button" :disabled="submitting" @tap="submit">{{ submitting ? '创建中' : '创建家庭' }}</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import AppIcon from '../../components/app/app-icon.vue';
import { createFamily, updateFamily } from '../../services/family';
import { uploadAvatarFile } from '../../services/file-upload';

const name = ref('');
const avatarPreview = ref('');
const avatarFilePath = ref('');
const submitting = ref(false);

const goBack = () => {
  uni.navigateBack();
};

const chooseAvatar = () => {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: ({ tempFilePaths }) => {
      const filePath = tempFilePaths?.[0] ?? '';
      if (!filePath) return;
      avatarFilePath.value = filePath;
      avatarPreview.value = filePath;
    }
  });
};

const clearAvatar = () => {
  avatarFilePath.value = '';
  avatarPreview.value = '';
};

const submit = async () => {
  const trimmedName = name.value.trim();
  if (!trimmedName) {
    uni.showToast({ title: '请填写家庭名称', icon: 'none' });
    return;
  }
  submitting.value = true;
  try {
    let family = await createFamily(trimmedName);
    if (avatarFilePath.value) {
      try {
        const uploaded = await uploadAvatarFile(avatarFilePath.value, {}, 'family-avatar').promise;
        const updated = await updateFamily({ ...family, avatar: uploaded.url, avatarFileId: uploaded.id });
        family = updated.find((item) => item.id === family.id) ?? family;
      } catch {
        uni.showToast({ title: '家庭已创建，头像可稍后补充', icon: 'none' });
      }
    }
    uni.showToast({ title: '家庭已创建', icon: 'success' });
    uni.redirectTo({ url: `/pages/family-manage/index?id=${family.id}` });
  } catch (error) {
    uni.showToast({ title: error instanceof Error ? error.message : '创建失败', icon: 'none' });
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped lang="scss">
.create-page {
  padding-bottom: calc(90rpx + var(--app-safe-area-bottom));
}

.safe-top-spacer {
  height: calc(var(--app-safe-area-top) + 8rpx);
}

.topbar {
  display: grid;
  grid-template-columns: var(--touch-target) 1fr var(--touch-target);
  align-items: center;
}

.nav-button,
.primary-button {
  border: 0;
}

.nav-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: transparent;
  color: var(--app-text);
}

.topbar-title {
  color: var(--app-text);
  font-size: var(--font-size-body);
  font-weight: var(--font-semibold);
  text-align: center;
}

.hero,
.form-card {
  margin-top: 24rpx;
}

.hero-title,
.hero-desc,
.field-label {
  display: block;
}

.field-hint {
  display: block;
  margin-top: 8rpx;
  color: var(--app-text-tertiary);
  font-size: var(--font-size-tag);
  line-height: var(--line-tag);
}

.hero-title {
  color: var(--app-text);
  font-size: var(--font-size-page-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-page-title);
}

.hero-desc {
  margin-top: 14rpx;
  color: var(--app-text-tertiary);
  font-size: var(--font-size-caption);
  line-height: var(--line-caption);
}

.field-label {
  margin-top: 22rpx;
  color: var(--app-text-secondary);
  font-size: var(--font-size-tag);
  font-weight: var(--font-medium);
}

.field-label:first-child {
  margin-top: 0;
}

.field-input {
  width: 100%;
  margin-top: 12rpx;
  padding: 0 24rpx;
  border-radius: var(--app-radius-input);
  border: 1rpx solid var(--app-border);
  background: var(--app-surface);
  color: var(--app-text);
  font-size: var(--font-size-body-sm);
}

.field-input {
  height: 84rpx;
}

.avatar-label { margin-top: 34rpx; }
.avatar-upload-row { display: flex; align-items: center; gap: 24rpx; margin-top: 16rpx; }
.avatar-preview { display: flex; align-items: center; justify-content: center; width: 120rpx; height: 120rpx; flex: 0 0 auto; padding: 0; overflow: hidden; border: 1rpx solid var(--app-border); border-radius: 30rpx; background: var(--app-primary-soft); color: var(--app-primary); font-size: var(--font-size-page-title); font-weight: var(--font-semibold); }
.avatar-preview::after, .upload-button::after, .reset-button::after { border: 0; }
.avatar-image { width: 100%; height: 100%; }
.avatar-upload-copy { min-width: 0; flex: 1; }
.upload-button, .reset-button { min-height: 72rpx; margin: 0; padding: 0 20rpx; border-radius: var(--app-radius-button); font-size: var(--font-size-caption); }
.upload-button { border: 1rpx solid var(--app-border); background: transparent; color: var(--app-primary); }
.reset-button { margin-top: 8rpx; border: 0; background: transparent; color: var(--app-text-tertiary); }

.primary-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 88rpx;
  margin-top: 42rpx;
  padding: 0;
  border-radius: var(--app-radius-button);
  background: var(--app-primary);
  color: var(--text-white);
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-semibold);
  line-height: var(--line-body-sm);
}
</style>
