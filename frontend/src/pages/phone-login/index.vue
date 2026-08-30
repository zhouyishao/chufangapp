<template>
  <view class="auth-page">
    <view class="topbar">
      <button class="back-button" @tap="goBack">
        <app-icon name="arrow-left" size="26rpx" />
      </button>
      <text class="top-title">账号密码登录</text>
    </view>

    <view class="form-card glass-card">
      <text class="title">欢迎回来</text>
      <text class="desc">输入管理员为你开通的手机号和密码，登录后同步收藏、家庭和菜篮子。</text>

      <view class="field">
        <text class="field-label">手机号</text>
        <input v-model="phone" class="input" type="number" maxlength="11" placeholder="请输入手机号" />
      </view>

      <view class="field">
        <text class="field-label">密码</text>
        <input v-model="password" class="input" password placeholder="请输入密码" />
      </view>

      <button class="primary-button" :loading="isSubmitting" :disabled="isSubmitting" @tap="login">
        {{ isSubmitting ? '登录中...' : '登录' }}
      </button>
      <view class="link-row">
        <button class="text-button" @tap="goToRegister">注册账号</button>
        <button class="text-button" @tap="goToForgotPassword">忘记密码</button>
      </view>
      <view class="agreement">
        <button class="text-button" @tap="goLegal('terms')">服务协议</button>
        <text>与</text>
        <button class="text-button" @tap="goLegal('privacy')">隐私政策</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import AppIcon from '../../components/app/app-icon.vue';
import { isValidPhone, loginAuthUser } from '../../services/auth';

const phone = ref('');
const password = ref('');
const isSubmitting = ref(false);

const goBack = () => {
  if (getCurrentPages().length <= 1) {
    uni.reLaunch({ url: '/pages/login/index' });
    return;
  }

  uni.navigateBack();
};

const login = async () => {
  if (isSubmitting.value) return;
  if (!isValidPhone(phone.value)) {
    uni.showToast({ title: '请输入正确手机号', icon: 'none' });
    return;
  }

  if (!password.value.trim()) {
    uni.showToast({ title: '请输入密码', icon: 'none' });
    return;
  }

  isSubmitting.value = true;
  try {
    await loginAuthUser(phone.value, password.value);
    uni.showToast({ title: '登录成功', icon: 'success' });
    setTimeout(() => {
      uni.reLaunch({ url: '/pages/mine/index' });
    }, 350);
  } catch (error) {
    const message = error instanceof Error ? error.message : '登录失败，请稍后重试';
    uni.showToast({ title: message, icon: 'none' });
  } finally {
    isSubmitting.value = false;
  }
};

const goToRegister = () => {
  uni.navigateTo({ url: '/pages/register/index' });
};

const goToForgotPassword = () => {
  uni.navigateTo({ url: '/pages/forgot-password/index' });
};

const goLegal = (type: 'terms' | 'privacy') => {
  uni.navigateTo({ url: `/pages/legal/index?type=${type}` });
};
</script>

<style scoped lang="scss">
.auth-page {
  min-height: 100vh;
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
  background: #fffdfc;
  color: var(--app-text);
  font-size: var(--font-size-card-title);
  font-weight: var(--font-medium);
  line-height: 1;
  box-shadow: 0 12rpx 30rpx rgba(0, 0, 0, 0.04);
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
  padding: 34rpx;
}

.title,
.desc,
.field-label {
  display: block;
}

.title {
  color: var(--app-text);
  font-size: var(--font-size-page-title);
  font-weight: var(--font-semibold);
}

.desc {
  margin-top: 14rpx;
  color: var(--app-text-secondary);
  font-size: var(--font-size-caption);
  line-height: var(--line-body-sm);
}

.field {
  margin-top: 28rpx;
}

.field-label {
  margin-bottom: 12rpx;
  color: var(--app-text-secondary);
  font-size: var(--font-size-tag);
  font-weight: var(--font-medium);
}

.input {
  height: 82rpx;
  padding: 0 24rpx;
  border-radius: 28rpx;
  background: #e9e2d6;
  color: var(--app-text);
  font-size: var(--font-size-body-sm);
}

.primary-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 88rpx;
  margin-top: 34rpx;
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

.link-row {
  display: flex;
  justify-content: space-between;
  margin-top: 16rpx;
}

.agreement {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 6rpx;
  color: var(--app-text-tertiary);
  font-size: var(--font-size-tag);
}

.text-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 72rpx;
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
