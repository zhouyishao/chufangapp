# 数据库映射审计

## 说明

- 数据来源：`server/prisma/schema.prisma`
- 初始审计只做结构归类；2026-07-03 已追加非破坏性查询索引优化
- 标签含义：
  - `MVP 必须`
  - `MVP 第二优先级`
  - `暂缓`
  - `legacy`
  - `疑似废弃`

结论先行：

- 当前 unified Prisma schema 中未发现明显的 legacy 表。
- legacy 结构主要停留在 `admin-backend/` 与 `backend/`，不在当前 Prisma 主 schema 内。
- 风险点不在“表太旧”，而在“模型数量已经超出 MVP 主链路”。
- 已补充 MVP 高频读路径复合索引：公开列表、分类模块、收藏、浏览历史、菜篮子、家庭成员、搜索历史、菜价记录。

## 模型分类

| 模型 | 标记 | 说明 |
| --- | --- | --- |
| `User` | MVP 必须 | C 端登录、收藏、浏览、家庭、我的菜谱都依赖 |
| `Family` | MVP 必须 | 家庭主实体 |
| `FamilyMember` | MVP 必须 | 家庭成员管理主链路 |
| `FamilyInvite` | MVP 必须 | 家庭邀请/加入主链路 |
| `Admin` | MVP 必须 | 后台登录与管理 |
| `Role` | MVP 必须 | 后台权限模型基础 |
| `Permission` | MVP 必须 | 后台权限模型基础 |
| `AdminRole` | MVP 必须 | 后台权限关联表 |
| `RolePermission` | MVP 必须 | 后台权限关联表 |
| `Category` | MVP 必须 | 内容分类基础模型 |
| `Ingredient` | MVP 必须 | 食材主实体 |
| `IngredientPriceRecord` | MVP 必须 | 价格记录功能已接入移动端 |
| `IngredientTip` | MVP 第二优先级 | 有 seed，但主链路接口暴露有限 |
| `Cuisine` | MVP 第二优先级 | 后台已管理，C 端主链路弱依赖 |
| `Recipe` | MVP 必须 | 菜谱主实体 |
| `SeasonalFood` | MVP 必须 | 时令页面与推荐链路依赖 |
| `Recommendation` | MVP 必须 | 首页/推荐链路依赖 |
| `Menu` | MVP 第二优先级 | 已有模型与 seed，但当前主链路较弱 |
| `Beverage` | MVP 必须 | 酒水详情与后台管理都在用 |
| `RecipeBeverage` | MVP 第二优先级 | 菜谱与酒水关联扩展能力 |
| `MenuRecipe` | MVP 第二优先级 | 菜单能力扩展表 |
| `Banner` | MVP 第二优先级 | 后台有管理接口，C 端主链路依赖不强 |
| `HomeHeroBanner` | MVP 必须 | 新顶部导航轮播链路仍依赖该表 |
| `Favorite` | MVP 必须 | 收藏链路已打通 |
| `ViewHistory` | MVP 必须 | 最近浏览链路已打通 |
| `PurchaseListItem` | MVP 必须 | 菜篮子/采购清单主链路 |
| `SearchHistory` | MVP 必须 | 搜索历史已暴露移动端接口 |
| `FamilyPreference` | MVP 必须 | 家庭偏好页已接入 |
| `Comment` | 暂缓 | 后台与 seed 已有，非当前 MVP 核心闭环 |
| `Post` | 暂缓 | 偏社区化能力，不是 MVP 主闭环 |
| `RecipeStep` | MVP 必须 | 菜谱详情与编辑必需 |
| `RecipeIngredient` | MVP 必须 | 菜谱详情与编辑必需 |
| `File` | MVP 第二优先级 | 上传能力依赖，但不属于用户核心价值链 |
| `OperationLog` | 暂缓 | 有管理价值，但不是 MVP 验收必需 |
| `Tag` | MVP 第二优先级 | 内容组织增强项 |
| `RecipeTag` | MVP 第二优先级 | 内容组织增强项 |
| `IngredientTag` | MVP 第二优先级 | 内容组织增强项 |
| `Channel` | MVP 第二优先级 | 后台内容组织增强项 |
| `HomeTopNav` | MVP 必须 | 首页顶部导航核心配置 |
| `HomeTopNavRelation` | MVP 必须 | 顶部导航内容映射核心关联 |
| `HomeTopNavStyle` | MVP 必须 | 顶部导航展示配置依赖 |
| `ContentModule` | MVP 必须 | 首页模块配置核心实体 |
| `HomeTopNavContentRule` | MVP 必须 | 顶部导航内容规则依赖 |
| `ResourceApp` | 暂缓 | 资源接入体系已建，但非当前 C 端 MVP 必需 |
| `ResourceApiKey` | 暂缓 | 同上 |
| `ResourcePermission` | 暂缓 | 同上 |
| `ResourceCallLog` | 暂缓 | 同上 |
| `ResourceImportBatch` | 暂缓 | 同上 |
| `ResourceImportItem` | 暂缓 | 同上 |

## 当前 schema 中的 legacy / 疑似废弃判定

### `legacy`

- 当前 Prisma schema 中未发现直接标记为 legacy 的模型。
- legacy 逻辑主要仍停留在历史目录，不在主 schema。

### `疑似废弃`

- 当前 Prisma schema 中未发现可以仅凭 schema 就直接判定为“疑似废弃”的表。
- 已废弃的是“接口入口/页面入口”，不是 `HomeHeroBanner` 这张表本身。

## seed 覆盖情况

`server/prisma/seed.ts` 已覆盖：

- 权限：admin/role
- 分类与标签：category/tag/channel/cuisine
- 首页：home-top-nav 相关模型
- 用户与家庭：user/family/family-member/family-invite
- 内容：ingredient/ingredient-tip/seasonal-food/recipe/recommendation/beverage
- 扩展内容：banner/home-hero-banner/menu/post/comment/favorite
- 资源接入：resource-app/api-key/permission/log

未见明显 seed 覆盖或仅弱覆盖的模型：

- `ViewHistory`
- `PurchaseListItem`
- `SearchHistory`
- `FamilyPreference`
- `OperationLog`
- `ResourceImportBatch`
- `ResourceImportItem`

## 风险点

1. 模型总量已经超过 MVP 必要规模，后续整理必须先分层，不要一起动。
2. `Resource*` 体系完整度高，但与当前家庭菜谱 MVP 主线相关性弱。
3. `Comment`、`Post`、`Banner`、`Menu` 等模型已进入 schema 与 seed，但验收优先级低，容易拖慢联调。

## 2026-07-03 数据库优化记录

本次只做非破坏性索引优化，不改字段、不删表、不改 legacy 目录。

新增索引覆盖：

- `Recipe`：公开菜谱列表、首页模块、分类列表、作者菜谱列表。
- `Ingredient`：公开食材列表、分类食材列表。
- `Beverage`：公开酒水列表、分类酒水列表。
- `Favorite`：用户收藏列表、用户对菜谱/食材收藏状态查询。
- `ViewHistory`：用户浏览历史列表、用户对菜谱/食材浏览记录查询。
- `PurchaseListItem`：用户菜篮子、家庭菜篮子分页列表。
- `SearchHistory`：用户搜索历史分页列表。
- `IngredientPriceRecord`：食材价格记录按食材、用户、日期查询。
- `FamilyMember`：家庭成员权限校验、用户家庭列表。

暂未处理：

- `HomeTopNav` 的“同 displayPosition 默认项唯一”更适合后续用数据校验 + PostgreSQL partial unique index 处理，不能只靠 Prisma 普通唯一索引解决。
- `Resource*` 体系当前标记为暂缓，本次不为非 MVP 主链路追加索引。
