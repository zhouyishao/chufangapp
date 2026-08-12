<template>
  <view class="app-page detail-page">
    <view class="safe-top-spacer" aria-hidden="true" />
    <view class="page-header">
      <button class="icon-button" aria-label="返回" @tap="goBack"><app-icon name="arrow-left" size="28rpx" /></button>
      <text class="page-title">采购详情</text>
      <view />
    </view>

    <view v-if="loading" class="state-card"><text>正在加载采购详情…</text></view>
    <view v-else-if="error" class="state-card">
      <text class="state-title">采购详情加载失败</text>
      <text class="state-desc">{{ error }}</text>
      <button class="retry-button" @tap="loadDetail">重新加载</button>
    </view>
    <view v-else-if="!items.length" class="state-card">
      <text class="state-title">没有找到这次采购记录</text>
      <text class="state-desc">记录可能已被清理，返回采购记录查看其他日期。</text>
    </view>
    <template v-else>
      <view class="purchase-summary">
        <text class="purchase-date">{{ dateLabel }}</text>
        <text class="purchase-meta">{{ items.length }} 项 · {{ familyNames }}</text>
      </view>
      <view class="item-list">
        <view v-for="item in items" :key="item.id" class="item-row">
          <view>
            <text class="item-name">{{ item.name }}</text>
            <text class="item-source">{{ item.recipeName || '单独加入' }}</text>
          </view>
          <text class="item-amount">{{ item.amountText || item.quantity }}</text>
        </view>
      </view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import AppIcon from '../../components/app/app-icon.vue';
import { loadBasketItems, type BasketItem } from '../../services/basket';

const dateKey = ref('');
const items = ref<BasketItem[]>([]);
const loading = ref(false);
const error = ref('');
const familyNames = computed(() => {
  const names = Array.from(new Set(items.value.map((item) => item.familyName).filter(Boolean)));
  return names.length ? names.join('、') : '未绑定家庭';
});
const dateLabel = computed(() => {
  const date = new Date(`${dateKey.value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '采购记录';
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
});
const toDateKey = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};
const goBack = () => uni.navigateBack({ fail: () => uni.reLaunch({ url: '/pages/purchase-history/index' }) });
const loadDetail = async () => {
  loading.value = true;
  error.value = '';
  try {
    const data = await loadBasketItems(null);
    items.value = data.filter((item) => item.checked && toDateKey(item.checkedAt || item.updatedAt || item.createdAt) === dateKey.value);
  } catch (err) {
    error.value = err instanceof Error ? err.message : '请稍后再试';
  } finally {
    loading.value = false;
  }
};
onLoad((query) => {
  dateKey.value = decodeURIComponent(query?.date || '');
  void loadDetail();
});
</script>

<style scoped lang="scss">
.detail-page { min-height: 100vh; padding: 0 16px 40px; background: var(--app-bg); }
.safe-top-spacer { height: calc(var(--app-safe-area-top) + 12px); }
.page-header { display: grid; grid-template-columns: 44px 1fr 44px; align-items: center; min-height: 44px; }
.page-title { color: var(--app-text); font-size: var(--font-size-body); font-weight: var(--font-semibold); text-align: center; }
.icon-button { display: grid; place-items: center; width: 44px; height: 44px; padding: 0; border: 0; background: transparent; color: var(--app-text); }
.purchase-summary { margin-top: 26px; padding: 0 4px 16px; }
.purchase-date, .purchase-meta, .item-name, .item-source, .item-amount, .state-title, .state-desc { display: block; }
.purchase-date { color: var(--app-text); font-size: var(--font-size-detail-title); font-weight: var(--font-semibold); }
.purchase-meta, .item-source, .state-desc { margin-top: 4px; color: var(--app-text-secondary); font-size: var(--font-size-caption); line-height: var(--line-caption); }
.item-list { overflow: hidden; border: 1px solid var(--app-border); border-radius: var(--app-radius-card); background: var(--app-surface-strong); }
.item-row { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 16px; min-height: 70px; padding: 12px 16px; border-bottom: 1px solid var(--app-border); }
.item-row:last-child { border-bottom: 0; }
.item-name { color: var(--app-text); font-size: var(--font-size-list-title); font-weight: var(--font-medium); }
.item-amount { color: var(--app-text-secondary); font-size: var(--font-size-body-sm); }
.state-card { margin-top: 24px; padding: 20px; border-radius: var(--app-radius-card); background: var(--app-surface-strong); color: var(--app-text-secondary); }
.state-title { color: var(--app-text); font-size: var(--font-size-card-title); font-weight: var(--font-semibold); }
.retry-button { width: 100%; min-height: 44px; margin-top: 16px; border: 0; border-radius: var(--app-radius-button); background: var(--app-primary); color: var(--text-white); }
button::after { border: 0; }
</style>
