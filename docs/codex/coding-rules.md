# Codex 编码规则

## 修改范围

| 任务类型 | 允许修改 |
|---|---|
| C 端页面 | `frontend/` |
| 后台页面 | `admin-frontend/` |
| 后端接口 | `server/` |
| 数据库 | `server/prisma/` |
| 文档 | `docs/`、`AGENTS.md` |

## 禁止

- 不修改 `admin-backend/` 和 `backend/`，除非明确要求。
- 不删除已有页面和路由。
- 不修改 `.env`。
- 不修改 Git 历史。
- 不混入无关重构。
- 不提交 `node_modules/`、`dist/`、密钥、Token。

## 开发流程

1. 先读 `AGENTS.md` 和相关短文档。
2. 根据任务类型读取对应 skill。
3. 只修改必要文件。
4. 做最小可验证实现。
5. 运行与任务匹配的验证命令。
6. 输出使用的 skill、修改文件、测试方式、影响范围和风险点。

## 代码规则

- TypeScript 不使用 `any`。
- 异步逻辑使用 `async/await`。
- 命名语义化，不使用拼音缩写。
- 注释只解释必要业务约束和设计原因。
