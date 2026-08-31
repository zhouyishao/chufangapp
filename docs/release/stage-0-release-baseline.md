# 阶段 0：发布基线

## 冻结范围

- 产品与交互验收基准：`docs/prototypes/home-feed-interactive/index.html`。
- 原型目录从本阶段开始只读，不再作为正式业务实现目录。
- 正式实现仅允许进入 `frontend/`、`admin-frontend/`、`server/`。
- 历史 `backend/`、`admin-backend/` 不进入新功能开发。

## 当前工程基线

| 端 | 技术栈 | 当前状态 |
|---|---|---|
| C 端 | uni-app + Vue 3 | 37 个正式路由；统一请求层已存在；资料仍有本地存储；部分页面含硬编码与旧交互 |
| 后台 | React + TypeScript + Ant Design | 内容与首页配置已有基础；约 27 个页面仍为 mock/占位；顶部导航内容配置仍使用 localStorage |
| 后端 | Express + Prisma + PostgreSQL | 51 个模型；App JWT 已用于菜篮；其他用户私有接口仍未全面鉴权 |

## 已确认验证基线

2026-07-18 执行结果：

- `npx prisma validate`：通过。
- `npx tsx --test src/__tests__/*.test.ts`：14 项通过。
- `server npm run build`：通过。
- `admin-frontend npm run build`：通过；存在约 2.1 MB 主 chunk 警告。
- `frontend npm run type-check`：通过。
- `frontend npm run build`：通过。
- 原型 `verify*.mjs` 与 `node --check app.js`：通过。
- `git diff --check`：通过。

### 数据库可恢复性证据

2026-07-18 在本机开发 PostgreSQL 16.14 执行：

- `npx prisma migrate status`：24/24 migration 已应用，schema up to date。
- `pg_dump --format=custom`：成功生成 `/private/tmp/chufangapp-stage0-20260718.dump`，635483 bytes、564 个 TOC 条目。
- 将备份恢复到隔离临时库 `chufangapp_stage0_restore_20260718`：成功。
- 恢复后验证：`_prisma_migrations` 24 条，`public` schema 52 张表。
- 验证完成后只删除临时恢复库，源数据库未执行写入或清理。

以上是开发基线证据；staging/prod 上线前仍必须分别生成对应环境备份与恢复演练记录，开发备份不能替代生产备份。

## 首发范围

- 首发平台：iOS + Android。
- 暂定名称：家里有菜。
- 必须闭环：后台配置、数据库、API、正式 C 端；五类内容；菜谱烹饪；调制饮品制作；家庭、菜篮、偏好和提醒；个人资料、上传、收藏、浏览和添加菜谱。
- 不做：聊天、库存、独立买菜模式、主页壁纸、草稿、支付、AI、复杂经营报表。

## 发布阻塞项

- DCloud AppID、iOS Bundle ID、Android Package Name、签名证书未配置。
- 生产域名、对象存储、推送服务和隐私政策正式 URL 未配置。
- 资源 provider migration 已改为业务字段哈希并按主键稳定处理重复项；部署到 staging 前仍需在复制数据上执行耗时、锁表和 checksum 检查。
- 多数用户私有接口仍可接受客户端身份参数，必须 JWT 化。
- 后台 mock/占位页面不得作为已完成功能发布。

## 原型证据

- 有效频道截图：`screenshots/channel-recipe.png`、`channel-ingredient.png`、`channel-fruit.png`、`channel-drink.png`，宽度均为 393px。
- `mine-393x852.png`、`mine-full-393.png` 实际为 JPEG 且宽度 378px，只作视觉参考，不作像素基准。
- 冻结提交：`b7e0d3b`。
- 冻结文件 SHA-256：
  - `index.html`：`78b99a47899458b70461b0b24d92aaab7a608a365510149669be42cd37465f78`
  - `app.js`：`4fc7b951a2f5eb0c194a7cca1741600d5c712a22f3387a0fff0cc4577d1bcf0b`
  - `styles.css`：`65022cf3a3cd81825c4483149b981d1a1d53d64a3949dfc9d0be13b78d3e414a`
  - `fixes.css`：`d1d99b68b84afb3715d8f7bb7c670dfe7a727ca2e9e7be42575098f6994f6b65`
- 自动证据：`verify.mjs`、`verify-category.mjs`、`verify-basket.mjs`、`verify-mine.mjs`、`verify-mine-subpages.mjs`、`verify-detail-pages.mjs`、`verify-add-recipe.mjs`、`verify-interactions.mjs` 均通过；它们分别锁定首页、分类、菜篮、我的、二级页、五类详情、添加菜谱和交互入口。
- 截图缺口：菜篮、我的、五类详情和制作流程暂无可信 393px 自动截图；实现阶段必须以冻结 DOM/验证脚本为功能基准，并在正式 C 端逐页替换时补齐视觉回归截图，不能用缺失截图推翻已确认规格。
