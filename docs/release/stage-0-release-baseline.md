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

## 首发范围

- 首发平台：iOS + Android。
- 暂定名称：家里有菜。
- 必须闭环：后台配置、数据库、API、正式 C 端；五类内容；菜谱烹饪；调制饮品制作；家庭、菜篮、偏好和提醒；个人资料、上传、收藏、浏览和添加菜谱。
- 不做：聊天、库存、独立买菜模式、主页壁纸、草稿、支付、AI、复杂经营报表。

## 发布阻塞项

- DCloud AppID、iOS Bundle ID、Android Package Name、签名证书未配置。
- 生产域名、对象存储、推送服务和隐私政策正式 URL 未配置。
- 资源 provider migration 固定使用数据库 ID 回填，不能部署到未知存量数据库。
- 多数用户私有接口仍可接受客户端身份参数，必须 JWT 化。
- 后台 mock/占位页面不得作为已完成功能发布。

## 原型证据

- 有效频道截图：`screenshots/channel-recipe.png`、`channel-ingredient.png`、`channel-fruit.png`、`channel-drink.png`，宽度均为 393px。
- `mine-393x852.png`、`mine-full-393.png` 实际为 JPEG 且宽度 378px，只作视觉参考，不作像素基准。

