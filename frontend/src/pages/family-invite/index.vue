<template>
  <view class="app-page invite-page">
    <view class="topbar">
      <button class="nav-button" @tap="goBack">←</button>
      <view class="topbar__spacer" />
    </view>

    <text class="page-title">选择邀请方式</text>
    <text class="page-subtitle">二维码扫码邀请</text>

    <view class="invite-card glass-card">
      <view class="qr-wrap">
        <view class="qr-grid">
          <view v-for="block in qrBlocks" :key="block" class="qr-dot" />
        </view>
      </view>
      <text class="hint">使用手机扫码加入「{{ family.name }}」</text>
    </view>

    <view class="link-card glass-card">
      <text class="link-title">邀请链接</text>
      <text class="link-value">{{ inviteLink }}</text>
      <nut-button type="primary" block @click="copyLink">复制链接</nut-button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getFamilyById } from '../../services/family';
import type { FamilyProfile } from '../../types/family';

const familyId = ref('');
const family = ref<FamilyProfile>(getFamilyById(''));
const qrBlocks = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't'];

const inviteLink = computed(() => {
  const id = familyId.value || family.value.id;
  return `https://recipe.app/join?family=${encodeURIComponent(id)}`;
});

const goBack = () => {
  uni.navigateBack();
};

const copyLink = () => {
  uni.setClipboardData({
    data: inviteLink.value,
    success: () => {
      uni.showToast({ title: '邀请链接已复制', icon: 'none' });
    }
  });
};

onLoad((options) => {
  familyId.value = typeof options?.familyId === 'string' ? options.familyId : '';
  family.value = getFamilyById(familyId.value);
});
</script>

<style scoped lang="scss">
.invite-page {
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
  background: rgba(255, 255, 255, 0.92);
  color: var(--app-text);
  font-size: 38rpx;
  font-weight: 800;
  box-shadow: 0 12rpx 30rpx rgba(15, 23, 42, 0.06);
}

.nav-button::after {
  border: 0;
}

.topbar__spacer {
  width: 74rpx;
  height: 74rpx;
}

.page-title,
.page-subtitle,
.hint,
.link-title,
.link-value {
  display: block;
}

.page-title {
  margin-top: 6rpx;
  color: var(--app-text);
  font-size: 62rpx;
  font-weight: 950;
  letter-spacing: -1rpx;
}

.page-subtitle {
  margin-top: 14rpx;
  color: var(--app-text-tertiary);
  font-size: 24rpx;
  font-weight: 800;
}

.invite-card {
  margin-top: 28rpx;
  padding: 28rpx;
  border-radius: 34rpx;
  background: rgba(255, 255, 255, 0.92);
}

.qr-wrap {
  display: flex;
  justify-content: center;
  padding: 18rpx 0 10rpx;
}

.qr-grid {
  display: grid;
  grid-template-columns: repeat(5, 40rpx);
  gap: 12rpx;
  padding: 26rpx;
  border-radius: 28rpx;
  background: #ffffff;
  box-shadow: 0 16rpx 40rpx rgba(15, 23, 42, 0.08);
}

.qr-dot {
  width: 40rpx;
  height: 40rpx;
  border-radius: 10rpx;
  background: var(--app-accent);
}

.qr-dot:nth-child(2),
.qr-dot:nth-child(4),
.qr-dot:nth-child(9),
.qr-dot:nth-child(12),
.qr-dot:nth-child(18) {
  background: var(--app-accent-soft);
}

.hint {
  margin-top: 18rpx;
  text-align: center;
  color: var(--app-text-secondary);
  font-size: 24rpx;
  line-height: 1.55;
}

.link-card {
  margin-top: 18rpx;
  padding: 26rpx;
  border-radius: 34rpx;
  background: rgba(255, 255, 255, 0.92);
}

.link-title {
  color: var(--app-text);
  font-size: 28rpx;
  font-weight: 950;
}

.link-value {
  margin-top: 12rpx;
  padding: 18rpx;
  border-radius: 26rpx;
  background: var(--app-accent-soft);
  color: var(--app-text-secondary);
  font-size: 22rpx;
  line-height: 1.5;
  word-break: break-all;
}
</style>

