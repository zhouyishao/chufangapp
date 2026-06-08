<template>
  <view class="placeholder-page">
    <text class="placeholder-title">几人用餐推荐</text>
    <text class="placeholder-desc">骨架完成。后续接入真实场景推荐接口并按设计实现页面。</text>
  </view>
</template>

<script setup lang="ts"></script>

<style scoped lang="scss">
.placeholder-page {
  min-height: 100vh;
  padding: 48rpx 32rpx;
  background: #f7f4ef;
}

.placeholder-title {
  display: block;
  color: var(--text-primary);
  font-size: var(--font-size-section-title);
  font-weight: var(--font-semibold);
}

.placeholder-desc {
  display: block;
  margin-top: 16rpx;
  color: var(--text-tertiary);
  font-size: var(--font-size-caption);
  line-height: var(--line-caption);
}
</style>
