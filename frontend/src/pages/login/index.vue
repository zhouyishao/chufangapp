<template>
  <view class="auth-page">
    <view class="topbar">
      <button class="back-button" @tap="goBack">←</button>
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
    radial-gradient(circle at 72% 4%, rgba(255, 255, 255, 0.98), transparent 34%),
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
  background: #ffffff;
  color: var(--app-text);
  font-size: 34rpx;
  font-weight: 800;
  box-shadow: 0 12rpx 30rpx rgba(15, 23, 42, 0.06);
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
  font-size: 22rpx;
  font-weight: 800;
}

.title {
  margin-top: 20rpx;
  color: var(--app-text);
  font-size: 48rpx;
  font-weight: 900;
  line-height: 1.2;
}

.desc {
  margin-top: 18rpx;
  color: var(--app-text-secondary);
  font-size: 26rpx;
  line-height: 1.7;
}

.action-card {
  margin-top: 22rpx;
}

.primary-button,
.secondary-button {
  width: 100%;
  height: 88rpx;
  border: 0;
  border-radius: 999rpx;
  font-size: 28rpx;
  font-weight: 900;
}

.primary-button {
  background: var(--app-accent);
  color: #ffffff;
}

.secondary-button {
  margin-top: 16rpx;
  background: #f2f4f7;
  color: var(--app-text);
}

.agreement {
  margin-top: 22rpx;
  color: var(--app-text-tertiary);
  font-size: 22rpx;
  text-align: center;
}

.benefit-list {
  display: grid;
  gap: 18rpx;
  margin-top: 22rpx;
}

.benefit-title {
  color: var(--app-text);
  font-size: 28rpx;
  font-weight: 900;
}

.benefit-desc {
  margin-top: 8rpx;
  color: var(--app-text-secondary);
  font-size: 23rpx;
}
</style>
