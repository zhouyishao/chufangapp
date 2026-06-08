# Codex 开发规范

## 1. 修改范围约束

每次任务只修改所必需的文件，不混入无关重构。

| 修改目标 | 允许修改的目录 |
|----------|---------------|
| C 端页面 | `frontend/src/pages/`, `frontend/src/components/`, `frontend/src/services/`, `frontend/src/types/` |
| 后台页面 | `admin-frontend/src/app/pages/`, `admin-frontend/src/app/components/`, `admin-frontend/src/app/api.ts` |
| 后端接口 | `server/src/routes/`, `server/src/app.ts` |
| 数据库 | `server/prisma/schema.prisma`, `server/prisma/seed.ts` |
| 配置 | 仅限 `.env.example`，不修改 `.env` |
| 文档 | `docs/`, `AGENTS.md` |

## 2. 禁止操作

- 不修改 `admin-backend/`（旧后台）
- 不修改 `backend/`（旧 FastAPI）
- 不删除已有页面和路由
- 不修改侧边栏、顶部栏、公共布局（除非任务明确需要）
- 不修改 `package.json` 中的依赖（除非任务明确需要）
- 不直接修改 `.env` 文件
- 不修改 Git 历史

## 3. 开发流程

1. 先读相关文件，理解现有实现
2. 设计修改方案
3. 实现代码
4. TypeCheck：`npx tsc --noEmit`
5. Build：`npm run build`
6. 验证功能

## 4. 输出规范

每次修改完成后必须输出：
1. 修改了哪些文件
2. 修改原因
3. 测试方式
4. 风险点

## 5. C 端与后台联动规则

- 后台新增/修改内容后，必须验证 C 端接口是否返回正确数据
- 修改接口字段后，必须同步检查 C 端字段映射（`public-api.ts`）
- C 端页面不允许继续依赖假数据
- 所有 C 端图片必须通过 `resolveAssetUrl` 处理
