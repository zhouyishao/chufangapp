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
      <button
        class="avatar-stage"
        :disabled="isLoading || isSaving || isUploading"
        aria-label="更换头像"
        @tap="chooseAvatar"
      >
        <image class="avatar" :src="draft.avatarUrl" mode="aspectFill" />
        <text class="avatar-action">{{ isUploading ? `${uploadProgress}%` : '更换' }}</text>
      </button>
      <text class="preview-name">{{ draft.nickname || '未设置昵称' }}</text>
      <text class="preview-bio">{{ draft.bio || '填写一句自己的厨房签名' }}</text>
      <text class="avatar-spec">JPG、PNG 或 WebP，至少 512×512，最大 5MB</text>
      <view v-if="isUploading || uploadError" class="upload-status" aria-live="polite">
        <text v-if="isUploading" class="upload-status__text">头像上传中 {{ uploadProgress }}%</text>
        <text v-else class="upload-status__error">{{ uploadError }}</text>
        <button v-if="isUploading" class="upload-status__button" @tap="cancelAvatarUpload">取消</button>
        <button v-else class="upload-status__button" @tap="retryAvatarUpload">重试</button>
      </view>
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
      <button class="primary-button" :disabled="isLoading || isSaving || isUploading" @tap="save">
        {{ isSaving ? '保存中…' : isLoading ? '加载中…' : '保存' }}
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onLoad, onShow, onUnload } from '@dcloudio/uni-app';
import { computed, ref } from 'vue';
import AppIcon from '../../components/app/app-icon.vue';
import { getAuthToken, loadAuthUser } from '../../services/auth-session';
import {
  deleteUploadedFile,
  enqueuePendingFileCleanup,
  handlePendingFileCleanupFailure,
  removePendingFileCleanup,
  retryPendingFileCleanup,
  uploadAvatarFile,
  type UploadController
} from '../../services/file-upload';
import { getDefaultUserProfile, getUserProfile, updateUserProfile } from '../../services/profile';
import type { UserProfile } from '../../types/profile';

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
const isLoading = ref(false);
const hasLoaded = ref(false);
const loadedToken = ref<string | null>(null);
const loadingToken = ref<string | null>(null);
const requestSequence = ref(0);
const uploadSequence = ref(0);
const originalAvatarFileId = ref<number | null>(null);
const temporaryAvatarFiles = new Map<number, { token: string; userId: number }>();
const isSaving = ref(false);
const isUploading = ref(false);
const uploadProgress = ref(0);
const uploadError = ref('');
const pendingAvatarPath = ref('');
const activeUpload = ref<UploadController | null>(null);
const draft = ref<UserProfile>(getDefaultUserProfile());

const bioCount = computed(() => draft.value.bio.trim().length);

const goBack = () => {
  uni.navigateBack();
};

const resetSessionState = () => {
  activeUpload.value?.abort();
  activeUpload.value = null;
  cleanupAllTemporaryAvatars();
  requestSequence.value += 1;
  uploadSequence.value += 1;
  draft.value = getDefaultUserProfile();
  loadedToken.value = null;
  loadingToken.value = null;
  hasLoaded.value = false;
  isLoading.value = false;
  isSaving.value = false;
  isUploading.value = false;
  uploadError.value = '';
  uploadProgress.value = 0;
  pendingAvatarPath.value = '';
};

const loadProfile = async (expectedToken: string) => {
  const sequence = requestSequence.value + 1;
  requestSequence.value = sequence;
  loadingToken.value = expectedToken;
  isLoading.value = true;
  try {
    const profile = await getUserProfile();
    if (sequence !== requestSequence.value || getAuthToken() !== expectedToken) return;
    draft.value = profile;
    originalAvatarFileId.value = profile.avatarFileId;
    loadedToken.value = expectedToken;
    hasLoaded.value = true;
    uploadError.value = '';
    pendingAvatarPath.value = '';
  } catch (error) {
    if (sequence !== requestSequence.value || getAuthToken() !== expectedToken) return;
    uni.showToast({ title: error instanceof Error ? error.message : '资料加载失败', icon: 'none' });
  } finally {
    if (sequence === requestSequence.value) {
      loadingToken.value = null;
      isLoading.value = false;
    }
  }
};

const syncProfileForCurrentSession = () => {
  const authUser = loadAuthUser();
  const token = authUser?.token.trim() || null;
  if (!token || !authUser?.id) {
    if (loadedToken.value || loadingToken.value || hasLoaded.value) {
      resetSessionState();
    }
    return;
  }
  void retryPendingFileCleanup(authUser.id, authUser.token);
  if ((hasLoaded.value && loadedToken.value === token) || (isLoading.value && loadingToken.value === token)) {
    return;
  }

  resetSessionState();
  void loadProfile(token);
};

const uploadSelectedAvatar = async (filePath: string) => {
  if (isUploading.value) return;
  const authUser = loadAuthUser();
  const expectedToken = loadedToken.value;
  const expectedUserId = authUser?.id;
  if (!expectedToken || !expectedUserId || authUser?.token !== expectedToken) {
    syncProfileForCurrentSession();
    uni.showToast({ title: '账号已切换，请重新选择头像', icon: 'none' });
    return;
  }
  const expectedOriginalAvatarFileId = originalAvatarFileId.value;

  const sequence = uploadSequence.value + 1;
  uploadSequence.value = sequence;
  uploadError.value = '';
  uploadProgress.value = 0;
  isUploading.value = true;
  const controller = uploadAvatarFile(filePath, {
    onProgress: (progress) => {
      if (sequence !== uploadSequence.value || getAuthToken() !== expectedToken) return;
      uploadProgress.value = progress;
    }
  });
  activeUpload.value = controller;
  try {
    const file = await controller.promise;
    registerTemporaryAvatar(
      file.id,
      expectedToken,
      expectedUserId,
      expectedOriginalAvatarFileId
    );
    if (sequence !== uploadSequence.value || getAuthToken() !== expectedToken) {
      void cleanupTemporaryAvatar(file.id);
      return;
    }
    const replacedFileId = draft.value.avatarFileId;
    if (
      replacedFileId &&
      replacedFileId !== file.id &&
      replacedFileId !== originalAvatarFileId.value &&
      temporaryAvatarFiles.has(replacedFileId)
    ) {
      void cleanupTemporaryAvatar(replacedFileId);
    }
    draft.value.avatarFileId = file.id;
    draft.value.avatarUrl = file.url;
    pendingAvatarPath.value = '';
    uploadProgress.value = 100;
  } catch (error) {
    if (sequence !== uploadSequence.value || getAuthToken() !== expectedToken) return;
    uploadError.value = error instanceof Error ? error.message : '头像上传失败';
  } finally {
    if (sequence === uploadSequence.value) {
      activeUpload.value = null;
      isUploading.value = false;
    }
  }
};

const registerTemporaryAvatar = (
  fileId: number,
  token: string,
  userId: number,
  originalFileId: number | null
) => {
  if (fileId === originalFileId) return;
  temporaryAvatarFiles.set(fileId, { token, userId });
  enqueuePendingFileCleanup(userId, fileId);
};

const cleanupTemporaryAvatar = async (fileId: number) => {
  const owner = temporaryAvatarFiles.get(fileId);
  if (!owner || fileId === originalAvatarFileId.value) return;
  try {
    enqueuePendingFileCleanup(owner.userId, fileId);
    await deleteUploadedFile(fileId, owner.token);
    temporaryAvatarFiles.delete(fileId);
    removePendingFileCleanup(owner.userId, fileId);
  } catch (error) {
    handlePendingFileCleanupFailure(owner.userId, fileId, error);
  }
};

const cleanupAllTemporaryAvatars = () => {
  for (const fileId of temporaryAvatarFiles.keys()) {
    void cleanupTemporaryAvatar(fileId);
  }
};

const chooseAvatar = async () => {
  if (isLoading.value || isSaving.value || isUploading.value) return;
  try {
    const result = await uni.chooseImage({
      count: 1,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera']
    });
    const avatarPath = result.tempFilePaths[0];
    const selectedFiles = Array.isArray(result.tempFiles)
      ? result.tempFiles
      : result.tempFiles
        ? [result.tempFiles]
        : [];
    const selectedFile = selectedFiles[0] as { size?: number } | undefined;
    if (!avatarPath) return;
    if (typeof selectedFile?.size === 'number' && selectedFile.size > MAX_AVATAR_SIZE) {
      uni.showToast({ title: '头像不能超过 5MB', icon: 'none' });
      return;
    }

    const imageInfo = await uni.getImageInfo({ src: avatarPath });
    if (imageInfo.width < 512 || imageInfo.height < 512) {
      uni.showToast({ title: '请选择至少 512×512 的图片', icon: 'none' });
      return;
    }

    pendingAvatarPath.value = avatarPath;
    draft.value.avatarUrl = avatarPath;
    await uploadSelectedAvatar(avatarPath);
  } catch {
    if (!pendingAvatarPath.value) {
      uni.showToast({ title: '未选择头像', icon: 'none' });
    }
  }
};

const cancelAvatarUpload = () => {
  activeUpload.value?.abort();
};

const retryAvatarUpload = async () => {
  if (!pendingAvatarPath.value || isUploading.value) return;
  await uploadSelectedAvatar(pendingAvatarPath.value);
};

const save = async () => {
  if (isLoading.value || isSaving.value || isUploading.value) return;
  const expectedToken = loadedToken.value;
  if (!expectedToken || getAuthToken() !== loadedToken.value) {
    resetSessionState();
    syncProfileForCurrentSession();
    uni.showToast({ title: '账号已切换，资料已重新加载', icon: 'none' });
    return;
  }

  const nickname = draft.value.nickname.trim();
  const bio = draft.value.bio.trim();
  if (!nickname) {
    uni.showToast({ title: '请填写昵称', icon: 'none' });
    return;
  }
  if (uploadError.value || pendingAvatarPath.value) {
    uni.showToast({ title: '请先重试头像上传', icon: 'none' });
    return;
  }

  isSaving.value = true;
  const submittedAvatarFileId = draft.value.avatarFileId;
  const submittedAvatarOwner =
    submittedAvatarFileId === null ? undefined : temporaryAvatarFiles.get(submittedAvatarFileId);
  try {
    const profile = await updateUserProfile({
      nickname,
      bio,
      avatarFileId: draft.value.avatarFileId
    });
    if (submittedAvatarFileId !== null && submittedAvatarOwner) {
      removePendingFileCleanup(submittedAvatarOwner.userId, submittedAvatarFileId);
      temporaryAvatarFiles.delete(submittedAvatarFileId);
    }
    if (getAuthToken() !== expectedToken || loadedToken.value !== expectedToken) return;
    draft.value = profile;
    uni.showToast({ title: '已保存', icon: 'success' });
    await new Promise<void>((resolve) => setTimeout(resolve, 450));
    uni.navigateBack();
  } catch (error) {
    uni.showToast({ title: error instanceof Error ? error.message : '保存失败，请重试', icon: 'none' });
  } finally {
    isSaving.value = false;
  }
};

onLoad(() => {
  syncProfileForCurrentSession();
});

onShow(() => {
  syncProfileForCurrentSession();
});

onUnload(() => {
  activeUpload.value?.abort();
  uploadSequence.value += 1;
  cleanupAllTemporaryAvatars();
});
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
  display: block;
  width: 150rpx;
  height: 150rpx;
  margin-bottom: 24rpx;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
}

.avatar-stage::after,
.upload-status__button::after {
  border: 0;
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

.avatar-spec {
  display: block;
  margin-top: 18rpx;
  color: var(--app-text-tertiary);
  font-size: var(--font-size-caption);
  line-height: var(--line-body-sm);
  text-align: center;
}

.upload-status {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 72rpx;
  margin-top: 14rpx;
  gap: 12rpx;
}

.upload-status__text,
.upload-status__error {
  color: var(--app-text-secondary);
  font-size: var(--font-size-caption);
  line-height: var(--line-body-sm);
}

.upload-status__error {
  color: var(--app-danger);
}

.upload-status__button {
  min-width: 88rpx;
  min-height: 72rpx;
  padding: 0 18rpx;
  border: 0;
  border-radius: var(--app-radius-button);
  background: var(--app-muted);
  color: var(--app-accent);
  font-size: var(--font-size-caption);
  font-weight: var(--font-medium);
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

.primary-button[disabled] {
  opacity: 0.56;
}

.primary-button::after {
  border: 0;
}
</style>
