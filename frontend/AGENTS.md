# frontend/AGENTS.md

本目录为 C 端前端。用户最新明确要求优先于旧技术栈约定，后续 C 端开发按以下规则执行。

## 技术栈

- React + TypeScript。
- TailwindCSS。
- shadcn/ui。
- 图标统一使用 `lucide-react`。

## 组件规则

- 不从零手写复杂基础组件。
- 优先使用 shadcn/ui 的现成组件组合页面能力。
- 图标只从 `lucide-react` 导入。
- 可复用组件独立封装到 `src/components/`。
- 不混用多套 C 端 UI 组件库。

## 样式规则

- 使用 TailwindCSS 做页面样式组合。
- 保持移动端优先、轻量、统一。
- 不手写复杂基础控件样式，除非 shadcn/ui 无法覆盖该业务场景。
