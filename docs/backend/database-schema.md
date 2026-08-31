# 数据库 Schema

## 当前数据库

- 主后端目录：`server/`
- ORM：Prisma
- 数据库：PostgreSQL
- Schema 文件：`server/prisma/schema.prisma`

## 核心模型

| 模型 / 表 | 用途 |
|---|---|
| Admin / admins | 管理员 |
| Role / roles | 角色 |
| Permission / permissions | 权限 |
| Category / categories | 分类 |
| Ingredient / ingredients | 食材 |
| IngredientTip / ingredient_tips | 食材挑选技巧 |
| Recipe / recipes | 菜谱 |
| RecipeStep / recipe_steps | 菜谱步骤 |
| RecipeIngredient / recipe_ingredients | 菜谱用料 |
| SeasonalFood / seasonal_foods | 时令食材 |
| Recommendation / recommendations | 推荐内容 |
| Menu / menus | 场景菜单 |
| Banner / banners | Banner |
| User / users | C 端用户 |
| Favorite / favorites | 收藏 |
| ViewHistory / view_histories | 浏览历史 |
| SearchHistory / search_histories | 搜索关键词、累计次数和最近结果数 |
| PurchaseListItem / purchase_list_items | 家庭或个人菜篮条目、勾选状态与来源菜谱 |
| Comment / comments | 评论 |
| File / files | 上传资源 |
| OperationLog / operation_logs | 操作日志 |

## 管理后台 RBAC

- `admins.last_login_at` 记录最近成功登录时间。
- `roles.code` 为唯一稳定编码，`roles.is_system` 标识系统内置角色。
- `permissions.module` 与 `permissions.action` 用于分组展示和读写权限预设。
- `admin_roles` 与 `role_permissions` 使用有效状态及软删除字段；运行时要求每个管理员恰好一个有效角色。
- 增量迁移 `20260813160000_admin_rbac_foundation` 只新增字段和索引，并为历史角色、权限补齐编码及模块/动作，不清空业务数据。
- 种子幂等维护 `SUPER_ADMIN`、`CONTENT_OPERATOR`、`READ_ONLY` 三个系统角色和统一权限目录；既有管理员只在缺少有效角色时补为超级管理员，不覆盖既有密码。

## 建模规则

- 所有核心表必须有 `id`、`createdAt`、`updatedAt`。
- 核心业务表必须有 `status`。
- 删除优先软删除，使用 `deletedAt`。
- 图片字段统一存 URL。
- 菜谱和食材必须有关联。
- 推荐内容必须能关联菜谱、食材或运营资源。
- C 端展示数据必须来自 B 端维护的数据。
- 必须提供 seed 数据初始化。

## C 端账号凭据

- `users.password_hash` 为可空 `VARCHAR(255)`，仅保存 bcrypt 哈希。
- 后台新建手机号账号必须写入哈希；历史数据允许为空，并由管理员在编辑用户时重置。
- 密码哈希不属于任何 API 响应字段；后台只返回布尔状态 `hasPassword`。
- 本地 seed 为验收账号 `13956785678` 写入开发密码 `user12345` 的哈希，不打印或持久化明文密码字段。

## 用户行为数据

- 浏览、收藏、搜索、加入菜篮分别持久化于 `view_histories`、`favorites`、`search_histories`、`purchase_list_items`。
- `search_histories.search_count` 默认 1；相同用户与关键词再次搜索时原子累加，`result_count` 保存最近一次结果数。
- 后台用户行为页只读聚合上述已有记录，不新增独立伪事件表，也不修改用户行为数据。

## 内容图片职责

`Ingredient` 与 `Beverage` 将完整封面和透明实物图分开存储：

- `Ingredient.cover` / `Beverage.coverImage`：详情页和普通列表使用的完整封面图。
- `transparentImage`：菜谱用料、紧凑卡片使用的透明背景实物图，可为空。
- `transparentImageFileId`：关联 `File` 的受管媒体引用，可为空；删除文件时设为 `NULL`。
- 历史数据无需回填，未配置透明实物图时由客户端回退普通封面。

## 迁移与种子

```bash
cd server
npm run prisma:deploy
npm run prisma:seed
```

历史数据库清单见：`docs/database-schema.md`。
