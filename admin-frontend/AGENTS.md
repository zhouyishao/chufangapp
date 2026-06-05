# admin-frontend/AGENTS.md

本目录为管理后台前端，后续开发默认遵守以下规则。

## 技术栈

- React + TypeScript。
- Ant Design Pro / Ant Design。
- 图标统一使用 `@ant-design/icons`、`lucide-react` 或 `react-icons`。

## 组件规则

- 不从零手写复杂基础组件。
- 表格统一使用 `Ant Design Table` 或 ProComponents 表格。
- 表单统一使用 `Ant Design Form` 或 ProComponents 表单。
- 弹窗统一使用 `Ant Design Modal`。
- 分页统一使用 `Ant Design Pagination`。
- 页面功能通过现成组件组合实现，业务组件独立封装到 `src/components/`。
- 不混用多套后台 UI 组件库。

## 代码规则

- 使用 TypeScript 明确类型，不使用 `any`。
- 页面只做业务编排，复用展示块放到 `components`。
- 保持 Ant Design 视觉体系统一，不额外手写复杂 UI 基础设施。
