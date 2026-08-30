<template>
  <view class="page">
    <content-detail-hero
      :src="ingredient.image"
      :alt="`${ingredient.name || '食材'}主图`"
      :favorite="isFavorite"
      @back="goBack"
      @favorite="toggleFavorite"
      @share="shareIngredient"
    />

    <view class="content">
      <content-detail-state v-if="remoteLoading" state="loading" />
      <content-detail-state
        v-else-if="remoteError"
        state="error"
        title="食材资料暂时没有加载出来"
        :description="remoteError"
        @action="handleRetryRemote"
      />

      <template v-else>
        <header class="ingredient-heading">
          <view class="ingredient-heading__title-row">
            <text class="ingredient-name">{{ ingredient.name }}</text>
            <text class="ingredient-season">{{ ingredient.seasonTag.label }}</text>
          </view>
          <text class="ingredient-subtitle">{{ ingredient.subtitle }}</text>
        </header>

        <view class="ingredient-info-strip" aria-label="食材概要">
          <view v-for="item in detailInfoItems" :key="item.label" class="ingredient-info-strip__item">
            <text class="ingredient-info-strip__value">{{ item.value }}</text>
            <text class="ingredient-info-strip__label">{{ item.label }}</text>
          </view>
        </view>

        <section class="guide-module">
          <view class="tips-tabs" role="tablist" aria-label="食材使用指南">
            <button
              v-for="tab in tipsTabs"
              :key="tab.id"
              :class="['tips-tab', { 'is-active': activeTipsTab === tab.id }]"
              role="tab"
              :aria-selected="activeTipsTab === tab.id"
              @tap="activeTipsTab = tab.id"
            >
              {{ tab.label }}
            </button>
          </view>

          <view v-if="activeGuideItems.length" class="guide-list" role="tabpanel">
            <article v-for="(item, index) in activeGuideItems" :key="`${activeTipsTab}-${index}`" class="guide-item">
              <view class="guide-item__dot" aria-hidden="true" />
              <view class="guide-item__copy">
                <text class="guide-item__title">{{ item.title }}</text>
                <text v-if="item.description" class="guide-item__description">{{ item.description }}</text>
              </view>
            </article>
          </view>
          <view v-else class="guide-empty" role="tabpanel">
            <text>暂无这部分说明</text>
          </view>
        </section>

        <section class="recipe-section">
          <view class="section-header">
            <text class="section-title">相关菜谱</text>
            <button class="section-more" @tap="goToRelatedRecipes">
              <text>查看更多</text>
              <app-icon name="chevron-right" size="22rpx" />
            </button>
          </view>
          <scroll-view v-if="ingredient.relatedRecipes.length" class="related-recipe-rail" scroll-x>
            <view class="related-recipe-rail__inner">
              <article
                v-for="recipe in ingredient.relatedRecipes"
                :key="recipe.id"
                class="recipe-item"
                @tap="goToRecipe(recipe.id)"
              >
                <image
                  class="recipe-item__image"
                  :src="recipe.image"
                  :alt="recipe.name"
                  mode="aspectFill"
                  lazy-load
                />
                <view class="recipe-item__body">
                  <text class="recipe-item__name">{{ recipe.name }}</text>
                  <text class="recipe-item__meta">{{ recipe.duration }} · {{ recipe.difficulty }}</text>
                </view>
              </article>
            </view>
          </scroll-view>
          <text v-else class="recipe-empty">暂时没有相关菜谱</text>
        </section>
      </template>
    </view>

    <content-detail-bottom-bar
      v-if="!remoteLoading && !remoteError && ingredient.id"
      :primary-label="isInBasket ? '已加入菜篮' : '加入菜篮'"
      :primary-icon="isInBasket ? 'check' : 'basket-action'"
      :primary-pressed="isInBasket"
      @primary="addToBasket"
    />

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
import ContentDetailBottomBar from '../../components/content-detail-bottom-bar.vue';
import ContentDetailHero from '../../components/content-detail-hero.vue';
import ContentDetailState from '../../components/content-detail-state.vue';
import { getDetailPreviewFixture } from '../../dev/detail-preview-fixtures';
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
import { getContentDetailErrorMessage } from '../../utils/content-detail-error';
import { navigateBackFromContentDetail, resolveDetailEntryOrigin } from '../../utils/content-detail-navigation';

interface BasicInfo {
  label: string;
  value: string;
}

const detailEntryOrigin = ref('');

interface RelatedRecipe {
  id: string;
  name: string;
  image: string;
  duration: string;
  difficulty: string;
}

interface GuideItem {
  title: string;
  description: string;
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
  guides: Record<TipsTabId, GuideItem[]>;
  relatedRecipes: RelatedRecipe[];
}

type OverviewTabId = 'basic' | 'price';
type TipsTabId = 'select' | 'storage' | 'usage';

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
  subtitle: '正在加载食材资料',
  image: '',
  seasonTag: {
    type: 'success',
    label: '时令'
  },
  basicInfo: [],
  guides: { select: [], storage: [], usage: [] },
  relatedRecipes: []
});

const remoteLoading = ref(false);
const remoteError = ref<string | null>(null);
const heroFailed = ref(false);
const currentIngredientId = ref<number | null>(null);
const currentRouteIngredientId = ref('');
const previewRouteOptions = ref<Record<string, string | undefined>>({});

const normalizeTextBlock = (value: unknown) => {
  if (typeof value !== 'string') return '';
  return value.trim();
};

const fallbackGuideItems = (value: unknown, label: string): GuideItem[] => {
  const content = normalizeTextBlock(value);
  if (!content || /^[\[{]/u.test(content)) return [];
  return content
    .split(/\n+|(?<=[。！？；])/u)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 3)
    .map((description, index) => ({
      title: `${label}要点${index ? ` ${index + 1}` : ''}`,
      description
    }));
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

const loadRemoteIngredient = async (id: string | number) => {
  remoteLoading.value = true;
  remoteError.value = null;
  try {
    const data = getDetailPreviewFixture('ingredient', id, previewRouteOptions.value) ?? await getIngredient(id);
    currentIngredientId.value = data.id;
    const seasonText = data.season?.label?.trim() || data.seasonMonth?.trim() || '暂无';
    ingredient.value = {
      id: String(data.id),
      name: data.name,
      subtitle: data.category?.name ?? '食材',
      image: data.cover ?? '',
      seasonTag: {
        type: 'success',
        label: data.season?.isInSeason ? '当季' : '常备'
      },
      basicInfo: [
        { label: '类别', value: data.category?.name ?? '未分类' },
        { label: '季节', value: seasonText },
        { label: '价格', value: data.currentPrice ? `¥${data.currentPrice}/${data.priceUnit ?? '斤'}` : '待补充' },
        { label: '更新时间', value: data.updatedAt?.slice(0, 10) ?? '—' }
      ],
      guides: {
        select: data.selectionGuide?.length ? data.selectionGuide : fallbackGuideItems(data.selectionTips, '挑选'),
        storage: data.storageGuide?.length ? data.storageGuide : fallbackGuideItems(data.storageMethod, '保存'),
        usage: data.eatingGuide?.length ? data.eatingGuide : fallbackGuideItems(data.nutrition, '食用')
      },
      relatedRecipes: normalizeRelatedRecipes(data.relatedRecipes)
    };
    void recordIngredientViewHistory(data.id);
    void syncFavoriteState(data.id).catch(() => undefined);
  } catch (err) {
    remoteError.value = getContentDetailErrorMessage(err);
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
  { id: 'select', label: '怎么挑' },
  { id: 'storage', label: '怎么放' },
  { id: 'usage', label: '怎么吃' }
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
const detailInfoItems = computed(() => {
  const valueOf = (label: string) => ingredient.value.basicInfo.find((item) => item.label === label)?.value;
  return [
    {
      label: '时令时间',
      value: valueOf('季节') || ingredient.value.seasonTag.label
    },
    {
      label: '约多少钱一斤',
      value: valueOf('价格') || estimatedPriceText.value
    },
    {
      label: '时令状态',
      value: ingredient.value.seasonTag.label
    }
  ];
});
const activeGuideItems = computed<GuideItem[]>(() => ingredient.value.guides[activeTipsTab.value] ?? []);
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
  previewRouteOptions.value = query ?? {};
  detailEntryOrigin.value = resolveDetailEntryOrigin(query?.from);
  const id = readIngredientIdFromRoute(query);
  if (id) {
    currentRouteIngredientId.value = id;
    void loadRemoteIngredient(id);
  } else {
    remoteError.value = '缺少食材 ID';
  }
  void refreshPriceRecords();
  void syncBasketState().catch(() => undefined);
  void syncFavoriteState().catch(() => undefined);
});

const handleRetryRemote = () => {
  const id = currentRouteIngredientId.value || currentIngredientId.value;
  if (!id) return;
  void loadRemoteIngredient(id);
};

onShow(() => {
  if (!currentRouteIngredientId.value) {
    const recoveredId = readIngredientIdFromRoute();
    if (recoveredId) {
      currentRouteIngredientId.value = recoveredId;
      void loadRemoteIngredient(recoveredId);
    }
  }
  void refreshPriceRecords();
  void syncBasketState().catch(() => undefined);
  void syncFavoriteState().catch(() => undefined);
});

onMounted(() => {
  if (currentRouteIngredientId.value) return;
  const recoveredId = readIngredientIdFromRoute();
  if (recoveredId) {
    currentRouteIngredientId.value = recoveredId;
    void loadRemoteIngredient(recoveredId);
  }
});

onPageScroll((event) => {
  isHeaderSolid.value = event.scrollTop > 120;
});

const goBack = () => {
  navigateBackFromContentDetail(
    detailEntryOrigin.value || resolveDetailEntryOrigin(),
    '/pages/ingredients/index?type=ingredient'
  );
};

const shareIngredient = () => {
  uni.showToast({ title: '已准备分享内容', icon: 'none' });
};

const goToRecipe = (recipeId: string) => {
  uni.navigateTo({
    url: `/pages/recipe-detail/index?id=${recipeId}`
  });
};

const goToRelatedRecipes = () => {
  uni.navigateTo({
    url: `/pages/search/index?keyword=${encodeURIComponent(ingredient.value.name)}`
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
  padding: calc(var(--app-safe-area-top) + 20rpx) 30rpx 20rpx;
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
  padding: 0 30rpx calc(170rpx + var(--app-safe-area-bottom));
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
  bottom: calc(24rpx + var(--app-safe-area-bottom));
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

.detail-hero {
  width: 100%;
  aspect-ratio: 852 / 844;
  overflow: hidden;
}

.detail-hero .header-image__bg,
.hero-media-fallback {
  width: 100%;
  height: 100%;
}

/* Frozen prototype parity: full-bleed hero and one calm information surface. */
.page {
  min-height: 100dvh;
  padding-bottom: calc(144rpx + var(--app-safe-area-bottom));
  overflow-x: hidden;
  background: var(--app-bg);
}

.content {
  position: relative;
  z-index: 2;
  margin-top: -32rpx;
  padding: 0 40rpx;
  border-radius: 32rpx 32rpx 0 0;
  background: var(--app-bg);
  box-shadow: 0 -8rpx 24rpx rgba(47, 47, 47, 0.035);
}

.detail-state,
.ingredient-heading,
.ingredient-info-strip,
.guide-module,
.recipe-section {
  margin: 0;
}

.detail-state {
  display: flex;
  min-height: 360rpx;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: var(--space-3);
  padding: 48rpx 0;
  color: var(--text-tertiary);
  text-align: center;
}

.detail-state__line {
  width: 78%;
  height: 24rpx;
  border-radius: 999rpx;
  background: var(--app-surface);
}

.detail-state__line.is-title {
  width: 46%;
  height: 44rpx;
}

.detail-state__line.is-short {
  width: 58%;
}

.detail-state__title,
.detail-state__description {
  display: block;
}

.detail-state__title {
  color: var(--text-primary);
  font-size: var(--font-size-list-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-list-title);
}

.detail-state__description {
  max-width: 520rpx;
  color: var(--text-tertiary);
  font-size: var(--font-size-caption);
  line-height: var(--line-caption);
}

.detail-state__retry {
  min-width: 176rpx;
  min-height: var(--touch-target);
  margin-top: var(--space-2);
  border: 1rpx solid var(--app-border);
  border-radius: var(--app-radius-button);
  color: var(--app-primary);
  background: transparent;
  font-size: var(--font-size-caption);
  font-weight: var(--font-medium);
}

.detail-state__retry::after {
  border: 0;
}

.ingredient-heading {
  padding: 28rpx 0 24rpx;
}

.ingredient-heading__title-row {
  display: flex;
  min-width: 0;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20rpx;
}

.ingredient-name {
  min-width: 0;
  color: var(--text-primary);
  font-size: var(--font-size-hero);
  font-weight: var(--font-semibold);
  line-height: var(--line-hero);
}

.ingredient-season {
  flex: none;
  margin-top: 6rpx;
  padding: 4rpx 14rpx;
  border-radius: 999rpx;
  color: var(--app-primary);
  background: var(--app-accent-soft);
  font-size: var(--font-size-tag);
  font-weight: var(--font-medium);
  line-height: var(--line-tag);
}

.ingredient-subtitle {
  display: block;
  margin-top: 4rpx;
  color: var(--text-secondary);
  font-size: var(--font-size-caption);
  font-weight: var(--font-regular);
  line-height: var(--line-caption);
}

.ingredient-info-strip {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  padding: 18rpx 0;
  border-top: 1rpx solid var(--app-border);
  border-bottom: 1rpx solid var(--app-border);
}

.ingredient-info-strip__item {
  min-width: 0;
  padding: 0 12rpx;
  border-left: 1rpx solid var(--app-border);
  text-align: center;
}

.ingredient-info-strip__item:first-child {
  border-left: 0;
}

.ingredient-info-strip__value,
.ingredient-info-strip__label {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ingredient-info-strip__value {
  color: var(--app-primary);
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-semibold);
  line-height: var(--line-body-sm);
}

.ingredient-info-strip__label {
  margin-top: 2rpx;
  color: var(--text-tertiary);
  font-size: var(--font-size-tag);
  font-weight: var(--font-regular);
  line-height: var(--line-tag);
}

.guide-module {
  border-bottom: 1rpx solid var(--app-border);
}

.tips-tabs {
  display: grid;
  min-height: var(--touch-target);
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin: 0;
  padding: 0;
  border-bottom: 1rpx solid var(--app-border);
  background: transparent;
}

.tips-tab {
  position: relative;
  min-height: var(--touch-target);
  padding: 0;
  border: 0;
  border-radius: 0;
  color: var(--text-secondary);
  background: transparent;
  font-size: var(--font-size-body);
  font-weight: var(--font-medium);
  line-height: var(--line-body);
}

.tips-tab::after {
  border: 0;
}

.tips-tab.is-active {
  color: var(--app-primary);
  background: transparent;
}

.guide-list {
  display: grid;
}

.guide-item {
  display: grid;
  grid-template-columns: 12rpx minmax(0, 1fr);
  align-items: start;
  gap: 20rpx;
  padding: 24rpx 0;
  border-bottom: 1rpx solid var(--app-border);
}

.guide-item:last-child {
  border-bottom: 0;
}

.guide-item__dot {
  width: 10rpx;
  height: 10rpx;
  margin-top: 16rpx;
  border-radius: 50%;
  background: var(--app-primary);
}

.guide-item__copy {
  min-width: 0;
}

.guide-item__title,
.guide-item__description {
  display: block;
}

.guide-empty {
  display: flex;
  min-height: 120rpx;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  font-size: var(--font-size-caption);
  line-height: var(--line-caption);
}

.guide-item__title {
  color: var(--text-primary);
  font-size: var(--font-size-list-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-list-title);
}

.guide-item__description {
  margin-top: 6rpx;
  color: var(--text-secondary);
  font-size: var(--font-size-caption);
  font-weight: var(--font-regular);
  line-height: var(--line-caption);
}

.recipe-section {
  padding: 36rpx 0 10rpx;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 22rpx;
}

.section-title {
  margin: 0;
  font-size: var(--font-size-section-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-section-title);
}

.section-more {
  display: flex;
  min-height: var(--touch-target);
  align-items: center;
  gap: 4rpx;
  margin: 0;
  padding: 0;
  border: 0;
  color: var(--text-tertiary);
  background: transparent;
  font-size: var(--font-size-caption);
  line-height: var(--line-caption);
}

.section-more::after {
  border: 0;
}

.related-recipe-rail {
  width: calc(100% + 40rpx);
}

.related-recipe-rail__inner {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: calc((100% - 20rpx) / 2.3);
  gap: 20rpx;
  padding: 0 40rpx 8rpx 0;
}

.recipe-item {
  display: block;
  overflow: hidden;
  padding: 0 0 16rpx;
  border: 0;
  border-radius: var(--radius-md);
  background: var(--app-surface-strong);
}

.recipe-item__image {
  width: 100%;
  height: auto;
  aspect-ratio: 1;
  border-radius: 0;
}

.recipe-item__body {
  padding: 14rpx 16rpx 0;
}

.recipe-item__name {
  overflow: hidden;
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-semibold);
  line-height: var(--line-body-sm);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recipe-item__meta {
  color: var(--text-tertiary);
  font-size: var(--font-size-tag);
  font-weight: var(--font-regular);
  line-height: var(--line-tag);
}

.recipe-empty {
  display: block;
  min-height: 120rpx;
  padding-top: 28rpx;
  border-top: 1rpx solid var(--app-border);
  color: var(--text-tertiary);
  font-size: var(--font-size-caption);
  line-height: var(--line-caption);
}

.bottom-actions {
  position: fixed;
  z-index: var(--z-tabbar);
  right: 0;
  bottom: 0;
  left: 0;
  display: block;
  width: min(100%, 393px);
  margin: 0 auto;
  padding: 14rpx 32rpx calc(14rpx + var(--app-safe-area-bottom));
  border: 0;
  background: rgba(255, 253, 252, 0.78);
  box-shadow: 0 -8rpx 28rpx rgba(47, 47, 47, 0.04);
  backdrop-filter: blur(18px) saturate(112%);
  -webkit-backdrop-filter: blur(18px) saturate(112%);
}

.add-basket-button {
  display: flex;
  grid-template-columns: 1fr;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  width: 100%;
  min-height: 88rpx;
  border: 0;
  border-radius: var(--app-radius-button);
  color: var(--text-white);
  background: var(--app-primary);
  font-size: var(--font-size-body);
  font-weight: var(--font-semibold);
}

.add-basket-button::after {
  border: 0;
}

@media (max-width: 375px) {
  .content {
    padding-inline: 32rpx;
  }

  .guide-item {
    grid-template-columns: 144rpx minmax(0, 1fr);
  }

  .guide-item__image {
    width: 144rpx;
    height: 144rpx;
  }

  .related-recipe-rail {
    width: calc(100% + 32rpx);
  }

  .related-recipe-rail__inner {
    padding-right: 32rpx;
  }
}

@media (min-width: 1px) {
  .page {
    max-width: 393px;
    margin: 0 auto;
  }
}
</style>
<style scoped lang="scss" src="./canonical.scss"></style>
