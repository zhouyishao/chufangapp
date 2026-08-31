# “我的”页面 UX 完善 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不改变已确认视觉框架的前提下，把“我的”页面补齐为可返回、可恢复、可适配、具备完整状态的交互原型。

**Architecture:** 继续使用现有 HTML/CSS/原生 JavaScript。`app.js` 通过 History API 管理菜谱列表子页面，通过查询参数渲染原型状态；`fixes.css` 负责局部视觉与大字适配；`verify.mjs` 固化回归断言。

**Tech Stack:** HTML5、CSS、ES Modules、Node.js 静态验证脚本。

## Global Constraints

- 只修改 `docs/prototypes/home-feed-interactive/` 和本设计/计划文档。
- 不修改首页、分类、菜篮、Banner、接口、数据库和正式 `frontend/`。
- 保留 393pt 设计基准、系统字体、`#7A8B6F` 主色和局部玻璃原则。

---

### Task 1: 固化结构与文案

**Files:**
- Modify: `docs/prototypes/home-feed-interactive/index.html`
- Modify: `docs/prototypes/home-feed-interactive/verify.mjs`

- [ ] **Step 1:** 在验证脚本中加入具体共享文案、精简设置入口、状态容器和二级页语义断言。
- [ ] **Step 2:** 运行 `node verify.mjs`，确认新断言先失败。
- [ ] **Step 3:** 修改 HTML，共享文案改为具体类别；设置精简为消息、共享、更多设置；补齐菜谱列表状态结构。
- [ ] **Step 4:** 再运行 `node verify.mjs`，确认结构断言通过。

### Task 2: 实现二级页历史与状态

**Files:**
- Modify: `docs/prototypes/home-feed-interactive/app.js`
- Modify: `docs/prototypes/home-feed-interactive/verify.mjs`

- [ ] **Step 1:** 增加 History API、`inert`、底部导航隐藏和滚动/焦点恢复断言。
- [ ] **Step 2:** 实现 `showMineRecipeList`、`closeMineRecipeList`、`popstate` 与 `renderMineRecipeState`。
- [ ] **Step 3:** 为错误重试、空态添加动作和图片失败绑定真实反馈。
- [ ] **Step 4:** 运行 `node --check app.js` 与 `node verify.mjs`。

### Task 3: 完善视觉和大字体适配

**Files:**
- Modify: `docs/prototypes/home-feed-interactive/fixes.css`

- [ ] **Step 1:** 为四种状态、二级页进出、设置分组和按压/焦点状态补样式。
- [ ] **Step 2:** 增加 150%–200% 的个人资料、共享条、家庭摘要、列表头和底部导航规则。
- [ ] **Step 3:** 运行 `node verify.mjs`、Impeccable detector 与 `git diff --check`。
- [ ] **Step 4:** 在 360、375、393、430px 和 100%、150%、200% 字体组合下检查横向溢出、底部遮挡与返回行为。
