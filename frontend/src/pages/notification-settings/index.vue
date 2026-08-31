<template>
  <view class="app-page secondary-page">
    <view class="safe-top-spacer" aria-hidden="true" />
    <view class="page-header">
      <button class="icon-button" aria-label="返回" @tap="goBack"><app-icon name="arrow-left" size="28rpx" /></button>
      <text class="page-title">消息与提醒</text>
      <view />
    </view>

    <view class="section-list">
      <button class="list-row" @tap="goGathering">
        <view>
          <text class="row-title">家庭聚餐与开饭提醒</text>
          <text class="row-desc">聚餐准备完成后通知当前家庭成员</text>
        </view>
        <app-icon name="chevron-right" size="22rpx" />
      </button>
      <button class="list-row" @tap="goMessages">
        <view>
          <text class="row-title">消息中心</text>
          <text class="row-desc">查看家庭开饭提醒和产品通知</text>
        </view>
        <app-icon name="chevron-right" size="22rpx" />
      </button>
      <button class="list-row" @tap="openSystemSettings">
        <view>
          <text class="row-title">系统通知权限</text>
          <text class="row-desc">前往系统设置开启或关闭通知</text>
        </view>
        <app-icon name="chevron-right" size="22rpx" />
      </button>
    </view>
    <text class="page-note">家庭管理员发送“开饭了”后，已加入该家庭的成员会在消息中心收到提醒。</text>
  </view>
</template>

<script setup lang="ts">
import AppIcon from '../../components/app/app-icon.vue';
const goBack = () => uni.navigateBack({ fail: () => uni.reLaunch({ url: '/pages/mine/index' }) });
const goGathering = () => uni.navigateTo({ url: '/pages/family-gathering/index' });
const goMessages = () => uni.navigateTo({ url: '/pages/notifications/index' });
const openSystemSettings = () => {
  const api = (uni as unknown as { openAppAuthorizeSetting?: (options: { fail?: () => void }) => void }).openAppAuthorizeSetting;
  if (api) {
    api({ fail: () => uni.showToast({ title: '请在系统设置中管理通知权限', icon: 'none' }) });
    return;
  }
  uni.showToast({ title: '请在系统设置中管理通知权限', icon: 'none' });
};
</script>

<style scoped lang="scss">
.secondary-page { min-height: 100vh; padding: 0 16px 40px; background: var(--app-bg); }
.safe-top-spacer { height: calc(var(--app-safe-area-top) + 12px); }
.page-header { display: grid; grid-template-columns: 44px 1fr 44px; align-items: center; min-height: 44px; }
.page-title { color: var(--app-text); font-size: var(--font-size-body); font-weight: var(--font-semibold); text-align: center; }
.icon-button { display: grid; place-items: center; width: 44px; height: 44px; padding: 0; border: 0; background: transparent; color: var(--app-text); }
.section-list { overflow: hidden; margin-top: 24px; border: 1px solid var(--app-border); border-radius: var(--app-radius-card); background: var(--app-surface-strong); }
.list-row { display: grid; grid-template-columns: 1fr 24px; align-items: center; width: 100%; min-height: 72px; padding: 12px 16px; border: 0; border-bottom: 1px solid var(--app-border); background: transparent; text-align: left; }
.list-row:last-child { border-bottom: 0; }
.row-title, .row-desc { display: block; }
.row-title { color: var(--app-text); font-size: var(--font-size-list-title); font-weight: var(--font-medium); }
.row-desc, .page-note { color: var(--app-text-secondary); font-size: var(--font-size-caption); line-height: var(--line-caption); }
.row-desc { margin-top: 3px; }
.page-note { display: block; margin: 14px 8px 0; }
button::after { border: 0; }
</style>
