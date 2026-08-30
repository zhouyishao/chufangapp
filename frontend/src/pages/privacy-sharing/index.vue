<template>
  <view class="app-page privacy-page">
    <view class="safe-top-spacer" aria-hidden="true" />
    <view class="page-header">
      <button class="icon-button" aria-label="返回" @tap="goBack">
        <app-icon name="arrow-left" size="28rpx" />
      </button>
      <text class="page-title">隐私与家庭共享</text>
      <view class="header-spacer" />
    </view>

    <view v-if="loading" class="state-card" aria-busy="true">
      <text>正在同步共享设置…</text>
    </view>
    <view v-else-if="error" class="state-card">
      <text class="state-title">共享设置暂时无法加载</text>
      <text class="state-desc">{{ error }}</text>
      <button class="primary-button" @tap="loadSummary">重新加载</button>
    </view>
    <template v-else>
      <button class="sharing-summary" @tap="goPreferences">
        <view class="summary-icon"><app-icon name="users" size="30rpx" /></view>
        <view class="summary-copy">
          <text class="summary-title">{{ sharedCount ? `已向家庭共享 ${sharedCount} 项口味信息` : '还没有共享口味信息' }}</text>
          <text class="summary-desc">{{ privateCount }} 项仅自己可见</text>
        </view>
        <app-icon name="chevron-right" size="22rpx" />
      </button>

      <view class="section-list">
        <button class="list-row" @tap="goPreferences">
          <view>
            <text class="row-title">喜欢、忌口与过敏</text>
            <text class="row-desc">每个标签都可以单独设置共享范围</text>
          </view>
          <app-icon name="chevron-right" size="22rpx" />
        </button>
        <button class="list-row" @tap="goMyRecipes">
          <view>
            <text class="row-title">个人菜谱</text>
            <text class="row-desc">在每道菜谱中选择仅自己或家庭可见</text>
          </view>
          <app-icon name="chevron-right" size="22rpx" />
        </button>
        <button class="list-row" @tap="goProfile">
          <view>
            <text class="row-title">个人资料</text>
            <text class="row-desc">头像和昵称默认只用于识别你的账号</text>
          </view>
          <app-icon name="chevron-right" size="22rpx" />
        </button>
      </view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import AppIcon from '../../components/app/app-icon.vue';
import { loadAuthUser } from '../../services/auth';
import { listMobileUserPreferences, type ApiUserPreference } from '../../services/public-api';

const items = ref<ApiUserPreference[]>([]);
const loading = ref(false);
const error = ref('');
const sharedCount = computed(() => items.value.filter((item) => item.shareScope === 'FAMILY').length);
const privateCount = computed(() => items.value.filter((item) => item.shareScope === 'PRIVATE').length);

const goBack = () => uni.navigateBack({ fail: () => uni.reLaunch({ url: '/pages/mine/index' }) });
const goPreferences = () => uni.navigateTo({ url: '/pages/personal-preferences/index' });
const goMyRecipes = () => uni.navigateTo({ url: '/pages/my-recipes/index' });
const goProfile = () => uni.navigateTo({ url: '/pages/profile-edit/index' });

const loadSummary = async () => {
  if (!loadAuthUser()) {
    uni.navigateTo({ url: '/pages/login/index' });
    return;
  }
  loading.value = true;
  error.value = '';
  try {
    items.value = await listMobileUserPreferences();
  } catch (err) {
    error.value = err instanceof Error ? err.message : '请稍后再试';
  } finally {
    loading.value = false;
  }
};

onShow(() => void loadSummary());
</script>

<style scoped lang="scss">
.privacy-page {
  min-height: 100vh;
  padding: 0 16px 40px;
  background: var(--app-bg);
}
.safe-top-spacer { height: calc(var(--app-safe-area-top) + 12px); }
.page-header { display: grid; grid-template-columns: 44px 1fr 44px; align-items: center; min-height: 44px; }
.page-title { color: var(--app-text); font-size: var(--font-size-body); font-weight: var(--font-semibold); text-align: center; }
.icon-button { display: grid; place-items: center; width: 44px; height: 44px; padding: 0; border: 0; background: transparent; color: var(--app-text); }
.sharing-summary, .section-list { margin-top: 24px; border-radius: var(--app-radius-card); background: var(--app-surface-strong); }
.sharing-summary { display: grid; grid-template-columns: 40px 1fr 24px; align-items: center; gap: 12px; width: 100%; min-height: 78px; padding: 14px 16px; border: 1px solid var(--app-border); text-align: left; }
.summary-icon { display: grid; place-items: center; width: 40px; height: 40px; border-radius: 14px; background: var(--app-primary-soft); color: var(--app-primary); }
.summary-title, .summary-desc, .row-title, .row-desc, .state-title, .state-desc { display: block; }
.summary-title, .row-title { color: var(--app-text); font-size: var(--font-size-list-title); font-weight: var(--font-medium); line-height: var(--line-list-title); }
.summary-desc, .row-desc, .state-desc { margin-top: 3px; color: var(--app-text-secondary); font-size: var(--font-size-caption); line-height: var(--line-caption); }
.section-list { overflow: hidden; border: 1px solid var(--app-border); }
.list-row { display: grid; grid-template-columns: 1fr 24px; align-items: center; gap: 12px; width: 100%; min-height: 76px; padding: 12px 16px; border: 0; border-bottom: 1px solid var(--app-border); background: transparent; text-align: left; }
.list-row:last-child { border-bottom: 0; }
.state-card { margin-top: 24px; padding: 20px; border-radius: var(--app-radius-card); background: var(--app-surface-strong); color: var(--app-text-secondary); }
.state-title { color: var(--app-text); font-size: var(--font-size-card-title); font-weight: var(--font-semibold); }
.primary-button { width: 100%; min-height: 44px; margin-top: 16px; border: 0; border-radius: var(--app-radius-button); background: var(--app-primary); color: var(--text-white); }
button::after { border: 0; }
</style>
