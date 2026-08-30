# 死代码与清理候选报告

## 说明

- 本文只做候选整理，不自动删除。
- 当前环境未安装 `knip`、`madge`、`dependency-cruiser`、`prisma-erd-generator`。
- 结论基于静态引用扫描与路由挂载扫描，不等于最终删除清单。

## 高置信度候选

### 1. `server/src/routes/admin/home-hero-banners.ts`

证据：

- 文件头明确写明“已废弃”
- `server/src/app.ts` 中对应 import 与 `app.use()` 已被注释

判断：

- 属于未挂载的历史兼容路由文件

建议：

- 先保留
- 在 cleanup 第四阶段统一确认删除条件

### 2. `admin-frontend/src/app/pages/HomeHeroBannersPage.tsx`

证据：

- 页面仍存在
- `admin-frontend/src/app/App.tsx` 中路由已被注释
- `admin-frontend/src/app/api.ts` 中相关类型和方法均标记为 deprecated
- 当前页面已改为迁移提示页，不再发起旧接口请求

判断：

- 属于迁移后保编译兼容和防误用的旧页面入口

建议：

- 不作为主链路继续维护
- 后续确认无需迁移提示后再处理

## 中置信度候选

### 3. `admin-frontend/src/app/pages/topNavContentStore.ts`

证据：

- 全仓库静态扫描未发现引用

判断：

- 疑似未使用的页面级状态文件

建议：

- 先人工确认是否仅由未来计划使用

### 4. `server/prisma/seed.js`

证据：

- 仓库同时存在 `server/prisma/seed.ts` 与 `server/prisma/seed.js`
- `server/package.json` 的 `prisma:seed` 执行的是 `dist/prisma/seed.js`
- 仓库内这份 `server/prisma/seed.js` 与 `seed.ts` 内容不同

判断：

- 疑似历史残留 seed 源文件

风险：

- 容易让开发者误以为这是当前真实 seed 源

## 依赖清理候选

## frontend

### 高可疑未使用依赖

| 依赖 | 证据 |
| --- | --- |
| `react` | 未在 `frontend/src` 发现导入 |
| `react-dom` | 未在 `frontend/src` 发现导入 |
| `lucide-react` | 未在 `frontend/src` 发现导入 |
| `@radix-ui/react-slot` | 未在 `frontend/src` 发现导入 |
| `class-variance-authority` | 未在 `frontend/src` 发现导入 |
| `clsx` | 未在 `frontend/src` 发现导入 |
| `tailwind-merge` | 未在 `frontend/src` 发现导入 |
| `tailwindcss-animate` | 未在 `frontend/src` 发现导入 |

结论：

- 这一组依赖高度像 React/shadcn/Tailwind 迁移残留。

### 需启动验证后再判定

| 依赖 | 原因 |
| --- | --- |
| `tailwindcss` | 代码中未见配置，但可能被工具链或历史样式链路间接使用 |
| `postcss` | 同上 |
| `autoprefixer` | 同上 |

### 已确认仍在使用

- `@fontsource/inter`
- `@fontsource/noto-sans-sc`
- `@fontsource/noto-serif-sc`

## admin-frontend

### 高可疑未使用依赖

| 依赖 | 证据 |
| --- | --- |
| `react-icons` | 仅出现在 `package.json`，未在源码中发现导入 |

### 已确认在使用

- `react`
- `react-dom`
- `lucide-react`
- `xlsx`
- `antd`
- `@ant-design/pro-components`

## 当前不建议动的部分

以下文件或依赖虽然存在整理空间，但不建议在本次审计后直接清理：

- `admin-frontend/src/app/api.ts`
- `frontend/src/services/public-api.ts`
- `server/src/routes/api/mobile.ts`
- 所有 Prisma 模型

原因：

- 它们属于主链路核心文件，先要修映射和联调，再谈瘦身。

## 清理前置条件

任何删除动作前，至少先完成：

1. 主线目录冻结范围确认
2. 启动链路验证
3. 前后端接口联调确认
4. 对候选文件做一次人工入口核查
5. 对候选依赖做一次安装后构建验证
