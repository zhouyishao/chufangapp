<template>
  <view class="auth-page">
    <view class="topbar">
      <button class="back-button" @tap="goBack">←</button>
      <text class="top-title">账号密码登录</text>
    </view>

    <view class="form-card glass-card">
      <text class="title">欢迎回来</text>
      <text class="desc">使用手机号和密码登录，账号数据当前先保存在本地。</text>
      <view class="demo-account">
        <text>测试账号：13800138000</text>
        <text>密码：123456</text>
      </view>

      <view class="field">
        <text class="field-label">手机号</text>
        <input v-model="phone" class="input" type="number" maxlength="11" placeholder="请输入手机号" />
      </view>

      <view class="field">
        <text class="field-label">密码</text>
        <input v-model="password" class="input" password placeholder="请输入密码" />
      </view>

      <button class="primary-button" @tap="login">登录</button>
      <view class="link-row">
        <button class="text-button" @tap="goToRegister">注册账号</button>
        <button class="text-button" @tap="goToForgotPassword">忘记密码</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { createAuthUser, findAuthAccount, isValidPhone, saveAuthUser, verifyPassword } from '../../services/auth';
import { saveUserProfile } from '../../services/profile';

const phone = ref('');
const password = ref('');

const goBack = () => {
  if (getCurrentPages().length <= 1) {
    uni.reLaunch({ url: '/pages/login/index' });
    return;
  }

  uni.navigateBack();
};

const login = async () => {
  if (!isValidPhone(phone.value)) {
    uni.showToast({ title: '请输入正确手机号', icon: 'none' });
    return;
  }

  if (!password.value.trim()) {
    uni.showToast({ title: '请输入密码', icon: 'none' });
    return;
  }

  const account = findAuthAccount(phone.value);
  if (!account || !verifyPassword(phone.value, password.value)) {
    uni.showToast({ title: '手机号或密码错误', icon: 'none' });
    return;
  }

  const user = createAuthUser(account.phone, account.nickname);
  saveAuthUser(user);
  saveUserProfile({
    nickname: user.nickname,
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    bio: '一起把一日三餐过得更松弛'
  });
  uni.showToast({ title: '登录成功', icon: 'success' });
  setTimeout(() => {
    uni.reLaunch({ url: '/pages/mine/index' });
  }, 350);
};

const goToRegister = () => {
  uni.navigateTo({ url: '/pages/register/index' });
};

const goToForgotPassword = () => {
  uni.navigateTo({ url: '/pages/forgot-password/index' });
};
</script>

<style scoped lang="scss">
.auth-page {
  min-height: 100vh;
  padding: calc(var(--status-bar-height) + 22rpx) 30rpx 60rpx;
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
  border: 0;
  border-radius: 50%;
  background: #fffdfc;
  color: var(--app-text);
  font-size: 34rpx;
  font-weight: 500;
  box-shadow: 0 12rpx 30rpx rgba(0, 0, 0, 0.04);
}

.top-title {
  color: var(--app-text);
  font-size: 30rpx;
  font-weight: 600;
  text-align: center;
}

.back-button::after,
.primary-button::after,
.text-button::after {
  border: 0;
}

.form-card {
  padding: 34rpx;
}

.title,
.desc,
.field-label {
  display: block;
}

.title {
  color: var(--app-text);
  font-size: 46rpx;
  font-weight: 600;
}

.desc {
  margin-top: 14rpx;
  color: var(--app-text-secondary);
  font-size: 25rpx;
  line-height: 1.6;
}

.demo-account {
  display: grid;
  gap: 8rpx;
  margin-top: 22rpx;
  padding: 20rpx 22rpx;
  border-radius: 24rpx;
  background: #e9e2d6;
  color: var(--app-text-secondary);
  font-size: 23rpx;
  font-weight: 500;
}

.field {
  margin-top: 28rpx;
}

.field-label {
  margin-bottom: 12rpx;
  color: var(--app-text-secondary);
  font-size: 23rpx;
  font-weight: 500;
}

.input {
  height: 82rpx;
  padding: 0 24rpx;
  border-radius: 28rpx;
  background: #e9e2d6;
  color: var(--app-text);
  font-size: 27rpx;
}

.primary-button {
  width: 100%;
  height: 88rpx;
  margin-top: 34rpx;
  border: 0;
  border-radius: var(--app-radius-button);
  background: var(--app-accent);
  color: #fffdfc;
  font-size: 28rpx;
  font-weight: 600;
}

.link-row {
  display: flex;
  justify-content: space-between;
  margin-top: 16rpx;
}

.text-button {
  height: 72rpx;
  border: 0;
  background: transparent;
  color: var(--app-text-secondary);
  font-size: 24rpx;
  font-weight: 500;
}
</style>
