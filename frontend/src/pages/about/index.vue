<template>
  <view class="app-page secondary-page">
    <view class="safe-top-spacer" aria-hidden="true" />
    <view class="page-header">
      <button class="icon-button" aria-label="返回" @tap="goBack"><app-icon name="arrow-left" size="28rpx" /></button>
      <text class="page-title">关于产品</text>
      <view />
    </view>

    <view class="brand-block">
      <view class="brand-mark"><app-icon name="bowl-food" size="44rpx" /></view>
      <text class="brand-name">家里有菜</text>
      <text class="brand-copy">认真吃饭，也认真生活</text>
      <text class="version">当前版本 · MVP</text>
    </view>

    <view class="section-list">
      <button class="list-row" @tap="goLegal('terms')">
        <text>服务协议</text><app-icon name="chevron-right" size="22rpx" />
      </button>
      <button class="list-row" @tap="goLegal('privacy')">
        <text>隐私政策</text><app-icon name="chevron-right" size="22rpx" />
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import AppIcon from '../../components/app/app-icon.vue';
const goBack = () => uni.navigateBack({ fail: () => uni.reLaunch({ url: '/pages/mine/index' }) });
const goLegal = (type: 'terms' | 'privacy') => uni.navigateTo({ url: `/pages/legal/index?type=${type}` });
</script>

<style scoped lang="scss">
.secondary-page { min-height: 100vh; padding: 0 16px 40px; background: var(--app-bg); }
.safe-top-spacer { height: calc(var(--app-safe-area-top) + 12px); }
.page-header { display: grid; grid-template-columns: 44px 1fr 44px; align-items: center; min-height: 44px; }
.page-title { color: var(--app-text); font-size: var(--font-size-body); font-weight: var(--font-semibold); text-align: center; }
.icon-button { display: grid; place-items: center; width: 44px; height: 44px; padding: 0; border: 0; background: transparent; color: var(--app-text); }
.brand-block { display: flex; flex-direction: column; align-items: center; padding: 46px 16px 34px; text-align: center; }
.brand-mark { display: grid; place-items: center; width: 68px; height: 68px; border-radius: 24px; background: var(--app-primary); color: var(--text-white); }
.brand-name { margin-top: 16px; color: var(--app-text); font-size: var(--font-size-page-title); font-weight: var(--font-semibold); }
.brand-copy, .version { color: var(--app-text-secondary); font-size: var(--font-size-caption); line-height: var(--line-caption); }
.brand-copy { margin-top: 6px; }
.version { margin-top: 12px; }
.section-list { overflow: hidden; border: 1px solid var(--app-border); border-radius: var(--app-radius-card); background: var(--app-surface-strong); }
.list-row { display: grid; grid-template-columns: 1fr 24px; align-items: center; width: 100%; min-height: 60px; padding: 0 16px; border: 0; border-bottom: 1px solid var(--app-border); background: transparent; color: var(--app-text); font-size: var(--font-size-list-title); text-align: left; }
.list-row:last-child { border-bottom: 0; }
button::after { border: 0; }
</style>
