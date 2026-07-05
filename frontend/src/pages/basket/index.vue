<template>
  <view class="app-page basket-page">
    <view class="family-selector" @tap="toggleFamilySelector">
      <text class="family-selector__name">{{ basketScopeName }}</text>
      <app-icon :class="['family-selector__arrow', { 'is-open': isFamilySelectorVisible }]" name="chevron-down" size="22rpx" />
    </view>

    <view v-if="isFamilySelectorVisible" class="family-mask" @tap="closeFamilySelector">
      <view class="family-sheet glass-card" @tap.stop>
        <view
          v-for="family in families"
          :key="family.id"
          :class="['family-option', { 'is-active': family.id === activeFamilyId }]"
          @tap="selectFamilyScope(family.id)"
        >
          <text class="family-option__name">{{ family.name }}</text>
          <app-icon v-if="family.id === activeFamilyId" class="family-option__check" name="check" size="20rpx" />
        </view>

        <view class="family-sheet__divider" />

        <view class="family-manage-row" @tap="goToFamilyManage">
          <text class="family-manage-row__name">家庭管理</text>
          <app-icon class="family-manage-row__icon" name="arrow-right" size="22rpx" />
        </view>
      </view>
    </view>

    <view class="status-card glass-card">
      <view>
        <text class="status-label">待采购</text>
        <text class="status-value">{{ pendingCount }}</text>
      </view>
      <view>
        <text class="status-label">已完成</text>
        <text class="status-value">{{ checkedCount }}</text>
      </view>
      <view class="status-note">
        <text>{{ recipeGroupCount }} 道菜</text>
        <text>{{ items.length }} 项用料</text>
      </view>
    </view>

    <view class="basket-board glass-card">
      <view class="board-head">
        <view>
          <text class="board-title">本次采购</text>
          <text class="board-desc">{{ boardDescription }}</text>
        </view>
        <view class="mode-switch">
          <button :class="['mode-button', { 'is-active': viewMode === 'merged' }]" @tap="setViewMode('merged')">
            合
          </button>
          <button :class="['mode-button', { 'is-active': viewMode === 'recipe' }]" @tap="setViewMode('recipe')">
            菜
          </button>
        </view>
      </view>

      <view v-if="items.length" class="content">
      <view v-if="viewMode === 'recipe'" class="recipe-list">
        <view v-for="group in recipeGroups" :key="group.recipeId" class="recipe-card">
          <view
            class="recipe-swipe-row"
            @touchstart="handleTouchStart($event, getRecipeKey(group.recipeId))"
            @touchend="handleTouchEnd($event, getRecipeKey(group.recipeId))"
          >
            <view
              :class="['recipe-header', { 'is-open': openedItemId === getRecipeKey(group.recipeId) }]"
              @tap="toggleRecipeExpanded(group.recipeId)"
            >
              <view>
                <text class="recipe-title">{{ group.recipeName }}</text>
                <text class="recipe-subtitle">{{ group.checkedCount }}/{{ group.items.length }} 已采购</text>
              </view>
              <app-icon :class="['recipe-arrow', { 'is-expanded': isRecipeExpanded(group.recipeId) }]" name="chevron-right" size="22rpx" />
            </view>
            <view class="swipe-remove recipe-remove" @tap="removeRecipeGroup(group.recipeId)">删除</view>
          </view>

          <view v-if="isRecipeExpanded(group.recipeId)" class="ingredient-list">
            <view
              v-for="item in group.items"
              :key="item.id"
              class="swipe-row"
              @touchstart="handleTouchStart($event, item.id)"
              @touchend="handleTouchEnd($event, item.id)"
            >
              <view :class="['ingredient-row', { 'is-open': openedItemId === item.id }]">
                <view class="ingredient-main" @tap="toggleItem(item.id)">
                  <app-icon :class="['check', { 'is-checked': item.checked }]" :name="item.checked ? 'check' : 'circle'" size="18rpx" />
                  <text :class="['ingredient-name', { 'is-checked': item.checked }]">{{ item.name }}</text>
                </view>
                <text :class="['ingredient-amount', { 'is-checked': item.checked }]">{{ getBasketDisplayText(item) }}</text>
              </view>
              <view class="swipe-remove" @tap="removeItem(item.id)">删除</view>
            </view>
          </view>
        </view>
      </view>

      <view v-else class="merged-card">
        <view class="ingredient-list">
          <view
            v-for="item in mergedItems"
            :key="item.name"
            class="swipe-row"
            @touchstart="handleTouchStart($event, getMergedKey(item.name))"
            @touchend="handleTouchEnd($event, getMergedKey(item.name))"
          >
            <view :class="['ingredient-row', { 'is-open': openedItemId === getMergedKey(item.name) }]">
              <view class="ingredient-main" @tap="toggleMergedItem(item.itemIds)">
                <app-icon :class="['check', { 'is-checked': item.checked }]" :name="item.checked ? 'check' : 'circle'" size="18rpx" />
                <text :class="['ingredient-name', { 'is-checked': item.checked }]">{{ item.name }}</text>
              </view>
              <text :class="['ingredient-amount', { 'is-checked': item.checked }]">{{ item.amountText }}</text>
            </view>
            <view class="swipe-remove" @tap="removeMergedItem(item.itemIds)">删除</view>
          </view>
        </view>
      </view>

    </view>

      <view v-else class="empty-card">
      <view class="empty-illustration">
        <view class="basket-line">
          <view class="basket-handle" />
          <view class="basket-body">
            <view class="basket-dot" />
            <view class="basket-dot" />
            <view class="basket-dot" />
          </view>
        </view>
      </view>
      <text class="empty-kicker">清单已整理干净</text>
      <text class="empty-title">菜篮子空了</text>
      <text class="empty-desc">从菜谱详情页加入食材后，会自动按菜谱和合并用料整理成采购清单。</text>
      <view class="empty-actions">
        <button class="empty-button is-primary" @click="goHome">去首页看看</button>
        <button class="empty-button" @click="goToRecipes">浏览菜谱</button>
      </view>
    </view>
    </view>

    <view v-if="items.length" class="action-dock glass-card">
      <button class="dock-button" @tap="selectAll">{{ allChecked ? '取消全选' : '全选' }}</button>
      <button class="dock-button" @tap="clearChecked">删除已购</button>
      <button class="dock-button is-primary" @tap="completePurchase">完成采购</button>
    </view>

    <home-tab-bar :tabs="tabs" />

    <view v-if="isPricePanelVisible" class="sheet-mask" @tap="closePricePanel">
      <view class="price-panel" @tap.stop>
        <view class="price-panel__head">
          <view>
            <text class="price-panel__title">记录本次价格</text>
            <text class="price-panel__desc">采购完成后记录价格，之后可在食材详情查看走势。</text>
          </view>
          <text class="price-panel__close" @tap="closePricePanel">×</text>
        </view>
        <view class="price-list">
          <view v-for="item in priceInputs" :key="item.id" class="price-row">
            <text class="price-row__name">{{ item.name }}</text>
            <view class="price-row__field">
              <text class="price-row__prefix">¥</text>
              <input
                v-model="item.priceText"
                class="price-input"
                type="digit"
                placeholder="价格"
              />
              <text class="price-row__unit">/{{ item.unit }}</text>
            </view>
          </view>
        </view>
        <button class="save-price-button" @tap="savePurchasePrices">保存价格并完成</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import AppIcon from '../../components/app/app-icon.vue';
import HomeTabBar from '../../components/home/home-tab-bar.vue';
import { loadBasketItems, removeBasketItem, updateBasketItemChecked } from '../../services/basket';
import type { BasketItem } from '../../services/basket';
import { loadActiveFamilyId, loadFamilies, saveActiveFamilyId } from '../../services/family';
import type { FamilyProfile } from '../../types/family';
import { addPriceRecords } from '../../services/price';

type BasketViewMode = 'recipe' | 'merged';

interface BasketRecipeGroup {
  recipeId: string;
  recipeName: string;
  items: BasketItem[];
  checkedCount: number;
}

interface MergedBasketItem {
  name: string;
  amountText: string;
  checked: boolean;
  itemIds: string[];
}

interface PriceInputItem {
  id: string;
  ingredientId: number;
  name: string;
  unit: string;
  priceText: string;
}

const tabs = [
  { id: 'home', label: '首页', active: false },
  { id: 'categories', label: '分类', active: false },
  { id: 'basket', label: '菜篮子', active: true },
  { id: 'mine', label: '我的', active: false }
];

const items = ref<BasketItem[]>([]);
const families = ref<FamilyProfile[]>([]);
const activeFamilyId = ref(loadActiveFamilyId());

const viewMode = ref<BasketViewMode>('merged');
const openedItemId = ref('');
const touchStartX = ref(0);
const isPricePanelVisible = ref(false);
const isFamilySelectorVisible = ref(false);
const expandedRecipeIds = ref<string[]>([]);
const priceInputs = ref<PriceInputItem[]>([]);

const pendingCount = computed(() => items.value.filter((item) => !item.checked).length);
const checkedCount = computed(() => items.value.filter((item) => item.checked).length);
const allChecked = computed(() => items.value.length > 0 && items.value.every((item) => item.checked));
const recipeGroupCount = computed(() => recipeGroups.value.length);
const boardDescription = computed(() => {
  if (!items.value.length) {
    return '清单为空，去首页或食材页添加想买的食材';
  }

  if (viewMode.value === 'merged') {
    return '合并相同食材，单独添加的食材也在这里';
  }

  return '按菜谱整理采购项，单独食材不在这里显示';
});
const activeFamily = computed<FamilyProfile>(() => {
  return families.value.find((family) => family.id === activeFamilyId.value) ?? families.value[0] ?? {
    id: '',
    name: '我的菜篮子',
    description: '',
    commonRecipes: 0,
    pendingItems: 0,
    members: []
  };
});
const basketScopeName = computed(() => activeFamily.value.name);

const recipeGroups = computed<BasketRecipeGroup[]>(() => {
  const groupMap = new Map<string, BasketRecipeGroup>();

  items.value.forEach((item) => {
    if (item.recipeId === 'ingredient') {
      return;
    }

    const existingGroup = groupMap.get(item.recipeId);
    if (existingGroup) {
      existingGroup.items.push(item);
      existingGroup.checkedCount = existingGroup.items.filter((groupItem) => groupItem.checked).length;
      return;
    }

    groupMap.set(item.recipeId, {
      recipeId: item.recipeId,
      recipeName: item.recipeName,
      items: [item],
      checkedCount: item.checked ? 1 : 0
    });
  });

  return Array.from(groupMap.values());
});

const mergedItems = computed<MergedBasketItem[]>(() => {
  const mergedMap = new Map<string, BasketItem[]>();

  items.value.forEach((item) => {
    const sameNameItems = mergedMap.get(item.name) ?? [];
    mergedMap.set(item.name, [...sameNameItems, item]);
  });

  return Array.from(mergedMap.entries()).map(([name, sameNameItems]) => ({
    name,
    amountText: mergeAmountText(sameNameItems.map((item) => getBasketDisplayText(item))),
    checked: sameNameItems.every((item) => item.checked),
    itemIds: sameNameItems.map((item) => item.id)
  }));
});

const mergeAmountText = (amounts: string[]) => {
  const uniqueAmounts = Array.from(new Set(amounts));
  if (uniqueAmounts.length === 1) {
    return uniqueAmounts[0] ?? '';
  }
  return uniqueAmounts.join(' + ');
};

const getMergedKey = (name: string) => `merged-${name}`;
const getRecipeKey = (recipeId: string) => `recipe-${recipeId}`;
const getBasketDisplayText = (item: BasketItem) => item.purchaseText ?? item.amountText;

const setViewMode = (mode: BasketViewMode) => {
  viewMode.value = mode;
  openedItemId.value = '';
};

const toggleFamilySelector = () => {
  isFamilySelectorVisible.value = !isFamilySelectorVisible.value;
};

const closeFamilySelector = () => {
  isFamilySelectorVisible.value = false;
};

const selectFamilyScope = async (familyId: string) => {
  activeFamilyId.value = familyId;
  saveActiveFamilyId(familyId);
  items.value = await loadBasketItems(familyId);
  openedItemId.value = '';
  expandedRecipeIds.value = [];
  closeFamilySelector();
};

const goToFamilyManage = () => {
  closeFamilySelector();
  uni.navigateTo({ url: '/pages/family/index' });
};

const isRecipeExpanded = (recipeId: string) => expandedRecipeIds.value.includes(recipeId);

const toggleRecipeExpanded = (recipeId: string) => {
  openedItemId.value = '';
  if (isRecipeExpanded(recipeId)) {
    expandedRecipeIds.value = expandedRecipeIds.value.filter((id) => id !== recipeId);
    return;
  }

  expandedRecipeIds.value = [...expandedRecipeIds.value, recipeId];
};

const toggleItem = async (id: string) => {
  const target = items.value.find((item) => item.id === id);
  if (!target) return;
  items.value = items.value.map((item) => {
    if (item.id !== id) {
      return item;
    }

    return { ...item, checked: !item.checked };
  });
  await updateBasketItemChecked(id, !target.checked);
};

const toggleMergedItem = async (itemIds: string[]) => {
  const targetItems = items.value.filter((item) => itemIds.includes(item.id));
  const nextChecked = !targetItems.every((item) => item.checked);

  items.value = items.value.map((item) => {
    if (!itemIds.includes(item.id)) {
      return item;
    }
    return { ...item, checked: nextChecked };
  });
  await Promise.all(itemIds.map((id) => updateBasketItemChecked(id, nextChecked)));
};

const removeItem = async (id: string) => {
  items.value = items.value.filter((item) => item.id !== id);
  if (openedItemId.value === id) {
    openedItemId.value = '';
  }
  await removeBasketItem(id);
};

const removeMergedItem = async (itemIds: string[]) => {
  items.value = items.value.filter((item) => !itemIds.includes(item.id));
  openedItemId.value = '';
  await Promise.all(itemIds.map(removeBasketItem));
};

const removeRecipeGroup = async (recipeId: string) => {
  const removedIds = items.value.filter((item) => item.recipeId === recipeId).map((item) => item.id);
  items.value = items.value.filter((item) => item.recipeId !== recipeId);
  expandedRecipeIds.value = expandedRecipeIds.value.filter((id) => id !== recipeId);
  openedItemId.value = '';
  await Promise.all(removedIds.map(removeBasketItem));
};

const clearChecked = async () => {
  const checkedIds = items.value.filter((item) => item.checked).map((item) => item.id);
  items.value = items.value.filter((item) => !item.checked);
  await Promise.all(checkedIds.map(removeBasketItem));
};

const selectAll = async () => {
  const nextChecked = !allChecked.value;
  items.value = items.value.map((item) => ({ ...item, checked: nextChecked }));
  await Promise.all(items.value.map((item) => updateBasketItemChecked(item.id, nextChecked)));
};

const completePurchase = async () => {
  const purchasableItems = getUniquePurchasableItems();
  if (purchasableItems.length) {
    priceInputs.value = purchasableItems.map((item) => ({
      id: item.id,
      ingredientId: item.ingredientId ? Number(item.ingredientId) : 0,
      name: item.name,
      unit: getPriceUnit(item),
      priceText: ''
    }));
    isPricePanelVisible.value = true;
    return;
  }

  items.value = items.value.map((item) => ({ ...item, checked: true }));
  await awaitPersistItems();
  uni.showToast({ title: '已完成采购', icon: 'success' });
};

const getUniquePurchasableItems = () => {
  const itemMap = new Map<string, BasketItem>();
  items.value.forEach((item) => {
    if (!item.checked && !itemMap.has(item.name)) {
      itemMap.set(item.name, item);
    }
  });
  return Array.from(itemMap.values());
};

const getPriceUnit = (item: BasketItem) => {
  const purchaseText = item.purchaseText ?? '';
  const unitMatch = purchaseText.match(/\/(.+)$/);
  return unitMatch?.[1] ?? '斤';
};

const closePricePanel = () => {
  isPricePanelVisible.value = false;
};

const savePurchasePrices = async () => {
  const today = new Date().toISOString().slice(0, 10);
  const records = priceInputs.value
    .map((item) => ({
      id: `${item.id}-${Date.now()}`,
      ingredientId: item.ingredientId,
      ingredientName: item.name,
      price: Number(item.priceText),
      unit: item.unit,
      date: today
    }))
    .filter((record) => Number.isFinite(record.price) && record.price > 0);

  if (records.length) {
    await addPriceRecords(records);
  }

  items.value = items.value.map((item) => ({ ...item, checked: true }));
  await awaitPersistItems();
  closePricePanel();
  uni.showToast({ title: records.length ? '价格已记录' : '已完成采购', icon: 'success' });
};

const goHome = () => {
  uni.reLaunch({ url: '/pages/index/index' });
};

const goToRecipes = () => {
  uni.navigateTo({ url: '/pages/ingredients/index?tab=recipes' });
};

const handleTouchStart = (event: TouchEvent, id: string) => {
  touchStartX.value = event.changedTouches[0]?.clientX ?? 0;
  if (openedItemId.value && openedItemId.value !== id) {
    openedItemId.value = '';
  }
};

const handleTouchEnd = (event: TouchEvent, id: string) => {
  const endX = event.changedTouches[0]?.clientX ?? 0;
  const diffX = endX - touchStartX.value;

  if (diffX < -40) {
    openedItemId.value = id;
    return;
  }

  if (diffX > 40) {
    openedItemId.value = '';
  }
};

const awaitPersistItems = async () => {
  await Promise.all(items.value.map((item) => updateBasketItemChecked(item.id, item.checked)));
};

onShow(async () => {
  try {
    families.value = await loadFamilies();
    activeFamilyId.value = loadActiveFamilyId() || families.value[0]?.id || '';
    items.value = await loadBasketItems(activeFamilyId.value);
  } catch (error) {
    uni.showToast({ title: error instanceof Error ? error.message : '菜篮子加载失败', icon: 'none' });
  }
});
</script>

<style scoped lang="scss">
.basket-page {
  padding-bottom: calc(330rpx + env(safe-area-inset-bottom, 0));
  background:
    radial-gradient(circle at 50% -12%, rgba(255, 253, 252, 0.96), rgba(245, 241, 234, 0.9) 34%, #e9e2d6 100%);
}

.mode-button::after,
.dock-button::after {
  border: 0;
}

.family-selector {
  display: inline-flex;
  align-items: center;
  gap: 8rpx;
  max-width: 100%;
  margin-bottom: 24rpx;
  color: var(--app-text);
}

.family-selector__name {
  display: block;
  max-width: 620rpx;
  overflow: hidden;
  color: var(--app-text);
  font-size: var(--font-size-page-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-page-title);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.family-selector__arrow {
  color: var(--app-text-secondary);
  font-size: var(--font-size-caption);
  font-weight: var(--font-semibold);
  transition: transform 160ms ease;
}

.family-selector__arrow.is-open {
  transform: rotate(180deg);
}

.family-mask {
  position: fixed;
  inset: 0;
  z-index: 35;
  padding: 128rpx 24rpx 24rpx;
  background: rgba(47, 47, 47, 0.16);
  backdrop-filter: blur(8rpx);
  -webkit-backdrop-filter: blur(8rpx);
}

.family-sheet {
  overflow: hidden;
  border: 0;
  border-radius: var(--app-radius-card);
  background: #fffdfc;
  box-shadow: 0 28rpx 80rpx rgba(0, 0, 0, 0.08);
}

.family-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
  min-height: 96rpx;
  padding: 0 32rpx;
  background: #fffdfc;
}

.family-option.is-active {
  background: rgba(107, 163, 104, 0.12);
}

.family-option--plain {
  min-height: 118rpx;
}

.family-option__name,
.family-option__check,
.family-manage-row__name,
.family-manage-row__icon {
  display: block;
}

.family-option__name {
  color: var(--app-text);
  font-size: var(--font-size-list-title);
  font-weight: var(--font-semibold);
}

.family-option.is-active .family-option__name,
.family-option__check {
  color: var(--text-brand);
}

.family-option__check {
  font-size: var(--font-size-section-title);
  font-weight: var(--font-semibold);
}

.family-sheet__divider {
  height: 1rpx;
  margin: 0 32rpx;
  background: var(--app-border);
}

.family-manage-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
  min-height: 110rpx;
  padding: 0 32rpx;
}

.family-manage-row__name {
  color: var(--app-text);
  font-size: var(--font-size-list-title);
  font-weight: var(--font-semibold);
}

.family-manage-row__icon {
  color: var(--app-text-secondary);
  font-size: var(--font-size-section-title);
}

.status-card {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  align-items: center;
  gap: 24rpx;
  padding: 26rpx 28rpx;
  border: 0;
  background: #fffdfc;
  border-radius: var(--app-radius-card);
  overflow: hidden;
  box-shadow: 0 18rpx 48rpx rgba(0, 0, 0, 0.04);
}

.status-card::after {
  position: absolute;
  top: -80rpx;
  right: -80rpx;
  width: 190rpx;
  height: 190rpx;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(47, 47, 47, 0.05), transparent 66%);
  content: '';
}

.status-label {
  display: block;
  color: var(--app-text-secondary);
  font-size: var(--font-size-tabbar);
}

.status-value {
  display: block;
  margin-top: 8rpx;
  color: var(--app-text);
  font-size: var(--font-size-page-title);
  font-weight: var(--font-medium);
  line-height: var(--line-tabbar);
}

.status-note {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  align-items: flex-end;
  color: var(--app-text-secondary);
  font-size: var(--font-size-tabbar);
}

.basket-board {
  margin-top: 24rpx;
  padding: 24rpx;
  border: 0;
  border-radius: var(--app-radius-card);
  background: #fffdfc;
  box-shadow: 0 20rpx 56rpx rgba(0, 0, 0, 0.04);
}

.board-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18rpx;
  margin-bottom: 22rpx;
}

.board-title,
.board-desc {
  display: block;
}

.board-title {
  color: var(--app-text);
  font-size: var(--font-size-list-title);
  font-weight: var(--font-semibold);
}

.board-desc {
  margin-top: 8rpx;
  color: var(--app-text-secondary);
  font-size: var(--font-size-tabbar);
  line-height: var(--line-body-sm);
}

.mode-switch {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8rpx;
  width: 210rpx;
  flex: 0 0 auto;
  padding: 7rpx;
  border-radius: var(--app-radius-button);
  background: #e9e2d6;
  border: 1rpx solid rgba(122, 139, 111, 0.14);
}

.mode-button {
  height: 58rpx;
  border: 0;
  border-radius: var(--app-radius-button);
  background: transparent;
  color: var(--app-text-secondary);
  font-size: var(--font-size-tabbar);
  font-weight: var(--font-semibold);
}

.mode-button.is-active {
  background: var(--app-accent);
  color: var(--text-white);
  box-shadow: 0 14rpx 30rpx rgba(47, 47, 47, 0.12);
}

.single-card,
.recipe-card,
.merged-card,
.empty-card {
  padding: 20rpx;
  border-radius: 32rpx;
  background: #e9e2d6;
}

.recipe-list {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.recipe-swipe-row {
  position: relative;
  overflow: hidden;
}

.recipe-header {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  min-height: 78rpx;
  margin-bottom: 12rpx;
  padding: 0 18rpx;
  border-radius: 26rpx;
  background: #e9e2d6;
  transition: transform 0.22s ease;
}

.recipe-header.is-open {
  transform: translateX(-132rpx);
}

.recipe-title {
  display: block;
  color: var(--app-text);
  font-size: var(--font-size-list-title);
  font-weight: var(--font-medium);
  line-height: var(--line-caption);
}

.recipe-subtitle {
  display: block;
  margin-top: 8rpx;
  color: var(--app-text-tertiary);
  font-size: var(--font-size-tabbar);
}

.recipe-arrow {
  color: var(--app-text);
  font-size: var(--font-size-hero);
  line-height: var(--line-tabbar);
  transition: transform 0.2s ease;
}

.recipe-arrow.is-expanded {
  transform: rotate(90deg);
}

.ingredient-list {
  overflow: hidden;
  margin: 4rpx 0 10rpx;
  border-radius: 28rpx;
  background: #fffdfc;
}

.swipe-row {
  position: relative;
  overflow: hidden;
  border-bottom: 1rpx solid rgba(0, 0, 0, 0.04);
}

.swipe-row:last-child {
  border-bottom: 0;
}

.ingredient-row {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1fr 150rpx;
  align-items: center;
  min-height: 86rpx;
  padding: 0 18rpx;
  background: #fffdfc;
  transition: transform 0.22s ease;
}

.ingredient-row.is-open {
  transform: translateX(-132rpx);
}

.ingredient-main {
  display: flex;
  align-items: center;
  gap: 16rpx;
  min-width: 0;
}

.check {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 34rpx;
  height: 34rpx;
  border: 1rpx solid rgba(122, 139, 111, 0.2);
  border-radius: 50%;
  color: var(--text-white);
  font-size: var(--font-size-tabbar);
  font-weight: var(--font-semibold);
}

.check.is-checked {
  background: var(--app-accent);
  border-color: var(--app-accent);
}

.ingredient-name {
  overflow: hidden;
  color: var(--app-text);
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-semibold);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ingredient-amount {
  color: var(--app-text-secondary);
  font-size: var(--font-size-body-sm);
  text-align: left;
}

.ingredient-name.is-checked,
.ingredient-amount.is-checked {
  color: var(--app-text-tertiary);
  text-decoration: line-through;
}

.swipe-remove {
  position: absolute;
  top: 12rpx;
  right: 0;
  z-index: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 116rpx;
  height: 58rpx;
  border-radius: var(--app-radius-button);
  background: #e5735f;
  color: var(--text-white);
  font-size: var(--font-size-tag);
  font-weight: var(--font-semibold);
}

.recipe-remove {
  top: 8rpx;
}

.action-dock {
  position: fixed;
  right: 42rpx;
  bottom: calc(150rpx + env(safe-area-inset-bottom, 0));
  left: 42rpx;
  z-index: 29;
  display: grid;
  grid-template-columns: 1fr 1fr 1.35fr;
  gap: 12rpx;
  margin-top: 0;
  padding: 14rpx;
  border: 1rpx solid rgba(0, 0, 0, 0.04);
  border-radius: var(--app-radius-card);
  background: rgba(255, 253, 252, 0.96);
  box-shadow: 0 16rpx 42rpx rgba(0, 0, 0, 0.04);
}

.dock-button {
  height: 64rpx;
  border: 0;
  border-radius: var(--app-radius-button);
  background: #e9e2d6;
  color: var(--app-text);
  font-size: var(--font-size-tag);
  font-weight: var(--font-semibold);
}

.dock-button.is-primary {
  background: var(--app-accent);
  color: var(--text-white);
}

.empty-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14rpx;
  min-height: 548rpx;
  padding: 58rpx 24rpx 36rpx;
  overflow: hidden;
  text-align: center;
}

.empty-card::before {
  position: absolute;
  top: -120rpx;
  right: -100rpx;
  width: 300rpx;
  height: 300rpx;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(47, 47, 47, 0.06), transparent 68%);
  content: '';
}

.empty-illustration {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 190rpx;
  height: 190rpx;
  margin-bottom: 12rpx;
  border-radius: 50%;
  background:
    linear-gradient(145deg, rgba(255, 253, 252, 0.98), rgba(233, 226, 214, 0.78));
  box-shadow: inset 0 1rpx 0 rgba(255, 253, 252, 0.9), 0 20rpx 44rpx rgba(0, 0, 0, 0.04);
}

.basket-line {
  position: relative;
  width: 110rpx;
  height: 92rpx;
}

.basket-handle {
  position: absolute;
  top: 0;
  left: 22rpx;
  width: 66rpx;
  height: 42rpx;
  border: 6rpx solid var(--app-text);
  border-bottom: 0;
  border-radius: 40rpx 40rpx 0 0;
  opacity: 0.84;
}

.basket-body {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  height: 62rpx;
  border: 6rpx solid var(--app-text);
  border-radius: 20rpx 20rpx 26rpx 26rpx;
  opacity: 0.9;
}

.basket-dot {
  width: 10rpx;
  height: 10rpx;
  border-radius: 50%;
  background: var(--app-text);
  opacity: 0.72;
}

.empty-kicker {
  position: relative;
  z-index: 1;
  padding: 8rpx 16rpx;
  border-radius: var(--app-radius-button);
  background: var(--app-accent-soft);
  color: var(--app-text-secondary);
  font-size: var(--font-size-tabbar);
  font-weight: var(--font-semibold);
}

.empty-title {
  position: relative;
  z-index: 1;
  color: var(--app-text);
  font-size: var(--font-size-section-title);
  font-weight: var(--font-medium);
}

.empty-desc {
  position: relative;
  z-index: 1;
  max-width: 460rpx;
  color: var(--app-text-secondary);
  font-size: var(--font-size-tag);
  line-height: var(--line-body-sm);
}

.empty-actions {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14rpx;
  width: 100%;
  margin-top: 22rpx;
}

.empty-button {
  height: 72rpx;
  border: 0;
  border-radius: var(--app-radius-button);
  background: var(--app-accent-soft);
  color: var(--app-text);
  font-size: var(--font-size-tag);
  font-weight: var(--font-semibold);
}

.empty-button.is-primary {
  background: var(--app-accent);
  color: var(--text-white);
}

.empty-button::after {
  border: 0;
}

.sheet-mask {
  position: fixed;
  inset: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48rpx;
  background: rgba(47, 47, 47, 0.28);
  backdrop-filter: blur(10rpx);
  -webkit-backdrop-filter: blur(10rpx);
}

.price-panel {
  width: min(650rpx, 100%);
  max-height: 78vh;
  padding: 28rpx;
  overflow-y: auto;
  border-radius: var(--app-radius-card);
  background: rgba(255, 253, 252, 0.94);
  box-shadow: 0 28rpx 80rpx rgba(0, 0, 0, 0.08);
}

.price-panel__head {
  display: flex;
  justify-content: space-between;
  gap: 20rpx;
}

.price-panel__title,
.price-panel__desc,
.price-row__name {
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
  line-height: var(--line-body-sm);
}

.price-panel__close {
  color: var(--app-text-tertiary);
  font-size: var(--font-size-detail-title);
  line-height: var(--line-tabbar);
}

.price-list {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
  margin-top: 24rpx;
}

.price-row {
  display: grid;
  grid-template-columns: 1fr 240rpx;
  align-items: center;
  gap: 18rpx;
  padding: 18rpx;
  border-radius: 24rpx;
  background: #e9e2d6;
}

.price-row__name {
  color: var(--app-text);
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-medium);
}

.price-row__field {
  display: flex;
  align-items: center;
  height: 62rpx;
  padding: 0 18rpx;
  border-radius: var(--app-radius-button);
  background: #fffdfc;
}

.price-row__prefix,
.price-row__unit {
  color: var(--app-text-secondary);
  font-size: var(--font-size-tabbar);
  font-weight: var(--font-semibold);
}

.price-input {
  min-width: 0;
  flex: 1;
  color: var(--app-text);
  font-size: var(--font-size-caption);
  font-weight: var(--font-medium);
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

.save-price-button::after {
  border: 0;
}
</style>
