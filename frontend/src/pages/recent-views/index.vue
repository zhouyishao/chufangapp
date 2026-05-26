<template>
  <view class="app-page list-page">
    <view class="topbar">
      <button class="back-button" @tap="goBack">←</button>
      <view>
        <text class="eyebrow">浏览轨迹</text>
        <text class="page-title">最近浏览</text>
      </view>
    </view>

    <view class="timeline-card glass-card">
      <view
        v-for="group in viewGroups"
        :key="group.date"
        class="timeline-group"
      >
        <text class="timeline-date">{{ group.date }}</text>
        <view
          v-for="recipe in group.recipes"
          :key="recipe.id"
          class="recipe-row"
          @tap="goToRecipe(recipe.id)"
        >
          <image class="recipe-image" :src="recipe.image" mode="aspectFill" />
          <view class="recipe-body">
            <text class="recipe-name">{{ recipe.name }}</text>
            <text class="recipe-desc">{{ recipe.description }}</text>
            <text class="recipe-time">{{ recipe.viewedAt }}</text>
          </view>
          <text class="arrow">›</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
interface RecentRecipe {
  id: string;
  name: string;
  description: string;
  image: string;
  viewedAt: string;
}

interface ViewGroup {
  date: string;
  recipes: RecentRecipe[];
}

const viewGroups: ViewGroup[] = [
  {
    date: '今天',
    recipes: [
      {
        id: 'recipe-1',
        name: '芦笋虾仁',
        description: '清爽快手，适合工作日晚餐',
        image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=900&q=80',
        viewedAt: '18:20'
      },
      {
        id: 'recipe-3',
        name: '菌菇豆腐汤',
        description: '口味干净，步骤轻松',
        image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=900&q=80',
        viewedAt: '12:46'
      }
    ]
  },
  {
    date: '昨天',
    recipes: [
      {
        id: 'recipe-2',
        name: '番茄牛腩',
        description: '番茄酸香，适合全家分食',
        image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80',
        viewedAt: '20:05'
      }
    ]
  }
];

const goBack = () => {
  uni.navigateBack();
};

const goToRecipe = (recipeId: string) => {
  uni.navigateTo({ url: `/pages/recipe-detail/index?id=${recipeId}` });
};
</script>

<style scoped lang="scss">
.list-page {
  min-height: 100vh;
  padding-bottom: calc(80rpx + env(safe-area-inset-bottom, 0));
}

.topbar {
  display: flex;
  align-items: center;
  gap: 18rpx;
  margin-bottom: 24rpx;
}

.back-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72rpx;
  height: 72rpx;
  border: 0;
  border-radius: 50%;
  background: #fffdfc;
  color: var(--app-text);
  font-size: 34rpx;
  font-weight: 700;
  box-shadow: 0 12rpx 30rpx rgba(0, 0, 0, 0.04);
}

.back-button::after {
  border: 0;
}

.eyebrow,
.page-title,
.timeline-date,
.recipe-name,
.recipe-desc,
.recipe-time {
  display: block;
}

.eyebrow {
  color: var(--app-text-tertiary);
  font-size: 22rpx;
  font-weight: 700;
}

.page-title {
  margin-top: 4rpx;
  color: var(--app-text);
  font-size: 42rpx;
  font-weight: 600;
}

.timeline-card {
  padding: 24rpx;
}

.timeline-group + .timeline-group {
  margin-top: 28rpx;
  padding-top: 24rpx;
  border-top: 1rpx solid var(--app-border);
}

.timeline-date {
  margin-bottom: 16rpx;
  color: var(--app-text);
  font-size: 28rpx;
  font-weight: 600;
}

.recipe-row {
  display: flex;
  align-items: center;
  gap: 18rpx;
  min-height: 138rpx;
}

.recipe-row + .recipe-row {
  margin-top: 18rpx;
}

.recipe-image {
  width: 118rpx;
  height: 118rpx;
  flex: 0 0 auto;
  border-radius: 24rpx;
}

.recipe-body {
  min-width: 0;
  flex: 1;
}

.recipe-name {
  color: var(--app-text);
  font-size: 28rpx;
  font-weight: 600;
}

.recipe-desc {
  margin-top: 8rpx;
  color: var(--app-text-secondary);
  font-size: 22rpx;
  line-height: 1.45;
}

.recipe-time {
  margin-top: 8rpx;
  color: var(--app-text-tertiary);
  font-size: 20rpx;
}

.arrow {
  color: var(--app-text-tertiary);
  font-size: 42rpx;
}
</style>
