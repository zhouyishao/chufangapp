<template>
  <view class="page-container">
    <!-- Header Navigation -->
    <view class="header-nav">
      <view class="nav-circle-btn back-btn" @click="goBack">
        <app-icon class="cooking-header-icon" name="arrow-left" size="30rpx" />
      </view>
      <view class="header-title-col">
        <text class="recipe-name-title">{{ recipeName }}</text>
        <text class="step-progress-text">第 {{ currentIndex + 1 }} 步 / 共 {{ steps.length }} 步</text>
      </view>
      <view class="nav-circle-btn more-btn" @click="showMoreActions">
        <app-icon class="cooking-header-icon" name="share" size="28rpx" />
      </view>
    </view>

    <!-- Progress Indicator Bar -->
    <view class="progress-section" v-if="steps.length > 0">
      <view class="progress-text-row">
        <text class="progress-percent-label">{{ Math.round((currentIndex + 1) / steps.length * 100) }}%</text>
        <text class="progress-time-label">剩余约 {{ totalRemainingMinutes }} 分钟</text>
      </view>
      <view class="progress-track-bar">
        <view class="progress-fill-bar" :style="{ width: ((currentIndex + 1) / steps.length * 100) + '%' }" />
      </view>
    </view>

    <!-- Loading / Error / Empty States -->
    <view v-if="loading" class="status-banner">
      <text class="status-text">正在载入烹饪步骤...</text>
    </view>
    <view v-else-if="error" class="status-banner">
      <text class="status-text error-text">{{ error }}</text>
      <view class="retry-btn" @click="fetchRecipeDetails">重试</view>
    </view>
    <view v-else-if="steps.length === 0" class="status-banner">
      <text class="status-text">暂无制作步骤</text>
    </view>

    <!-- Step content Card -->
    <view v-else-if="currentStep" class="step-display-card">
      <view class="card-header-row">
        <view class="step-chip-tag">步骤 {{ currentIndex + 1 }}</view>
        <view class="step-duration-chip">
          {{ currentStep.durationMinutes > 0 ? `约 ${currentStep.durationMinutes} 分钟` : '时长待补充' }}
        </view>
      </view>
      
      <text class="step-main-title">{{ currentStep.title }}</text>
      
      <image v-if="currentStep.image" class="step-card-img" :src="currentStep.image" mode="aspectFill" />
      
      <text class="step-card-desc">{{ currentStep.description }}</text>
      
      <!-- Current step Tip (if available) -->
      <view v-if="currentStep.tip" class="step-tips-box">
        <view class="tips-header-row">
          <app-icon class="cooking-tip-icon" name="cooking-pot" size="26rpx" />
          <text class="tips-title">小贴士</text>
        </view>
        <text class="tips-body">{{ currentStep.tip }}</text>
      </view>

      <!-- Divider line above timer -->
      <view class="card-divider" />

      <!-- Timer Section -->
      <view class="timer-section-box">
        <view class="timer-header-kv">
          <text class="timer-title">计时器</text>
          <text class="timer-expected-val">预计时间 {{ expectedTimeStr }}</text>
        </view>
        
        <view class="timer-main-clock">{{ formatTime(remainingSeconds) }}</view>
        
        <view class="timer-controls-row">
          <button class="timer-ctrl-btn reset-btn" @click="resetTimer">重置</button>
          <button class="timer-ctrl-btn toggle-btn" :class="{ 'is-running': isTimerRunning }" @click="toggleTimer">
            {{ isTimerRunning ? '暂停' : '开始' }}
          </button>
        </view>
      </view>
    </view>

    <!-- Bottom Actions Bar -->
    <view class="bottom-action-fixed-bar">
      <view class="bottom-bar-inner-row">
        <button 
          class="nav-step-btn prev-step-btn" 
          :disabled="currentIndex === 0" 
          @click="prevStep"
        >
          上一步
        </button>
        <button 
          class="nav-step-btn next-step-btn" 
          @click="nextStep"
        >
          {{ currentIndex === steps.length - 1 ? '完成烹饪' : '下一步' }}
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch, onUnmounted } from 'vue';
import { onLoad, onShow, onUnload } from '@dcloudio/uni-app';
import AppIcon from '../../components/app/app-icon.vue';
import { getRecipe, resolveAssetUrl } from '../../services/public-api';

type CookingStep = {
  title: string;
  description: string;
  image: string;
  durationMinutes: number;
  tip?: string;
};

const recipeId = ref<string | null>(null);
const recipeName = ref('');
const steps = ref<CookingStep[]>([]);
const currentIndex = ref(0);
const loading = ref(true);
const error = ref<string | null>(null);

const isTimerRunning = ref(false);
const remainingSeconds = ref(0);
let timer: ReturnType<typeof setInterval> | null = null;

const currentStep = computed(() => steps.value[currentIndex.value] ?? null);

const readRecipeIdFromRoute = (query?: Record<string, string | undefined>) => {
  const fromQuery = query?.id?.trim();
  if (fromQuery) return fromQuery;
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1] as { options?: Record<string, string | undefined> } | undefined;
  return currentPage?.options?.id?.trim() || null;
};

const totalRemainingMinutes = computed(() => {
  let minutes = 0;
  for (let i = currentIndex.value; i < steps.value.length; i++) {
    minutes += steps.value[i].durationMinutes;
  }
  return minutes;
});

const expectedTimeStr = computed(() => {
  const step = currentStep.value;
  if (!step || step.durationMinutes <= 0) return '待补充';
  const m = step.durationMinutes;
  const mm = m < 10 ? `0${m}` : String(m);
  return `${mm}:00`;
});

const formatTime = (totalSecs: number): string => {
  const m = Math.floor(totalSecs / 60);
  const s = totalSecs % 60;
  const mm = m < 10 ? `0${m}` : String(m);
  const ss = s < 10 ? `0${s}` : String(s);
  return `${mm}:${ss}`;
};

const goBack = () => {
  if (getCurrentPages().length <= 1) {
    if (recipeId.value) {
      uni.redirectTo({ url: `/pages/recipe-detail/index?id=${recipeId.value}` });
    } else {
      uni.reLaunch({ url: '/pages/ingredients/index?tab=recipes' });
    }
    return;
  }
  uni.navigateBack();
};

const showMoreActions = () => {
  uni.showActionSheet({
    itemList: ['分享菜谱', '返回菜谱详情'],
    success: (res) => {
      if (res.tapIndex === 0) {
        uni.showToast({ title: '链接已复制，去分享给好友吧', icon: 'none' });
      } else if (res.tapIndex === 1) {
        if (recipeId.value) {
          uni.redirectTo({ url: `/pages/recipe-detail/index?id=${recipeId.value}` });
        }
      }
    }
  });
};

const initTimerForStep = () => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  isTimerRunning.value = false;
  const step = currentStep.value;
  remainingSeconds.value = step ? step.durationMinutes * 60 : 0;
};

const toggleTimer = () => {
  if (isTimerRunning.value) {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    isTimerRunning.value = false;
  } else {
    if (remainingSeconds.value <= 0) {
      remainingSeconds.value = currentStep.value ? currentStep.value.durationMinutes * 60 : 0;
    }
    isTimerRunning.value = true;
    timer = setInterval(() => {
      if (remainingSeconds.value > 0) {
        remainingSeconds.value--;
      } else {
        if (timer) {
          clearInterval(timer);
          timer = null;
        }
        isTimerRunning.value = false;
        uni.showToast({
          title: '当前步骤计时完成！',
          icon: 'success',
          duration: 3000
        });
      }
    }, 1000);
  }
};

const resetTimer = () => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  isTimerRunning.value = false;
  remainingSeconds.value = currentStep.value ? currentStep.value.durationMinutes * 60 : 0;
};

const prevStep = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--;
  }
};

const nextStep = () => {
  if (currentIndex.value < steps.value.length - 1) {
    currentIndex.value++;
  } else {
    uni.showToast({
      title: '烹饪完成！',
      icon: 'success',
      duration: 2000
    });
    setTimeout(() => {
      if (recipeId.value) {
        uni.redirectTo({ url: `/pages/recipe-detail/index?id=${recipeId.value}` });
      } else {
        uni.reLaunch({ url: '/pages/ingredients/index?tab=recipes' });
      }
    }, 1500);
  }
};

watch(currentIndex, () => {
  initTimerForStep();
});

const fetchRecipeDetails = async () => {
  if (!recipeId.value) return;
  loading.value = true;
  error.value = null;
  try {
    const data = await getRecipe(recipeId.value) as any;
    recipeName.value = data.title ?? (data.name ?? '');
    
    const rawSteps = data.steps ?? (data.cookingSteps ?? []);
    
    steps.value = rawSteps.map((s: any, idx: number) => {
      const title = s.title ?? (s.name ?? `步骤 ${idx + 1}`);
      const description = s.description ?? (s.content ?? (s.text ?? ''));
      const image = s.image ? resolveAssetUrl(s.image) : '';
      
      let minutes = 0;
      const rawDur = s.duration ?? (s.time ?? s.minutes);
      if (rawDur) {
        const parsed = parseInt(String(rawDur).replace(/[^0-9]/g, ''), 10);
        if (!isNaN(parsed) && parsed > 0) {
          minutes = parsed;
        }
      }
      
      const tipVal = s.tip ?? (s.tips ?? (data.tips ? data.tips.split('\n')[idx]?.trim() : ''));
      
      return {
        title,
        description,
        image,
        durationMinutes: minutes,
        tip: tipVal || undefined
      } satisfies CookingStep;
    });

    initTimerForStep();
  } catch (err) {
    error.value = err instanceof Error ? err.message : '加载失败';
  } finally {
    loading.value = false;
  }
};

onLoad((query?: Record<string, string | undefined>) => {
  const id = readRecipeIdFromRoute(query);
  if (id) {
    recipeId.value = id;
    void fetchRecipeDetails();
  } else {
    error.value = '参数缺失，无法加载烹饪步骤';
    loading.value = false;
  }
  
  const stepQuery = query?.step?.trim();
  if (stepQuery) {
    const sIdx = parseInt(stepQuery, 10) - 1;
    if (!isNaN(sIdx) && sIdx >= 0) {
      currentIndex.value = sIdx;
    }
  }
});

onMounted(() => {
  if (recipeId.value) return;
  const id = readRecipeIdFromRoute();
  if (!id) return;
  recipeId.value = id;
  void fetchRecipeDetails();
});

onShow(() => {
  if (recipeId.value) return;
  const id = readRecipeIdFromRoute();
  if (!id) return;
  recipeId.value = id;
  void fetchRecipeDetails();
});

onUnmounted(() => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
});

onUnload(() => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
});
</script>

<style scoped lang="scss">
.page-container {
  max-width: 393px;
  margin: 0 auto;
  min-height: 100vh;
  background: var(--app-bg);
  padding-bottom: calc(180rpx + env(safe-area-inset-bottom, 0));
  position: relative;
  overflow-x: hidden;
  box-shadow: 0 0 40rpx rgba(0, 0, 0, 0.05);
}

.header-nav {
  padding: calc(env(safe-area-inset-top, 0) + 24rpx) 32rpx 20rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16rpx;
}

.nav-circle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 88rpx;
  height: 88rpx;
  border-radius: 50%;
  background: #FFFDFC;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.08);
  color: var(--text-primary);
  border: 1rpx solid rgba(183, 174, 161, 0.15);
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.nav-circle-btn:active {
  transform: scale(0.92);
  background: rgba(255, 255, 255, 0.95);
}

.header-title-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  min-width: 0;
}

.recipe-name-title {
  font-family: var(--font-system);
  font-size: var(--font-size-card-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-card-title);
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
}

.step-progress-text {
  font-size: var(--font-size-tag);
  color: var(--text-placeholder);
  margin-top: 4rpx;
}

.cooking-header-icon {
  color: var(--text-primary);
}

.cooking-tip-icon {
  color: var(--text-brand);
}

.progress-section {
  margin: 16rpx 32rpx 32rpx;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.progress-text-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.progress-percent-label {
  font-size: var(--font-size-tag);
  font-weight: var(--font-semibold);
  color: var(--text-brand);
}

.progress-time-label {
  font-size: var(--font-size-tag);
  color: var(--text-placeholder);
}

.progress-track-bar {
  height: 12rpx;
  background: rgba(183, 174, 161, 0.2);
  border-radius: 999rpx;
  overflow: hidden;
  width: 100%;
}

.progress-fill-bar {
  height: 100%;
  background: var(--text-brand);
  border-radius: 999rpx;
  transition: width 0.3s ease;
}

.status-banner {
  margin: 32rpx;
  padding: 40rpx;
  border-radius: 36rpx;
  text-align: center;
  background: #FFFDFC;
  border: 1rpx solid var(--app-border);
  box-shadow: var(--app-shadow);
}

.status-text {
  font-size: var(--font-size-body-sm);
  color: var(--text-secondary);
}

.error-text {
  color: var(--app-danger);
}

.retry-btn {
  margin: 20rpx auto 0;
  padding: 10rpx 40rpx;
  border-radius: 999rpx;
  background: var(--text-brand);
  color: #FFFDFC;
  font-size: var(--font-size-caption);
  width: fit-content;
}

.step-display-card {
  margin: 0 32rpx;
  background: #FFFDFC;
  border: 1rpx solid var(--app-border);
  border-radius: 36rpx;
  padding: 36rpx;
  box-shadow: var(--app-shadow);
  display: flex;
  flex-direction: column;
}

.card-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.step-chip-tag {
  font-size: var(--font-size-tag);
  font-weight: var(--font-semibold);
  color: var(--text-brand);
  background: rgba(122, 139, 111, 0.1);
  padding: 6rpx 20rpx;
  border-radius: 999rpx;
}

.step-duration-chip {
  font-size: var(--font-size-tag);
  font-weight: var(--font-medium);
  color: var(--text-placeholder);
}

.step-main-title {
  font-family: var(--font-system);
  font-size: var(--font-size-section-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-section-title);
  color: var(--text-primary);
  margin-bottom: 24rpx;
}

.step-card-img {
  width: 100%;
  height: 360rpx;
  border-radius: 24rpx;
  margin-bottom: 24rpx;
}

.step-card-desc {
  font-size: var(--font-size-body-sm);
  line-height: var(--line-body);
  color: var(--text-secondary);
  margin-bottom: 24rpx;
}

.step-tips-box {
  background: rgba(245, 241, 234, 0.5);
  border-radius: 24rpx;
  padding: 24rpx;
  border: 1rpx solid var(--app-border);
  margin-bottom: 24rpx;
}

.tips-header-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 12rpx;
}

.tips-title {
  font-size: var(--font-size-tag);
  font-weight: var(--font-semibold);
  color: var(--text-brand);
}

.tips-body {
  font-size: var(--font-size-caption);
  line-height: var(--line-caption);
  color: var(--text-tertiary);
}

.card-divider {
  height: 1rpx;
  background-color: var(--app-border);
  margin: 24rpx 0;
}

.timer-section-box {
  display: flex;
  flex-direction: column;
  background: rgba(183, 174, 161, 0.08);
  border: 1rpx solid var(--app-border);
  border-radius: 28rpx;
  padding: 24rpx;
}

.timer-header-kv {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.timer-title {
  font-size: var(--font-size-caption);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.timer-expected-val {
  font-size: var(--font-size-tag);
  color: var(--text-placeholder);
}

.timer-main-clock {
  font-family: var(--font-system);
  font-size: 80rpx;
  font-weight: 300;
  color: var(--text-primary);
  text-align: center;
  margin: 24rpx 0;
  letter-spacing: 2rpx;
}

.timer-controls-row {
  display: flex;
  gap: 16rpx;
}

.timer-ctrl-btn {
  flex: 1;
  height: 72rpx;
  border-radius: 36rpx;
  font-size: var(--font-size-caption);
  font-weight: var(--font-semibold);
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  transition: all 0.2s ease;
}

.timer-ctrl-btn::after {
  border: none;
}

.timer-ctrl-btn:active {
  transform: scale(0.96);
}

.reset-btn {
  background: #FFFDFC;
  border: 1rpx solid var(--app-border) !important;
  color: var(--text-secondary);
}

.toggle-btn {
  background: var(--text-brand);
  color: #FFFDFC;
}

.toggle-btn.is-running {
  background: var(--app-accent-warm);
}

.bottom-action-fixed-bar {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 393px;
  max-width: 100vw;
  background: rgba(255, 253, 252, 0.96);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-top: 1rpx solid rgba(183, 174, 161, 0.2);
  padding: 24rpx 32rpx calc(24rpx + env(safe-area-inset-bottom, 0));
  z-index: 100;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.02);
}

.bottom-bar-inner-row {
  display: flex;
  gap: 20rpx;
}

.nav-step-btn {
  flex: 1;
  height: 96rpx;
  border-radius: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-semibold);
  transition: all 0.2s ease;
  border: none;
}

.nav-step-btn::after {
  border: none;
}

.nav-step-btn:active:not([disabled]) {
  transform: scale(0.97);
}

.nav-step-btn[disabled] {
  opacity: 0.4;
  pointer-events: none;
}

.prev-step-btn {
  background: #FFFDFC;
  border: 2rpx solid var(--app-border) !important;
  color: var(--text-secondary);
}

.next-step-btn {
  background: var(--text-brand);
  color: #FFFDFC;
}
</style>
