<template>
  <view class="content-detail-actions">
    <button
      class="content-detail-actions__button content-detail-actions__button--secondary"
      :disabled="favoriteChanging"
      @tap="toggleFavorite"
    >
      <app-icon :name="isFavorite ? 'heart-filled' : 'heart'" size="24rpx" />
      <text>{{ isFavorite ? '已收藏' : '收藏' }}</text>
    </button>
    <button
      class="content-detail-actions__button content-detail-actions__button--primary"
      :disabled="basketChanging"
      @tap="toggleBasket"
    >
      <app-icon :name="isInBasket ? 'check' : 'basket'" size="24rpx" />
      <text>{{ isInBasket ? '已在菜篮' : '加入菜篮' }}</text>
    </button>
  </view>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import AppIcon from './app/app-icon.vue';
import { addBasketItem, getIngredientBasketItemId, loadBasketItems, removeBasketItem } from '../services/basket';
import { loadAuthUser, syncAuthUserWithBackend } from '../services/auth';
import { addMobileFavorite, deleteMobileFavorite, listMobileFavorites, type MobileContentTarget } from '../services/public-api';

const props = defineProps<{
  targetType: MobileContentTarget['targetType'];
  targetId: string | number;
  name: string;
  ingredientId?: string | number;
}>();

const isFavorite = ref(false);
const favoriteRecordId = ref<number | null>(null);
const favoriteChanging = ref(false);
const isInBasket = ref(false);
const basketItemId = ref<string | null>(null);
const basketChanging = ref(false);

const getUser = async () => {
  const user = await syncAuthUserWithBackend(loadAuthUser());
  if (!user?.id) throw new Error('请先登录');
  return { ...user, id: user.id };
};

const syncState = async () => {
  const user = await getUser();
  const [favorites, basket] = await Promise.all([
    listMobileFavorites({ userId: user.id, page: 1, pageSize: 100 }),
    loadBasketItems()
  ]);
  const favorite = favorites.list.find((item) => item.targetType === props.targetType && item.targetId === String(props.targetId));
  isFavorite.value = Boolean(favorite);
  favoriteRecordId.value = favorite?.id ?? null;
  const ingredientId = props.ingredientId ? String(props.ingredientId) : null;
  const basketItem = basket.find((item) => ingredientId ? item.ingredientId === ingredientId : item.name === props.name);
  isInBasket.value = Boolean(basketItem);
  basketItemId.value = basketItem?.id ?? null;
};

const toggleFavorite = async () => {
  if (favoriteChanging.value) return;
  favoriteChanging.value = true;
  try {
    const user = await getUser();
    if (isFavorite.value && favoriteRecordId.value) {
      await deleteMobileFavorite(favoriteRecordId.value);
      isFavorite.value = false;
      favoriteRecordId.value = null;
      uni.showToast({ title: '已取消收藏', icon: 'none' });
    } else {
      const record = await addMobileFavorite({ userId: user.id, targetType: props.targetType, targetId: props.targetId });
      isFavorite.value = true;
      favoriteRecordId.value = record.id;
      uni.showToast({ title: '已加入收藏', icon: 'success' });
    }
  } catch (error) {
    uni.showToast({ title: error instanceof Error ? error.message : '收藏失败', icon: 'none' });
  } finally {
    favoriteChanging.value = false;
  }
};

const toggleBasket = async () => {
  if (basketChanging.value) return;
  basketChanging.value = true;
  try {
    if (isInBasket.value && basketItemId.value) {
      await removeBasketItem(basketItemId.value);
      isInBasket.value = false;
      basketItemId.value = null;
      uni.showToast({ title: '已移出菜篮', icon: 'none' });
    } else {
      const ingredientId = props.ingredientId ? String(props.ingredientId) : undefined;
      const items = await addBasketItem({
        id: ingredientId ? getIngredientBasketItemId(ingredientId) : `${props.targetType.toLowerCase()}-${props.targetId}`,
        recipeId: 'ingredient',
        recipeName: '单独添加',
        name: props.name,
        amountText: '适量',
        checked: false,
        ingredientId
      });
      const item = items.find((entry) => ingredientId ? entry.ingredientId === ingredientId : entry.name === props.name);
      isInBasket.value = true;
      basketItemId.value = item?.id ?? null;
      uni.showToast({ title: '已加入菜篮', icon: 'success' });
    }
  } catch (error) {
    uni.showToast({ title: error instanceof Error ? error.message : '菜篮操作失败', icon: 'none' });
  } finally {
    basketChanging.value = false;
  }
};

onMounted(() => {
  void syncState().catch(() => undefined);
});
</script>

<style scoped lang="scss">
.content-detail-actions {
  display: flex;
  gap: 16rpx;
  margin-top: 24rpx;
  padding: 0 24rpx 24rpx;
}

.content-detail-actions__button {
  display: flex;
  min-height: 84rpx;
  flex: 1;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  border: 1rpx solid var(--app-border);
  border-radius: var(--app-radius-button);
  font-size: var(--font-size-body);
  font-weight: var(--font-semibold);
}

.content-detail-actions__button::after {
  border: 0;
}

.content-detail-actions__button--secondary {
  background: var(--app-surface-strong);
  color: var(--app-primary);
}

.content-detail-actions__button--primary {
  background: var(--app-primary);
  color: var(--app-surface-strong);
}
</style>
