<template>
  <view class="auth-page">
    <view class="topbar">
      <button class="back-button" @tap="goBack">
        <app-icon name="arrow-left" size="26rpx" />
      </button>
      <text class="top-title">注册</text>
    </view>

    <view class="hero-card">
      <text class="hero-kicker">家庭时令菜谱</text>
      <text class="hero-title">创建账号</text>
      <text class="hero-desc">保存菜篮子、价格记录和自己的创新菜谱。</text>
    </view>

    <view class="form-card glass-card">
      <view class="step-head">
        <text class="step-label">{{ stepLabel }}</text>
        <view class="step-track">
          <view
            v-for="stepNumber in stepNumbers"
            :key="stepNumber"
            class="step-dot"
            :class="{ 'step-dot--active': stepNumber <= stepIndex }"
          />
        </view>
      </view>
      <text class="title">{{ title }}</text>
      <text class="desc">{{ desc }}</text>

      <view v-if="step === 'phone'" class="field">
        <text class="field-label">手机号</text>
        <input v-model="phone" class="input" type="number" maxlength="11" placeholder="请输入手机号" />
        <button class="primary-button" @tap="sendCode">发送验证码</button>
      </view>

      <view v-else-if="step === 'code'" class="code-section">
        <text class="phone-tip">验证码已发送至 {{ maskedPhone }}</text>
        <input
          v-model="code"
          class="code-input"
          type="number"
          maxlength="6"
          focus
          placeholder="000000"
          @input="handleCodeInput"
        />
        <text class="code-help">填写 6 位验证码后自动验证</text>
      </view>

      <view v-else class="field">
        <text class="field-label">设置密码</text>
        <input v-model="password" class="input" password placeholder="至少 6 位" />
        <view class="field field--nested">
          <text class="field-label">确认密码</text>
          <input v-model="confirmPassword" class="input" password placeholder="再次输入密码" />
        </view>
        <button class="primary-button" @tap="finishRegister">完成注册</button>
      </view>

      <button class="text-button" @tap="goToPhoneLogin">已有账号，去登录</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import AppIcon from '../../components/app/app-icon.vue';
import {
  createAuthUser,
  isValidPassword,
  isValidPhone,
  maskPhone,
  registerAuthAccount,
  saveAuthUser,
  syncAuthUserWithBackend
} from '../../services/auth';
import { saveUserProfile } from '../../services/profile';

type RegisterStep = 'phone' | 'code' | 'password';

const step = ref<RegisterStep>('phone');
const phone = ref('');
const code = ref('');
const password = ref('');
const confirmPassword = ref('');
const stepNumbers = [1, 2, 3];

const stepIndex = computed(() => {
  if (step.value === 'phone') {
    return 1;
  }
  if (step.value === 'code') {
    return 2;
  }
  return 3;
});

const stepLabel = computed(() => {
  if (step.value === 'phone') {
    return '1/3 手机号';
  }
  if (step.value === 'code') {
    return '2/3 验证码';
  }
  return '3/3 设置密码';
});

const title = computed(() => {
  if (step.value === 'phone') {
    return '输入手机号';
  }
  if (step.value === 'code') {
    return '输入验证码';
  }
  return '设置登录密码';
});

const desc = computed(() => {
  if (step.value === 'phone') {
    return '手机号用于登录和找回密码。';
  }
  if (step.value === 'code') {
    return '验证通过后继续设置登录密码。';
  }
  return '以后可使用手机号和密码登录。';
});

const maskedPhone = computed(() => maskPhone(phone.value));

const goBack = () => {
  if (step.value === 'password') {
    step.value = 'code';
    return;
  }
  if (step.value === 'code') {
    step.value = 'phone';
    return;
  }
  if (getCurrentPages().length <= 1) {
    uni.reLaunch({ url: '/pages/login/index' });
    return;
  }

  uni.navigateBack();
};

const sendCode = async () => {
  if (!isValidPhone(phone.value)) {
    uni.showToast({ title: '请输入正确手机号', icon: 'none' });
    return;
  }

  code.value = '';
  step.value = 'code';
  uni.showToast({ title: '验证码已发送', icon: 'none' });
};

const handleCodeInput = () => {
  if (code.value.trim().length < 6) {
    return;
  }

  step.value = 'password';
};

const finishRegister = async () => {
  if (!isValidPassword(password.value)) {
    uni.showToast({ title: '密码至少 6 位', icon: 'none' });
    return;
  }
  if (password.value !== confirmPassword.value) {
    uni.showToast({ title: '两次密码不一致', icon: 'none' });
    return;
  }

  const account = registerAuthAccount(phone.value, password.value);
  const user = createAuthUser(account.phone, account.nickname);
  const remoteUser = await syncAuthUserWithBackend(user);
  saveAuthUser(remoteUser ?? user);
  saveUserProfile({
    nickname: remoteUser?.nickname ?? user.nickname,
    avatarUrl: '',
    bio: '正在整理自己的家庭菜谱'
  });
  uni.showToast({ title: '注册成功', icon: 'success' });
  setTimeout(() => {
    uni.reLaunch({ url: '/pages/mine/index' });
  }, 350);
};

const goToPhoneLogin = () => {
  uni.navigateTo({ url: '/pages/phone-login/index' });
};
</script>

<style scoped lang="scss">
.auth-page {
  min-height: 100vh;
  padding: calc(var(--status-bar-height) + 22rpx) 30rpx 72rpx;
  background:
    radial-gradient(circle at 78% 4%, rgba(255, 253, 252, 0.95), transparent 34%),
    linear-gradient(180deg, #fffdfc 0%, #e9e2d6 100%);
}

.topbar {
  display: grid;
  grid-template-columns: 72rpx 1fr 72rpx;
  align-items: center;
  margin-bottom: 26rpx;
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

.hero-card {
  display: grid;
  gap: 12rpx;
  margin-bottom: 22rpx;
  padding: 38rpx 36rpx 42rpx;
  border: 1rpx solid rgba(0, 0, 0, 0.04);
  border-radius: var(--app-radius-card);
  background: #fffdfc;
  box-shadow: 0 24rpx 70rpx rgba(0, 0, 0, 0.04);
}

.hero-kicker,
.hero-title,
.hero-desc {
  display: block;
}

.hero-kicker {
  color: var(--app-text-tertiary);
  font-size: var(--font-size-tag);
  font-weight: var(--font-semibold);
}

.hero-title {
  color: var(--app-text);
  font-size: var(--font-size-hero);
  font-weight: var(--font-semibold);
  letter-spacing: 0;
  line-height: var(--line-hero);
}

.hero-desc {
  color: var(--app-text-secondary);
  font-size: var(--font-size-body-sm);
  line-height: var(--line-body-sm);
}

.form-card {
  padding: 36rpx;
  border-radius: var(--app-radius-card);
  background: #fffdfc;
  box-shadow: 0 28rpx 80rpx rgba(0, 0, 0, 0.04);
}

.step-label,
.title,
.desc,
.field-label,
.phone-tip,
.code-help {
  display: block;
}

.step-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24rpx;
}

.step-label {
  color: var(--app-text-secondary);
  font-size: var(--font-size-tabbar);
  font-weight: var(--font-medium);
}

.step-track {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 10rpx 12rpx;
  border-radius: var(--app-radius-button);
  background: #e9e2d6;
}

.step-dot {
  width: 28rpx;
  height: 8rpx;
  border-radius: var(--app-radius-button);
  background: #b7aea1;
  transition: width 0.2s ease, background 0.2s ease;
}

.step-dot--active {
  width: 42rpx;
  background: var(--app-accent);
}

.title {
  margin-top: 22rpx;
  color: var(--app-text);
  font-size: var(--font-size-page-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-page-title);
}

.desc {
  margin-top: 14rpx;
  color: var(--app-text-secondary);
  font-size: var(--font-size-caption);
  line-height: var(--line-body-sm);
}

.field,
.code-section {
  margin-top: 32rpx;
}

.field--nested {
  margin-top: 22rpx;
}

.field-label {
  margin-bottom: 12rpx;
  color: var(--app-text-secondary);
  font-size: var(--font-size-tag);
  font-weight: var(--font-medium);
}

.input {
  height: 94rpx;
  padding: 0 28rpx;
  border-radius: var(--app-radius-input);
  background: #e9e2d6;
  color: var(--app-text);
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-medium);
}

.primary-button {
  width: 100%;
  height: 94rpx;
  margin-top: 36rpx;
  border: 0;
  border-radius: var(--app-radius-button);
  background: var(--app-accent);
  color: var(--text-white);
  font-size: var(--font-size-body);
  font-weight: var(--font-semibold);
  box-shadow: 0 20rpx 44rpx rgba(122, 139, 111, 0.2);
}

.phone-tip {
  color: var(--app-text-secondary);
  font-size: var(--font-size-caption);
  font-weight: var(--font-medium);
}

.code-input {
  width: 100%;
  height: 128rpx;
  margin-top: 24rpx;
  border-radius: var(--app-radius-card);
  background: #e9e2d6;
  color: var(--app-text);
  font-size: var(--font-size-hero);
  font-weight: var(--font-semibold);
  letter-spacing: 16rpx;
  text-align: center;
}

.code-help {
  margin-top: 16rpx;
  color: var(--app-text-tertiary);
  font-size: var(--font-size-tabbar);
  text-align: center;
}

.text-button {
  width: 100%;
  height: 72rpx;
  margin-top: 20rpx;
  border: 0;
  background: transparent;
  color: var(--app-text-secondary);
  font-size: var(--font-size-tag);
  font-weight: var(--font-medium);
}
</style>
