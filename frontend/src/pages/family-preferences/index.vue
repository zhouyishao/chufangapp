<template>
  <view class="app-page preference-page">
    <view class="topbar">
      <button class="nav-button" @tap="goBack">
        <app-icon name="arrow-left" size="26rpx" />
      </button>
      <text class="topbar-title">家庭偏好</text>
      <view class="topbar-spacer" />
    </view>

    <view class="summary-card glass-card">
      <text class="summary-title">{{ family?.name || '家庭偏好' }}</text>
      <text class="summary-desc">保存后会写入后端家庭偏好，后续推荐和菜篮子可按这些规则过滤。</text>
    </view>

    <view class="section glass-card">
      <text class="section-title">忌口</text>
      <view class="chip-list">
        <button v-for="item in avoidItems" :key="item" class="chip" @tap="removeAvoid(item)">{{ item }} ×</button>
      </view>
      <view class="input-row">
        <input v-model="avoidDraft" class="chip-input" placeholder="例如：香菜" confirm-type="done" />
        <button class="add-button" @tap="addAvoid">添加</button>
      </view>
    </view>

    <view class="section glass-card">
      <text class="section-title">过敏</text>
      <view class="chip-list">
        <button v-for="item in allergies" :key="item" class="chip is-warm" @tap="removeAllergy(item)">{{ item }} ×</button>
      </view>
      <view class="input-row">
        <input v-model="allergyDraft" class="chip-input" placeholder="例如：花生" confirm-type="done" />
        <button class="add-button" @tap="addAllergy">添加</button>
      </view>
    </view>

    <view class="section glass-card">
      <text class="section-title">偏好</text>
      <view class="chip-list">
        <button v-for="item in preferences" :key="item" class="chip is-green" @tap="removePreference(item)">{{ item }} ×</button>
      </view>
      <view class="input-row">
        <input v-model="preferenceDraft" class="chip-input" placeholder="例如：清淡、少油" confirm-type="done" />
        <button class="add-button" @tap="addPreference">添加</button>
      </view>
    </view>

    <view class="section glass-card">
      <text class="section-title">家庭口味备注</text>
      <textarea v-model="note" class="note-input" placeholder="例如：晚餐少盐，周末可以做辣一点" maxlength="120" />
    </view>

    <button class="save-button" :disabled="saving" @tap="save">{{ saving ? '保存中' : '保存偏好' }}</button>
  </view>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import AppIcon from '../../components/app/app-icon.vue';
import { getFamilyById, loadActiveFamilyId, updateFamily } from '../../services/family';
import type { FamilyProfile } from '../../types/family';

const familyId = ref('');
const family = ref<FamilyProfile | null>(null);
const avoidItems = ref<string[]>([]);
const allergies = ref<string[]>([]);
const preferences = ref<string[]>([]);
const note = ref('');
const avoidDraft = ref('');
const allergyDraft = ref('');
const preferenceDraft = ref('');
const saving = ref(false);

const addUnique = (list: string[], value: string) => {
  const trimmed = value.trim();
  if (!trimmed || list.includes(trimmed)) return list;
  return [...list, trimmed];
};

const addAvoid = () => {
  avoidItems.value = addUnique(avoidItems.value, avoidDraft.value);
  avoidDraft.value = '';
};

const addAllergy = () => {
  allergies.value = addUnique(allergies.value, allergyDraft.value);
  allergyDraft.value = '';
};

const addPreference = () => {
  preferences.value = addUnique(preferences.value, preferenceDraft.value);
  preferenceDraft.value = '';
};

const removeAvoid = (item: string) => {
  avoidItems.value = avoidItems.value.filter((value) => value !== item);
};

const removeAllergy = (item: string) => {
  allergies.value = allergies.value.filter((value) => value !== item);
};

const removePreference = (item: string) => {
  preferences.value = preferences.value.filter((value) => value !== item);
};

const goBack = () => {
  uni.navigateBack();
};

const loadFamily = async (id: string) => {
  const data = await getFamilyById(id);
  family.value = data;
  avoidItems.value = data?.preferences?.avoidItems ?? [];
  allergies.value = data?.preferences?.allergies ?? [];
  preferences.value = data?.preferences?.preferences ?? [];
  note.value = data?.preferences?.note ?? data?.rules ?? '';
};

const save = async () => {
  if (!family.value) return;
  saving.value = true;
  try {
    await updateFamily({
      ...family.value,
      rules: note.value.trim(),
      preferences: {
        avoidItems: avoidItems.value,
        allergies: allergies.value,
        preferences: preferences.value,
        taste: preferences.value[0] ?? null,
        note: note.value.trim()
      }
    });
    uni.showToast({ title: '偏好已保存', icon: 'success' });
    setTimeout(() => uni.navigateBack(), 250);
  } catch (error) {
    uni.showToast({ title: error instanceof Error ? error.message : '保存失败', icon: 'none' });
  } finally {
    saving.value = false;
  }
};

onLoad((options) => {
  familyId.value = typeof options?.familyId === 'string' ? options.familyId : loadActiveFamilyId();
  if (familyId.value) {
    void loadFamily(familyId.value).catch((error) => {
      uni.showToast({ title: error instanceof Error ? error.message : '家庭加载失败', icon: 'none' });
    });
  }
});

onMounted(() => {
  if (familyId.value) return;
  if (typeof window !== 'undefined') {
    const hash = window.location.hash;
    const queryText = hash.includes('?') ? hash.slice(hash.indexOf('?') + 1) : '';
    familyId.value = new URLSearchParams(queryText).get('familyId') ?? loadActiveFamilyId();
  } else {
    familyId.value = loadActiveFamilyId();
  }
  if (familyId.value) {
    void loadFamily(familyId.value).catch((error) => {
      uni.showToast({ title: error instanceof Error ? error.message : '家庭加载失败', icon: 'none' });
    });
  }
});

onShow(() => {
  const nextFamilyId = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.hash.includes('?') ? window.location.hash.slice(window.location.hash.indexOf('?') + 1) : '').get('familyId')
    : null;
  const resolvedFamilyId = nextFamilyId?.trim() || loadActiveFamilyId();
  if (!resolvedFamilyId || resolvedFamilyId === familyId.value) return;
  familyId.value = resolvedFamilyId;
  void loadFamily(resolvedFamilyId).catch((error) => {
    uni.showToast({ title: error instanceof Error ? error.message : '家庭加载失败', icon: 'none' });
  });
});
</script>

<style scoped lang="scss">
.preference-page {
  padding-bottom: calc(120rpx + env(safe-area-inset-bottom, 0));
}

.topbar {
  display: grid;
  grid-template-columns: 72rpx 1fr 72rpx;
  align-items: center;
}

.nav-button,
.add-button,
.chip,
.save-button {
  border: 0;
}

.nav-button {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: var(--app-surface-strong);
  color: var(--app-text);
  font-size: var(--font-size-card-title);
}

.topbar-title {
  color: var(--app-text);
  font-size: var(--font-size-body);
  font-weight: var(--font-semibold);
  text-align: center;
}

.summary-card,
.section {
  margin-top: 24rpx;
  padding: 28rpx;
}

.summary-title,
.summary-desc,
.section-title {
  display: block;
}

.summary-title {
  color: var(--app-text);
  font-size: var(--font-size-page-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-page-title);
}

.summary-desc {
  margin-top: 12rpx;
  color: var(--app-text-tertiary);
  font-size: var(--font-size-caption);
  line-height: var(--line-caption);
}

.chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 18rpx;
}

.chip {
  height: 58rpx;
  padding: 0 20rpx;
  border-radius: 20rpx;
  background: var(--app-accent-soft);
  color: var(--app-text);
  font-size: var(--font-size-tag);
}

.chip.is-warm {
  background: rgba(217, 138, 74, 0.14);
}

.chip.is-green {
  background: rgba(122, 139, 111, 0.14);
}

.input-row {
  display: grid;
  grid-template-columns: 1fr 120rpx;
  gap: 14rpx;
  margin-top: 18rpx;
}

.chip-input,
.note-input {
  width: 100%;
  border-radius: var(--app-radius-input);
  background: var(--app-accent-soft);
  color: var(--app-text);
  font-size: var(--font-size-body-sm);
}

.chip-input {
  height: 76rpx;
  padding: 0 22rpx;
}

.add-button {
  height: 76rpx;
  border-radius: 24rpx;
  background: var(--app-primary);
  color: var(--text-white);
  font-size: var(--font-size-tag);
}

.note-input {
  min-height: 170rpx;
  margin-top: 18rpx;
  padding: 22rpx;
  line-height: var(--line-body-sm);
}

.save-button {
  position: fixed;
  right: 32rpx;
  bottom: calc(24rpx + env(safe-area-inset-bottom, 0));
  left: 32rpx;
  z-index: 20;
  height: 88rpx;
  border-radius: var(--app-radius-button);
  background: var(--app-primary);
  color: var(--text-white);
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-semibold);
}
</style>
