<template>
  <view class="preferences-page">
    <view class="safe-top" aria-hidden="true" />
    <view class="page-header">
      <button class="icon-button" aria-label="返回" @tap="goBack">
        <app-icon name="arrow-left" size="28rpx" />
      </button>
      <text class="page-title">个人口味</text>
      <button class="save-button" :disabled="loading || saving" @tap="save">
        {{ saving ? '保存中' : '保存' }}
      </button>
    </view>

    <view v-if="loading" class="state-card" aria-busy="true">
      <text>正在加载个人口味…</text>
    </view>
    <view v-else-if="error" class="state-card">
      <text class="state-title">加载失败</text>
      <text class="state-desc">{{ error }}</text>
      <button class="retry-button" @tap="loadPreferences">重新加载</button>
    </view>
    <template v-else>
      <view class="intro-card">
        <text class="intro-title">用于采购和做饭提醒</text>
        <text class="intro-desc">喜欢、忌口和过敏分别记录；每一项都能选择是否共享给家庭。</text>
      </view>

      <view class="kind-tabs" role="tablist">
        <button
          v-for="option in kindOptions"
          :key="option.value"
          :class="['kind-tab', { 'is-active': activeKind === option.value }]"
          @tap="activeKind = option.value"
        >{{ option.label }}</button>
      </view>

      <view class="add-row">
        <input v-model="newValue" class="preference-input" :placeholder="activePlaceholder" maxlength="20" />
        <button class="add-button" :disabled="!newValue.trim()" @tap="addItem">添加</button>
      </view>

      <view v-if="activeItems.length" class="preference-list">
        <view v-for="item in activeItems" :key="item.localId" class="preference-row">
          <view class="preference-copy">
            <text class="preference-name">{{ item.value }}</text>
            <button class="scope-button" @tap="toggleScope(item)">
              <app-icon :name="item.shareScope === 'FAMILY' ? 'users' : 'lock-simple'" size="16rpx" />
              <text>{{ item.shareScope === 'FAMILY' ? '家庭可见' : '仅自己' }}</text>
            </button>
          </view>
          <button class="delete-button" :aria-label="`删除${item.value}`" @tap="removeItem(item.localId)">
            <app-icon name="close" size="20rpx" />
          </button>
        </view>
      </view>
      <view v-else class="state-card state-card--empty">
        <text class="state-title">还没有{{ activeKindLabel }}</text>
        <text class="state-desc">在上方输入后添加，保存才会同步到账号。</text>
      </view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import AppIcon from '../../components/app/app-icon.vue';
import { loadAuthUser } from '../../services/auth';
import {
  listMobileUserPreferences,
  replaceMobileUserPreferences,
  type ApiUserPreference
} from '../../services/public-api';

type PreferenceKind = ApiUserPreference['kind'];
type DraftPreference = Pick<ApiUserPreference, 'kind' | 'value' | 'shareScope'> & { localId: string };

const kindOptions: Array<{ value: PreferenceKind; label: string; placeholder: string }> = [
  { value: 'LIKE', label: '喜欢', placeholder: '例如：番茄、清淡口味' },
  { value: 'AVOID', label: '忌口', placeholder: '例如：香菜、肥肉' },
  { value: 'ALLERGY', label: '过敏', placeholder: '例如：花生、虾蟹' }
];
const items = ref<DraftPreference[]>([]);
const activeKind = ref<PreferenceKind>('LIKE');
const newValue = ref('');
const loading = ref(false);
const saving = ref(false);
const error = ref('');
const activeItems = computed(() => items.value.filter((item) => item.kind === activeKind.value));
const activeOption = computed(() => kindOptions.find((item) => item.value === activeKind.value) ?? kindOptions[0]);
const activePlaceholder = computed(() => activeOption.value.placeholder);
const activeKindLabel = computed(() => activeOption.value.label);

const goBack = () => uni.navigateBack({ fail: () => uni.reLaunch({ url: '/pages/privacy-sharing/index' }) });
const loadPreferences = async () => {
  if (!loadAuthUser()) {
    uni.navigateTo({ url: '/pages/login/index' });
    return;
  }
  loading.value = true;
  error.value = '';
  try {
    const data = await listMobileUserPreferences();
    items.value = data.map((item) => ({
      kind: item.kind,
      value: item.value,
      shareScope: item.shareScope,
      localId: String(item.id)
    }));
  } catch (err) {
    error.value = err instanceof Error ? err.message : '请稍后再试';
  } finally {
    loading.value = false;
  }
};
const addItem = () => {
  const value = newValue.value.trim();
  if (!value) return;
  if (items.value.some((item) => item.kind === activeKind.value && item.value === value)) {
    uni.showToast({ title: '这项已经添加', icon: 'none' });
    return;
  }
  items.value.push({ kind: activeKind.value, value, shareScope: 'PRIVATE', localId: `new-${Date.now()}` });
  newValue.value = '';
};
const removeItem = (localId: string) => {
  items.value = items.value.filter((item) => item.localId !== localId);
};
const toggleScope = (item: DraftPreference) => {
  item.shareScope = item.shareScope === 'FAMILY' ? 'PRIVATE' : 'FAMILY';
};
const save = async () => {
  if (saving.value) return;
  saving.value = true;
  try {
    const saved = await replaceMobileUserPreferences(
      items.value.map(({ kind, value, shareScope }) => ({ kind, value, shareScope }))
    );
    items.value = saved.map((item) => ({ ...item, localId: String(item.id) }));
    uni.showToast({ title: '已保存', icon: 'success' });
  } catch (err) {
    uni.showToast({ title: err instanceof Error ? err.message : '保存失败，请重试', icon: 'none' });
  } finally {
    saving.value = false;
  }
};

onShow(() => void loadPreferences());
</script>

<style scoped lang="scss">
.preferences-page { min-height: 100vh; padding: 0 16px 48px; background: var(--app-bg); }
.safe-top { height: calc(var(--app-safe-area-top) + 12px); }
.page-header { display: grid; grid-template-columns: 44px 1fr 64px; align-items: center; min-height: 44px; }
.page-title { color: var(--app-text); font-size: var(--font-size-body); font-weight: var(--font-semibold); text-align: center; }
.icon-button, .save-button, .kind-tab, .add-button, .scope-button, .delete-button, .retry-button { min-height: 44px; border: 0; }
.icon-button { display: grid; place-items: center; width: 44px; padding: 0; background: transparent; color: var(--app-text); }
.save-button { background: transparent; color: var(--app-primary); font-size: var(--font-size-body-sm); }
.intro-card, .preference-list, .state-card { margin-top: 20px; border: 1px solid var(--app-border); border-radius: var(--app-radius-card); background: var(--app-surface-strong); }
.intro-card, .state-card { padding: 18px; }
.intro-title, .intro-desc, .preference-name, .state-title, .state-desc { display: block; }
.intro-title, .preference-name, .state-title { color: var(--app-text); font-size: var(--font-size-list-title); font-weight: var(--font-medium); line-height: var(--line-list-title); }
.intro-desc, .state-desc { margin-top: 5px; color: var(--app-text-secondary); font-size: var(--font-size-caption); line-height: var(--line-caption); }
.kind-tabs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 18px; }
.kind-tab { border-radius: var(--app-radius-button); background: var(--app-surface-strong); color: var(--app-text-secondary); font-size: var(--font-size-body-sm); }
.kind-tab.is-active { background: var(--app-primary); color: var(--text-white); }
.add-row { display: grid; grid-template-columns: 1fr 64px; gap: 10px; margin-top: 14px; }
.preference-input { height: 44px; padding: 0 14px; border-radius: var(--app-radius-button); background: var(--app-surface-strong); color: var(--app-text); font-size: var(--font-size-body-sm); }
.add-button, .retry-button { border-radius: var(--app-radius-button); background: var(--app-primary-soft); color: var(--app-primary); font-size: var(--font-size-body-sm); }
.preference-list { overflow: hidden; }
.preference-row { display: grid; grid-template-columns: 1fr 44px; align-items: center; min-height: 72px; padding: 10px 10px 10px 16px; border-bottom: 1px solid var(--app-border); }
.preference-row:last-child { border-bottom: 0; }
.scope-button { display: inline-flex; align-items: center; gap: 5px; min-height: 32px; margin-top: 3px; padding: 0; background: transparent; color: var(--app-primary); font-size: var(--font-size-caption); }
.delete-button { display: grid; place-items: center; width: 44px; padding: 0; background: transparent; color: var(--app-text-tertiary); }
.state-card--empty { text-align: center; }
.retry-button { margin-top: 14px; padding: 0 18px; }
button::after { border: 0; }
</style>
