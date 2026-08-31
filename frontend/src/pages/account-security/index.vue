<template>
  <view class="app-page secondary-page">
    <view class="safe-top-spacer" aria-hidden="true" />
    <view class="page-header">
      <button class="icon-button" aria-label="返回" @tap="goBack"><app-icon name="arrow-left" size="28rpx" /></button>
      <text class="page-title">账号与安全</text>
      <view />
    </view>

    <view class="identity-card">
      <view class="identity-icon"><app-icon name="lock-simple" size="32rpx" /></view>
      <view>
        <text class="identity-title">{{ user ? '账号已登录' : '当前未登录' }}</text>
        <text class="identity-desc">{{ maskedPhone }}</text>
      </view>
    </view>

    <view class="section-list">
      <button class="list-row" @tap="goPhoneLogin">
        <text class="row-title">{{ user ? '更换登录账号' : '手机号登录' }}</text>
        <app-icon name="chevron-right" size="22rpx" />
      </button>
      <button class="list-row" @tap="goLoginDevices">
        <view>
          <text class="row-title">登录设备</text>
          <text class="row-desc">查看当前设备与远程下线能力</text>
        </view>
        <app-icon name="chevron-right" size="22rpx" />
      </button>
      <view class="list-row list-row--static">
        <view>
          <text class="row-title">登录保护</text>
          <text class="row-desc">登录凭证保存在当前设备，接口通过账号身份校验</text>
        </view>
        <text class="status-text">已启用</text>
      </view>
      <button class="list-row" @tap="goAccountDeletion">
        <view>
          <text class="row-title">注销账号</text>
          <text class="row-desc">查看账号注销能力状态</text>
        </view>
        <app-icon name="chevron-right" size="22rpx" />
      </button>
    </view>

    <button v-if="user" class="logout-button" @tap="confirmLogout">退出当前账号</button>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import AppIcon from '../../components/app/app-icon.vue';
import { clearAuthUser, loadAuthUser, type AuthUser } from '../../services/auth';

const user = ref<AuthUser | null>(loadAuthUser());
const maskedPhone = computed(() => {
  if (!user.value?.phone) return '登录后同步家庭、收藏与菜篮';
  return user.value.phone.replace(/^(\d{3})\d+(\d{4})$/, '$1 **** $2');
});
const goBack = () => uni.navigateBack({ fail: () => uni.reLaunch({ url: '/pages/mine/index' }) });
const goPhoneLogin = () => uni.navigateTo({ url: '/pages/phone-login/index' });
const goLoginDevices = () => uni.navigateTo({ url: '/pages/login-devices/index' });
const goAccountDeletion = () => uni.navigateTo({ url: '/pages/account-deletion/index' });
const confirmLogout = () => uni.showModal({
  title: '退出当前账号？',
  content: '退出后，本机将停止同步家庭、收藏和菜篮数据。',
  cancelText: '取消',
  confirmText: '退出',
  confirmColor: '#7A8B6F',
  success: ({ confirm }) => {
    if (!confirm) return;
    clearAuthUser();
    user.value = null;
    uni.reLaunch({ url: '/pages/mine/index' });
  }
});
onShow(() => { user.value = loadAuthUser(); });
</script>

<style scoped lang="scss">
.secondary-page { min-height: 100vh; padding: 0 16px 40px; background: var(--app-bg); }
.safe-top-spacer { height: calc(var(--app-safe-area-top) + 12px); }
.page-header { display: grid; grid-template-columns: 44px 1fr 44px; align-items: center; min-height: 44px; }
.page-title { color: var(--app-text); font-size: var(--font-size-body); font-weight: var(--font-semibold); text-align: center; }
.icon-button { display: grid; place-items: center; width: 44px; height: 44px; padding: 0; border: 0; background: transparent; color: var(--app-text); }
.identity-card { display: flex; align-items: center; gap: 14px; margin-top: 24px; padding: 18px; border-radius: var(--app-radius-card); background: var(--app-surface-strong); border: 1px solid var(--app-border); }
.identity-icon { display: grid; place-items: center; width: 44px; height: 44px; border-radius: 15px; background: var(--app-primary-soft); color: var(--app-primary); }
.identity-title, .identity-desc, .row-title, .row-desc { display: block; }
.identity-title, .row-title { color: var(--app-text); font-size: var(--font-size-list-title); font-weight: var(--font-medium); }
.identity-desc, .row-desc { margin-top: 4px; color: var(--app-text-secondary); font-size: var(--font-size-caption); line-height: var(--line-caption); }
.section-list { overflow: hidden; margin-top: 20px; border-radius: var(--app-radius-card); background: var(--app-surface-strong); border: 1px solid var(--app-border); }
.list-row { display: grid; grid-template-columns: 1fr auto; align-items: center; width: 100%; min-height: 64px; padding: 12px 16px; border: 0; border-bottom: 1px solid var(--app-border); background: transparent; text-align: left; }
.list-row:last-child { border-bottom: 0; }
.status-text { color: var(--app-primary); font-size: var(--font-size-caption); }
.logout-button { width: 100%; min-height: 48px; margin-top: 24px; border: 1px solid var(--app-border); border-radius: var(--app-radius-button); background: transparent; color: var(--app-text-secondary); font-size: var(--font-size-body-sm); }
button::after { border: 0; }
</style>
