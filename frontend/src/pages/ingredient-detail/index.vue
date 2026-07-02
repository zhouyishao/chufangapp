<template>
  <view class="page">
      <view class="header-image">
      <image class="header-image__bg" :src="ingredient.image" mode="aspectFill" />
      <view :class="['header-overlay', { 'is-solid': isHeaderSolid }]">
        <view class="back-button" @click="goBack">
          <app-icon name="arrow-left" size="26rpx" />
        </view>
        <text class="header-title">{{ ingredient.name }}</text>
        <view :class="['favorite-button', { 'is-favorite': isFavorite }]" @click="toggleFavorite">
          <app-icon :name="isFavorite ? 'heart-filled' : 'heart'" size="28rpx" />
        </view>
      </view>
    </view>

    <view class="content">
      <view v-if="remoteLoading" class="remote-banner glass-card">
        <text class="remote-banner__text">正在加载食材详情...</text>
      </view>
      <view v-else-if="remoteError" class="remote-banner glass-card">
        <text class="remote-banner__error">加载失败：{{ remoteError }}</text>
        <button class="remote-banner__retry" @tap="handleRetryRemote">重试</button>
      </view>

      <view class="ingredient-header glass-card">
        <view class="ingredient-header__content">
          <view class="ingredient-header__main">
            <text class="ingredient-name">{{ ingredient.name }}</text>
            <nut-tag :type="ingredient.seasonTag.type">{{ ingredient.seasonTag.label }}</nut-tag>
          </view>
          <text class="ingredient-subtitle">{{ ingredient.subtitle }}</text>
        </view>
        <view class="ingredient-header__side">
          <text class="estimate-label">预计价格</text>
          <text class="estimate-value">{{ estimatedPriceText }}</text>
        </view>
      </view>

      <view class="overview-section glass-card">
        <view class="overview-tabs">
          <button
            v-for="tab in overviewTabs"
            :key="tab.id"
            :class="['overview-tab', { 'is-active': activeOverviewTab === tab.id }]"
            @tap="activeOverviewTab = tab.id"
          >
            {{ tab.label }}
          </button>
        </view>

        <view v-if="activeOverviewTab === 'basic'" class="overview-pane">
          <view class="info-grid">
            <view
              v-for="info in ingredient.basicInfo"
              :key="info.label"
              class="info-item"
            >
              <text class="info-label">{{ info.label }}</text>
              <text class="info-value">{{ info.value }}</text>
            </view>
          </view>
        </view>

        <view v-else-if="activeOverviewTab === 'price'" class="overview-pane">
          <view class="price-topline">
            <view>
              <text class="price-label">{{ selectedPriceDateText }}</text>
              <text class="price-value">{{ selectedPriceText }}</text>
            </view>
            <view class="price-actions">
              <text class="section-more">{{ priceTrendLabel }}</text>
            </view>
          </view>
          <view
            v-if="visiblePriceRecords.length"
            class="price-line-chart"
            @touchstart="selectPriceByTouch"
            @touchmove="selectPriceByTouch"
            @longpress="showDeletePriceAction"
          >
            <button
              v-if="isDeletePriceActionVisible && selectedPriceRecord"
              class="delete-price-button"
              @tap.stop="deleteSelectedPriceRecord"
            >
              删除
            </button>
            <svg class="price-line-chart__svg" viewBox="0 0 220 104">
              <polyline
                class="price-line-chart__line"
                :points="priceLinePoints"
                fill="none"
              />
              <circle
                v-for="(point, index) in pricePointItems"
                :key="point.id"
                :class="['price-line-chart__point', { 'is-active': selectedPriceIndex === index }]"
                :cx="point.x"
                :cy="point.y"
                r="5"
                @tap.stop="selectPriceRecord(index)"
              />
            </svg>
            <view class="price-line-chart__labels">
              <text
                v-for="record in visiblePriceRecords"
                :key="record.id"
              >
                {{ formatPriceDate(record.date) }}
              </text>
            </view>
          </view>
          <text v-if="!visiblePriceRecords.length" class="price-empty">
            记录价格后会显示历史走势。
          </text>
        </view>

      </view>

      <view class="tips-section glass-card">
        <view class="tips-tabs">
          <button
            v-for="tab in tipsTabs"
            :key="tab.id"
            :class="['tips-tab', { 'is-active': activeTipsTab === tab.id }]"
            @tap="activeTipsTab = tab.id"
          >
            {{ tab.label }}
          </button>
        </view>
        <text class="section-content">{{ activeTipsContent }}</text>
      </view>

      <view class="recipe-section glass-card">
        <view class="section-header">
          <text class="section-title">相关菜谱</text>
          <text class="section-more">查看全部</text>
        </view>
        <view class="recipe-list">
          <view
            v-for="recipe in ingredient.relatedRecipes"
            :key="recipe.id"
            class="recipe-item"
            @click="goToRecipe(recipe.id)"
          >
            <image class="recipe-item__image" :src="recipe.image" mode="aspectFill" />
            <view class="recipe-item__body">
              <text class="recipe-item__name">{{ recipe.name }}</text>
              <text class="recipe-item__meta">{{ recipe.duration }} · {{ recipe.difficulty }}</text>
            </view>
          </view>
        </view>
      </view>

      <view class="bottom-actions">
        <button class="record-bottom-button" @tap="openPricePanel">
          <app-icon class="bottom-button__icon" name="plus" size="28rpx" />
          <text>添加价格</text>
        </button>
        <button
          :class="['add-basket-button', { 'is-in-basket': isInBasket }]"
          @tap="addToBasket"
        >
          <app-icon class="bottom-button__icon" :name="isInBasket ? 'check' : 'basket'" size="28rpx" />
          <text>{{ isInBasket ? '已在菜篮子' : '加入菜篮子' }}</text>
        </button>
      </view>
    </view>

    <view v-if="isPricePanelVisible" class="price-mask" @tap="closePricePanel">
      <view class="price-panel glass-card" @tap.stop>
        <view class="price-panel__head">
          <view>
            <text class="price-panel__title">记录{{ ingredient.name }}价格</text>
            <text class="price-panel__desc">可记录采购价，也可以补录看到的市场价。</text>
          </view>
          <text class="price-panel__close" @tap="closePricePanel">×</text>
        </view>
        <view class="price-form">
          <view class="price-field price-field--total">
            <text class="field-label">总价</text>
            <view class="field-input">
              <text>¥</text>
              <input v-model="manualPrice" type="digit" placeholder="例如 18" />
            </view>
          </view>
          <view v-if="isWeightUnit" class="price-field price-field--amount">
            <text class="field-label">购买量</text>
            <view class="field-input amount-input">
              <input v-model="manualSpecAmount" type="digit" placeholder="例如 500" />
              <picker
                mode="selector"
                :range="unitOptions"
                :value="manualUnitIndex"
                @change="handleUnitChange"
              >
                <view class="unit-select">
                  <text>{{ selectedManualUnit }}</text>
                  <app-icon class="select-arrow" name="chevron-down" size="20rpx" />
                </view>
              </picker>
            </view>
          </view>
          <view v-else class="price-field price-field--amount">
            <text class="field-label">规格</text>
            <picker
              mode="selector"
              :range="unitOptions"
              :value="manualUnitIndex"
              @change="handleUnitChange"
            >
              <view class="field-input is-select">
                <text>{{ selectedManualUnit }}</text>
                <app-icon class="select-arrow" name="chevron-down" size="20rpx" />
              </view>
            </picker>
            </view>
          <view v-if="convertedPriceText" class="converted-price price-field is-full">
            <text class="converted-price__label">换算结果</text>
            <text class="converted-price__value">{{ convertedPriceText }}</text>
          </view>
          <view class="price-field is-full">
            <text class="field-label">日期</text>
            <picker
              mode="date"
              :value="manualDate"
              @change="handleDateChange"
            >
              <view class="field-input is-select">
                <text>{{ manualDate }}</text>
                <app-icon class="select-arrow" name="chevron-down" size="20rpx" />
              </view>
            </picker>
          </view>
        </view>
        <text class="price-form-tip">按实际标价填写，例如 18 元 / 500 g；重量单位会自动统一换算为元/斤。</text>
        <button class="save-price-button" @tap="saveManualPrice">保存价格</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { onLoad, onPageScroll, onShow } from '@dcloudio/uni-app';
import AppIcon from '../../components/app/app-icon.vue';
import {
  addBasketItem,
  getIngredientBasketItemId,
  getIngredientPurchaseText,
  loadBasketItems,
  removeBasketItem
} from '../../services/basket';
import type { BasketItem } from '../../services/basket';
import { loadAuthUser, syncAuthUserWithBackend } from '../../services/auth';
import { addPriceRecords, getPriceRecordsByIngredient, removePriceRecord } from '../../services/price';
import type { IngredientPriceRecord } from '../../services/price';
import {
  addMobileFavorite,
  addMobileViewHistory,
  deleteMobileFavorite,
  getIngredient,
  listMobileFavorites
} from '../../services/public-api';

interface BasicInfo {
  label: string;
  value: string;
}

interface RelatedRecipe {
  id: string;
  name: string;
  image: string;
  duration: string;
  difficulty: string;
}

interface Ingredient {
  id: string;
  name: string;
  subtitle: string;
  image: string;
  seasonTag: {
    type: string;
    label: string;
  };
  basicInfo: BasicInfo[];
  nutrition: string;
  selectTips: string;
  storageTips: string;
  relatedRecipes: RelatedRecipe[];
}

type OverviewTabId = 'basic' | 'price';
type TipsTabId = 'select' | 'storage' | 'nutrition';

const readIngredientIdFromRoute = (query?: Record<string, string | undefined>) => {
  const fromQuery = query?.id?.trim();
  if (fromQuery) return fromQuery;
  if (typeof window === 'undefined') return '';
  const hash = window.location.hash;
  const queryText = hash.includes('?') ? hash.slice(hash.indexOf('?') + 1) : '';
  return new URLSearchParams(queryText).get('id')?.trim() ?? '';
};

const ingredient = ref<Ingredient>({
  id: '',
  name: '食材详情',
  subtitle: '正在读取后台食材资料',
  image: '',
  seasonTag: {
    type: 'success',
    label: '时令'
  },
  basicInfo: [],
  nutrition: '后台暂未配置营养说明。',
  selectTips: '后台暂未配置挑选建议。',
  storageTips: '后台暂未配置保存建议。',
  relatedRecipes: []
});

const remoteLoading = ref(false);
const remoteError = ref<string | null>(null);
const currentIngredientId = ref<number | null>(null);

const normalizeTextBlock = (value: unknown, fallback: string) => {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return trimmed || fallback;
};

const normalizeRelatedRecipes = (value: unknown): RelatedRecipe[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const record = item as Record<string, unknown>;
      const id = record.id ?? record.recipeId;
      const name = record.name ?? record.title;
      if (id === undefined || typeof name !== 'string') return null;
      return {
        id: String(id),
        name,
        image: typeof record.image === 'string' ? record.image : typeof record.cover === 'string' ? record.cover : '',
        duration: typeof record.duration === 'string' ? record.duration : typeof record.cookTime === 'number' ? `${record.cookTime}分钟` : '—',
        difficulty: typeof record.difficulty === 'string' ? record.difficulty : '—'
      };
    })
    .filter((item): item is RelatedRecipe => item !== null);
};

const loadRemoteIngredient = async (id: number) => {
  remoteLoading.value = true;
  remoteError.value = null;
  try {
    const data = await getIngredient(id);
    const seasonText = data.seasonMonth?.trim() || '';
    ingredient.value = {
      id: String(data.id),
      name: data.name,
      subtitle: seasonText ? `时令：${seasonText}` : '后台已配置食材资料',
      image: data.cover ?? '',
      seasonTag: {
        type: 'success',
        label: seasonText ? `${seasonText.split(',')[0]?.trim() ?? ''}月当季` : '常备'
      },
      basicInfo: [
        { label: '类别', value: data.category?.name ?? '未分类' },
        { label: '季节', value: seasonText || '未配置' },
        { label: '价格', value: data.currentPrice ? `¥${data.currentPrice}/${data.priceUnit ?? '斤'}` : '待补充' },
        { label: '更新时间', value: data.updatedAt?.slice(0, 10) ?? '—' }
      ],
      nutrition: normalizeTextBlock(data.nutrition, '后台暂未配置营养说明。'),
      selectTips: normalizeTextBlock(data.selectionTips, '后台暂未配置挑选建议。'),
      storageTips: normalizeTextBlock(data.storageMethod, '后台暂未配置保存建议。'),
      relatedRecipes: normalizeRelatedRecipes(data.relatedRecipes)
    };
    void recordIngredientViewHistory(id);
    void syncFavoriteState(id).catch(() => undefined);
  } catch (err) {
    remoteError.value = err instanceof Error ? err.message : '加载失败';
  } finally {
    remoteLoading.value = false;
  }
};

const isHeaderSolid = ref(false);
const priceRecords = ref<IngredientPriceRecord[]>([]);
const basketItemIds = ref<string[]>([]);
const favoriteRecordId = ref<number | null>(null);
const favoriteChanging = ref(false);
const isPricePanelVisible = ref(false);
const manualPrice = ref('');
const weightUnitOptions = ['g', '斤', 'kg'];
const unitOptions = computed(() => getUnitOptionsByIngredient(ingredient.value.name));
const weightUnits = ['g', '斤', 'kg'];
const manualUnitIndex = ref(0);
const manualSpecAmount = ref('500');
const manualDate = ref(new Date().toISOString().slice(0, 10));
const selectedPriceIndex = ref(0);
const isDeletePriceActionVisible = ref(false);
const activeOverviewTab = ref<OverviewTabId>('basic');
const overviewTabs: { id: OverviewTabId; label: string }[] = [
  { id: 'basic', label: '基础' },
  { id: 'price', label: '价格' }
];
const activeTipsTab = ref<TipsTabId>('select');
const tipsTabs: { id: TipsTabId; label: string }[] = [
  { id: 'select', label: '挑选' },
  { id: 'storage', label: '保存' },
  { id: 'nutrition', label: '营养' }
];
const visiblePriceRecords = computed(() => priceRecords.value.slice(0, 5).reverse());
const selectedManualUnit = computed(() => unitOptions.value[manualUnitIndex.value] ?? unitOptions.value[0] ?? '斤');
const isWeightUnit = computed(() => weightUnits.includes(selectedManualUnit.value));
const convertedPriceText = computed(() => {
  const price = Number(manualPrice.value);
  if (!Number.isFinite(price) || price <= 0) {
    return '';
  }

  const convertedPrice = normalizePriceToJin(price, selectedManualUnit.value, Number(manualSpecAmount.value));
  return `${convertedPrice}元/${getNormalizedUnit(selectedManualUnit.value)}`;
});
const selectedPriceRecord = computed(() => visiblePriceRecords.value[selectedPriceIndex.value]);
const selectedPriceText = computed(() => {
  const record = selectedPriceRecord.value;
  if (record) {
    return `¥${record.price}/${record.unit}`;
  }
  return latestPriceText.value;
});
const selectedPriceDateText = computed(() => {
  const record = selectedPriceRecord.value;
  if (record) {
    return `${formatPriceDate(record.date)} 价格`;
  }
  return '最近记录';
});
const pricePointItems = computed(() => {
  const records = visiblePriceRecords.value;
  if (!records.length) {
    return [];
  }

  const prices = records.map((record) => record.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const range = Math.max(maxPrice - minPrice, 1);
  const stepX = records.length > 1 ? 200 / (records.length - 1) : 0;

  return records.map((record, index) => ({
    id: record.id,
    x: 10 + stepX * index,
    y: 90 - ((record.price - minPrice) / range) * 70
  }));
});
const priceLinePoints = computed(() => {
  return pricePointItems.value.map((point) => `${point.x},${point.y}`).join(' ');
});
const activeTipsContent = computed(() => {
  if (activeTipsTab.value === 'nutrition') {
    return ingredient.value.nutrition;
  }
  if (activeTipsTab.value === 'storage') {
    return ingredient.value.storageTips;
  }
  return ingredient.value.selectTips;
});
const ingredientBasketItemId = computed(() => getIngredientBasketItemId(ingredient.value.id));
const isInBasket = computed(() => basketItemIds.value.includes(ingredientBasketItemId.value));
const basketItems = ref<BasketItem[]>([]);
const isFavorite = ref(false);
const estimatedPriceText = computed(() => getIngredientPurchaseText(ingredient.value.name) ?? '参考价待补充');
const latestPriceText = computed(() => {
  const latestRecord = priceRecords.value[0];
  if (!latestRecord) {
    return getIngredientPurchaseText(ingredient.value.name) ?? '暂无记录';
  }

  return `¥${latestRecord.price}/${latestRecord.unit}`;
});
const priceTrendLabel = computed(() => {
  if (priceRecords.value.length < 2) {
    return '待积累';
  }

  const latestPrice = priceRecords.value[0]?.price ?? 0;
  const previousPrice = priceRecords.value[1]?.price ?? latestPrice;
  if (latestPrice > previousPrice) {
    return '上涨';
  }
  if (latestPrice < previousPrice) {
    return '下降';
  }
  return '持平';
});

onLoad((query?: Record<string, string | undefined>) => {
  const id = readIngredientIdFromRoute(query);
  const numericId = Number.parseInt(id, 10);
  if (Number.isFinite(numericId)) {
    currentIngredientId.value = numericId;
    void loadRemoteIngredient(numericId);
  } else {
    remoteError.value = '缺少食材 ID';
  }
  void refreshPriceRecords();
  void syncBasketState().catch(() => undefined);
  void syncFavoriteState().catch(() => undefined);
});

const handleRetryRemote = () => {
  if (!currentIngredientId.value) return;
  void loadRemoteIngredient(currentIngredientId.value);
};

onShow(() => {
  if (!currentIngredientId.value) {
    const recoveredId = Number.parseInt(readIngredientIdFromRoute(), 10);
    if (Number.isFinite(recoveredId)) {
      currentIngredientId.value = recoveredId;
      void loadRemoteIngredient(recoveredId);
    }
  }
  void refreshPriceRecords();
  void syncBasketState().catch(() => undefined);
  void syncFavoriteState().catch(() => undefined);
});

onMounted(() => {
  if (currentIngredientId.value) return;
  const recoveredId = Number.parseInt(readIngredientIdFromRoute(), 10);
  if (Number.isFinite(recoveredId)) {
    currentIngredientId.value = recoveredId;
    void loadRemoteIngredient(recoveredId);
  }
});

onPageScroll((event) => {
  isHeaderSolid.value = event.scrollTop > 120;
});

const goBack = () => {
  if (getCurrentPages().length <= 1) {
    uni.reLaunch({ url: '/pages/ingredients/index' });
    return;
  }

  uni.navigateBack();
};

const goToRecipe = (recipeId: string) => {
  uni.navigateTo({
    url: `/pages/recipe-detail/index?id=${recipeId}`
  });
};

const addToBasket = async () => {
  if (isInBasket.value) {
    const existing = basketItems.value.find((item) => item.ingredientId === ingredient.value.id);
    if (existing) {
      await removeBasketItem(existing.id);
    }
    await syncBasketState();
    uni.showToast({
      title: '已移出菜篮子',
      icon: 'none'
    });
    return;
  }

  await addBasketItem({
    id: ingredientBasketItemId.value,
    recipeId: 'ingredient',
    recipeName: '单买食材',
    name: ingredient.value.name,
    amountText: '适量',
    purchaseText: getIngredientPurchaseText(ingredient.value.name),
    checked: false,
    ingredientId: ingredient.value.id
  });
  await syncBasketState();
  uni.showToast({
    title: '已加入菜篮子',
    icon: 'success'
  });
};

const getLoggedUserId = async () => {
  const user = await syncAuthUserWithBackend(loadAuthUser());
  return user?.id ?? null;
};

const recordIngredientViewHistory = async (ingredientId: number) => {
  try {
    const userId = await getLoggedUserId();
    if (!userId) return;
    await addMobileViewHistory({ userId, ingredientId });
  } catch {
    // 浏览历史写入失败不影响食材详情阅读。
  }
};

const toggleFavorite = async () => {
  if (favoriteChanging.value) return;
  const ingredientId = currentIngredientId.value;
  if (!ingredientId) {
    uni.showToast({ title: '真实食材加载后可收藏', icon: 'none' });
    return;
  }
  favoriteChanging.value = true;
  try {
    const userId = await getLoggedUserId();
    if (!userId) {
      uni.showToast({ title: '请先登录后收藏', icon: 'none' });
      return;
    }
    if (isFavorite.value && favoriteRecordId.value) {
      await deleteMobileFavorite(favoriteRecordId.value);
      isFavorite.value = false;
      favoriteRecordId.value = null;
      uni.showToast({ title: '已取消收藏', icon: 'none' });
      return;
    }
    const record = await addMobileFavorite({ userId, ingredientId });
    isFavorite.value = true;
    favoriteRecordId.value = record.id;
    uni.showToast({ title: '已加入收藏', icon: 'success' });
  } catch (err) {
    uni.showToast({ title: err instanceof Error ? err.message : '操作失败', icon: 'none' });
  } finally {
    favoriteChanging.value = false;
  }
};

const syncBasketState = async () => {
  basketItems.value = await loadBasketItems();
  basketItemIds.value = basketItems.value.map((item) => item.ingredientId ? getIngredientBasketItemId(item.ingredientId) : item.id);
};

const syncFavoriteState = async (targetIngredientId = currentIngredientId.value) => {
  if (!targetIngredientId) {
    isFavorite.value = false;
    favoriteRecordId.value = null;
    return;
  }
  const userId = await getLoggedUserId();
  if (!userId) {
    isFavorite.value = false;
    favoriteRecordId.value = null;
    return;
  }
  const data = await listMobileFavorites({ userId, page: 1, pageSize: 100 });
  const record = data.list.find((item) => item.ingredientId === targetIngredientId);
  isFavorite.value = Boolean(record);
  favoriteRecordId.value = record?.id ?? null;
};

const refreshPriceRecords = async () => {
  if (!currentIngredientId.value) {
    priceRecords.value = [];
    return;
  }
  priceRecords.value = await getPriceRecordsByIngredient(currentIngredientId.value, ingredient.value.name);
  selectedPriceIndex.value = Math.max(visiblePriceRecords.value.length - 1, 0);
  isDeletePriceActionVisible.value = false;
};

const selectPriceRecord = (index: number) => {
  selectedPriceIndex.value = index;
  isDeletePriceActionVisible.value = false;
};

const selectPriceByTouch = (event: TouchEvent) => {
  const records = visiblePriceRecords.value;
  if (!records.length) {
    return;
  }

  const target = event.currentTarget as HTMLElement | null;
  const touch = event.touches[0];
  if (!target || !touch) {
    return;
  }

  const rect = target.getBoundingClientRect();
  const ratio = Math.min(Math.max((touch.clientX - rect.left) / rect.width, 0), 1);
  selectedPriceIndex.value = Math.round(ratio * (records.length - 1));
  isDeletePriceActionVisible.value = false;
};

const showDeletePriceAction = () => {
  if (!selectedPriceRecord.value) {
    return;
  }

  isDeletePriceActionVisible.value = true;
};

const openPricePanel = () => {
  const unitMatch = getIngredientPurchaseText(ingredient.value.name)?.match(/\/(.+)$/);
  const suggestedUnit = unitMatch?.[1] ?? '斤';
  const options = unitOptions.value;
  manualUnitIndex.value = options.some((unit) => weightUnits.includes(unit))
    ? Math.max(options.indexOf('g'), 0)
    : Math.max(options.indexOf(suggestedUnit), 0);
  manualSpecAmount.value = '500';
  manualDate.value = new Date().toISOString().slice(0, 10);
  manualPrice.value = '';
  isPricePanelVisible.value = true;
};

const closePricePanel = () => {
  isPricePanelVisible.value = false;
};

const saveManualPrice = async () => {
  const price = Number(manualPrice.value);
  if (!Number.isFinite(price) || price <= 0) {
    uni.showToast({ title: '请输入有效价格', icon: 'none' });
    return;
  }

  try {
    await addPriceRecords([
      {
        id: `${ingredient.value.id}-${Date.now()}`,
        ingredientId: Number(ingredient.value.id),
        ingredientName: ingredient.value.name,
        price: normalizePriceToJin(price, selectedManualUnit.value, Number(manualSpecAmount.value)),
        unit: getNormalizedUnit(selectedManualUnit.value),
        date: manualDate.value.trim() || new Date().toISOString().slice(0, 10)
      }
    ]);
    await refreshPriceRecords();
    closePricePanel();
    uni.showToast({ title: '价格已记录', icon: 'success' });
  } catch (error) {
    uni.showToast({ title: error instanceof Error ? error.message : '保存失败', icon: 'none' });
  }
};

const deleteSelectedPriceRecord = async () => {
  const record = selectedPriceRecord.value;
  if (!record) {
    return;
  }

  uni.showModal({
    title: '删除价格记录',
    content: `确认删除 ${formatPriceDate(record.date)} 的 ¥${record.price}/${record.unit}？`,
    confirmText: '删除',
    confirmColor: '#7a8b6f',
    success: async (result) => {
      if (!result.confirm) {
        return;
      }

      try {
        await removePriceRecord(record.id);
        await refreshPriceRecords();
        isDeletePriceActionVisible.value = false;
        uni.showToast({
          title: '已删除',
          icon: 'none'
        });
      } catch (error) {
        uni.showToast({ title: error instanceof Error ? error.message : '删除失败', icon: 'none' });
      }
    }
  });
};

const handleUnitChange = (event: Event) => {
  const detail = event as unknown as { detail?: { value?: number } };
  manualUnitIndex.value = detail.detail?.value ?? 0;
};

const getUnitOptionsByIngredient = (name: string) => {
  const unitMap: Record<string, string[]> = {
    生抽: ['500ml/瓶', '1L/瓶', '瓶'],
    酱油: ['500ml/瓶', '1L/瓶', '瓶'],
    料酒: ['500ml/瓶', '瓶'],
    食用油: ['5L/桶', '1.8L/桶', '桶'],
    盐: ['400g/袋', '袋'],
    苹果: ['g', '斤', 'kg', '个'],
    草莓: ['g', '斤', 'kg', '盒'],
    虾仁: ['g', '斤', 'kg'],
    三文鱼: ['g', '斤', 'kg']
  };

  return unitMap[name] ?? weightUnitOptions;
};

const handleDateChange = (event: Event) => {
  const detail = event as unknown as { detail?: { value?: string } };
  manualDate.value = detail.detail?.value ?? new Date().toISOString().slice(0, 10);
};

const normalizePriceToJin = (price: number, unit: string, specAmount: number) => {
  if (!weightUnits.includes(unit)) {
    return price;
  }

  const safeAmount = Number.isFinite(specAmount) && specAmount > 0 ? specAmount : 1;
  if (unit === 'g') {
    return Number((price / (safeAmount / 500)).toFixed(2));
  }
  if (unit === 'kg') {
    return Number((price / (safeAmount * 2)).toFixed(2));
  }
  return Number((price / safeAmount).toFixed(2));
};

const getNormalizedUnit = (unit: string) => {
  if (weightUnits.includes(unit)) {
    return '斤';
  }
  return unit;
};

const formatPriceDate = (date: string) => date.slice(5).replace('-', '/');
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background: var(--app-bg);
}

.header-image {
  position: relative;
  width: 100%;
  height: 500rpx;
}

.header-image__bg {
  width: 100%;
  height: 100%;
}

.header-overlay {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 12;
  display: grid;
  grid-template-columns: 64rpx 1fr 64rpx;
  align-items: center;
  gap: 20rpx;
  width: 100%;
  padding: calc(var(--status-bar-height) + 20rpx) 30rpx 20rpx;
  pointer-events: none;
  transition:
    background 0.22s ease,
    box-shadow 0.22s ease,
    border-radius 0.22s ease;
}

.header-overlay.is-solid {
  border-radius: 0 0 34rpx 34rpx;
  background: rgba(255, 253, 252, 0.96);
  box-shadow: 0 14rpx 36rpx rgba(0, 0, 0, 0.04);
  backdrop-filter: blur(22rpx);
  -webkit-backdrop-filter: blur(22rpx);
}

.back-button,
.favorite-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: rgba(255, 253, 252, 0.9);
  backdrop-filter: blur(10rpx);
  pointer-events: auto;
  box-shadow: 0 12rpx 32rpx rgba(0, 0, 0, 0.04);
  transition:
    background 0.22s ease,
    box-shadow 0.22s ease;
}

.header-overlay.is-solid .back-button,
.header-overlay.is-solid .favorite-button {
  background: var(--app-accent-soft);
  box-shadow: none;
}

.favorite-button.is-favorite {
  background: rgba(47, 47, 47, 0.82);
  color: var(--text-white);
}

.header-overlay.is-solid .favorite-button.is-favorite {
  background: var(--app-accent);
  color: var(--text-white);
}

.back-icon,
.favorite-icon {
  color: var(--app-text);
  font-size: var(--font-size-section-title);
  font-weight: var(--font-semibold);
}

.favorite-button.is-favorite .favorite-icon {
  color: var(--text-white);
}

.favorite-icon {
  font-size: var(--font-size-card-title);
}

.header-title {
  overflow: hidden;
  color: var(--app-text);
  font-size: var(--font-size-body);
  font-weight: var(--font-semibold);
  opacity: 0;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: opacity 0.18s ease;
}

.header-overlay.is-solid .header-title {
  opacity: 1;
}

.content {
  position: relative;
  margin-top: -40rpx;
  padding: 0 30rpx calc(170rpx + env(safe-area-inset-bottom, 0));
}

.remote-banner {
  margin-bottom: 20rpx;
  padding: 18rpx 22rpx;
  border-radius: var(--app-radius-card);
}

.remote-banner__text {
  color: var(--app-text-secondary);
  font-size: var(--font-size-tag);
}

.remote-banner__error {
  color: var(--app-danger);
  font-size: var(--font-size-tag);
  line-height: var(--line-caption);
}

.remote-banner__retry {
  margin-top: 12rpx;
  padding: 14rpx 20rpx;
  border-radius: 999rpx;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(255, 253, 252, 0.9);
  color: var(--app-text);
  font-size: var(--font-size-tag);
}

.ingredient-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 22rpx;
  padding: 32rpx;
  margin-bottom: 20rpx;
}

.ingredient-header__content {
  min-width: 0;
  flex: 1;
}

.ingredient-header__main {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 16rpx;
}

.ingredient-name {
  color: var(--app-text);
  font-size: var(--font-size-section-title);
  font-weight: var(--font-semibold);
}

.ingredient-subtitle {
  display: block;
  color: var(--app-text-secondary);
  font-size: var(--font-size-caption);
  line-height: var(--line-body-sm);
}

.ingredient-header__side {
  display: flex;
  align-items: flex-end;
  flex-direction: column;
  gap: 10rpx;
  min-width: 156rpx;
}

.estimate-label {
  color: var(--app-text-tertiary);
  font-size: var(--font-size-tabbar);
  font-weight: var(--font-semibold);
}

.estimate-value {
  color: var(--app-text);
  font-size: var(--font-size-caption);
  font-weight: var(--font-semibold);
}

.overview-section,
.tips-section,
.recipe-section {
  padding: 32rpx;
  margin-bottom: 20rpx;
}

.section-title {
  display: block;
  margin-bottom: 20rpx;
  color: var(--app-text);
  font-size: var(--font-size-body);
  font-weight: var(--font-semibold);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.info-label {
  color: var(--app-text-tertiary);
  font-size: var(--font-size-tag);
}

.info-value {
  color: var(--app-text);
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-medium);
}

.section-content {
  display: block;
  color: var(--app-text-secondary);
  font-size: var(--font-size-caption);
  line-height: var(--line-body);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.section-more {
  color: var(--app-text-tertiary);
  font-size: var(--font-size-tag);
}

.overview-tabs {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8rpx;
  margin-bottom: 24rpx;
  padding: 8rpx;
  border-radius: var(--app-radius-button);
  background: #e9e2d6;
}

.overview-tab {
  height: 62rpx;
  border: 0;
  border-radius: var(--app-radius-button);
  background: transparent;
  color: var(--app-text-secondary);
  font-size: var(--font-size-caption);
  font-weight: var(--font-semibold);
}

.overview-tab.is-active {
  background: var(--app-accent);
  color: var(--text-white);
  box-shadow: 0 12rpx 28rpx rgba(0, 0, 0, 0.06);
}

.overview-tab::after {
  border: 0;
}

.overview-pane {
  min-height: 170rpx;
}

.price-topline {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18rpx;
}

.price-actions {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.delete-price-button {
  position: absolute;
  top: 18rpx;
  right: 18rpx;
  z-index: 2;
  height: 48rpx;
  padding: 0 18rpx;
  border: 0;
  border-radius: var(--app-radius-button);
  background: var(--app-accent);
  color: var(--text-white);
  font-size: var(--font-size-tabbar);
  font-weight: var(--font-medium);
  box-shadow: 0 12rpx 28rpx rgba(0, 0, 0, 0.08);
}

.delete-price-button::after,
.save-price-button::after {
  border: 0;
}

.price-label,
.price-value,
.price-empty {
  display: block;
}

.price-label {
  color: var(--app-text-tertiary);
  font-size: var(--font-size-tabbar);
}

.price-value {
  margin-top: 10rpx;
  color: var(--app-text);
  font-size: var(--font-size-card-title);
  font-weight: var(--font-semibold);
}

.price-line-chart {
  position: relative;
  margin-top: 22rpx;
}

.price-line-chart__svg {
  width: 100%;
  height: 144rpx;
  border-radius: 24rpx;
  background:
    linear-gradient(to bottom, rgba(122, 139, 111, 0.14) 1rpx, transparent 1rpx) 0 0 / 100% 33%,
    #e9e2d6;
}

.price-line-chart__line {
  stroke: var(--app-accent);
  stroke-width: 4;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.price-line-chart__point {
  fill: #fffdfc;
  stroke: var(--app-accent);
  stroke-width: 3;
}

.price-line-chart__point.is-active {
  fill: var(--app-accent);
  stroke: #fffdfc;
  stroke-width: 4;
}

.price-line-chart__labels {
  display: flex;
  justify-content: space-between;
  margin-top: 8rpx;
  color: var(--app-text-tertiary);
  font-size: var(--font-size-tabbar);
}

.price-empty {
  margin-top: 14rpx;
  color: var(--app-text-secondary);
  font-size: var(--font-size-tag);
  line-height: var(--line-body-sm);
}

.tips-tabs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8rpx;
  margin-bottom: 22rpx;
  padding: 8rpx;
  border-radius: var(--app-radius-button);
  background: #e9e2d6;
}

.tips-tab {
  height: 58rpx;
  border: 0;
  border-radius: var(--app-radius-button);
  background: transparent;
  color: var(--app-text-secondary);
  font-size: var(--font-size-tag);
  font-weight: var(--font-medium);
}

.tips-tab.is-active {
  background: var(--app-accent);
  color: var(--text-white);
}

.tips-tab::after {
  border: 0;
}

.price-mask {
  position: fixed;
  inset: 0;
  z-index: 30;
  display: flex;
  align-items: flex-end;
  padding: 24rpx;
  background: rgba(47, 47, 47, 0.18);
  backdrop-filter: blur(10rpx);
  -webkit-backdrop-filter: blur(10rpx);
}

.price-panel {
  width: 100%;
  padding: 28rpx;
}

.price-panel__head {
  display: flex;
  justify-content: space-between;
  gap: 20rpx;
}

.price-panel__title,
.price-panel__desc,
.field-label {
  display: block;
}

.price-panel__title {
  color: var(--app-text);
  font-size: var(--font-size-card-title);
  font-weight: var(--font-semibold);
}

.price-panel__desc {
  margin-top: 8rpx;
  color: var(--app-text-secondary);
  font-size: var(--font-size-tag);
}

.price-panel__close {
  color: var(--app-text-tertiary);
  font-size: var(--font-size-detail-title);
  line-height: var(--line-tabbar);
}

.price-form {
  display: grid;
  grid-template-columns: 0.9fr 1.1fr;
  gap: 16rpx;
  margin-top: 26rpx;
}

.price-field.is-full {
  grid-column: 1 / -1;
}

.field-label {
  margin-bottom: 10rpx;
  color: var(--app-text-secondary);
  font-size: var(--font-size-tabbar);
  font-weight: var(--font-semibold);
}

.field-input {
  display: flex;
  align-items: center;
  gap: 8rpx;
  height: 72rpx;
  padding: 0 20rpx;
  border-radius: 24rpx;
  background: #e9e2d6;
  color: var(--app-text);
  font-size: var(--font-size-caption);
  font-weight: var(--font-medium);
}

.field-input.is-select {
  justify-content: space-between;
}

.amount-input {
  padding-right: 10rpx;
}

.field-input input {
  min-width: 0;
  flex: 1;
  font-size: var(--font-size-caption);
}

.unit-select {
  display: flex;
  align-items: center;
  gap: 6rpx;
  padding: 11rpx 14rpx;
  border-radius: var(--app-radius-button);
  background: #fffdfc;
  color: var(--app-text);
  font-size: var(--font-size-tag);
  font-weight: var(--font-semibold);
  box-shadow: inset 0 0 0 1rpx rgba(0, 0, 0, 0.04);
}

.select-arrow {
  color: var(--app-text-tertiary);
  font-size: var(--font-size-tag);
}

.price-form-tip {
  display: block;
  margin-top: 18rpx;
  color: var(--app-text-tertiary);
  font-size: var(--font-size-tabbar);
  line-height: var(--line-body-sm);
}

.converted-price {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
  margin-top: 18rpx;
  padding: 18rpx 20rpx;
  border-radius: 24rpx;
  background: #e9e2d6;
}

.converted-price__label {
  color: var(--app-text-secondary);
  font-size: var(--font-size-tag);
  font-weight: var(--font-semibold);
}

.converted-price__value {
  color: var(--app-text);
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-semibold);
}

.save-price-button {
  width: 100%;
  height: 76rpx;
  margin-top: 24rpx;
  border: 0;
  border-radius: var(--app-radius-button);
  background: var(--app-accent);
  color: var(--text-white);
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-semibold);
}

.recipe-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.recipe-item {
  display: flex;
  gap: 20rpx;
}

.recipe-item__image {
  width: 160rpx;
  height: 160rpx;
  border-radius: 12rpx;
}

.recipe-item__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: center;
  gap: 12rpx;
}

.recipe-item__name {
  color: var(--app-text);
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-medium);
}

.recipe-item__meta {
  color: var(--app-text-secondary);
  font-size: var(--font-size-tag);
}

.bottom-actions {
  position: fixed;
  right: 30rpx;
  bottom: calc(24rpx + env(safe-area-inset-bottom, 0));
  left: 30rpx;
  z-index: 20;
  display: grid;
  grid-template-columns: 0.9fr 1.2fr;
  gap: 14rpx;
}

.record-bottom-button,
.add-basket-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  width: 100%;
  height: 82rpx;
  border: 0;
  border-radius: var(--app-radius-button);
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-semibold);
}

.record-bottom-button {
  background: #fffdfc;
  color: var(--app-text);
  box-shadow: 0 16rpx 38rpx rgba(0, 0, 0, 0.06);
}

.add-basket-button {
  background: var(--app-accent);
  color: var(--text-white);
  box-shadow: 0 18rpx 46rpx rgba(0, 0, 0, 0.1);
}

.add-basket-button.is-in-basket {
  background: #a8b48a;
}

.bottom-button__icon {
  width: 30rpx;
  height: 30rpx;
}

.record-bottom-button::after,
.add-basket-button::after {
  border: 0;
}
</style>
