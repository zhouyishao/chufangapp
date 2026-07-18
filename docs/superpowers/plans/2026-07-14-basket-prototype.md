# 菜篮页原型 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将已确认的家庭共享菜篮设计写入首页交互原型，支持食材/菜谱双视图、采购状态、家庭偏好入口、家庭切换和完成采购确认。

**Architecture:** 保留现有单页原型和 localStorage 菜篮数据，在 `app.js` 中增加两个视图投影：食材视图按食材合并，菜谱视图按菜谱分组；共享状态只保存菜篮条目和已采购条目。底部弹层与家庭下拉菜单均由原生 HTML/CSS 渲染，不引入依赖。

**Tech Stack:** 原生 HTML、CSS、ES module JavaScript、现有 `verify.mjs`、Playwright CLI。

## Global Constraints

- 只修改 `docs/prototypes/home-feed-interactive/`，不修改 `frontend/`、接口或数据库。
- 菜篮页面顶部直接显示家庭名称，不显示“菜篮”标题。
- 家庭切换使用家庭名下拉菜单；挑选方法、家庭口味和完成采购使用底部弹层。
- 页面基准 393×852，检查 360×800；底部导航不遮挡内容。
- 使用现有颜色、字体 Token、SVG 图标和 localStorage 机制。

### Task 1: Extend basket markup and regression assertions

**Files:**
- Modify: `docs/prototypes/home-feed-interactive/index.html`
- Modify: `docs/prototypes/home-feed-interactive/verify.mjs`

- [ ] Add basket page hooks for family title/dropdown, view switch, preference summary, content list, completion action and a reusable overlay root.
- [ ] Add assertions for the new hooks, both basket views, purchase state controls, and overlay state.
- [ ] Run `node verify.mjs` and confirm the new assertions fail before implementation.

### Task 2: Implement shared basket view data and interactions

**Files:**
- Modify: `docs/prototypes/home-feed-interactive/app.js`

- [ ] Add prototype data for family choices, family preferences, merged ingredients, recipe groups and purchased keys.
- [ ] Render the default `食材` view with merged rows, quantity/price, source count, checkbox state and detail route buttons.
- [ ] Render the `菜谱` view with expandable recipe groups and ingredient progress.
- [ ] Keep both views synchronized through the same purchase state.
- [ ] Add family dropdown, preference sheet, ingredient selection sheet and completion confirmation sheet with close/backdrop behavior.
- [ ] Keep clear-all restricted to the prototype administrator action and preserve existing category/home interactions.

### Task 3: Apply basket visual system and responsive behavior

**Files:**
- Modify: `docs/prototypes/home-feed-interactive/fixes.css`

- [ ] Replace the old basket header/list styles with the approved family-title layout, segmented control, compact preference row, merged ingredient rows and recipe accordions.
- [ ] Add bottom-sheet and anchored family-dropdown layers with safe-area spacing and focus-visible states.
- [ ] Ensure 44px touch targets, readable type at 100%–200%, and no horizontal overflow at 360px–393px.
- [ ] Keep bottom navigation selected-state icon filled and remove underline.

### Task 4: Verify the interactive prototype

**Files:**
- Verify: `docs/prototypes/home-feed-interactive/index.html`
- Verify: `docs/prototypes/home-feed-interactive/app.js`
- Verify: `docs/prototypes/home-feed-interactive/styles.css`
- Verify: `docs/prototypes/home-feed-interactive/fixes.css`
- Verify: `docs/prototypes/home-feed-interactive/verify.mjs`

- [ ] Run `node verify.mjs` and `node --check app.js`.
- [ ] Run Impeccable detector and `git diff --check`.
- [ ] Use Playwright at 393×852 and 360×800 to verify: opening 菜篮, switching 食材/菜谱, checking an item, opening 家庭口味, opening a selection sheet, opening family dropdown, and confirming completion.
- [ ] Confirm no JavaScript console errors; report the pre-existing favicon 404 separately if it remains.
