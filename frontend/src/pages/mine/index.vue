<template>
  <view class="app-page mine-page">
    <view v-if="isLoggedIn" class="mine-shell">
      <header class="profile-header">
        <image class="profile-avatar" :src="profileAvatarUrl" mode="aspectFill" />
        <view class="profile-copy">
          <text class="profile-name">{{ displayNickname }}</text>
          <text class="profile-bio">{{ profile.bio || '认真吃饭，也认真生活' }}</text>
        </view>
        <button class="icon-button profile-edit" aria-label="编辑个人资料" @tap="editProfile">
          <app-icon name="edit" size="22px" />
        </button>
      </header>

      <button class="sharing-row" @tap="goToPrivacy">
        <app-icon name="users" size="22px" />
        <text>{{ sharingSummary }}</text>
        <app-icon class="row-chevron" name="chevron-right" size="18px" />
      </button>

      <section class="family-section">
        <view class="family-summary">
          <button class="family-name-button" @tap="goToFamilies">
            <text>{{ currentFamily.name }}</text>
            <app-icon name="chevron-down" size="17px" />
          </button>
          <text class="family-meta">
            {{ currentFamily.members.length }} 位成员 · {{ currentFamily.pendingItems }} 项待采购
          </text>
        </view>
        <view class="family-actions" aria-label="家庭快捷入口">
          <button class="family-action" @tap="goToCurrentFamily">
            <app-icon name="users" size="27px" />
            <text>管理</text>
          </button>
          <button class="family-action" @tap="goToFamilyPreferences">
            <app-icon name="bowl-food" size="27px" />
            <text>口味</text>
          </button>
          <button class="family-action" @tap="goToFamilyCode">
            <app-icon name="qr-code" size="27px" />
            <text>家庭码</text>
          </button>
        </view>
      </section>

      <section class="mine-recipes">
        <view class="section-heading">
          <button class="section-title" @tap="goToMyRecipes">
            <text>我的菜谱</text>
            <app-icon name="chevron-right" size="17px" />
          </button>
          <button class="section-action" @tap="goToCreateRecipe">
            <app-icon name="plus" size="18px" />
            <text>添加</text>
          </button>
        </view>
        <scroll-view
          v-if="myRecipePreviews.length"
          class="recipe-rail"
          scroll-x
          :show-scrollbar="false"
          aria-label="我的菜谱，可左右滑动"
        >
          <view class="recipe-row">
            <button
              v-for="recipe in myRecipePreviews"
              :key="recipe.id"
              class="mine-recipe-card"
              @tap="openMyRecipe(recipe.id)"
            >
              <image class="mine-recipe-card__image" :src="recipe.image" mode="aspectFill" />
              <view class="mine-recipe-card__copy">
                <text class="mine-recipe-card__title">{{ recipe.name }}</text>
                <view class="mine-recipe-card__visibility">
                  <app-icon :name="recipe.visibility.includes('家庭') ? 'users' : 'lock-simple'" size="14px" />
                  <text>{{ displayRecipeVisibility(recipe.visibility) }}</text>
                </view>
              </view>
            </button>
          </view>
        </scroll-view>
        <button v-else class="recipe-empty" @tap="goToCreateRecipe">
          <app-icon name="recipe" size="28px" />
          <text>还没有个人菜谱，添加第一道</text>
        </button>
      </section>

      <section class="asset-shortcuts" aria-label="个人内容">
        <button class="asset-shortcut" @tap="goToFavorites">
          <app-icon name="star" size="31px" />
          <view>
            <text class="asset-title">收藏</text>
            <text class="asset-meta">{{ favoriteCount }} 道内容</text>
          </view>
          <app-icon class="row-chevron" name="chevron-right" size="18px" />
        </button>
        <button class="asset-shortcut" @tap="goToRecentViews">
          <app-icon name="clock" size="31px" />
          <view>
            <text class="asset-title">最近浏览</text>
            <text class="asset-meta">{{ recentViewCount }} 条记录</text>
          </view>
          <app-icon class="row-chevron" name="chevron-right" size="18px" />
        </button>
      </section>

      <section class="settings-card" aria-label="常用设置">
        <button class="settings-row" @tap="goToNotifications">
          <app-icon name="bell" size="21px" />
          <text>消息与提醒</text>
          <app-icon class="row-chevron" name="chevron-right" size="18px" />
        </button>
        <button class="settings-row" @tap="goToPrivacy">
          <app-icon name="user-focus" size="21px" />
          <text>隐私与家庭共享</text>
          <app-icon class="row-chevron" name="chevron-right" size="18px" />
        </button>
        <button class="settings-row" @tap="goToSettings">
          <app-icon name="sliders-horizontal" size="21px" />
          <text>更多设置</text>
          <app-icon class="row-chevron" name="chevron-right" size="18px" />
        </button>
      </section>
    </view>

    <view v-else class="guest-shell">
      <image class="guest-avatar" :src="avatarPlaceholderUrl" mode="aspectFill" />
      <text class="guest-title">登录后查看我的内容</text>
      <text class="guest-description">同步家庭、菜谱、收藏和浏览记录</text>
      <button class="guest-login" @tap="goToLogin">手机号登录</button>
      <section class="settings-card guest-settings">
        <button class="settings-row" @tap="goToFavorites">
          <app-icon name="heart" size="21px" />
          <text>收藏</text>
          <app-icon class="row-chevron" name="chevron-right" size="18px" />
        </button>
        <button class="settings-row" @tap="goToRecentViews">
          <app-icon name="clock" size="21px" />
          <text>最近浏览</text>
          <app-icon class="row-chevron" name="chevron-right" size="18px" />
        </button>
        <button class="settings-row" @tap="goToSettings">
          <app-icon name="sliders-horizontal" size="21px" />
          <text>更多设置</text>
          <app-icon class="row-chevron" name="chevron-right" size="18px" />
        </button>
      </section>
    </view>

    <home-tab-bar :tabs="tabs" />
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import AppIcon from '../../components/app/app-icon.vue';
import HomeTabBar from '../../components/home/home-tab-bar.vue';
import { loadAuthUser } from '../../services/auth';
import { loadActiveFamilyId, loadFamilies } from '../../services/family';
import { loadMyRecipes, type MyRecipe } from '../../services/my-recipes';
import { getDefaultUserProfile, getUserProfile } from '../../services/profile';
import { listMobileFavorites, listMobileViewHistories } from '../../services/public-api';
import type { FamilyProfile } from '../../types/family';
import type { UserProfile } from '../../types/profile';

const tabs = [
  { id: 'home', label: '首页', active: false },
  { id: 'categories', label: '分类', active: false },
  { id: 'basket', label: '菜篮', active: false },
  { id: 'mine', label: '我的', active: true }
];

const authUser = ref(loadAuthUser());
const profile = ref<UserProfile>(getDefaultUserProfile());
const familyOptions = ref<FamilyProfile[]>([]);
const activeFamilyId = ref(loadActiveFamilyId());
const favoriteCount = ref(0);
const recentViewCount = ref(0);
const myRecipePreviews = ref<MyRecipe[]>([]);
const mineRequestSequence = ref(0);
const avatarPlaceholderUrl =
  'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 200%22%3E%3Crect width=%22200%22 height=%22200%22 rx=%2252%22 fill=%22%23E9E2D6%22/%3E%3Ccircle cx=%22100%22 cy=%2277%22 r=%2226%22 fill=%22%237A8B6F%22 opacity=%22.72%22/%3E%3Cpath d=%22M57 166c10-32 25-48 43-48s33 16 43 48%22 fill=%22%237A8B6F%22 opacity=%22.72%22/%3E%3C/svg%3E';

const isLoggedIn = computed(() => authUser.value !== null);
const profileAvatarUrl = computed(() => profile.value.avatarUrl || avatarPlaceholderUrl);
const displayNickname = computed(() => profile.value.nickname.trim() || '未设置昵称');
const currentFamily = computed<FamilyProfile>(() => {
  return familyOptions.value.find((family) => family.id === activeFamilyId.value) ?? familyOptions.value[0] ?? {
    id: '',
    name: '暂未加入家庭',
    avatar: '',
    avatarFileId: null,
    description: '创建或加入家庭后可共享内容',
    commonRecipes: 0,
    pendingItems: 0,
    members: []
  };
});
const sharingSummary = computed(() => {
  if (!currentFamily.value.id) return '还没有家庭共享信息';
  const preferences = currentFamily.value.preferences;
  const sharedGroups = [
    preferences?.taste,
    preferences?.preferences?.length,
    preferences?.avoidItems?.length,
    preferences?.allergies?.length,
    myRecipePreviews.value.some((recipe) => recipe.visibility.includes('家庭'))
  ].filter(Boolean).length;
  return `已向${currentFamily.value.name}共享 ${sharedGroups} 项信息`;
});

const familyQuery = computed(() => currentFamily.value.id ? `?id=${encodeURIComponent(currentFamily.value.id)}` : '');
const navigateTo = (url: string) => uni.navigateTo({ url });
const goToLogin = () => navigateTo('/pages/login/index');
const editProfile = () => navigateTo('/pages/profile-edit/index');
const goToFavorites = () => navigateTo('/pages/favorites/index');
const goToRecentViews = () => navigateTo('/pages/recent-views/index');
const goToMyRecipes = () => navigateTo('/pages/my-recipes/index');
const goToCreateRecipe = () => navigateTo('/pages/recipe-create/index');
const goToSettings = () => navigateTo('/pages/settings/index');
const goToPrivacy = () => navigateTo('/pages/privacy-sharing/index');
const goToNotifications = () => navigateTo('/pages/notifications/index');
const goToFamilies = () => navigateTo('/pages/family/index');
const goToCurrentFamily = () => navigateTo(currentFamily.value.id
  ? `/pages/family-manage/index${familyQuery.value}`
  : '/pages/family/index');
const goToFamilyPreferences = () => navigateTo(currentFamily.value.id
  ? `/pages/family-preferences/index?familyId=${encodeURIComponent(currentFamily.value.id)}`
  : '/pages/family/index');
const goToFamilyCode = () => navigateTo(currentFamily.value.id
  ? `/pages/family-invite/index?familyId=${encodeURIComponent(currentFamily.value.id)}`
  : '/pages/family/index');
const openMyRecipe = (recipeId: string) => navigateTo(`/pages/my-recipe-detail/index?id=${encodeURIComponent(recipeId)}`);
const displayRecipeVisibility = (visibility: string) => visibility.includes('家庭')
  ? `已共享 · ${currentFamily.value.name}`
  : '仅自己';

const refreshUserStats = async (expectedToken: string, sequence: number) => {
  const session = loadAuthUser();
  if (!session?.id || session.token !== expectedToken) return;
  const [
    profileResult,
    familiesResult,
    favoritesResult,
    historiesResult,
    recipesResult
  ] = await Promise.allSettled([
    getUserProfile(),
    loadFamilies(),
    listMobileFavorites({ userId: session.id, page: 1, pageSize: 1 }),
    listMobileViewHistories({ userId: session.id, page: 1, pageSize: 1 }),
    loadMyRecipes()
  ]);
  if (loadAuthUser()?.token !== expectedToken || sequence !== mineRequestSequence.value) return;

  if (profileResult.status === 'fulfilled') {
    profile.value = profileResult.value;
  }
  if (familiesResult.status === 'fulfilled') {
    familyOptions.value = familiesResult.value;
  }
  activeFamilyId.value = loadActiveFamilyId();
  if (favoritesResult.status === 'fulfilled') {
    favoriteCount.value = favoritesResult.value.total;
  }
  if (historiesResult.status === 'fulfilled') {
    recentViewCount.value = historiesResult.value.total;
  }
  if (recipesResult.status === 'fulfilled') {
    myRecipePreviews.value = recipesResult.value.slice(0, 6);
  }

  const results = [
    profileResult,
    familiesResult,
    favoritesResult,
    historiesResult,
    recipesResult
  ];
  if (results.every((result) => result.status === 'rejected')) {
    const rejectedResult = results.find(
      (result): result is PromiseRejectedResult => result.status === 'rejected'
    );
    throw rejectedResult?.reason ?? new Error('我的页面加载失败');
  }
};

const refreshMinePage = async () => {
  const sequence = mineRequestSequence.value + 1;
  mineRequestSequence.value = sequence;
  const session = loadAuthUser();
  authUser.value = session;
  profile.value = getDefaultUserProfile();
  if (!session?.id) {
    familyOptions.value = [];
    activeFamilyId.value = '';
    favoriteCount.value = 0;
    recentViewCount.value = 0;
    myRecipePreviews.value = [];
    return;
  }

  try {
    await refreshUserStats(session.token, sequence);
  } catch (error) {
    if (sequence !== mineRequestSequence.value || loadAuthUser()?.token !== session.token) return;
    uni.showToast({ title: error instanceof Error ? error.message : '我的页面加载失败', icon: 'none' });
  }
};

onShow(() => {
  void refreshMinePage();
});

onMounted(() => {
  void refreshMinePage();
});
</script>

<style scoped lang="scss">
button::after {
  border: 0;
}

.mine-page {
  min-height: 100vh;
  padding: 0 16px calc(112px + var(--app-safe-area-bottom));
  background: var(--app-bg);
}

.mine-shell,
.guest-shell {
  padding-top: calc(var(--app-safe-area-top) + 30px);
}

.profile-header {
  display: grid;
  grid-template-columns: 68px minmax(0, 1fr) 44px;
  align-items: center;
  gap: 16px;
}

.profile-avatar {
  width: 68px;
  height: 68px;
  border-radius: var(--radius-lg);
  background: var(--app-surface);
}

.profile-copy {
  min-width: 0;
}

.profile-name,
.profile-bio,
.family-meta,
.asset-title,
.asset-meta,
.guest-title,
.guest-description {
  display: block;
}

.profile-name {
  color: var(--text-primary);
  font-size: var(--font-size-page-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-page-title);
}

.profile-bio {
  margin-top: 4px;
  overflow: hidden;
  color: var(--text-tertiary);
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-regular);
  line-height: var(--line-body-sm);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.icon-button,
.profile-edit,
.sharing-row,
.family-name-button,
.family-action,
.section-title,
.section-action,
.mine-recipe-card,
.recipe-empty,
.asset-shortcut,
.settings-row,
.guest-login {
  margin: 0;
  padding: 0;
  border: 0;
}

.profile-edit {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background: transparent;
  color: var(--text-primary);
}

.sharing-row {
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr) 18px;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 52px;
  margin-top: 20px;
  padding: 0 14px;
  border: 1px solid var(--app-border);
  border-radius: var(--radius-md);
  background: var(--app-surface-strong);
  color: var(--app-primary);
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-medium);
  line-height: var(--line-body-sm);
  text-align: left;
}

.sharing-row text {
  overflow: hidden;
  color: var(--text-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.row-chevron {
  justify-self: end;
  color: var(--text-tertiary);
}

.family-section {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 1.4fr);
  align-items: center;
  gap: 12px;
  margin-top: 22px;
  padding-bottom: 22px;
  border-bottom: 1px solid var(--app-border);
}

.family-summary {
  min-width: 0;
}

.family-name-button {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  max-width: 100%;
  min-height: 44px;
  background: transparent;
  color: var(--text-primary);
  font-size: var(--font-size-section-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-section-title);
}

.family-name-button text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.family-meta {
  margin-top: 2px;
  overflow: hidden;
  color: var(--text-tertiary);
  font-size: var(--font-size-tag);
  font-weight: var(--font-regular);
  line-height: var(--line-tag);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.family-actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
}

.family-action {
  display: flex;
  min-width: 0;
  min-height: 66px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 6px;
  border-left: 1px solid var(--app-border);
  background: transparent;
  color: var(--app-primary);
}

.family-action text {
  color: var(--text-primary);
  font-size: var(--font-size-tag);
  font-weight: var(--font-medium);
  line-height: var(--line-tag);
}

.mine-recipes {
  margin-top: 18px;
}

.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 44px;
}

.section-title,
.section-action {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  background: transparent;
}

.section-title {
  gap: 4px;
  color: var(--text-primary);
  font-size: var(--font-size-section-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-section-title);
}

.section-action {
  gap: 4px;
  color: var(--app-primary);
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-medium);
  line-height: var(--line-body-sm);
}

.recipe-rail {
  width: calc(100% + 16px);
  margin-top: 8px;
  white-space: nowrap;
}

.recipe-row {
  display: inline-flex;
  gap: 10px;
  padding-right: 16px;
}

.mine-recipe-card {
  display: flex;
  width: 146px;
  flex: 0 0 146px;
  overflow: hidden;
  flex-direction: column;
  border-radius: var(--radius-md);
  background: var(--app-surface-strong);
  color: var(--text-primary);
  text-align: left;
  white-space: normal;
}

.mine-recipe-card__image {
  width: 146px;
  height: 110px;
  background: var(--app-surface);
}

.mine-recipe-card__copy {
  min-height: 64px;
  padding: 9px 11px 10px;
}

.mine-recipe-card__title {
  display: block;
  overflow: hidden;
  color: var(--text-primary);
  font-size: var(--font-size-list-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-list-title);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mine-recipe-card__visibility {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 3px;
  overflow: hidden;
  color: var(--text-tertiary);
  font-size: var(--font-size-tag);
  font-weight: var(--font-regular);
  line-height: var(--line-tag);
  white-space: nowrap;
}

.mine-recipe-card__visibility text {
  overflow: hidden;
  text-overflow: ellipsis;
}

.recipe-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  min-height: 92px;
  margin-top: 8px;
  border: 1px dashed var(--app-border-strong);
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--app-primary);
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-medium);
}

.asset-shortcuts {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  margin-top: 18px;
  border-top: 1px solid var(--app-border);
  border-bottom: 1px solid var(--app-border);
}

.asset-shortcut {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) 18px;
  align-items: center;
  gap: 10px;
  min-height: 76px;
  background: transparent;
  color: var(--app-primary);
  text-align: left;
}

.asset-shortcut + .asset-shortcut {
  padding-left: 14px;
  border-left: 1px solid var(--app-border);
}

.asset-title {
  color: var(--text-primary);
  font-size: var(--font-size-list-title);
  font-weight: var(--font-medium);
  line-height: var(--line-list-title);
}

.asset-meta {
  margin-top: 1px;
  color: var(--text-tertiary);
  font-size: var(--font-size-tag);
  font-weight: var(--font-regular);
  line-height: var(--line-tag);
}

.settings-card {
  margin-top: 18px;
  overflow: hidden;
  border: 1px solid var(--app-border);
  border-radius: var(--radius-md);
  background: var(--app-surface-strong);
}

.settings-row {
  display: grid;
  grid-template-columns: 23px minmax(0, 1fr) 18px;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 54px;
  padding: 0 14px;
  background: transparent;
  color: var(--text-primary);
  font-size: var(--font-size-body);
  font-weight: var(--font-regular);
  line-height: var(--line-body);
  text-align: left;
}

.settings-row + .settings-row {
  border-top: 1px solid var(--app-border);
}

.guest-shell {
  display: flex;
  align-items: center;
  flex-direction: column;
}

.guest-avatar {
  width: 78px;
  height: 78px;
  border-radius: 24px;
}

.guest-title {
  margin-top: 18px;
  color: var(--text-primary);
  font-size: var(--font-size-page-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-page-title);
}

.guest-description {
  margin-top: 6px;
  color: var(--text-tertiary);
  font-size: var(--font-size-body-sm);
  line-height: var(--line-body-sm);
}

.guest-login {
  width: 100%;
  min-height: 46px;
  margin-top: 22px;
  border-radius: var(--app-radius-button);
  background: var(--app-primary);
  color: var(--text-white);
  font-size: var(--font-size-body);
  font-weight: var(--font-semibold);
}

.guest-settings {
  width: 100%;
}
</style>
