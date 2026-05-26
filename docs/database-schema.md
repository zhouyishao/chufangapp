# 数据库清单

## 当前数据库识别

- 主后端目录：`server`
- ORM：Prisma
- 数据库：PostgreSQL
- Schema 文件：`server/prisma/schema.prisma`

## 当前已存在模型

| 模型 | 表名 | 用途 | 是否满足核心要求 |
|---|---|---|---|
| Admin | admins | 管理员 | 是 |
| Role | roles | 角色 | 是 |
| Permission | permissions | 权限 | 是 |
| AdminRole | admin_roles | 管理员角色关联 | 是 |
| RolePermission | role_permissions | 角色权限关联 | 是 |
| Category | categories | 分类 | 是 |
| Ingredient | ingredients | 食材 | 是 |
| Recipe | recipes | 菜谱 | 是 |
| RecipeStep | recipe_steps | 菜谱步骤 | 是 |
| RecipeIngredient | recipe_ingredients | 菜谱用料 | 是 |
| File | files | 文件 | 部分满足，命名需与 uploads 统一 |
| OperationLog | operation_logs | 操作日志 | 是 |

## 已补齐模型

| 表名 | 用途 | 状态 |
|---|---|---|
| users | C 端用户 | 已完成 |
| ingredient_tips | 食材挑选技巧 | 已完成 |
| cuisines | 菜系 | 已完成 |
| seasonal_foods | 时令食材 | 已完成 |
| recommendations | 今日推荐 | 已完成 |
| menus | 场景菜单 | 已完成 |
| menu_recipes | 场景菜单菜谱关联 | 已完成 |
| banners | Banner | 已完成 |
| posts | 晒菜内容 | 已完成 |
| comments | 评论 | 已完成 |
| favorites | 收藏 | 已完成 |
| view_histories | 浏览历史 | 已完成 |
| uploads/files | 上传资源 | 已有 `files` 表，后续上传接口复用 |

## 当前 migration

- `server/prisma/migrations/20260524142712_add_content_models/migration.sql`
- 已执行：`DATABASE_URL=... npm run prisma:deploy`
- 已执行：`DATABASE_URL=... npm run prisma:seed`

## 建模规则

- 所有表必须有 `id`、`createdAt`、`updatedAt`。
- 核心业务表必须有 `status`。
- 图片字段统一存 URL。
- 菜谱和食材必须有关联。
- 今日推荐必须能关联菜谱或食材。
- C 端展示数据必须来自 B 端维护的数据。
- 必须提供 seed 数据初始化。
