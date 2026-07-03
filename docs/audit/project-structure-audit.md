# 项目结构审计

## 审计范围

- 时间：2026-07-02
- 范围：`frontend/`、`admin-frontend/`、`server/`
- 对照文档：
  - `README.md`
  - `AGENTS.md`
  - `docs/index.md`
  - `docs/codex/coding-rules.md`
  - `docs/codex/checklist.md`
  - `docs/backend/api-spec.md`
  - `docs/backend/database-schema.md`
- 约束：
  - 未修改 `server/prisma/schema.prisma`
  - 未修改 `.env`
  - 未修改 `admin-backend/`、`backend/`
  - 未删除任何文件

## 结论摘要

当前仓库的主线目录定义基本一致：

| 文档 | 主线目录描述 | legacy 目录描述 | 结论 |
| --- | --- | --- | --- |
| `README.md` | `frontend/`、`admin-frontend/`、`server/` | `admin-backend/`、`backend/` 为历史目录 | 一致 |
| `AGENTS.md` | `frontend/`、`admin-frontend/`、`server/` | `admin-backend/`、`backend/` 仅作参考，禁止新增功能 | 一致 |
| `docs/codex/coding-rules.md` | 允许修改 `frontend/`、`admin-frontend/`、`server/` | 禁止修改 `admin-backend/`、`backend/` | 一致 |
| `docs/codex/checklist.md` | 主线任务围绕三条主线目录 | legacy 目录默认不动 | 一致 |

结论：

- 主线目录与 legacy 目录的边界定义一致，没有发现文档级冲突。
- 风险不在目录归属，而在“代码面已经迁移，但兼容层仍残留”，尤其是首页顶部导航/轮播图链路。

## 目录现状

### 主线目录

| 目录 | 角色 | 当前状态 |
| --- | --- | --- |
| `frontend/` | C 端 App/H5（uni-app + Vue 3） | 页面注册完整，服务层集中在 `src/services/` |
| `admin-frontend/` | 后台管理（React + Vite） | 路由量大，已覆盖内容、家庭、资源接入、审核等模块 |
| `server/` | 统一后端（Express + Prisma + PostgreSQL） | 路由已基本统一到 `server/src/routes/` 与 Prisma 模型 |

### legacy 目录

| 目录 | 角色 | 审计结论 |
| --- | --- | --- |
| `admin-backend/` | 历史后台后端 | 本次未扫描业务代码，仅建议继续锁死 |
| `backend/` | 历史后端 | 本次未扫描业务代码，仅建议继续锁死 |

## 页面入口整理

### frontend 页面入口

`frontend/src/pages.json` 当前注册 37 个页面，核心分组如下：

- 首页与内容：`index`、`recommendations`、`seasonal`、`recipes`、`ingredients`
- 详情页：`recipe-detail`、`ingredient-detail`、`fruit-detail`、`seasoning-detail`、`beverage-detail`
- 搜索与筛选：`search`、`scan`、`category-filter`
- 家庭与菜篮子：`family`、`family-create`、`family-manage`、`family-member`、`family-invite`、`family-preferences`、`basket`、`purchase-history`
- 用户与个人：`mine`、`settings`、`profile-edit`、`favorites`、`recent-views`
- 登录注册：`login`、`phone-login`、`register`、`forgot-password`
- 我的菜谱：`my-recipes`、`recipe-create`、`my-recipe-detail`

判断：

- C 端页面注册面完整。
- 页面命名已围绕 MVP 主链路展开，没有明显继续依赖 legacy 目录。

### admin-frontend 页面入口

`admin-frontend/src/app/App.tsx` 是后台主路由入口。已注册的后台分组包括：

- 首页运营：`/home-ops`、顶部导航、内容模块、轮播配置
- 内容管理：菜谱、食材、水果、调料、酒水
- 家庭与用户：家庭、用户、收藏、最近浏览、投稿
- 审核与评论：审核中心、评论、举报
- 资源接入：资源应用、API Key、权限、日志、导入
- 运营与报表：搜索运营、价格、采购、报表、文件、系统设置

判断：

- 后台页面数量明显高于当前 MVP 主链路。
- 存在保兼容但不建议继续使用的残留页面：`HomeHeroBannersPage.tsx`。

### server 后端入口

`server/src/app.ts` 已完成统一挂载，主入口清晰：

- 健康检查：`/health`
- 文档：`/docs`
- 管理端：`/api/admin/**`
- C 端/公共：`/api/home`、`/api/app/**`、`/api/mobile/**`、`/api/recipes`、`/api/ingredients`、`/api/beverages`

判断：

- 统一后端方向明确。
- 旧首页轮播图管理接口已经被注释掉，不再挂载。

## API 调用层整理

### frontend

主要 API 服务文件：

- `frontend/src/services/public-api.ts`
- `frontend/src/services/auth.ts`
- `frontend/src/services/basket.ts`
- `frontend/src/services/family.ts`
- `frontend/src/services/my-recipes.ts`
- `frontend/src/services/price.ts`
- `frontend/src/services/profile.ts`

特点：

- C 端 API 基本集中到 `public-api.ts`。
- `basket.ts`、`family.ts`、`price.ts` 是基于 `public-api.ts` 的场景封装层。

### admin-frontend

主要 API 服务文件：

- `admin-frontend/src/app/api.ts`

特点：

- 后台 API 基本集中在单文件。
- 类型、请求函数、资源方法混放在同一文件，审计和维护成本较高。
- 已存在 deprecated 兼容导出，说明迁移尚未彻底收口。

## 已注册后端接口

服务端已注册接口详见：

- `docs/audit/api-map.md`

本页只记录关键风险：

1. `server/src/routes/admin/home-hero-banners.ts` 明确标注“已废弃”，且未挂载到 `server/src/app.ts`。
2. `admin-frontend/src/app/api.ts` 仍保留 `HomeHeroBanner` 兼容类型和兼容请求方法。
3. `admin-frontend/src/app/pages/HomeHeroBannersPage.tsx` 仍存在，但在 `App.tsx` 中已被注释掉路由。

## 数据库模型与 seed 数据

数据库模型详见：

- `docs/audit/database-map.md`

seed 情况摘要：

- 当前有效 seed 入口是 `server/prisma/seed.ts`
- `server/package.json` 的 `prisma:seed` 实际执行的是构建产物 `dist/prisma/seed.js`
- 仓库中还存在 `server/prisma/seed.js`，内容与 `seed.ts` 不同，属于高风险重复源

`seed.ts` 已覆盖的主要模型：

- 权限与后台：`Role`、`Admin`、`AdminRole`
- 内容基础数据：`Category`、`Tag`、`Cuisine`、`Channel`
- 首页配置：`HomeTopNav`、`HomeTopNavStyle`、`HomeTopNavContentRule`、`HomeTopNavRelation`
- C 端用户侧：`User`、`Family`、`FamilyMember`、`FamilyInvite`
- 内容数据：`Ingredient`、`IngredientTip`、`SeasonalFood`、`Recipe`、`RecipeTag`、`Recommendation`、`Beverage`、`RecipeBeverage`
- 运营数据：`Banner`、`HomeHeroBanner`、`Menu`、`MenuRecipe`、`Post`、`Comment`、`Favorite`
- 资源接入：`ResourceApp`、`ResourceApiKey`、`ResourcePermission`、`ResourceCallLog`

## 可能未使用文件

当前能给出较高置信度的候选项：

| 文件 | 证据 | 判断 |
| --- | --- | --- |
| `server/src/routes/admin/home-hero-banners.ts` | 文件头注明“已废弃”，`server/src/app.ts` 未挂载 | 高置信度未使用 |
| `admin-frontend/src/app/pages/HomeHeroBannersPage.tsx` | `App.tsx` 中对应路由已注释，页面已改为迁移提示页 | 保留为迁移防误用页 |
| `admin-frontend/src/app/pages/topNavContentStore.ts` | 全仓库静态扫描未找到引用 | 疑似未使用 |
| `server/prisma/seed.js` | 与 `seed.ts` 并存，且 `package.json` 并不直接执行该文件 | 疑似历史残留 |

## 可能未使用依赖

### frontend

静态引用扫描发现以下依赖未在 `frontend/src` 和显式配置文件中看到有效引用：

- `react`
- `react-dom`
- `lucide-react`
- `@radix-ui/react-slot`
- `class-variance-authority`
- `clsx`
- `tailwind-merge`
- `tailwindcss-animate`

说明：

- 这些包更像 React/Tailwind/shadcn 体系残留。
- `@fontsource/*` 为已使用依赖，不在清理候选中。
- `tailwindcss`、`postcss`、`autoprefixer` 目前只在依赖树中出现，未看到显式配置；是否需要保留，要在启动链路验证后再定。

### admin-frontend

静态引用扫描发现：

- `react-icons` 仅出现在 `package.json`，未在源码中发现导入

## 辅助工具使用情况

本次允许使用但当前环境不可直接使用的工具：

- `knip`：未安装
- `madge`：未安装
- `dependency-cruiser` / `depcruise`：未安装
- `prisma-erd-generator`：未安装

因此本次审计结论基于：

- 目录扫描
- 路由注册扫描
- 静态引用扫描
- Prisma schema / seed 静态阅读

## 当前主线风险

1. 首页运营链路存在迁移残留：旧轮播页、旧兼容 API、未挂载旧路由同时存在。
2. `admin-frontend/src/app/api.ts` 过大，资源边界已模糊，后续联调成本高。
3. `server/prisma/seed.ts` 与 `server/prisma/seed.js` 双源并存，容易导致 seed 认知混乱。
4. 后台页面面过宽，已超出 MVP 必要面，后续会放大接口对齐成本。
