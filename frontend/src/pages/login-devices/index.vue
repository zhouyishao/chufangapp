<template>
  <view class="blocked-page">
    <view class="safe-top" aria-hidden="true" />
    <view class="page-header">
      <button class="icon-button" aria-label="返回" @tap="goBack"><app-icon name="arrow-left" size="28rpx" /></button>
      <text class="page-title">登录设备</text><view />
    </view>
    <view class="device-card">
      <view class="device-icon"><app-icon name="user" size="28rpx" /></view>
      <view><text class="device-title">当前设备</text><text class="device-desc">{{ phoneText }}</text></view>
      <text class="current-tag">当前</text>
    </view>
    <view class="blocked-card">
      <text class="blocked-title">设备管理暂不可用</text>
      <text class="blocked-desc">服务端暂未提供登录设备接口，因此当前不能查询其他设备或执行远程下线。这里不会伪造设备记录和操作结果。</text>
    </view>
  </view>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import AppIcon from '../../components/app/app-icon.vue';
import { loadAuthUser } from '../../services/auth';
const phoneText = computed(() => loadAuthUser()?.phone || '当前账号未登录');
const goBack = () => uni.navigateBack({ fail: () => uni.reLaunch({ url: '/pages/account-security/index' }) });
</script>
<style scoped lang="scss">
.blocked-page { min-height: 100vh; padding: 0 16px 48px; background: var(--app-bg); }
.safe-top { height: calc(var(--app-safe-area-top) + 12px); }
.page-header { display: grid; grid-template-columns: 44px 1fr 44px; align-items: center; min-height: 44px; }
.page-title { color: var(--app-text); font-size: var(--font-size-body); font-weight: var(--font-semibold); text-align: center; }
.icon-button { display: grid; place-items: center; width: 44px; height: 44px; padding: 0; border: 0; background: transparent; color: var(--app-text); }
.device-card, .blocked-card { margin-top: 20px; border: 1px solid var(--app-border); border-radius: var(--app-radius-card); background: var(--app-surface-strong); }
.device-card { display: grid; grid-template-columns: 44px 1fr auto; align-items: center; gap: 12px; padding: 16px; }
.device-icon { display: grid; place-items: center; width: 44px; height: 44px; border-radius: 15px; background: var(--app-primary-soft); color: var(--app-primary); }
.device-title, .device-desc, .blocked-title, .blocked-desc { display: block; }
.device-title, .blocked-title { color: var(--app-text); font-size: var(--font-size-list-title); font-weight: var(--font-medium); }
.device-desc, .blocked-desc { margin-top: 4px; color: var(--app-text-secondary); font-size: var(--font-size-caption); line-height: var(--line-caption); }
.current-tag { padding: 4px 9px; border-radius: var(--app-radius-button); background: var(--app-primary-soft); color: var(--app-primary); font-size: var(--font-size-tag); }
.blocked-card { padding: 18px; }
button::after { border: 0; }
</style>
