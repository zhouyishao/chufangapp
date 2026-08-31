<template>
  <view class="app-page legal-page">
    <view class="safe-top-spacer" aria-hidden="true" />
    <view class="page-header">
      <button class="icon-button" aria-label="返回" @tap="goBack"><app-icon name="arrow-left" size="28rpx" /></button>
      <text class="page-title">{{ title }}</text>
      <view />
    </view>
    <view class="document">
      <template v-if="type === 'privacy'">
        <text class="document-title">隐私政策</text>
        <text class="paragraph">我们仅在提供账号、家庭、菜篮、收藏和内容服务所必需的范围内处理你的信息。</text>
        <text class="heading">你可以控制的共享</text>
        <text class="paragraph">喜欢、忌口、过敏和个人菜谱是否共享给家庭，由你在应用内逐项选择。</text>
        <text class="heading">媒体与账号数据</text>
        <text class="paragraph">头像、家庭头像及菜谱媒体仅用于对应功能。退出账号不会删除云端数据；删除账号能力上线前不会伪装成已支持。</text>
      </template>
      <template v-else>
        <text class="document-title">服务协议</text>
        <text class="paragraph">“家里有菜”为家庭提供菜谱、食材知识、菜篮和制作引导服务。</text>
        <text class="heading">内容与参考信息</text>
        <text class="paragraph">时令和价格信息仅作参考，实际价格、食材状态与健康需求请以当地情况和专业意见为准。</text>
        <text class="heading">账号使用</text>
        <text class="paragraph">请妥善保管登录信息，不得利用本服务上传违法、侵权或误导性内容。</text>
      </template>
      <text class="updated-at">更新日期：2026年7月</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import AppIcon from '../../components/app/app-icon.vue';
const type = ref<'terms' | 'privacy'>('terms');
const title = computed(() => type.value === 'privacy' ? '隐私政策' : '服务协议');
const goBack = () => uni.navigateBack({ fail: () => uni.reLaunch({ url: '/pages/about/index' }) });
onLoad((query) => { type.value = query?.type === 'privacy' ? 'privacy' : 'terms'; });
</script>

<style scoped lang="scss">
.legal-page { min-height: 100vh; padding: 0 20px 48px; background: var(--app-bg); }
.safe-top-spacer { height: calc(var(--app-safe-area-top) + 12px); }
.page-header { display: grid; grid-template-columns: 44px 1fr 44px; align-items: center; min-height: 44px; }
.page-title { color: var(--app-text); font-size: var(--font-size-body); font-weight: var(--font-semibold); text-align: center; }
.icon-button { display: grid; place-items: center; width: 44px; height: 44px; padding: 0; border: 0; background: transparent; color: var(--app-text); }
.document { margin-top: 28px; }
.document-title, .heading, .paragraph, .updated-at { display: block; }
.document-title { color: var(--app-text); font-size: var(--font-size-page-title); font-weight: var(--font-semibold); line-height: var(--line-page-title); }
.heading { margin-top: 28px; color: var(--app-text); font-size: var(--font-size-section-title); font-weight: var(--font-semibold); line-height: var(--line-section-title); }
.paragraph { margin-top: 10px; color: var(--app-text-secondary); font-size: var(--font-size-body-sm); line-height: var(--line-body); }
.updated-at { margin-top: 36px; color: var(--app-text-tertiary); font-size: var(--font-size-caption); }
button::after { border: 0; }
</style>
