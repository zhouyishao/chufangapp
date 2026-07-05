# API 映射审计

## 说明

- 本文区分三层：
  - C 端调用层
  - 后台调用层
  - 服务端实际注册层
- 重点关注“前端在调什么”和“后端是否真的挂了什么”。

## C 端 API 调用

主要文件：

- `frontend/src/services/public-api.ts`
- `frontend/src/services/basket.ts`
- `frontend/src/services/family.ts`
- `frontend/src/services/price.ts`
- `frontend/src/services/my-recipes.ts`
- `frontend/src/services/profile.ts`

### 首页与内容

| 方法 | 路径 |
| --- | --- |
| `getHome` | `GET /mobile/home` |
| `getHomeTopNavs` | `GET /app/home/top-navs` |
| `getHomeTopNavContents` | `GET /app/home/top-navs/:navId/contents` |
| `getHomeHeroBanners` | `GET /app/home/top-navs/:navId/hero-banners` |
| `getHomeModules` | `GET /app/home/top-navs/:navId/modules` |
| `getPageModules` | `GET /app/page-modules` |
| `listRecipes` | `GET /recipes` |
| `getRecipe` | `GET /recipes/:id` |
| `listIngredients` | `GET /ingredients` |
| `getIngredient` | `GET /ingredients/:id` |
| `getBeverage` | `GET /beverages/:id` |
| `searchMobileContent` | `GET /mobile/search` |

### 登录与用户

| 方法 | 路径 |
| --- | --- |
| `loginMobileAuth` | `POST /mobile/auth/login` |
| `listMobileFavorites` | `GET /mobile/favorites` |
| `addMobileFavorite` | `POST /mobile/favorites` |
| `deleteMobileFavorite` | `DELETE /mobile/favorites/:id` |
| `listMobileViewHistories` | `GET /mobile/view-histories` |
| `addMobileViewHistory` | `POST /mobile/view-histories` |
| `listMobileSearchHistories` | `GET /mobile/search-histories` |
| `clearMobileSearchHistories` | `DELETE /mobile/search-histories` |

### 家庭与菜篮子

| 方法 | 路径 |
| --- | --- |
| `listMobileFamilies` | `GET /mobile/families` |
| `createMobileFamily` | `POST /mobile/families` |
| `getMobileFamily` | `GET /mobile/families/:id` |
| `updateMobileFamily` | `PUT /mobile/families/:id` |
| `createMobileFamilyInvite` | `POST /mobile/families/:id/invites` |
| `getMobileFamilyInvite` | `GET /mobile/family-invites/:token` |
| `joinMobileFamilyInvite` | `POST /mobile/family-invites/:token/join` |
| `saveMobileFamilyPreferences` | `PUT /mobile/families/:id/preferences` |
| `removeMobileFamilyMember` | `DELETE /mobile/family-members/:id` |
| `updateMobileFamilyMember` | `PUT /mobile/family-members/:id` |
| `listMobileBasketItems` | `GET /mobile/basket-items` |
| `addMobileBasketItem` | `POST /mobile/basket-items` |
| `updateMobileBasketItem` | `PUT /mobile/basket-items/:id` |
| `deleteMobileBasketItem` | `DELETE /mobile/basket-items/:id` |

### 我的菜谱与价格记录

| 方法 | 路径 |
| --- | --- |
| `listMobileMyRecipes` | `GET /mobile/my-recipes` |
| `getMobileMyRecipe` | `GET /mobile/my-recipes/:id` |
| `createMobileMyRecipe` | `POST /mobile/my-recipes` |
| `listMobileIngredientPriceRecords` | `GET /mobile/ingredient-price-records` |
| `createMobileIngredientPriceRecord` | `POST /mobile/ingredient-price-records` |
| `deleteMobileIngredientPriceRecord` | `DELETE /mobile/ingredient-price-records/:id` |

## 后台 API 调用

主要文件：

- `admin-frontend/src/app/api.ts`

### 已集中管理的资源

| 资源域 | 主要路径前缀 |
| --- | --- |
| 认证 | `/auth` |
| 用户 | `/users` |
| 分类 | `/categories` |
| 标签 | `/tags` |
| 频道 | `/channels` |
| 食材 | `/ingredients` |
| 菜谱 | `/recipes` |
| 酒水 | `/beverages` |
| 家庭 | `/families` |
| 审核 | `/audits` |
| 首页顶部导航 | `/home/top-navs` |
| 顶部导航轮播图 | `/home/top-navs/:navId/hero-banners` |
| 顶部导航模块 | `/home/top-navs/:navId/modules` |
| 内容选择器 | `/content-selector` |
| 资源接入 | `/resource-*` |
| 上传 | `/upload/*` |

### 管理端调用面摘要

| 模块 | 调用类型 |
| --- | --- |
| `users` | 列表、详情、创建、更新、删除、状态、收藏、最近浏览 |
| `categories` | 列表、详情、创建、更新、删除、发布、状态 |
| `tags` | 列表、详情、创建、更新、删除、状态 |
| `channels` | 列表、详情、创建、更新、删除、状态 |
| `ingredients` | 列表、详情、创建、更新、删除、发布、推荐、状态 |
| `recipes` | 列表、详情、创建、更新、删除、发布、下线、提审、推荐、审核、状态、关联酒水 |
| `beverages` | 列表、详情、创建、更新、删除、启用、停用 |
| `families` | 概览、列表、详情、创建、状态、成员、邀请 |
| `home/top-navs` | 汇总、列表、详情、创建、更新、删除、状态、默认、排序 |
| `home/top-navs/:navId/hero-banners` | 列表、详情、创建、更新、状态、删除 |
| `home/top-navs/:navId/modules` | 列表、详情、创建、更新、状态、删除 |
| `resource-apps` | 列表、详情、创建、更新、状态、删除 |
| `resource-api-keys` | 列表、创建、重置、状态、删除 |
| `resource-permissions` | 列表、详情、创建、更新、状态、删除 |
| `resource-logs` | 列表、详情 |
| `resource-imports` | 预览、上传、批次、统计、条目、状态变更、确认、重试 |

## 服务端实际注册接口

## 管理端挂载前缀

| 挂载前缀 | 路由文件 |
| --- | --- |
| `/api/admin/auth` | `server/src/routes/admin/auth.ts` |
| `/api/admin/categories` | `server/src/routes/admin/categories.ts` |
| `/api/admin/ingredients` | `server/src/routes/admin/ingredients.ts` |
| `/api/admin/recipes` | `server/src/routes/admin/recipes.ts` |
| `/api/admin/recommendations` | `server/src/routes/admin/recommendations.ts` |
| `/api/admin/seasonal-foods` | `server/src/routes/admin/seasonal-foods.ts` |
| `/api/admin/cuisines` | `server/src/routes/admin/cuisines.ts` |
| `/api/admin/menus` | `server/src/routes/admin/menus.ts` |
| `/api/admin/banners` | `server/src/routes/admin/banners.ts` |
| `/api/admin/beverages` | `server/src/routes/admin/beverages.ts` |
| `/api/admin/families` | `server/src/routes/admin/families.ts` |
| `/api/admin/upload` | `server/src/routes/admin/upload.ts` |
| `/api/admin/users` | `server/src/routes/admin/users.ts` |
| `/api/admin/posts` | `server/src/routes/admin/posts.ts` |
| `/api/admin/comments` | `server/src/routes/admin/comments.ts` |
| `/api/admin/audits` | `server/src/routes/admin/audits.ts` |
| `/api/admin/tags` | `server/src/routes/admin/tags.ts` |
| `/api/admin/channels` | `server/src/routes/admin/channels.ts` |
| `/api/admin/content-selector` | `server/src/routes/admin/content-selector.ts` |
| `/api/admin/home/top-navs` | `server/src/routes/admin/home-top-navs.ts` |
| `/api/admin/home/top-navs/:navId/hero-banners` | `server/src/routes/admin/top-nav-hero-banners.ts` |
| `/api/admin/home/top-navs/:navId/modules` | `server/src/routes/admin/content-modules.ts` |
| `/api/admin` | `server/src/routes/admin/resources.ts` |

### 管理端已注册资源摘要

- `auth`：`POST /login`，`GET /profile`
- `tags`：列表、详情、创建、更新、删除、状态
- `categories`：列表、详情、创建、更新、删除、发布、状态
- `ingredients`：列表、详情、创建、更新、删除、发布、推荐、状态
- `recipes`：列表、详情、创建、更新、删除、发布、下线、提审、推荐、状态、审核、酒水绑定
- `beverages`：列表、详情、创建、更新、删除、启用、停用、排序
- `families`：概览、列表、创建、成员、邀请、详情、状态、移除成员
- `resources`：应用、API Key、权限、日志、导入整套接口

## C 端/公共挂载前缀

| 挂载前缀 | 路由文件 |
| --- | --- |
| `/api/home` | `server/src/routes/api/home.ts` |
| `/api/app/home` | `server/src/routes/api/app-home.ts` |
| `/api/app` | `server/src/routes/api/page-modules.ts` |
| `/api/beverages` | `server/src/routes/api/beverages.ts` |
| `/api/ingredients` | `server/src/routes/api/ingredients.ts` |
| `/api/recipes` | `server/src/routes/api/recipes.ts` |
| `/api/mobile` | `server/src/routes/api/mobile.ts` |
| `/api/mobile/ingredients` | `server/src/routes/api/ingredients.ts` |
| `/api/mobile/recipes` | `server/src/routes/api/recipes.ts` |

### 公共端已注册资源摘要

- `app-home`：
  - `GET /top-navs`
  - `GET /hero-banners`
  - `GET /top-navs/:navId/hero-banners`
  - `GET /top-navs/:navId/modules`
  - `GET /top-navs/:id/contents`
- `mobile`：
  - 登录、首页、我的菜谱、推荐、时令、搜索、搜索历史
  - 价格记录、收藏、浏览历史
  - 家庭、邀请、偏好、成员
  - 菜篮子
- `recipes`：列表、详情
- `ingredients`：列表、详情
- `beverages`：详情
- `page-modules`：`GET /page-modules`

## 已确认的接口断层

### 1. 旧全局首页轮播链路已废弃，但残留兼容代码仍在仓库

服务端事实：

- `server/src/app.ts` 已不挂载 `/api/admin/home-hero-banners`
- `server/src/routes/admin/home-hero-banners.ts` 文件头明确标注“已废弃”

后台前端事实：

- `admin-frontend/src/app/api.ts` 仍保留 `HomeHeroBanner` deprecated 类型与方法
- `admin-frontend/src/app/pages/HomeHeroBannersPage.tsx` 仍存在
- `admin-frontend/src/app/App.tsx` 中该页面路由已被注释

结论：

- 这不是运行中的主链路，而是迁移残留兼容层。
- 后续应统一以 `/home/top-navs/:navId/hero-banners` 作为唯一轮播图接口。

### 2. `admin-frontend/src/app/api.ts` 已承担过多资源职责

结论：

- 虽然当前仍可工作，但已不利于继续审计和联调。
- 建议后续仅做“按资源拆文件”的整理，不在本次审计动作内执行。
