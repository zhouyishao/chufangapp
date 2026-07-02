<template>
  <view class="app-page scan-page">
    <view class="topbar">
      <button class="nav-button" @tap="goBack">
        <app-icon name="arrow-left" size="26rpx" />
      </button>
      <text class="topbar-title">扫一扫</text>
      <view class="topbar-spacer" />
    </view>

    <view class="scan-card glass-card">
      <view class="scan-frame">
        <view class="corner corner-tl" />
        <view class="corner corner-tr" />
        <view class="corner corner-bl" />
        <view class="corner corner-br" />
        <view class="scan-line" />
      </view>
      <text class="scan-title">扫码加入家庭</text>
      <text class="scan-desc">扫描家人分享的家庭邀请二维码，确认后会写入后端家庭成员。</text>
      <button class="primary-button" :disabled="submitting" @tap="scanCode">调用系统扫码</button>
    </view>

    <view class="manual-card glass-card">
      <text class="section-title">手动输入邀请码</text>
      <input v-model="token" class="token-input" placeholder="粘贴邀请 token 或邀请链接" confirm-type="done" />
      <button class="secondary-button" :disabled="submitting" @tap="previewInvite">查看邀请</button>
    </view>

    <view v-if="inviteFamilyName" class="confirm-card glass-card">
      <text class="confirm-label">待加入家庭</text>
      <text class="confirm-title">{{ inviteFamilyName }}</text>
      <text class="confirm-desc">{{ inviteMemberCount }} 位成员 · 邀请有效</text>
      <button class="primary-button" :disabled="submitting" @tap="joinFamily">确认加入</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import AppIcon from '../../components/app/app-icon.vue';
import { getFamilyInvite, joinFamilyInvite } from '../../services/family';

const token = ref('');
const inviteFamilyName = ref('');
const inviteMemberCount = ref(0);
const submitting = ref(false);

const extractToken = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return '';
  const tokenMatch = trimmed.match(/[?&]token=([^&]+)/);
  if (tokenMatch?.[1]) return decodeURIComponent(tokenMatch[1]);
  const pathMatch = trimmed.match(/invite\/([^/?#]+)/);
  if (pathMatch?.[1]) return decodeURIComponent(pathMatch[1]);
  return trimmed;
};

const goBack = () => {
  uni.navigateBack();
};

const scanCode = () => {
  uni.scanCode({
    success: (result) => {
      token.value = extractToken(String(result.result || ''));
      void previewInvite();
    },
    fail: () => {
      uni.showToast({ title: '无法读取二维码，请手动输入', icon: 'none' });
    }
  });
};

const previewInvite = async () => {
  const nextToken = extractToken(token.value);
  if (!nextToken) {
    uni.showToast({ title: '请输入邀请码', icon: 'none' });
    return;
  }
  submitting.value = true;
  try {
    const invite = await getFamilyInvite(nextToken);
    token.value = nextToken;
    inviteFamilyName.value = invite.family.name;
    inviteMemberCount.value = invite.family.memberCount;
  } catch (error) {
    inviteFamilyName.value = '';
    uni.showToast({ title: error instanceof Error ? error.message : '邀请无效', icon: 'none' });
  } finally {
    submitting.value = false;
  }
};

const joinFamily = async () => {
  const nextToken = extractToken(token.value);
  if (!nextToken) return;
  submitting.value = true;
  try {
    const family = await joinFamilyInvite(nextToken);
    uni.showToast({ title: '已加入家庭', icon: 'success' });
    uni.redirectTo({ url: `/pages/family-manage/index?id=${family.id}` });
  } catch (error) {
    uni.showToast({ title: error instanceof Error ? error.message : '加入失败', icon: 'none' });
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped lang="scss">
.scan-page {
  padding-bottom: calc(80rpx + env(safe-area-inset-bottom, 0));
}

.topbar {
  display: grid;
  grid-template-columns: 72rpx 1fr 72rpx;
  align-items: center;
}

.nav-button,
.primary-button,
.secondary-button {
  border: 0;
}

.nav-button {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: var(--app-surface-strong);
  color: var(--app-text);
  font-size: var(--font-size-card-title);
}

.topbar-title {
  color: var(--app-text);
  font-size: var(--font-size-body);
  font-weight: var(--font-semibold);
  text-align: center;
}

.scan-card,
.manual-card,
.confirm-card {
  margin-top: 24rpx;
  padding: 30rpx;
}

.scan-frame {
  position: relative;
  width: 360rpx;
  height: 360rpx;
  margin: 10rpx auto 30rpx;
  border-radius: 34rpx;
  background: rgba(233, 226, 214, 0.48);
}

.corner {
  position: absolute;
  width: 64rpx;
  height: 64rpx;
  border-color: var(--app-primary);
}

.corner-tl { top: 28rpx; left: 28rpx; border-top: 5rpx solid; border-left: 5rpx solid; }
.corner-tr { top: 28rpx; right: 28rpx; border-top: 5rpx solid; border-right: 5rpx solid; }
.corner-bl { bottom: 28rpx; left: 28rpx; border-bottom: 5rpx solid; border-left: 5rpx solid; }
.corner-br { right: 28rpx; bottom: 28rpx; border-right: 5rpx solid; border-bottom: 5rpx solid; }

.scan-line {
  position: absolute;
  right: 54rpx;
  left: 54rpx;
  top: 176rpx;
  height: 3rpx;
  background: var(--app-accent-warm);
}

.scan-title,
.scan-desc,
.confirm-label,
.confirm-title,
.confirm-desc {
  display: block;
  text-align: center;
}

.scan-title,
.confirm-title {
  color: var(--app-text);
  font-size: var(--font-size-section-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-section-title);
}

.scan-desc,
.confirm-desc {
  margin-top: 12rpx;
  color: var(--app-text-tertiary);
  font-size: var(--font-size-caption);
  line-height: var(--line-caption);
}

.primary-button,
.secondary-button {
  width: 100%;
  height: 86rpx;
  margin-top: 28rpx;
  border-radius: var(--app-radius-button);
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-semibold);
}

.primary-button {
  background: var(--app-primary);
  color: var(--text-white);
}

.secondary-button {
  background: var(--app-accent-soft);
  color: var(--app-text);
}

.token-input {
  height: 84rpx;
  margin-top: 18rpx;
  padding: 0 24rpx;
  border-radius: var(--app-radius-input);
  background: var(--app-accent-soft);
  color: var(--app-text);
  font-size: var(--font-size-body-sm);
}

.confirm-label {
  color: var(--app-text-tertiary);
  font-size: var(--font-size-tag);
}
</style>
