# 文档审计记录

## 本次扫描范围

- `AGENTS.md`
- `README.md`
- `docs/`
- `server/README.md`
- `admin-frontend/README.md`
- `backend/README.md`
- `admin-backend/README.md`
- PRD / API / 数据库 / Figma 相关文档

## 文档清单

### 根目录

- `AGENTS.md`：项目规则入口，已精简为索引型文档。
- `README.md`：本地启动说明。
- `家庭菜谱App_Codex防漏页执行骨架.md`：旧执行骨架，建议作为历史资料。

### docs 原有文档

- `docs/admin-cms-prd-dev-spec.md`：后台管理系统大 PRD，1366 行。
- `docs/codex-full-e2e-prototype-execution-spec.md`：全链路任务书，1256 行。
- `docs/codex-strict-e2e-execution-spec.md`：严格 E2E 任务书，1084 行。
- `docs/codex-content-management-task.md`：内容管理任务书，565 行。
- `docs/progress-report.md`：进度报告，567 行。
- `docs/implementation-checklist.md`：实现检查清单，495 行。
- `docs/api-spec.md`：旧 API 清单。
- `docs/database-schema.md`：旧数据库清单。
- `docs/frontend-ui-rules.md`：旧 C 端 UI 规则。
- `docs/backend-api-rules.md`：旧后端规则。
- `docs/admin-cms-to-capp-test-checklist.md`：后台到 C 端验证清单。
- `docs/route-map.md`：旧路由清单。
- `docs/module-list.md`：旧模块清单。
- `docs/page-manifest.md`：页面统计。
- `docs/figma-missing-info.md`：Figma 缺失信息。
- `docs/security-rules.md`：安全规则。
- `docs/blockers.md`：阻塞风险。

### 新拆分文档

- `docs/product/prd.md`
- `docs/product/roadmap.md`
- `docs/design/ui-rules.md`
- `docs/design/color-system.md`
- `docs/design/icon-rules.md`
- `docs/backend/database-schema.md`
- `docs/backend/api-spec.md`
- `docs/backend/auth.md`
- `docs/admin/menu-structure.md`
- `docs/admin/page-rules.md`
- `docs/app/page-structure.md`
- `docs/app/route-map.md`
- `docs/codex/coding-rules.md`
- `docs/codex/checklist.md`
- `docs/codex/task-template.md`

## 重复内容

- 接口返回格式重复出现在 `AGENTS.md`、`docs/api-spec.md`、`docs/backend-api-rules.md`、后台 PRD、E2E 任务书。
- 数据库模型重复出现在 `AGENTS.md`、`docs/database-schema.md`、后台 PRD、E2E 任务书。
- C 端 UI 规则重复出现在 `AGENTS.md`、`docs/frontend-ui-rules.md`、多份 Codex 任务书。
- 后台列表页、表单、弹窗、分页规范重复出现在后台 PRD、内容管理任务书、E2E 任务书。
- 后台到 C 端联调规则重复出现在 `AGENTS.md`、`docs/admin-cms-to-capp-test-checklist.md`、多份任务书。
- 输出格式和完成标准重复出现在 `AGENTS.md`、`docs/codex-rules.md`、多份 Codex 执行任务书。

## 过长文档处理状态

| 文档 | 行数 | 建议 |
|---|---:|---|
| `docs/admin-cms-prd-dev-spec.md` | 原 1366 | 已改为短索引，内容拆到 `docs/product/`、`docs/admin/`、`docs/backend/`、`docs/codex/` |
| `docs/codex-full-e2e-prototype-execution-spec.md` | 原 1256 | 已改为短索引，内容拆到 `docs/codex/e2e-index.md` 等 |
| `docs/codex-strict-e2e-execution-spec.md` | 原 1084 | 已改为短索引，测试规则拆到 `docs/codex/` |
| `docs/codex-content-management-task.md` | 原 565 | 已改为短索引，内容拆到 `docs/admin/content-management.md` 等 |
| `docs/progress-report.md` | 原 567 | 已改为短索引，按月份拆到 `docs/codex/progress-2026-05.md`、`docs/codex/progress-2026-06.md` |
| `docs/implementation-checklist.md` | 495 | 未超过 500 行，暂保留；后续增长时按模块拆分 |

## 建议拆分内容

- 产品目标、范围、路线图放到 `docs/product/`。
- UI、颜色、图标放到 `docs/design/`。
- 数据库、接口、鉴权放到 `docs/backend/`。
- 后台菜单和页面规则放到 `docs/admin/`。
- C 端页面结构和路由放到 `docs/app/`。
- Codex 执行规则、检查清单、任务模板放到 `docs/codex/`。

## 后续阅读策略

- 常规任务先读 `AGENTS.md`、`docs/codex/coding-rules.md`、`docs/codex/checklist.md`。
- 按任务类型只读一个领域目录，避免读取全部旧 PRD。
- 旧长文档仅作归档和争议追溯，不作为默认上下文。
- 全项目导航入口为 `docs/index.md`。
- 文档依赖图见 `docs/codex/dependency-graph.md`。
