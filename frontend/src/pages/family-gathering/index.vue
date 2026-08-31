<template>
  <view class="app-page gathering-page">
    <view class="safe-top-spacer" aria-hidden="true" />
    <view class="page-header">
      <button class="icon-button" aria-label="返回" @tap="goBack"><app-icon name="arrow-left" size="28rpx" /></button>
      <text class="page-title">家庭聚餐</text>
      <view />
    </view>

    <view v-if="loading" class="state-card"><text>正在加载家庭…</text></view>
    <view v-else-if="error" class="state-card">
      <text class="state-title">家庭信息加载失败</text>
      <text class="state-desc">{{ error }}</text>
      <button class="primary-button" @tap="loadPage">重新加载</button>
    </view>
    <view v-else-if="!families.length" class="state-card">
      <text class="state-title">先加入一个家庭</text>
      <text class="state-desc">开饭提醒只会发送给当前家庭中的成员。</text>
      <button class="primary-button" @tap="goFamilies">管理家庭</button>
    </view>
    <template v-else>
      <view class="family-select">
        <text class="field-label">发送到</text>
        <picker :range="familyNames" :value="selectedIndex" @change="changeFamily">
          <view class="picker-value">
            <text>{{ selectedFamily?.name }}</text>
            <app-icon name="chevron-down" size="20rpx" />
          </view>
        </picker>
      </view>

      <view class="form-card">
        <label class="field">
          <text class="field-label">提醒标题</text>
          <input v-model="title" class="field-input" maxlength="20" placeholder="开饭了" />
        </label>
        <label class="field">
          <text class="field-label">给家人的话</text>
          <textarea v-model="body" class="field-textarea" maxlength="80" placeholder="饭菜已经准备好，大家来吃饭吧。" />
        </label>
      </view>

      <view class="preference-note">
        <view class="preference-note__copy">
          <app-icon name="users" size="26rpx" />
          <text>{{ selectedFamily?.members.length || 0 }} 位成员会收到这条家庭提醒</text>
        </view>
        <button class="preference-link" @tap="goPreferences">查看家庭口味</button>
      </view>

      <button class="send-button" :disabled="sending" @tap="sendReminder">
        {{ sending ? '正在发送…' : '发送“开饭了”提醒' }}
      </button>
    </template>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import AppIcon from '../../components/app/app-icon.vue';
import { loadActiveFamilyId, loadFamilies, saveActiveFamilyId } from '../../services/family';
import { sendMobileMealReady } from '../../services/public-api';
import type { FamilyProfile } from '../../types/family';

const families = ref<FamilyProfile[]>([]);
const selectedIndex = ref(0);
const loading = ref(false);
const sending = ref(false);
const error = ref('');
const title = ref('开饭了');
const body = ref('饭菜已经准备好，大家来吃饭吧。');
const familyNames = computed(() => families.value.map((family) => family.name));
const selectedFamily = computed(() => families.value[selectedIndex.value] || null);
const goBack = () => uni.navigateBack({ fail: () => uni.reLaunch({ url: '/pages/notifications/index' }) });
const goFamilies = () => uni.navigateTo({ url: '/pages/family/index' });
const goPreferences = () => {
  if (!selectedFamily.value) return;
  uni.navigateTo({
    url: `/pages/family-preferences/index?familyId=${encodeURIComponent(selectedFamily.value.id)}`
  });
};
const changeFamily = (event: Event) => {
  const index = Number((event as unknown as { detail?: { value?: number | string } }).detail?.value || 0);
  selectedIndex.value = index;
  if (families.value[index]) saveActiveFamilyId(families.value[index].id);
};
const loadPage = async () => {
  loading.value = true;
  error.value = '';
  try {
    families.value = await loadFamilies();
    const activeId = loadActiveFamilyId();
    const index = families.value.findIndex((family) => family.id === activeId);
    selectedIndex.value = index >= 0 ? index : 0;
  } catch (err) {
    error.value = err instanceof Error ? err.message : '请稍后再试';
  } finally {
    loading.value = false;
  }
};
const sendReminder = async () => {
  if (!selectedFamily.value || sending.value) return;
  sending.value = true;
  try {
    await sendMobileMealReady(Number(selectedFamily.value.id), {
      idempotencyKey: `${selectedFamily.value.id}-${Date.now()}`,
      title: title.value.trim() || '开饭了',
      body: body.value.trim() || '饭菜已经准备好，大家来吃饭吧。'
    });
    uni.showToast({ title: '已通知家人', icon: 'success' });
    setTimeout(goBack, 800);
  } catch (err) {
    uni.showToast({ title: err instanceof Error ? err.message : '发送失败，请重试', icon: 'none' });
  } finally {
    sending.value = false;
  }
};
onShow(() => void loadPage());
</script>

<style scoped lang="scss">
.gathering-page { min-height: 100vh; padding: 0 16px 40px; background: var(--app-bg); }
.safe-top-spacer { height: calc(var(--app-safe-area-top) + 12px); }
.page-header { display: grid; grid-template-columns: 44px 1fr 44px; align-items: center; min-height: 44px; }
.page-title { color: var(--app-text); font-size: var(--font-size-body); font-weight: var(--font-semibold); text-align: center; }
.icon-button { display: grid; place-items: center; width: 44px; height: 44px; padding: 0; border: 0; background: transparent; color: var(--app-text); }
.family-select, .form-card, .preference-note, .state-card { margin-top: 22px; border: 1px solid var(--app-border); border-radius: var(--app-radius-card); background: var(--app-surface-strong); }
.family-select { padding: 16px; }
.field-label, .state-title, .state-desc { display: block; }
.field-label { color: var(--app-text-secondary); font-size: var(--font-size-caption); }
.picker-value { display: flex; align-items: center; justify-content: space-between; min-height: 44px; color: var(--app-text); font-size: var(--font-size-card-title); font-weight: var(--font-semibold); }
.form-card { overflow: hidden; }
.field { display: block; padding: 16px; border-bottom: 1px solid var(--app-border); }
.field:last-child { border-bottom: 0; }
.field-input, .field-textarea { width: 100%; margin-top: 8px; color: var(--app-text); font-size: var(--font-size-body-sm); line-height: var(--line-body); }
.field-textarea { min-height: 96px; }
.preference-note { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 16px; color: var(--app-primary); font-size: var(--font-size-caption); }
.preference-note__copy { display: flex; min-width: 0; align-items: center; gap: 10px; }
.preference-link { min-height: 44px; margin: 0; padding: 0 4px; border: 0; background: transparent; color: var(--app-primary); font-size: var(--font-size-caption); white-space: nowrap; }
.send-button, .primary-button { width: 100%; min-height: 50px; margin-top: 24px; border: 0; border-radius: var(--app-radius-button); background: var(--app-primary); color: var(--text-white); font-size: var(--font-size-body); font-weight: var(--font-semibold); }
.send-button[disabled] { opacity: .58; }
.state-card { padding: 20px; }
.state-title { color: var(--app-text); font-size: var(--font-size-card-title); font-weight: var(--font-semibold); }
.state-desc { margin-top: 6px; color: var(--app-text-secondary); font-size: var(--font-size-caption); line-height: var(--line-caption); }
button::after { border: 0; }
</style>
