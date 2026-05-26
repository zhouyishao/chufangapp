# 路由清单

## 子项目识别

| 子项目 | 判断 | 技术栈 | 说明 |
|---|---|---|---|
| admin-frontend | B 端后台 | React + TypeScript + Vite + Tailwind CSS | 管理端页面与组件所在项目 |
| frontend | C 端用户端 | uni-app + Vue 3 + TypeScript | 用户端 App/H5/小程序前端 |
| server | 后端服务 | Node.js + Express + Prisma + PostgreSQL | 当前统一后端，优先继续维护 |
| admin-backend | 旧 B 端后端雏形 | Node.js + Express + MySQL | 早期服务，后续不作为主线 |

## B 端路由

| 路由 | 页面 | 文件路径 | 是否已有 | 状态 |
|---|---|---|---|---|
| /login | 登录页 | admin-frontend/src/app/pages/LoginPage.tsx | 是 | UI开发中 |
| / | 原型索引/工作台入口 | admin-frontend/src/app/pages/DashboardPage.tsx | 是 | UI开发中 |
| /categories | 分类管理 | admin-frontend/src/app/pages/CategoriesPage.tsx | 是 | UI开发中 |
| /categories/:id | 分类详情/编辑 | admin-frontend/src/app/pages/CategoryDetailPage.tsx | 是 | UI开发中 |
| /ingredients | 食材管理 | admin-frontend/src/app/pages/IngredientsPage.tsx | 是 | UI开发中 |
| /ingredients/create | 新增食材 | admin-frontend/src/app/pages/IngredientCreatePage.tsx | 否 | 未开始 |
| /ingredients/:id | 食材详情 | admin-frontend/src/app/pages/IngredientDetailPage.tsx | 是 | UI开发中 |
| /ingredients/:id/edit | 编辑食材 | admin-frontend/src/app/pages/IngredientEditPage.tsx | 否 | 未开始 |
| /recipes | 菜谱管理 | admin-frontend/src/app/pages/RecipesPage.tsx | 是 | UI开发中 |
| /recipes/create | 新增菜谱 | admin-frontend/src/app/pages/RecipeCreatePage.tsx | 否 | 未开始 |
| /recipes/:id | 菜谱详情 | admin-frontend/src/app/pages/RecipeDetailPage.tsx | 是 | UI开发中 |
| /recipes/:id/edit | 编辑菜谱 | admin-frontend/src/app/pages/RecipeEditPage.tsx | 否 | 未开始 |
| /recommendations | 今日推荐管理 | admin-frontend/src/app/pages/RecommendationsPage.tsx | 否 | 未开始 |
| /seasonal | 时令食材管理 | admin-frontend/src/app/pages/SeasonalPage.tsx | 否 | 未开始 |
| /cuisines | 菜系管理 | admin-frontend/src/app/pages/CuisinesPage.tsx | 否 | 未开始 |
| /menus | 场景菜单管理 | admin-frontend/src/app/pages/MenusPage.tsx | 否 | 未开始 |
| /banners | Banner 管理 | admin-frontend/src/app/pages/BannersPage.tsx | 否 | 未开始 |
| /users | 用户管理 | admin-frontend/src/app/pages/UsersPage.tsx | 否 | 未开始 |
| /posts | 晒菜内容管理 | admin-frontend/src/app/pages/PostsPage.tsx | 否 | 未开始 |
| /comments | 评论管理 | admin-frontend/src/app/pages/CommentsPage.tsx | 否 | 未开始 |
| /settings | 系统设置 | admin-frontend/src/app/pages/SettingsPage.tsx | 否 | 未开始 |

## C 端路由

| 路由 | 页面 | 文件路径 | 是否已有 | 状态 |
|---|---|---|---|---|
| pages/index/index | 首页 | frontend/src/pages/index/index.vue | 是 | UI开发中 |
| pages/recommendations/index | 今日推荐 | frontend/src/pages/recommendations/index.vue | 否 | 未开始 |
| pages/seasonal/index | 时令食材 | frontend/src/pages/seasonal/index.vue | 否 | 未开始 |
| pages/ingredients/index | 食材列表 | frontend/src/pages/ingredients/index.vue | 是 | UI开发中 |
| pages/ingredient-detail/index | 食材详情 | frontend/src/pages/ingredient-detail/index.vue | 是 | UI开发中 |
| pages/recipes/index | 菜谱列表 | frontend/src/pages/recipes/index.vue | 是 | UI开发中 |
| pages/recipe-detail/index | 菜谱详情 | frontend/src/pages/recipe-detail/index.vue | 是 | UI开发中 |
| pages/search/index | 搜索页 | frontend/src/pages/search/index.vue | 否 | 未开始 |
| pages/category-filter/index | 分类筛选 | frontend/src/pages/category-filter/index.vue | 否 | 未开始 |
| pages/today/index | 今天吃什么 | frontend/src/pages/today/index.vue | 否 | 未开始 |
| pages/serving-recommendation/index | 几人用餐推荐 | frontend/src/pages/serving-recommendation/index.vue | 否 | 未开始 |
| pages/family-menu/index | 家庭招待菜单 | frontend/src/pages/family-menu/index.vue | 否 | 未开始 |
| pages/favorites/index | 收藏 | frontend/src/pages/favorites/index.vue | 是 | UI开发中 |
| pages/recent-views/index | 浏览历史 | frontend/src/pages/recent-views/index.vue | 是 | UI开发中 |
| pages/mine/index | 我的页面 | frontend/src/pages/mine/index.vue | 是 | UI开发中 |
| pages/basket/index | 菜篮子 | frontend/src/pages/basket/index.vue | 是 | UI开发中 |
| pages/purchase-history/index | 采购历史 | frontend/src/pages/purchase-history/index.vue | 是 | UI开发中 |
| pages/login/index | 账号登录 | frontend/src/pages/login/index.vue | 是 | UI开发中 |
| pages/phone-login/index | 手机登录 | frontend/src/pages/phone-login/index.vue | 是 | UI开发中 |
| pages/register/index | 注册 | frontend/src/pages/register/index.vue | 是 | UI开发中 |
| pages/forgot-password/index | 忘记密码 | frontend/src/pages/forgot-password/index.vue | 是 | UI开发中 |
| pages/my-recipes/index | 我的菜谱 | frontend/src/pages/my-recipes/index.vue | 是 | UI开发中 |
| pages/recipe-create/index | 创建菜谱 | frontend/src/pages/recipe-create/index.vue | 是 | UI开发中 |
| pages/my-recipe-detail/index | 我的菜谱详情 | frontend/src/pages/my-recipe-detail/index.vue | 是 | UI开发中 |
| pages/profile-edit/index | 编辑资料 | frontend/src/pages/profile-edit/index.vue | 是 | UI开发中 |
| pages/family-manage/index | 家庭管理 | frontend/src/pages/family-manage/index.vue | 是 | UI开发中 |
| pages/family/index | 家庭空间 | frontend/src/pages/family/index.vue | 是 | UI开发中 |
| pages/family-member/index | 家庭成员 | frontend/src/pages/family-member/index.vue | 是 | UI开发中 |
| pages/family-invite/index | 家庭邀请 | frontend/src/pages/family-invite/index.vue | 是 | UI开发中 |
