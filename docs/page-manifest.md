# 页面清单

## 页面统计

- Figma MCP 已识别页面/状态 Frame：8 个以上。`node-id=10:2` 为大画布容器，工具输出存在截断，详见 [figma-missing-info.md](/Users/oooz/Desktop/Z_ou/chufangapp/docs/figma-missing-info.md)。
- B 端规划页面/状态：24 个。
- C 端规划页面：29 个，其中 15 个来自执行骨架核心 C 端范围，14 个来自当前项目已有页面。
- 页面/状态总数：53 个。

| 序号 | 端 | 页面名称 | Figma Node | 页面类型 | 路由 | 文件路径 | 状态 | 备注 |
|---|---|---|---|---|---|---|---|---|
| 1 | B端 | 原型索引/工作台入口 | 10:3 | 索引页 | / | admin-frontend/src/app/pages/DashboardPage.tsx | UI开发中 | Figma 已识别，当前实现需继续校准 |
| 2 | B端 | 登录页 | 10:31 | 登录页 | /login | admin-frontend/src/app/pages/LoginPage.tsx | UI开发中 | Figma 已识别，已有页面需按原型重构 |
| 3 | B端 | 后台布局 | 130:2 | 布局页 | / | admin-frontend/src/app/components/AdminLayout.tsx | UI开发中 | Figma 已识别左侧导航 |
| 4 | B端 | 菜谱管理 | 待复核 | 列表页 | /recipes | admin-frontend/src/app/pages/RecipesPage.tsx | UI开发中 | 已有页面，Figma 输出被截断 |
| 5 | B端 | 新增菜谱 | 任务规划页面 | 表单页 | /recipes/create | admin-frontend/src/app/pages/RecipeCreatePage.tsx | 未开始 | 非 Figma 已确认节点 |
| 6 | B端 | 编辑菜谱 | 任务规划页面 | 表单页 | /recipes/:id/edit | admin-frontend/src/app/pages/RecipeEditPage.tsx | 未开始 | 非 Figma 已确认节点 |
| 7 | B端 | 菜谱详情 | 待复核 | 详情页 | /recipes/:id | admin-frontend/src/app/pages/RecipeDetailPage.tsx | UI开发中 | 已有页面，Figma 输出被截断 |
| 8 | B端 | 食材管理 | 待复核 | 列表页 | /ingredients | admin-frontend/src/app/pages/IngredientsPage.tsx | UI开发中 | 已有页面，Figma 输出被截断 |
| 9 | B端 | 新增食材 | 任务规划页面 | 表单页 | /ingredients/create | admin-frontend/src/app/pages/IngredientCreatePage.tsx | 未开始 | 非 Figma 已确认节点 |
| 10 | B端 | 编辑食材 | 任务规划页面 | 表单页 | /ingredients/:id/edit | admin-frontend/src/app/pages/IngredientEditPage.tsx | 未开始 | 非 Figma 已确认节点 |
| 11 | B端 | 食材详情 | 待复核 | 详情页 | /ingredients/:id | admin-frontend/src/app/pages/IngredientDetailPage.tsx | UI开发中 | 已有页面，Figma 输出被截断 |
| 12 | B端 | 分类管理 | 待复核 | 列表页 | /categories | admin-frontend/src/app/pages/CategoriesPage.tsx | UI开发中 | 已有页面，Figma 输出被截断 |
| 13 | B端 | 分类详情/编辑 | 待复核 | 详情页 | /categories/:id | admin-frontend/src/app/pages/CategoryDetailPage.tsx | UI开发中 | 已有页面，Figma 输出被截断 |
| 14 | B端 | 今日推荐管理 | 任务规划页面 | 列表页 | /recommendations | admin-frontend/src/app/pages/RecommendationsPage.tsx | 未开始 | 非 Figma 已确认节点 |
| 15 | B端 | 时令食材管理 | 任务规划页面 | 列表页 | /seasonal | admin-frontend/src/app/pages/SeasonalPage.tsx | 未开始 | 非 Figma 已确认节点 |
| 16 | B端 | 菜系管理 | 任务规划页面 | 列表页 | /cuisines | admin-frontend/src/app/pages/CuisinesPage.tsx | 未开始 | 非 Figma 已确认节点 |
| 17 | B端 | 场景菜单管理 | 任务规划页面 | 列表页 | /menus | admin-frontend/src/app/pages/MenusPage.tsx | 未开始 | 非 Figma 已确认节点 |
| 18 | B端 | Banner 管理 | 任务规划页面 | 列表页 | /banners | admin-frontend/src/app/pages/BannersPage.tsx | 未开始 | 非 Figma 已确认节点 |
| 19 | B端 | 用户管理 | 任务规划页面 | 列表页 | /users | admin-frontend/src/app/pages/UsersPage.tsx | 未开始 | 非 Figma 已确认节点 |
| 20 | B端 | 晒菜内容管理 | 任务规划页面 | 列表页 | /posts | admin-frontend/src/app/pages/PostsPage.tsx | 未开始 | 非 Figma 已确认节点 |
| 21 | B端 | 评论管理 | 任务规划页面 | 列表页 | /comments | admin-frontend/src/app/pages/CommentsPage.tsx | 未开始 | 非 Figma 已确认节点 |
| 22 | B端 | 系统设置 | 待复核 | 设置页 | /settings | admin-frontend/src/app/pages/SettingsPage.tsx | 未开始 | Figma 导航已识别 |
| 23 | B端 | 筛选 Drawer 状态 | 106:110 | 交互状态 | 组件状态 | admin-frontend/src/app/components/Drawer.tsx | UI开发中 | Figma 已识别 |
| 24 | B端 | 删除确认 Modal 状态 | 106:153 | 交互状态 | 组件状态 | admin-frontend/src/app/components/ConfirmModal.tsx | UI开发中 | Figma 已识别 |
| 25 | C端 | 首页 | 任务规划页面 | 首页 | pages/index/index | frontend/src/pages/index/index.vue | UI开发中 | Figma Admin 文件未提供 C 端完整原型 |
| 26 | C端 | 今日推荐 | 任务规划页面 | 列表页 | pages/recommendations/index | frontend/src/pages/recommendations/index.vue | 未开始 | 非 Figma 已确认节点 |
| 27 | C端 | 时令食材 | 任务规划页面 | 列表页 | pages/seasonal/index | frontend/src/pages/seasonal/index.vue | 未开始 | 非 Figma 已确认节点 |
| 28 | C端 | 食材列表 | 任务规划页面 | 列表页 | pages/ingredients/index | frontend/src/pages/ingredients/index.vue | UI开发中 | 已有页面 |
| 29 | C端 | 食材详情 | 任务规划页面 | 详情页 | pages/ingredient-detail/index | frontend/src/pages/ingredient-detail/index.vue | UI开发中 | 已有页面 |
| 30 | C端 | 菜谱列表 | 任务规划页面 | 列表页 | pages/recipes/index | frontend/src/pages/recipes/index.vue | UI开发中 | 已有页面 |
| 31 | C端 | 菜谱详情 | 任务规划页面 | 详情页 | pages/recipe-detail/index | frontend/src/pages/recipe-detail/index.vue | UI开发中 | 已有页面 |
| 32 | C端 | 搜索页 | 任务规划页面 | 搜索页 | pages/search/index | frontend/src/pages/search/index.vue | 未开始 | 非 Figma 已确认节点 |
| 33 | C端 | 分类筛选 | 任务规划页面 | 筛选页 | pages/category-filter/index | frontend/src/pages/category-filter/index.vue | 未开始 | 非 Figma 已确认节点 |
| 34 | C端 | 今天吃什么 | 任务规划页面 | 推荐页 | pages/today/index | frontend/src/pages/today/index.vue | 未开始 | 非 Figma 已确认节点 |
| 35 | C端 | 几人用餐推荐 | 任务规划页面 | 推荐页 | pages/serving-recommendation/index | frontend/src/pages/serving-recommendation/index.vue | 未开始 | 非 Figma 已确认节点 |
| 36 | C端 | 家庭招待菜单 | 任务规划页面 | 菜单页 | pages/family-menu/index | frontend/src/pages/family-menu/index.vue | 未开始 | 非 Figma 已确认节点 |
| 37 | C端 | 收藏 | 任务规划页面 | 列表页 | pages/favorites/index | frontend/src/pages/favorites/index.vue | UI开发中 | 已有页面 |
| 38 | C端 | 浏览历史 | 任务规划页面 | 列表页 | pages/recent-views/index | frontend/src/pages/recent-views/index.vue | UI开发中 | 已有页面 |
| 39 | C端 | 我的页面 | 任务规划页面 | 个人中心 | pages/mine/index | frontend/src/pages/mine/index.vue | UI开发中 | 已有页面 |
| 40 | C端 | 菜篮子 | 当前已有页面 | 功能页 | pages/basket/index | frontend/src/pages/basket/index.vue | UI开发中 | 已有页面，需接真实接口 |
| 41 | C端 | 采购历史 | 当前已有页面 | 列表页 | pages/purchase-history/index | frontend/src/pages/purchase-history/index.vue | UI开发中 | 已有页面，需接真实接口 |
| 42 | C端 | 账号登录 | 当前已有页面 | 登录页 | pages/login/index | frontend/src/pages/login/index.vue | UI开发中 | 已有页面 |
| 43 | C端 | 手机登录 | 当前已有页面 | 登录页 | pages/phone-login/index | frontend/src/pages/phone-login/index.vue | UI开发中 | 已有页面 |
| 44 | C端 | 注册 | 当前已有页面 | 注册页 | pages/register/index | frontend/src/pages/register/index.vue | UI开发中 | 已有页面 |
| 45 | C端 | 忘记密码 | 当前已有页面 | 表单页 | pages/forgot-password/index | frontend/src/pages/forgot-password/index.vue | UI开发中 | 已有页面 |
| 46 | C端 | 我的菜谱 | 当前已有页面 | 列表页 | pages/my-recipes/index | frontend/src/pages/my-recipes/index.vue | UI开发中 | 已有页面 |
| 47 | C端 | 创建菜谱 | 当前已有页面 | 表单页 | pages/recipe-create/index | frontend/src/pages/recipe-create/index.vue | UI开发中 | 已有页面 |
| 48 | C端 | 我的菜谱详情 | 当前已有页面 | 详情页 | pages/my-recipe-detail/index | frontend/src/pages/my-recipe-detail/index.vue | UI开发中 | 已有页面 |
| 49 | C端 | 编辑资料 | 当前已有页面 | 表单页 | pages/profile-edit/index | frontend/src/pages/profile-edit/index.vue | UI开发中 | 已有页面 |
| 50 | C端 | 家庭管理 | 当前已有页面 | 功能页 | pages/family-manage/index | frontend/src/pages/family-manage/index.vue | UI开发中 | 已有页面 |
| 51 | C端 | 家庭空间 | 当前已有页面 | 功能页 | pages/family/index | frontend/src/pages/family/index.vue | UI开发中 | 已有页面 |
| 52 | C端 | 家庭成员 | 当前已有页面 | 功能页 | pages/family-member/index | frontend/src/pages/family-member/index.vue | UI开发中 | 已有页面 |
| 53 | C端 | 家庭邀请 | 当前已有页面 | 功能页 | pages/family-invite/index | frontend/src/pages/family-invite/index.vue | UI开发中 | 已有页面 |
