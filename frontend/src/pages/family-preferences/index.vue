<template>
  <view class="family-taste-page">
    <view class="safe-top" aria-hidden="true" />
    <view class="page-header">
      <button class="icon-button" aria-label="返回" @tap="goBack">
        <app-icon name="arrow-left" size="28rpx" />
      </button>
      <text class="page-title">家庭口味</text>
      <view class="header-spacer" />
    </view>

    <view v-if="loading" class="state-panel" aria-busy="true">
      <text>正在加载家庭口味…</text>
    </view>
    <view v-else-if="loadError" class="state-panel state-panel--center">
      <text class="state-title">家庭口味暂时无法加载</text>
      <text class="state-description">{{ loadError }}</text>
      <button class="retry-button" @tap="loadFamily">重新加载</button>
    </view>
    <view v-else-if="!family" class="state-panel state-panel--center">
      <text class="state-title">没有找到这个家庭</text>
      <button class="retry-button" @tap="goBack">返回家庭管理</button>
    </view>

    <template v-else>
      <view class="family-summary">
        <view class="family-avatar" aria-hidden="true">
          <image v-if="family.avatar" class="family-avatar-image" :src="family.avatar" mode="aspectFill" />
          <text v-else>{{ family.name.slice(0, 1) }}</text>
        </view>
        <view class="family-summary-copy">
          <text class="family-name">{{ family.name }}</text>
          <text class="family-meta">{{ family.members.length }} 位成员共享的口味汇总</text>
        </view>
      </view>

      <view class="taste-tabs" role="tablist" aria-label="家庭口味分类">
        <button
          v-for="item in tabs"
          :key="item.key"
          :class="['taste-tab', { 'is-active': activeTab === item.key }]"
          role="tab"
          :aria-selected="activeTab === item.key"
          @tap="activeTab = item.key"
        >
          {{ item.label }} {{ item.items.length }}
        </button>
      </view>

      <view class="preference-content">
        <view v-if="activeItems.length" class="preference-tags" role="list">
          <view v-for="item in activeItems" :key="item" class="preference-tag" role="listitem">
            <text>{{ item }}</text>
          </view>
        </view>
        <view v-else class="empty-preferences">
          <text class="empty-title">暂无家庭{{ activeLabel }}</text>
          <text class="empty-description">成员将个人口味设为“家庭可见”后，会用于采购和做饭提醒。</text>
        </view>
      </view>

      <button class="personal-entry" @tap="goPersonalPreferences">
        <view>
          <text class="personal-entry-title">编辑我的口味</text>
          <text class="personal-entry-description">设置喜欢、忌口、过敏及是否共享给家庭</text>
        </view>
        <app-icon name="chevron-right" size="24rpx" />
      </button>

      <text class="data-note">家庭页只展示已共享的汇总；个人隐私项不会在这里出现。</text>
    </template>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import AppIcon from '../../components/app/app-icon.vue';
import { getFamilyById } from '../../services/family';
import type { FamilyProfile } from '../../types/family';

type TasteTab = 'avoid' | 'like' | 'allergy';

const familyId = ref('');
const family = ref<FamilyProfile | null>(null);
const loading = ref(false);
const loadError = ref('');
const activeTab = ref<TasteTab>('avoid');

const tabs = computed(() => [
  { key: 'avoid' as const, label: '忌口', items: family.value?.preferences?.avoidItems ?? [] },
  { key: 'like' as const, label: '喜欢', items: family.value?.preferences?.preferences ?? [] },
  { key: 'allergy' as const, label: '过敏', items: family.value?.preferences?.allergies ?? [] }
]);
const activeSection = computed(() => tabs.value.find((item) => item.key === activeTab.value) ?? tabs.value[0]);
const activeItems = computed(() => activeSection.value.items);
const activeLabel = computed(() => activeSection.value.label);

const goBack = () => uni.navigateBack({ fail: () => uni.redirectTo({ url: '/pages/family/index' }) });
const goPersonalPreferences = () => uni.navigateTo({ url: '/pages/personal-preferences/index' });

const loadFamily = async () => {
  loading.value = true;
  loadError.value = '';
  try {
    family.value = await getFamilyById(familyId.value);
  } catch (error) {
    family.value = null;
    loadError.value = error instanceof Error ? error.message : '请稍后再试';
  } finally {
    loading.value = false;
  }
};

onLoad((options) => {
  familyId.value = typeof options?.familyId === 'string' ? options.familyId : '';
  void loadFamily();
});
</script>

<style scoped lang="scss">
.family-taste-page {
  min-height: 100vh;
  padding: 0 var(--app-page-padding) 48px;
  background: var(--app-bg);
  color: var(--app-text);
}
.safe-top { height: calc(var(--app-safe-area-top) + 12px); }
.page-header { display: grid; grid-template-columns: 44px 1fr 44px; align-items: center; min-height: 44px; }
.icon-button, .taste-tab, .retry-button, .personal-entry { min-height: 44px; border: 0; }
.icon-button { display: grid; place-items: center; width: 44px; padding: 0; background: transparent; color: var(--app-text); }
.page-title { font-size: var(--font-size-list-title); font-weight: var(--font-semibold); line-height: var(--line-list-title); text-align: center; }
.family-summary { display: flex; align-items: center; gap: 14px; padding: 26px 4px 20px; }
.family-avatar { display: grid; flex: 0 0 56px; place-items: center; width: 56px; height: 56px; overflow: hidden; border: 1px solid var(--app-border); border-radius: 18px; background: var(--app-surface-strong); color: var(--app-primary); font-size: var(--font-size-section-title); font-weight: var(--font-medium); }
.family-avatar-image { width: 100%; height: 100%; }
.family-summary-copy, .family-name, .family-meta, .state-title, .state-description, .empty-title, .empty-description, .personal-entry-title, .personal-entry-description, .data-note { display: block; }
.family-summary-copy { min-width: 0; }
.family-name { font-size: var(--font-size-section-title); font-weight: var(--font-semibold); line-height: var(--line-section-title); }
.family-meta { margin-top: 3px; color: var(--app-text-secondary); font-size: var(--font-size-caption); line-height: var(--line-caption); }
.taste-tabs { display: grid; grid-template-columns: repeat(3, 1fr); border-bottom: 1px solid var(--app-border); }
.taste-tab { position: relative; padding: 0; background: transparent; color: var(--app-text-secondary); font-size: var(--font-size-body-sm); }
.taste-tab.is-active { color: var(--app-text); font-weight: var(--font-semibold); }
.taste-tab.is-active::after { position: absolute; right: 28%; bottom: 0; left: 28%; height: 2px; border-radius: 2px; background: var(--app-primary); content: ''; }
.preference-content { min-height: 152px; padding: 24px 2px; border-bottom: 1px solid var(--app-border); }
.preference-tags { display: flex; flex-wrap: wrap; gap: 10px; }
.preference-tag { min-height: 36px; padding: 8px 14px; border-radius: var(--app-radius-button); background: var(--app-primary-soft); color: var(--app-primary); font-size: var(--font-size-body-sm); line-height: var(--line-body-sm); }
.empty-preferences { padding: 24px 14px; text-align: center; }
.empty-title, .state-title { font-size: var(--font-size-list-title); font-weight: var(--font-medium); line-height: var(--line-list-title); }
.empty-description, .state-description { margin-top: 6px; color: var(--app-text-secondary); font-size: var(--font-size-caption); line-height: var(--line-caption); }
.personal-entry { display: flex; align-items: center; justify-content: space-between; width: 100%; margin-top: 18px; padding: 12px 2px; background: transparent; color: var(--app-text); text-align: left; }
.personal-entry-title { font-size: var(--font-size-list-title); font-weight: var(--font-medium); line-height: var(--line-list-title); }
.personal-entry-description { margin-top: 2px; color: var(--app-text-secondary); font-size: var(--font-size-caption); line-height: var(--line-caption); }
.data-note { margin-top: 18px; color: var(--app-text-tertiary); font-size: var(--font-size-caption); line-height: var(--line-caption); text-align: center; }
.state-panel { margin-top: 24px; padding: 22px 4px; color: var(--app-text-secondary); }
.state-panel--center { text-align: center; }
.retry-button { margin-top: 16px; padding: 0 18px; border-radius: var(--app-radius-button); background: var(--app-primary-soft); color: var(--app-primary); font-size: var(--font-size-body-sm); }
button::after { border: 0; }
</style>
