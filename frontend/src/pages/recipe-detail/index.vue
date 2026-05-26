<template>
  <view class="page">
    <view class="header-image">
      <image class="header-image__bg" :src="recipe.image" mode="aspectFill" />
      <view :class="['header-overlay', { 'is-solid': isHeaderSolid }]">
        <view class="back-button" @click="goBack">
          <text class="back-icon">←</text>
        </view>
        <text class="header-title">{{ recipe.name }}</text>
        <button
          :class="['favorite-button', { 'is-collected': isCollected }]"
          @click="toggleCollectRecipe"
        >
          <svg class="favorite-button__icon" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m12 3.5 2.63 5.33 5.87.85-4.25 4.14 1 5.84L12 16.9l-5.25 2.76 1-5.84L3.5 9.68l5.87-.85L12 3.5Z" />
          </svg>
        </button>
      </view>
    </view>

    <view class="content">
      <view v-if="remoteLoading" class="remote-banner glass-card">
        <text class="remote-banner__text">正在加载菜谱详情...</text>
      </view>
      <view v-else-if="remoteError" class="remote-banner glass-card">
        <text class="remote-banner__error">加载失败：{{ remoteError }}</text>
        <button class="remote-banner__retry" @tap="handleRetryRemote">重试</button>
      </view>

      <view class="recipe-header glass-card">
        <view class="recipe-header__main">
          <view class="recipe-title-group">
            <text class="recipe-name">{{ recipe.name }}</text>
            <nut-tag :type="recipe.tag.type">{{ recipe.tag.label }}</nut-tag>
          </view>
          <button
            :class="['section-basket-button', { 'is-added': areMainIngredientsInBasket }]"
            @click="toggleMainIngredientsInBasket"
          >
            <svg
              class="section-basket-button__icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            <text>{{ areMainIngredientsInBasket ? '已加入' : '加入主食材' }}</text>
          </button>
        </view>
        <text class="recipe-subtitle">{{ recipe.subtitle }}</text>
        <view class="recipe-meta">
          <view class="meta-item">
            <text class="meta-label">时长</text>
            <text class="meta-value">{{ recipe.duration }}</text>
          </view>
          <view class="meta-item">
            <text class="meta-label">难度</text>
            <text class="meta-value">{{ recipe.difficulty }}</text>
          </view>
          <view class="meta-item">
            <text class="meta-label">口味</text>
            <text class="meta-value">{{ recipe.taste }}</text>
          </view>
          <view class="meta-item">
            <text class="meta-label">热量</text>
            <text class="meta-value">{{ recipe.calories }}</text>
          </view>
        </view>
      </view>

      <view class="ingredients-section glass-card">
        <view class="section-header">
          <text class="section-title">食材清单</text>
        </view>
        <view class="ingredients-list">
          <view
            v-for="item in recipe.ingredients"
            :key="item.name"
            class="ingredient-item"
            @click="showIngredientGuide(item.name)"
          >
            <view class="ingredient-main">
              <text class="ingredient-name">{{ item.name }}</text>
              <text v-if="isPantrySeasoning(item.name)" class="ingredient-note">常备调料，默认不加入</text>
            </view>
            <view class="ingredient-side">
              <text class="ingredient-amount">{{ item.amount }}</text>
              <view
                :class="['ingredient-basket', { 'is-added': isIngredientInBasket(item) }]"
                @click.stop="toggleIngredientInBasket(item)"
              >
                <svg
                  class="ingredient-basket__icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
              </view>
            </view>
          </view>
        </view>
      </view>

      <view class="steps-section glass-card">
        <text class="section-title">制作步骤</text>
        <view class="steps-list">
          <view
            v-for="(step, index) in recipe.steps"
            :key="index"
            class="step-item"
          >
            <view class="step-number">{{ index + 1 }}</view>
            <view class="step-content">
              <text class="step-text">{{ step.text }}</text>
              <image
                v-if="step.image"
                class="step-image"
                :src="step.image"
                mode="aspectFill"
              />
            </view>
          </view>
        </view>
      </view>

      <view class="tips-section glass-card">
        <text class="section-title">烹饪技巧</text>
        <view class="tips-list">
          <text
            v-for="(tip, index) in recipe.tips"
            :key="index"
            class="tip-item"
          >
            {{ index + 1 }}. {{ tip }}
          </text>
        </view>
      </view>

      <view class="bottom-actions">
        <nut-button type="default" size="large" @click="collectRecipe">
          收藏
        </nut-button>
      </view>
    </view>

    <view
      v-if="activeGuide"
      class="guide-mask"
      @click="closeIngredientGuide"
    >
      <view class="guide-panel glass-card" @click.stop>
        <view class="guide-header">
          <view>
            <text class="guide-title">{{ activeGuide.name }}怎么挑</text>
            <text class="guide-subtitle">买菜时看这几处就够了</text>
          </view>
          <text class="guide-close" @click="closeIngredientGuide">×</text>
        </view>
        <image class="guide-image" :src="activeGuide.image" mode="aspectFill" />
        <view class="guide-list">
          <view
            v-for="tip in activeGuide.tips"
            :key="tip"
            class="guide-item"
          >
            <text class="guide-dot" />
            <text class="guide-text">{{ tip }}</text>
          </view>
        </view>
        <nut-button type="primary" block @click="closeIngredientGuide">
          知道了
        </nut-button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad, onPageScroll, onShow } from '@dcloudio/uni-app';
import { addBasketItem, getIngredientPurchaseText, loadBasketItems, removeBasketItem } from '../../services/basket';
import { getRecipe } from '../../services/public-api';

interface Ingredient {
  name: string;
  amount: string;
}

interface Step {
  text: string;
  image?: string;
}

interface Recipe {
  id: string;
  name: string;
  subtitle: string;
  image: string;
  tag: {
    type: string;
    label: string;
  };
  duration: string;
  difficulty: string;
  taste: string;
  calories: string;
  ingredients: Ingredient[];
  steps: Step[];
  tips: string[];
}

interface IngredientGuide {
  name: string;
  image: string;
  tips: string[];
}

const recipe = ref<Recipe>({
  id: '1',
  name: '芦笋虾仁',
  subtitle: '清爽快手，适合工作日晚餐',
  image: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=80',
  tag: {
    type: 'success',
    label: '清爽快手'
  },
  duration: '15分钟',
  difficulty: '简单',
  taste: '清淡',
  calories: '约260kcal',
  ingredients: [
    { name: '芦笋', amount: '200g' },
    { name: '虾仁', amount: '150g' },
    { name: '大蒜', amount: '3瓣' },
    { name: '生姜', amount: '3片' },
    { name: '料酒', amount: '1勺' },
    { name: '盐', amount: '适量' },
    { name: '食用油', amount: '适量' }
  ],
  steps: [
    {
      text: '芦笋洗净，切成3-4厘米的段，焯水1分钟后捞出沥干。',
      image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80'
    },
    {
      text: '虾仁洗净，用料酒和少许盐腌制5分钟。大蒜切片，生姜切丝。'
    },
    {
      text: '热锅凉油，放入蒜片和姜丝爆香。'
    },
    {
      text: '倒入虾仁快速翻炒至变色。'
    },
    {
      text: '加入焯好的芦笋，翻炒均匀，加盐调味即可出锅。',
      image: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80'
    }
  ],
  tips: [
    '芦笋焯水时间不宜过长，保持脆嫩口感',
    '虾仁不要炒太久，变色即可，避免肉质变老',
    '全程大火快炒，保持食材的鲜味',
    '可根据个人口味加入少许白胡椒粉提味'
  ]
});

const remoteLoading = ref(false);
const remoteError = ref<string | null>(null);
const currentRecipeId = ref<number | null>(null);

const loadRemoteRecipe = async (id: number) => {
  remoteLoading.value = true;
  remoteError.value = null;
  try {
    const data = await getRecipe(id);
    recipe.value = {
      id: String(data.id),
      name: data.title,
      subtitle: data.subtitle ?? (data.description ?? ''),
      image:
        data.cover ??
        'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=80',
      tag: { type: 'success', label: data.isRecommend ? '推荐' : '家常' },
      duration: data.cookTime ? `${data.cookTime}分钟` : '—',
      difficulty: data.difficulty ?? '—',
      taste: data.taste ?? '—',
      calories: data.calories ? `约${data.calories}kcal` : '—',
      ingredients: (data.ingredients ?? []).map((i) => ({ name: i.name, amount: i.amount ?? '' })),
      steps: (data.steps ?? []).map((s) => ({ text: s.description, image: s.image ?? undefined })),
      tips: data.tips ? data.tips.split('\n').map((t) => t.trim()).filter(Boolean) : []
    };
  } catch (err) {
    remoteError.value = err instanceof Error ? err.message : '加载失败';
  } finally {
    remoteLoading.value = false;
  }
};

onLoad((query?: Record<string, string | undefined>) => {
  const id = Number.parseInt(query?.id ?? '', 10);
  if (Number.isFinite(id)) {
    currentRecipeId.value = id;
    void loadRemoteRecipe(id);
  }
});

const handleRetryRemote = () => {
  if (!currentRecipeId.value) return;
  void loadRemoteRecipe(currentRecipeId.value);
};

const activeGuideName = ref('');
const basketItemIds = ref<string[]>([]);
const isCollected = ref(false);
const pantrySeasonings = ['盐', '糖', '白糖', '酱油', '生抽', '老抽', '蚝油', '料酒', '醋', '食用油', '香油', '胡椒粉', '白胡椒粉', '淀粉'];

const ingredientGuides: Record<string, IngredientGuide> = {
  芦笋: {
    name: '芦笋',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=900&q=80',
    tips: [
      '看笋尖：笋尖紧密不散开，颜色鲜绿，说明比较新鲜。',
      '看茎秆：茎秆挺直、有弹性，粗细均匀，口感更稳定。',
      '看切口：底部切口湿润、不干裂，避免发黄或有明显斑点。',
      '轻掐一下：表皮脆嫩、没有发软空心感，适合快炒和焯水。'
    ]
  },
  虾仁: {
    name: '虾仁',
    image: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=900&q=80',
    tips: [
      '看颜色：自然透亮、略带青白或粉色，避免发灰发黄。',
      '看形态：虾仁完整饱满，表面不过分黏滑，说明处理较干净。',
      '闻气味：只有淡淡海鲜味，不应有明显腥臭或氨味。',
      '买冷冻虾仁时看冰衣：冰层薄而均匀更好，冰霜太厚可能反复冻融。'
    ]
  },
  大蒜: {
    name: '大蒜',
    image: 'https://images.unsplash.com/photo-1615477550927-6ec0f9a97a55?auto=format&fit=crop&w=900&q=80',
    tips: [
      '看外皮：蒜皮干爽完整，颜色自然，不要选潮湿发霉的。',
      '掂重量：同等大小更沉实的蒜瓣通常水分更足。',
      '按蒜瓣：蒜瓣饱满坚硬，不发软、不空壳。',
      '避开发芽严重的大蒜，香气和口感都会变弱。'
    ]
  },
  生姜: {
    name: '生姜',
    image: 'https://images.unsplash.com/photo-1615485500834-bc10199bc727?auto=format&fit=crop&w=900&q=80',
    tips: [
      '看表皮：表面完整、纹理清楚，不要有黑斑和霉点。',
      '闻气味：新鲜生姜辛香明显，气味发闷说明放置较久。',
      '摸硬度：质地紧实，不发软、不出水。',
      '做快炒可选嫩姜，炖煮去腥更适合老姜。'
    ]
  },
  料酒: {
    name: '料酒',
    image: 'https://images.unsplash.com/photo-1605270012917-bf157c5a9541?auto=format&fit=crop&w=900&q=80',
    tips: [
      '看配料：优先选黄酒或酿造料酒，不选香精味过重的。',
      '看颜色：色泽清亮，不浑浊、不沉淀异常。',
      '闻香气：酒香温和，没有刺鼻酒精味。',
      '给虾仁去腥时少量即可，避免掩盖鲜味。'
    ]
  },
  盐: {
    name: '盐',
    image: 'https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?auto=format&fit=crop&w=900&q=80',
    tips: [
      '看包装：选择密封完好、生产日期清晰的食用盐。',
      '看颗粒：颗粒干爽均匀，不结块、不受潮。',
      '家常烹饪用普通加碘盐即可，不需要复杂调味盐。',
      '快炒菜建议少量多次调味，避免一次放多。'
    ]
  },
  食用油: {
    name: '食用油',
    image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=900&q=80',
    tips: [
      '看用途：快炒可用菜籽油、玉米油、花生油等常见炒菜油。',
      '看透明度：油体清亮，无明显浑浊或沉淀。',
      '看包装：避光瓶或小规格更适合家庭，减少开封后久放。',
      '炒虾仁用油不宜过多，薄薄铺满锅底即可。'
    ]
  }
};

const activeGuide = computed(() => ingredientGuides[activeGuideName.value]);
const mainIngredients = computed(() => recipe.value.ingredients.filter((item) => !isPantrySeasoning(item.name)));
const areMainIngredientsInBasket = computed(() => {
  return mainIngredients.value.every((item) => basketItemIds.value.includes(getRecipeIngredientBasketId(item)));
});
const isHeaderSolid = ref(false);

onPageScroll((event) => {
  isHeaderSolid.value = event.scrollTop > 120;
});

const goBack = () => {
  if (getCurrentPages().length <= 1) {
    uni.reLaunch({ url: '/pages/recipes/index' });
    return;
  }

  uni.navigateBack();
};

const toggleCollectRecipe = () => {
  isCollected.value = !isCollected.value;
  uni.showToast({
    title: isCollected.value ? '已收藏' : '取消收藏',
    icon: 'none'
  });
};

const collectRecipe = () => {
  toggleCollectRecipe();
};

const isPantrySeasoning = (name: string) => pantrySeasonings.includes(name);

const getRecipeIngredientBasketId = (item: Ingredient) => `${recipe.value.id}-${item.name}`;

const isIngredientInBasket = (item: Ingredient) => basketItemIds.value.includes(getRecipeIngredientBasketId(item));

const addIngredientToBasket = (item: Ingredient, showToast = true) => {
  if (isIngredientInBasket(item)) {
    if (showToast) {
      uni.showToast({
        title: `${item.name}已在菜篮子`,
        icon: 'none'
      });
    }
    return;
  }

  addBasketItem({
    id: getRecipeIngredientBasketId(item),
    recipeId: recipe.value.id,
    recipeName: recipe.value.name,
    name: item.name,
    amountText: item.amount,
    purchaseText: getIngredientPurchaseText(item.name),
    checked: false
  });
  syncBasketState();
  if (showToast) {
    uni.showToast({
      title: `${item.name}已加入菜篮子`,
      icon: 'success'
    });
  }
};

const removeIngredientFromBasket = (item: Ingredient, showToast = true) => {
  if (!isIngredientInBasket(item)) {
    return;
  }

  removeBasketItem(getRecipeIngredientBasketId(item));
  syncBasketState();
  if (showToast) {
    uni.showToast({
      title: `${item.name}已移出菜篮子`,
      icon: 'none'
    });
  }
};

const toggleIngredientInBasket = (item: Ingredient) => {
  if (isIngredientInBasket(item)) {
    removeIngredientFromBasket(item);
    return;
  }

  addIngredientToBasket(item);
};

const toggleMainIngredientsInBasket = () => {
  if (areMainIngredientsInBasket.value) {
    mainIngredients.value.forEach((item) => {
      removeBasketItem(getRecipeIngredientBasketId(item));
    });
    syncBasketState();
    uni.showToast({
      title: '主食材已移出菜篮子',
      icon: 'none'
    });
    return;
  }

  const pendingIngredients = mainIngredients.value.filter((item) => !isIngredientInBasket(item));
  pendingIngredients.forEach((item) => addIngredientToBasket(item, false));

  uni.showToast({
    title: pendingIngredients.length ? '主食材已加入菜篮子' : '主食材已在菜篮子',
    icon: pendingIngredients.length ? 'success' : 'none'
  });
};

const syncBasketState = () => {
  basketItemIds.value = loadBasketItems().map((item) => item.id);
};

const hasIngredientGuide = (name: string) => Boolean(ingredientGuides[name]);

const showIngredientGuide = (name: string) => {
  activeGuideName.value = name;
};

const closeIngredientGuide = () => {
  activeGuideName.value = '';
};

onShow(() => {
  syncBasketState();
});
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

.favorite-button {
  margin: 0;
  border: 0;
  color: var(--app-text);
}

.favorite-button::after {
  border: 0;
}

.favorite-button.is-collected {
  background: rgba(229, 115, 95, 0.12);
  color: #e5735f;
}

.header-overlay.is-solid .back-button,
.header-overlay.is-solid .favorite-button {
  background: var(--app-accent-soft);
  box-shadow: none;
}

.header-overlay.is-solid .favorite-button.is-collected {
  background: rgba(229, 115, 95, 0.12);
}

.favorite-button__icon {
  width: 34rpx;
  height: 34rpx;
  fill: transparent;
}

.favorite-button.is-collected .favorite-button__icon {
  fill: currentColor;
}

.back-icon {
  color: var(--app-text);
  font-size: 36rpx;
  font-weight: 600;
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
  padding: 0 30rpx 30rpx;
}

.remote-banner {
  margin-bottom: 20rpx;
  padding: 18rpx 22rpx;
  border-radius: var(--app-radius-card);
}

.remote-banner__text {
  color: var(--app-text-secondary);
  font-size: 24rpx;
}

.remote-banner__error {
  color: #dc2626;
  font-size: 24rpx;
  line-height: 1.4;
}

.remote-banner__retry {
  margin-top: 12rpx;
  padding: 14rpx 20rpx;
  border-radius: 999rpx;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(255, 253, 252, 0.9);
  color: var(--app-text);
  font-size: 24rpx;
}

.recipe-header {
  padding: 32rpx;
  margin-bottom: 20rpx;
}

.recipe-header__main {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16rpx;
  margin-bottom: 16rpx;
}

.recipe-title-group {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-wrap: wrap;
  align-items: center;
  gap: 16rpx;
}

.recipe-name {
  color: var(--app-text);
  font-size: 40rpx;
  font-weight: 600;
}

.recipe-subtitle {
  display: block;
  margin-bottom: 24rpx;
  color: var(--app-text-secondary);
  font-size: 26rpx;
}

.recipe-meta {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 20rpx;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.meta-label {
  color: var(--app-text-tertiary);
  font-size: 24rpx;
}

.meta-value {
  color: var(--app-text);
  font-size: 28rpx;
  font-weight: 500;
}

.ingredients-section,
.steps-section,
.tips-section {
  padding: 32rpx;
  margin-bottom: 20rpx;
}

.section-title {
  display: block;
  margin-bottom: 24rpx;
  color: var(--app-text);
  font-size: 30rpx;
  font-weight: 600;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  margin-bottom: 24rpx;
}

.section-header .section-title {
  margin-bottom: 0;
}

.section-basket-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  min-width: 144rpx;
  height: 58rpx;
  margin: 0;
  padding: 0 18rpx;
  border: 1rpx solid #e5735f;
  border-radius: var(--app-radius-button);
  background: #fffdfc;
  color: #e5735f;
  font-size: 24rpx;
  font-weight: 500;
}

.section-basket-button::after {
  border: 0;
}

.section-basket-button.is-added {
  border-color: transparent;
  background: var(--app-accent-soft);
  color: var(--app-text-secondary);
}

.section-basket-button__icon {
  width: 26rpx;
  height: 26rpx;
}

.ingredients-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.ingredient-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
  padding: 16rpx 0;
  border-bottom: 1rpx solid var(--app-border);
  cursor: pointer;
}

.ingredient-item:last-child {
  border-bottom: none;
}

.ingredient-main {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 6rpx;
}

.ingredient-name {
  color: var(--app-text);
  font-size: 28rpx;
}

.ingredient-note {
  color: var(--app-text-tertiary);
  font-size: 21rpx;
}

.ingredient-side {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 14rpx;
}

.ingredient-amount {
  color: var(--app-text-secondary);
  font-size: 26rpx;
}

.ingredient-basket {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  background: var(--app-accent-soft);
  color: var(--app-text);
}

.ingredient-basket.is-added {
  background: rgba(107, 163, 104, 0.12);
  color: var(--app-success);
}

.ingredient-basket__icon {
  width: 24rpx;
  height: 24rpx;
}

.steps-list {
  display: flex;
  flex-direction: column;
  gap: 32rpx;
}

.step-item {
  display: flex;
  gap: 20rpx;
}

.step-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48rpx;
  height: 48rpx;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--app-accent-soft);
  color: var(--app-accent);
  font-size: 24rpx;
  font-weight: 600;
}

.step-content {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 16rpx;
}

.step-text {
  color: var(--app-text);
  font-size: 28rpx;
  line-height: 1.8;
}

.step-image {
  width: 100%;
  height: 300rpx;
  border-radius: 12rpx;
}

.tips-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.tip-item {
  display: block;
  padding: 20rpx;
  border-radius: 12rpx;
  background: var(--app-accent-soft);
  color: var(--app-text-secondary);
  font-size: 26rpx;
  line-height: 1.6;
}

.bottom-actions {
  display: flex;
  gap: 20rpx;
  padding: 30rpx 0 calc(30rpx + env(safe-area-inset-bottom, 0));
}

.guide-mask {
  position: fixed;
  inset: 0;
  z-index: 20;
  display: flex;
  align-items: flex-end;
  padding: 24rpx;
  background: rgba(47, 47, 47, 0.28);
}

.guide-panel {
  width: 100%;
  padding: 28rpx;
  border-radius: 32rpx;
}

.guide-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20rpx;
  margin-bottom: 22rpx;
}

.guide-title {
  display: block;
  color: var(--app-text);
  font-size: 32rpx;
  font-weight: 600;
}

.guide-subtitle {
  display: block;
  margin-top: 8rpx;
  color: var(--app-text-secondary);
  font-size: 22rpx;
}

.guide-close {
  color: var(--app-text-tertiary);
  font-size: 36rpx;
  line-height: 1;
}

.guide-image {
  width: 100%;
  height: 240rpx;
  margin-bottom: 24rpx;
  border-radius: 24rpx;
}

.guide-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin-bottom: 26rpx;
}

.guide-item {
  display: flex;
  gap: 12rpx;
}

.guide-dot {
  width: 10rpx;
  height: 10rpx;
  flex: 0 0 10rpx;
  margin-top: 15rpx;
  border-radius: 50%;
  background: var(--app-accent);
}

.guide-text {
  color: var(--app-text-secondary);
  font-size: 26rpx;
  line-height: 1.7;
}
</style>
