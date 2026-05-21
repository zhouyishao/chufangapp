<template>
  <view class="page">
    <view class="header-image">
      <image class="header-image__bg" :src="ingredient.image" mode="aspectFill" />
      <view :class="['header-overlay', { 'is-solid': isHeaderSolid }]">
        <view class="back-button" @click="goBack">
          <text class="back-icon">←</text>
        </view>
        <text class="header-title">{{ ingredient.name }}</text>
        <view :class="['favorite-button', { 'is-favorite': isFavorite }]" @click="toggleFavorite">
          <text class="favorite-icon">{{ isFavorite ? '★' : '☆' }}</text>
        </view>
      </view>
    </view>

    <view class="content">
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
          <svg
            class="bottom-button__icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
          <text>添加价格</text>
        </button>
        <button
          :class="['add-basket-button', { 'is-in-basket': isInBasket }]"
          @tap="addToBasket"
        >
          <svg
            v-if="!isInBasket"
            class="bottom-button__icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
          <svg
            v-else
            class="bottom-button__icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.4"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
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
                  <text class="select-arrow">⌄</text>
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
                <text class="select-arrow">⌄</text>
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
                <text class="select-arrow">⌄</text>
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
import { computed, ref } from 'vue';
import { onLoad, onPageScroll, onShow } from '@dcloudio/uni-app';
import {
  addBasketItem,
  getIngredientBasketItemId,
  getIngredientPurchaseText,
  loadBasketItems,
  removeBasketItem
} from '../../services/basket';
import {
  addFavoriteIngredient,
  loadFavoriteIngredients,
  removeFavoriteIngredient
} from '../../services/favorites';
import { addPriceRecords, getPriceRecordsByIngredient, removePriceRecord } from '../../services/price';
import type { IngredientPriceRecord } from '../../services/price';

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

const ingredient = ref<Ingredient>({
  id: '1',
  name: '芦笋',
  subtitle: '初夏时令蔬菜，清爽脆嫩',
  image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=80',
  seasonTag: {
    type: 'success',
    label: '5月当季'
  },
  basicInfo: [
    { label: '产地', value: '山东' },
    { label: '季节', value: '春夏' },
    { label: '类别', value: '蔬菜' },
    { label: '保存', value: '冷藏3-5天' }
  ],
  nutrition: '芦笋富含维生素A、C、E及多种微量元素，具有较高的营养价值。其中含有的天门冬酰胺对心血管有益，叶酸含量也较为丰富。',
  selectTips: '选择笋尖紧密、茎秆挺直、切口新鲜湿润的芦笋。颜色应呈鲜绿色，避免选择发黄或有斑点的。粗细适中的口感更佳。',
  storageTips: '芦笋不耐储存，建议购买后尽快食用。如需保存，可将根部用湿纸巾包裹后放入保鲜袋，置于冰箱冷藏室，可保存3-5天。',
  relatedRecipes: [
    {
      id: 'recipe-1',
      name: '芦笋虾仁',
      image: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80',
      duration: '15分钟',
      difficulty: '简单'
    },
    {
      id: 'recipe-2',
      name: '白灼芦笋',
      image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80',
      duration: '10分钟',
      difficulty: '简单'
    },
    {
      id: 'recipe-3',
      name: '芦笋炒肉',
      image: 'https://images.unsplash.com/photo-1604909052743-94e838986d24?auto=format&fit=crop&w=800&q=80',
      duration: '20分钟',
      difficulty: '中等'
    }
  ]
});

const ingredientOverrides: Record<string, Partial<Ingredient>> = {
  '1': {
    id: '1',
    name: '虾仁',
    subtitle: '高蛋白低脂肪，适合快手烹饪',
    image: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=1200&q=80',
    seasonTag: { type: 'primary', label: '高蛋白' },
    basicInfo: [
      { label: '类别', value: '水产' },
      { label: '口感', value: '弹嫩' },
      { label: '做法', value: '快炒/蒸煮' },
      { label: '保存', value: '冷冻保存' }
    ],
    nutrition: '虾仁蛋白质含量高，脂肪相对较低，适合日常补充优质蛋白。',
    selectTips: '选择颜色自然透亮、形态完整、没有明显异味的虾仁。冷冻虾仁尽量选择冰衣薄而均匀的。',
    storageTips: '冷冻虾仁取出后建议尽快烹饪，解冻后不建议反复冷冻。'
  },
  '2': {
    id: '2',
    name: '三文鱼',
    subtitle: '富含 Omega-3，适合轻煎和烤制',
    image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=1200&q=80',
    seasonTag: { type: 'primary', label: '营养优选' },
    basicInfo: [
      { label: '类别', value: '水产' },
      { label: '口感', value: '细嫩' },
      { label: '做法', value: '轻煎/烤制' },
      { label: '保存', value: '冷藏当天食用' }
    ],
    nutrition: '三文鱼富含优质蛋白和 Omega-3 脂肪酸，适合家庭营养餐搭配。',
    selectTips: '选择纹理清晰、颜色自然、有光泽且无明显腥味的鱼肉。',
    storageTips: '新鲜三文鱼建议当天食用，冷冻产品解冻后尽快烹饪。'
  },
  '3': {
    id: '3'
  },
  '4': {
    id: '4',
    name: '西兰花',
    subtitle: '营养丰富的十字花科蔬菜',
    image: 'https://images.unsplash.com/photo-1628773822503-930a7eaecf80?auto=format&fit=crop&w=1200&q=80',
    seasonTag: { type: 'success', label: '常备蔬菜' },
    basicInfo: [
      { label: '类别', value: '蔬菜' },
      { label: '口感', value: '清脆' },
      { label: '做法', value: '焯拌/清炒' },
      { label: '保存', value: '冷藏3天' }
    ],
    nutrition: '西兰花富含膳食纤维、维生素 C 和多种矿物质，是日常餐桌常见的轻负担蔬菜。',
    selectTips: '选择花球紧密、颜色深绿、茎部不空心的西兰花。',
    storageTips: '用保鲜袋包好冷藏，烹饪前再清洗，避免提前受潮。'
  },
  '5': {
    id: '5',
    name: '番茄',
    subtitle: '酸甜可口，适合炖煮和凉拌',
    image: 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=1200&q=80',
    seasonTag: { type: 'success', label: '家庭常备' },
    basicInfo: [
      { label: '类别', value: '蔬菜' },
      { label: '口味', value: '酸甜' },
      { label: '做法', value: '炖煮/凉拌' },
      { label: '保存', value: '阴凉处或冷藏' }
    ],
    nutrition: '番茄含有维生素 C、番茄红素和有机酸，适合做汤、炖菜和清爽凉菜。',
    selectTips: '选择颜色均匀、表皮完整、手感有弹性的番茄。',
    storageTips: '未完全成熟可室温放置，成熟后建议冷藏并尽快食用。'
  },
  '6': {
    id: '6',
    name: '草莓',
    subtitle: '酸甜多汁，适合早餐和甜点',
    image: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=1200&q=80',
    seasonTag: { type: 'danger', label: '当季水果' },
    basicInfo: [
      { label: '类别', value: '水果' },
      { label: '口味', value: '酸甜' },
      { label: '搭配', value: '酸奶/燕麦' },
      { label: '保存', value: '冷藏1-2天' }
    ],
    nutrition: '草莓富含维生素 C 和果香，适合做轻早餐搭配。',
    selectTips: '选择颜色自然鲜红、果蒂新鲜、表面无压伤的草莓。',
    storageTips: '草莓不耐放，建议吃前再清洗，冷藏保存并尽快食用。'
  },
  '7': {
    id: '7',
    name: '苹果',
    subtitle: '四季常备水果，适合家庭日常',
    image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=1200&q=80',
    seasonTag: { type: 'success', label: '常备水果' },
    basicInfo: [
      { label: '类别', value: '水果' },
      { label: '口感', value: '脆甜' },
      { label: '搭配', value: '早餐/加餐' },
      { label: '保存', value: '冷藏更久' }
    ],
    nutrition: '苹果含有膳食纤维和果胶，适合作为家庭日常加餐水果。',
    selectTips: '选择表皮完整、手感结实、香气自然的苹果。',
    storageTips: '可放阴凉处短期保存，冷藏能延长新鲜度。'
  },
  '8': {
    id: '8',
    name: '牛肉',
    subtitle: '优质蛋白来源，适合炖煮和快炒',
    image: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=1200&q=80',
    seasonTag: { type: 'warning', label: '优质蛋白' },
    basicInfo: [
      { label: '类别', value: '肉类' },
      { label: '口感', value: '扎实' },
      { label: '做法', value: '炖煮/快炒' },
      { label: '保存', value: '冷藏或冷冻' }
    ],
    nutrition: '牛肉富含蛋白质、铁和多种矿物质，适合家庭主菜。',
    selectTips: '选择颜色红润、有自然肉香、纹理清晰且表面不黏手的牛肉。',
    storageTips: '短期冷藏，长时间保存建议分装冷冻，避免反复解冻。'
  }
};

const isHeaderSolid = ref(false);
const priceRecords = ref<IngredientPriceRecord[]>([]);
const basketItemIds = ref<string[]>([]);
const favoriteIngredientIds = ref<string[]>([]);
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
const isFavorite = computed(() => favoriteIngredientIds.value.includes(ingredient.value.id));
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
  const id = query?.id ?? '3';
  const override = ingredientOverrides[id];
  if (override) {
    ingredient.value = {
      ...ingredient.value,
      ...override
    };
  }
  refreshPriceRecords();
  syncBasketState();
  syncFavoriteState();
});

onShow(() => {
  refreshPriceRecords();
  syncBasketState();
  syncFavoriteState();
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

const addToBasket = () => {
  if (isInBasket.value) {
    removeBasketItem(ingredientBasketItemId.value);
    syncBasketState();
    uni.showToast({
      title: '已移出菜篮子',
      icon: 'none'
    });
    return;
  }

  addBasketItem({
    id: ingredientBasketItemId.value,
    recipeId: 'ingredient',
    recipeName: '单买食材',
    name: ingredient.value.name,
    amountText: '适量',
    purchaseText: getIngredientPurchaseText(ingredient.value.name),
    checked: false
  });
  syncBasketState();
  uni.showToast({
    title: '已加入菜篮子',
    icon: 'success'
  });
};

const toggleFavorite = () => {
  if (isFavorite.value) {
    removeFavoriteIngredient(ingredient.value.id);
    syncFavoriteState();
    uni.showToast({
      title: '已取消收藏',
      icon: 'none'
    });
    return;
  }

  addFavoriteIngredient({
    id: ingredient.value.id,
    name: ingredient.value.name,
    description: ingredient.value.subtitle,
    image: ingredient.value.image,
    tag: ingredient.value.seasonTag.label
  });
  syncFavoriteState();
  uni.showToast({
    title: '已加入收藏',
    icon: 'success'
  });
};

const syncBasketState = () => {
  basketItemIds.value = loadBasketItems().map((item) => item.id);
};

const syncFavoriteState = () => {
  favoriteIngredientIds.value = loadFavoriteIngredients().map((item) => item.id);
};

const refreshPriceRecords = () => {
  priceRecords.value = getPriceRecordsByIngredient(ingredient.value.name);
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

const saveManualPrice = () => {
  const price = Number(manualPrice.value);
  if (!Number.isFinite(price) || price <= 0) {
    uni.showToast({ title: '请输入有效价格', icon: 'none' });
    return;
  }

  addPriceRecords([
    {
      id: `${ingredient.value.id}-${Date.now()}`,
      ingredientName: ingredient.value.name,
      price: normalizePriceToJin(price, selectedManualUnit.value, Number(manualSpecAmount.value)),
      unit: getNormalizedUnit(selectedManualUnit.value),
      date: manualDate.value.trim() || new Date().toISOString().slice(0, 10)
    }
  ]);
  refreshPriceRecords();
  closePricePanel();
  uni.showToast({ title: '价格已记录', icon: 'success' });
};

const deleteSelectedPriceRecord = () => {
  const record = selectedPriceRecord.value;
  if (!record) {
    return;
  }

  uni.showModal({
    title: '删除价格记录',
    content: `确认删除 ${formatPriceDate(record.date)} 的 ¥${record.price}/${record.unit}？`,
    confirmText: '删除',
    confirmColor: '#111111',
    success: (result) => {
      if (!result.confirm) {
        return;
      }

      removePriceRecord(record.id);
      refreshPriceRecords();
      isDeletePriceActionVisible.value = false;
      uni.showToast({
        title: '已删除',
        icon: 'none'
      });
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
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 14rpx 36rpx rgba(15, 23, 42, 0.08);
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
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10rpx);
  pointer-events: auto;
  box-shadow: 0 12rpx 32rpx rgba(15, 23, 42, 0.08);
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
  background: rgba(15, 23, 42, 0.92);
  color: #ffffff;
}

.header-overlay.is-solid .favorite-button.is-favorite {
  background: var(--app-accent);
  color: #ffffff;
}

.back-icon,
.favorite-icon {
  color: var(--app-text);
  font-size: 36rpx;
  font-weight: 600;
}

.favorite-button.is-favorite .favorite-icon {
  color: #ffffff;
}

.favorite-icon {
  font-size: 34rpx;
}

.header-title {
  overflow: hidden;
  color: var(--app-text);
  font-size: 30rpx;
  font-weight: 700;
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
  font-size: 40rpx;
  font-weight: 600;
}

.ingredient-subtitle {
  display: block;
  color: var(--app-text-secondary);
  font-size: 26rpx;
  line-height: 1.5;
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
  font-size: 21rpx;
  font-weight: 700;
}

.estimate-value {
  color: var(--app-text);
  font-size: 25rpx;
  font-weight: 900;
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
  font-size: 30rpx;
  font-weight: 600;
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
  font-size: 24rpx;
}

.info-value {
  color: var(--app-text);
  font-size: 28rpx;
  font-weight: 500;
}

.section-content {
  display: block;
  color: var(--app-text-secondary);
  font-size: 26rpx;
  line-height: 1.8;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.section-more {
  color: var(--app-text-tertiary);
  font-size: 24rpx;
}

.overview-tabs {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8rpx;
  margin-bottom: 24rpx;
  padding: 8rpx;
  border-radius: 999rpx;
  background: #f2f4f7;
}

.overview-tab {
  height: 62rpx;
  border: 0;
  border-radius: 999rpx;
  background: transparent;
  color: var(--app-text-secondary);
  font-size: 26rpx;
  font-weight: 900;
}

.overview-tab.is-active {
  background: var(--app-accent);
  color: #ffffff;
  box-shadow: 0 12rpx 28rpx rgba(15, 23, 42, 0.12);
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
  border-radius: 999rpx;
  background: var(--app-accent);
  color: #ffffff;
  font-size: 22rpx;
  font-weight: 800;
  box-shadow: 0 12rpx 28rpx rgba(15, 23, 42, 0.18);
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
  font-size: 22rpx;
}

.price-value {
  margin-top: 10rpx;
  color: var(--app-text);
  font-size: 34rpx;
  font-weight: 900;
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
    linear-gradient(to bottom, rgba(15, 23, 42, 0.05) 1rpx, transparent 1rpx) 0 0 / 100% 33%,
    #f7f9fb;
}

.price-line-chart__line {
  stroke: var(--app-accent);
  stroke-width: 4;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.price-line-chart__point {
  fill: #ffffff;
  stroke: var(--app-accent);
  stroke-width: 3;
}

.price-line-chart__point.is-active {
  fill: var(--app-accent);
  stroke: #ffffff;
  stroke-width: 4;
}

.price-line-chart__labels {
  display: flex;
  justify-content: space-between;
  margin-top: 8rpx;
  color: var(--app-text-tertiary);
  font-size: 18rpx;
}

.price-empty {
  margin-top: 14rpx;
  color: var(--app-text-secondary);
  font-size: 23rpx;
  line-height: 1.6;
}

.tips-tabs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8rpx;
  margin-bottom: 22rpx;
  padding: 8rpx;
  border-radius: 999rpx;
  background: #f2f4f7;
}

.tips-tab {
  height: 58rpx;
  border: 0;
  border-radius: 999rpx;
  background: transparent;
  color: var(--app-text-secondary);
  font-size: 24rpx;
  font-weight: 800;
}

.tips-tab.is-active {
  background: var(--app-accent);
  color: #ffffff;
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
  background: rgba(15, 23, 42, 0.24);
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
  font-size: 34rpx;
  font-weight: 900;
}

.price-panel__desc {
  margin-top: 8rpx;
  color: var(--app-text-secondary);
  font-size: 23rpx;
}

.price-panel__close {
  color: var(--app-text-tertiary);
  font-size: 42rpx;
  line-height: 1;
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
  font-size: 22rpx;
  font-weight: 700;
}

.field-input {
  display: flex;
  align-items: center;
  gap: 8rpx;
  height: 72rpx;
  padding: 0 20rpx;
  border-radius: 24rpx;
  background: #f7f9fb;
  color: var(--app-text);
  font-size: 25rpx;
  font-weight: 800;
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
  font-size: 25rpx;
}

.unit-select {
  display: flex;
  align-items: center;
  gap: 6rpx;
  padding: 11rpx 14rpx;
  border-radius: 999rpx;
  background: #ffffff;
  color: var(--app-text);
  font-size: 23rpx;
  font-weight: 900;
  box-shadow: inset 0 0 0 1rpx rgba(15, 23, 42, 0.06);
}

.select-arrow {
  color: var(--app-text-tertiary);
  font-size: 24rpx;
}

.price-form-tip {
  display: block;
  margin-top: 18rpx;
  color: var(--app-text-tertiary);
  font-size: 22rpx;
  line-height: 1.5;
}

.converted-price {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
  margin-top: 18rpx;
  padding: 18rpx 20rpx;
  border-radius: 24rpx;
  background: #f7f9fb;
}

.converted-price__label {
  color: var(--app-text-secondary);
  font-size: 23rpx;
  font-weight: 700;
}

.converted-price__value {
  color: var(--app-text);
  font-size: 28rpx;
  font-weight: 900;
}

.save-price-button {
  width: 100%;
  height: 76rpx;
  margin-top: 24rpx;
  border: 0;
  border-radius: 999rpx;
  background: var(--app-accent);
  color: #ffffff;
  font-size: 27rpx;
  font-weight: 900;
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
  font-size: 28rpx;
  font-weight: 500;
}

.recipe-item__meta {
  color: var(--app-text-secondary);
  font-size: 24rpx;
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
  border-radius: 999rpx;
  font-size: 28rpx;
  font-weight: 900;
}

.record-bottom-button {
  background: #ffffff;
  color: var(--app-text);
  box-shadow: 0 16rpx 38rpx rgba(15, 23, 42, 0.12);
}

.add-basket-button {
  background: var(--app-accent);
  color: #ffffff;
  box-shadow: 0 18rpx 46rpx rgba(15, 23, 42, 0.2);
}

.add-basket-button.is-in-basket {
  background: #27384a;
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
