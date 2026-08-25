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
| ResourceApiProvider / resource_api_providers | 数据 Provider 与来源许可信息 |
| ResourceImportBatch / resource_import_batches | 数据导入批次 |
| ResourceImportItem / resource_import_items | 可审核、可确认的导入候选项 |
| RawImportRecord / raw_import_records | 保留的 Provider 原始响应记录 |

## 中国菜谱资源治理字段

- `resource_import_items.quality_score`：0–100 的导入质量分；中国菜谱确认导入的
  门槛为 80。
- `resource_import_items.is_chinese`：是否通过中文标题识别。
- `resource_import_items.quality_issues`：需要人工修正的字段问题列表，以 JSON 保存。
- `resource_import_items.filter_code`：不符合准入规则或被人工忽略时的机器可读原因。
- `recipes.import_quality_score`：确认导入时从导入项复制的质量分，用于追溯。
- `resource_api_providers.terms_url`：来源使用条款或开放数据说明地址。
- `resource_api_providers.license_note`：后台记录的内容许可、授权范围和署名要求；
  中国菜谱主源/补充源未确认该信息时不得生产同步。

菜谱来源角色由 Provider 编码在服务端固定识别：`proj_kitchen` 为 `PRIMARY`，
`tianapi_caipu` 为 `SUPPLEMENTAL`，`themealdb_recipe` 为 `OVERSEAS`，
`mock_recipe` 为 `TEST`。只有前两类可创建新的菜谱同步批次；历史来源数据不删除，
仅限制其新增同步。

`20260825120000_add_recipe_import_quality` 是加法迁移：为上述质量和许可字段增加列，
并建立 `(status, is_chinese, quality_score)` 索引。不得修改旧迁移，也不得通过清表
或删除历史记录进行回填。

历史修复脚本默认 dry-run：它只列出需要隐藏的海外、英文或测试正式菜谱，并列出
需要忽略的海外/测试待处理或失败导入项。经人工逐项审核后才可使用 `--apply`；应用
操作只会将正式菜谱设为 `is_publish = false`、将导入项设为 `IGNORED` 并更新受影响
批次统计，不删除数据。

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
