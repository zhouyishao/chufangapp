<template>
  <view class="auth-page">
    <view class="topbar">
      <button class="back-button" @tap="goBack">
        <app-icon name="arrow-left" size="26rpx" />
      </button>
      <text class="top-title">注册</text>
    </view>

    <view class="form-card glass-card">
      <text class="eyebrow">账号开通</text>
      <text class="title">注册暂未开放</text>
      <text class="desc">当前由管理员统一开通账号，请联系管理员获取手机号和初始密码。</text>
      <button class="primary-button" @tap="goToPhoneLogin">返回账号登录</button>

      <view class="agreement">
        <button class="text-button" @tap="goLegal('terms')">服务协议</button>
        <text>与</text>
        <button class="text-button" @tap="goLegal('privacy')">隐私政策</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import AppIcon from '../../components/app/app-icon.vue';

const goBack = () => {
  if (getCurrentPages().length <= 1) {
    uni.reLaunch({ url: '/pages/phone-login/index' });
    return;
  }
  uni.navigateBack();
};

const goToPhoneLogin = () => {
  uni.reLaunch({ url: '/pages/phone-login/index' });
};

const goLegal = (type: 'terms' | 'privacy') => {
  uni.navigateTo({ url: `/pages/legal/index?type=${type}` });
};
</script>

<style scoped lang="scss">
.auth-page {
  min-height: 100dvh;
  padding: calc(var(--app-safe-area-top) + 22rpx) 30rpx 60rpx;
  background: var(--app-bg);
}

.topbar {
  display: grid;
  grid-template-columns: 72rpx 1fr 72rpx;
  align-items: center;
  margin-bottom: 28rpx;
}

.back-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72rpx;
  height: 72rpx;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  border: 0;
  border-radius: 50%;
  background: var(--app-surface-strong);
  color: var(--app-text);
  line-height: 1;
}

.top-title {
  color: var(--app-text);
  font-size: var(--font-size-body);
  font-weight: var(--font-semibold);
  text-align: center;
}

.back-button::after,
.primary-button::after,
.text-button::after {
  border: 0;
}

.form-card {
  padding: 40rpx 34rpx 30rpx;
}

.eyebrow,
.title,
.desc {
  display: block;
}

.eyebrow {
  color: var(--app-accent);
  font-size: var(--font-size-tag);
  font-weight: var(--font-semibold);
}

.title {
  margin-top: 14rpx;
  color: var(--app-text);
  font-size: var(--font-size-page-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-page-title);
}

.desc {
  margin-top: 18rpx;
  color: var(--app-text-secondary);
  font-size: var(--font-size-body-sm);
  line-height: var(--line-body);
}

.primary-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 88rpx;
  margin-top: 42rpx;
  padding: 0 24rpx;
  box-sizing: border-box;
  border: 0;
  border-radius: var(--app-radius-button);
  background: var(--app-accent);
  color: var(--text-white);
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-semibold);
  line-height: var(--line-list-title);
}

.agreement {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 18rpx;
  color: var(--app-text-tertiary);
  font-size: var(--font-size-tag);
}

.text-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 64rpx;
  margin: 0;
  padding: 0 8rpx;
  box-sizing: border-box;
  border: 0;
  background: transparent;
  color: var(--app-text-secondary);
  font-size: var(--font-size-tag);
  font-weight: var(--font-medium);
  line-height: var(--line-list-title);
}
</style>
