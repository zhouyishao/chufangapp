<template>
  <view class="blocked-page">
    <view class="safe-top" aria-hidden="true" />
    <view class="page-header">
      <button class="icon-button" aria-label="返回" @tap="goBack"><app-icon name="arrow-left" size="28rpx" /></button>
      <text class="page-title">注销账号</text><view />
    </view>
    <view class="warning-card">
      <text class="warning-title">注销能力尚未开放</text>
      <text class="warning-desc">服务端暂未提供账号注销接口，因此当前无法提交注销申请，也不会显示虚假的完成状态。</text>
    </view>
    <view class="detail-card">
      <text class="detail-title">正式开放后需要处理</text>
      <text class="detail-row">· 退出所有登录设备</text>
      <text class="detail-row">· 解除家庭身份与共享关系</text>
      <text class="detail-row">· 按隐私政策处理个人资料与个人资产</text>
    </view>
    <button class="disabled-action" disabled>暂不可注销</button>
    <button class="legal-link" @tap="goPrivacy">查看隐私政策</button>
  </view>
</template>
<script setup lang="ts">
import AppIcon from '../../components/app/app-icon.vue';
const goBack = () => uni.navigateBack({ fail: () => uni.reLaunch({ url: '/pages/account-security/index' }) });
const goPrivacy = () => uni.navigateTo({ url: '/pages/legal/index?type=privacy' });
</script>
<style scoped lang="scss">
.blocked-page { min-height: 100vh; padding: 0 16px 48px; background: var(--app-bg); }
.safe-top { height: calc(var(--app-safe-area-top) + 12px); }
.page-header { display: grid; grid-template-columns: 44px 1fr 44px; align-items: center; min-height: 44px; }
.page-title { color: var(--app-text); font-size: var(--font-size-body); font-weight: var(--font-semibold); text-align: center; }
.icon-button { display: grid; place-items: center; width: 44px; height: 44px; padding: 0; border: 0; background: transparent; color: var(--app-text); }
.warning-card, .detail-card { margin-top: 20px; padding: 18px; border: 1px solid var(--app-border); border-radius: var(--app-radius-card); background: var(--app-surface-strong); }
.warning-title, .warning-desc, .detail-title, .detail-row { display: block; }
.warning-title, .detail-title { color: var(--app-text); font-size: var(--font-size-list-title); font-weight: var(--font-medium); }
.warning-desc, .detail-row { margin-top: 7px; color: var(--app-text-secondary); font-size: var(--font-size-body-sm); line-height: var(--line-body); }
.disabled-action, .legal-link { width: 100%; min-height: 48px; margin-top: 20px; border: 0; border-radius: var(--app-radius-button); font-size: var(--font-size-body-sm); }
.disabled-action { background: var(--app-muted); color: var(--app-text-tertiary); }
.legal-link { margin-top: 8px; background: transparent; color: var(--app-primary); }
button::after { border: 0; }
</style>
