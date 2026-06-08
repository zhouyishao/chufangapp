# E2E 任务索引

本文件承接旧全链路任务书：

- `docs/codex-full-e2e-prototype-execution-spec.md`
- `docs/prod-full-e2e-prototype-execution-spec.md`
- `docs/codex-strict-e2e-execution-spec.md`
- `docs/codex-content-management-task.md`

旧文件已精简为索引，具体规则拆分到本目录和对应业务目录。

## 目标

- 后台页面真实可用。
- 后端接口可联调。
- 数据库真实落库。
- C 端展示后台配置内容。
- 自动化或手动验证覆盖核心路径。

## 页面范围

- 内容管理：菜谱、食材、水果、调料、酒水。
- 分类标签：分类、标签、单位。
- 首页运营：顶部导航、Banner、推荐位、时令食材。
- 资源管理：上传资源、API 接口配置。
- C 端展示：首页、列表、详情、菜篮子、我的。

## 必读文档

- `docs/admin/content-management.md`
- `docs/admin/category-tag-unit-rules.md`
- `docs/admin/resource-api-management.md`
- `docs/admin/home-operations.md`
- `docs/backend/api-spec.md`
- `docs/backend/database-schema.md`
- `docs/codex/e2e-test-cases.md`
- `docs/codex/verification-rules.md`

## 输出要求

- 修改文件。
- 新增或修改接口。
- 数据库变化。
- 后台页面测试结果。
- C 端页面测试结果。
- 构建结果。
- 剩余风险。
