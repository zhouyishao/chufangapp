<template>
  <view class="auth-page">
    <view class="topbar">
      <button class="back-button" @tap="goBack">←</button>
      <text class="top-title">找回密码</text>
    </view>

    <view class="form-card glass-card">
      <text class="step-label">{{ stepLabel }}</text>
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
        <text class="field-label">新密码</text>
        <input v-model="password" class="input" password placeholder="至少 6 位" />
        <view class="field">
          <text class="field-label">确认新密码</text>
          <input v-model="confirmPassword" class="input" password placeholder="再次输入新密码" />
        </view>
        <button class="primary-button" @tap="resetPassword">保存新密码</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { isValidPassword, isValidPhone, maskPhone, resetAuthPassword } from '../../services/auth';

type ResetStep = 'phone' | 'code' | 'password';

const step = ref<ResetStep>('phone');
const phone = ref('');
const code = ref('');
const password = ref('');
const confirmPassword = ref('');

const stepLabel = computed(() => {
  if (step.value === 'phone') {
    return '1/3 验证手机号';
  }
  if (step.value === 'code') {
    return '2/3 输入验证码';
  }
  return '3/3 修改密码';
});

const title = computed(() => {
  if (step.value === 'phone') {
    return '输入手机号';
  }
  if (step.value === 'code') {
    return '验证身份';
  }
  return '设置新密码';
});

const desc = computed(() => {
  if (step.value === 'phone') {
    return '先验证手机号，再修改登录密码。';
  }
  if (step.value === 'code') {
    return '验证码验证通过后，可以重新设置密码。';
  }
  return '新密码保存后，可用手机号和新密码登录。';
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
    uni.reLaunch({ url: '/pages/phone-login/index' });
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

const resetPassword = async () => {
  if (!isValidPassword(password.value)) {
    uni.showToast({ title: '密码至少 6 位', icon: 'none' });
    return;
  }
  if (password.value !== confirmPassword.value) {
    uni.showToast({ title: '两次密码不一致', icon: 'none' });
    return;
  }

  resetAuthPassword(phone.value, password.value);
  uni.showToast({ title: '密码已修改', icon: 'success' });
  setTimeout(() => {
    uni.reLaunch({ url: '/pages/phone-login/index' });
  }, 350);
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
.primary-button::after {
  border: 0;
}

.form-card {
  padding: 34rpx;
}

.step-label,
.title,
.desc,
.field-label,
.phone-tip,
.code-help {
  display: block;
}

.step-label {
  color: var(--app-text-tertiary);
  font-size: var(--font-size-tabbar);
  font-weight: var(--font-medium);
}

.title {
  margin-top: 14rpx;
  color: var(--app-text);
  font-size: var(--font-size-detail-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-detail-title);
}

.desc {
  margin-top: 14rpx;
  color: var(--app-text-secondary);
  font-size: var(--font-size-caption);
  line-height: var(--line-body-sm);
}

.field,
.code-section {
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
  width: 100%;
  height: 88rpx;
  margin-top: 34rpx;
  border: 0;
  border-radius: var(--app-radius-button);
  background: var(--app-accent);
  color: var(--text-white);
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-semibold);
}

.phone-tip {
  color: var(--app-text-secondary);
  font-size: var(--font-size-tag);
}

.code-input {
  width: 100%;
  height: 112rpx;
  margin-top: 24rpx;
  border-radius: 32rpx;
  background: #e9e2d6;
  color: var(--app-text);
  font-size: var(--font-size-page-title);
  font-weight: var(--font-semibold);
  letter-spacing: 12rpx;
  text-align: center;
}

.code-help {
  margin-top: 16rpx;
  color: var(--app-text-tertiary);
  font-size: var(--font-size-tabbar);
  text-align: center;
}
</style>
