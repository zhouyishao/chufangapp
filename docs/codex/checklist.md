# Codex 任务检查清单

## 开始前

- [ ] 已阅读 `AGENTS.md`。
- [ ] 已阅读 `docs/codex/coding-rules.md`。
- [ ] 已按任务类型阅读相关 skill。
- [ ] 已阅读 `docs/codex/skill-tool-routing.md`，并判断是否需要调用 `Headroom`、`Superpowers`、`pm-product-discovery`。
- [ ] 执行 shell 命令前，已按 `docs/codex/headroom.md` 调用 Headroom 查看/压缩规则或限制输出范围。
- [ ] 已确认本次允许修改的目录。
- [ ] 已确认不会触碰 `admin-backend/` 和 `backend/`。

## 文档任务

- [ ] 只修改 `docs/` 或 `AGENTS.md`。
- [ ] 不修改业务代码。
- [ ] 新文档有清晰引用关系。
- [ ] 避免重复搬运长 PRD。

## C 端任务

- [ ] 已阅读 `docs/design/ui-rules.md`。
- [ ] 已检查 C 端路由和页面结构。
- [ ] 页面有 Loading、Empty、Error。
- [ ] 图片使用统一资源处理。

## 后台任务

- [ ] 使用 Ant Design / ProComponents。
- [ ] 表格、表单、弹窗、分页使用组件库。
- [ ] 操作按钮有真实交互。
- [ ] 后台改动已检查 C 端展示影响。

## 后端 / 数据库任务

- [ ] 已阅读 `docs/backend/api-spec.md`。
- [ ] 已阅读 `docs/backend/database-schema.md`。
- [ ] 字段变更已同步检查后台和 C 端。
- [ ] 不做破坏性数据库操作。

## 完成后

- [ ] 输出使用了哪些 skill。
- [ ] 输出修改文件和每个文件修改内容。
- [ ] 输出启动和测试方式。
- [ ] 输出接口 / 数据库 / 页面影响。
- [ ] 输出风险点。
