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
| Comment / comments | 评论 |
| File / files | 上传资源 |
| OperationLog / operation_logs | 操作日志 |

## 建模规则

- 所有核心表必须有 `id`、`createdAt`、`updatedAt`。
- 核心业务表必须有 `status`。
- 删除优先软删除，使用 `deletedAt`。
- 图片字段统一存 URL。
- 菜谱和食材必须有关联。
- 推荐内容必须能关联菜谱、食材或运营资源。
- C 端展示数据必须来自 B 端维护的数据。
- 必须提供 seed 数据初始化。

## 迁移与种子

```bash
cd server
npm run prisma:deploy
npm run prisma:seed
```

历史数据库清单见：`docs/database-schema.md`。
