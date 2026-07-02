<template>
  <view class="auth-page">
    <view class="topbar">
      <button class="back-button" @tap="goBack">
        <app-icon name="arrow-left" size="26rpx" />
      </button>
    </view>

    <view class="hero-card glass-card">
      <text class="eyebrow">家庭时令菜谱</text>
      <text class="title">登录后同步家的菜篮子</text>
      <text class="desc">保存收藏、采购记录和家庭共享信息，让每次买菜更顺手。</text>
    </view>

    <view class="action-card glass-card">
      <button class="primary-button" @tap="goToPhoneLogin">账号密码登录</button>
      <button class="secondary-button" @tap="goToRegister">注册新账号</button>
      <text class="agreement">登录即代表同意服务协议和隐私政策</text>
    </view>

    <view class="benefit-list">
      <view v-for="item in benefits" :key="item.title" class="benefit-item glass-card">
        <text class="benefit-title">{{ item.title }}</text>
        <text class="benefit-desc">{{ item.desc }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import AppIcon from '../../components/app/app-icon.vue';
const benefits = [
  { title: '家庭共享', desc: '和家人同步菜篮子与采购记录' },
  { title: '价格记录', desc: '记录食材价格，查看走势' },
  { title: '个人菜谱', desc: '保存收藏和自己的创新菜谱' }
];

const goBack = () => {
  if (getCurrentPages().length <= 1) {
    uni.reLaunch({ url: '/pages/mine/index' });
    return;
  }

  uni.navigateBack();
};

const goToPhoneLogin = () => {
  uni.navigateTo({ url: '/pages/phone-login/index' });
};

const goToRegister = () => {
  uni.navigateTo({ url: '/pages/register/index' });
};
</script>

<style scoped lang="scss">
.auth-page {
  min-height: 100vh;
  padding: calc(var(--status-bar-height) + 22rpx) 30rpx 60rpx;
  background:
    radial-gradient(circle at 72% 4%, rgba(255, 253, 252, 0.98), transparent 34%),
    var(--app-bg);
}

.topbar {
  margin-bottom: 18rpx;
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
  font-weight: var(--font-medium);
  box-shadow: 0 12rpx 30rpx rgba(0, 0, 0, 0.04);
}

.back-button::after,
.primary-button::after,
.secondary-button::after {
  border: 0;
}

.hero-card,
.action-card,
.benefit-item {
  padding: 32rpx;
}

.eyebrow,
.title,
.desc,
.agreement,
.benefit-title,
.benefit-desc {
  display: block;
}

.eyebrow {
  color: var(--app-text-tertiary);
  font-size: var(--font-size-tabbar);
  font-weight: var(--font-medium);
}

.title {
  margin-top: 20rpx;
  color: var(--app-text);
  font-size: var(--font-size-page-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-page-title);
}

.desc {
  margin-top: 18rpx;
  color: var(--app-text-secondary);
  font-size: var(--font-size-caption);
  line-height: var(--line-body);
}

.action-card {
  margin-top: 22rpx;
}

.primary-button,
.secondary-button {
  width: 100%;
  height: 88rpx;
  border: 0;
  border-radius: var(--app-radius-button);
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-semibold);
}

.primary-button {
  background: var(--app-accent);
  color: var(--text-white);
}

.secondary-button {
  margin-top: 16rpx;
  background: #e9e2d6;
  color: var(--app-text);
}

.agreement {
  margin-top: 22rpx;
  color: var(--app-text-tertiary);
  font-size: var(--font-size-tabbar);
  text-align: center;
}

.benefit-list {
  display: grid;
  gap: 18rpx;
  margin-top: 22rpx;
}

.benefit-title {
  color: var(--app-text);
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-semibold);
}

.benefit-desc {
  margin-top: 8rpx;
  color: var(--app-text-secondary);
  font-size: var(--font-size-tag);
}
</style>
