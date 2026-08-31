# Recipe Detail Discovery Implementation Plan

> **For Codex:** Execute this plan with `executing-plans`; keep the approved recipe-detail header, tabs, content panels, and bottom actions unchanged.

**Goal:** Add the approved “继续发现” content to the bottom of the recipe detail page so users can continue browsing without introducing content-management features.

**Architecture:** Render a recipe-only discovery section after the existing detail body. The section remains present when the user switches between 食材、步骤、小贴士 because tab updates replace only `.detail-body`. All discovery entries use the existing detail route/toast interaction pattern.

**Tech Stack:** Static HTML templates in `app.js`, responsive CSS in `fixes.css`, Node-based source verification.

## Constraints

- Do not change the locked detail hero size or edge-to-edge placement.
- Do not change the existing recipe title, family reminder, tabs, ingredient/step/tip content, or bottom dual actions.
- Add only: 相似菜谱、鲈鱼还能这样做、适合搭配的饮品.
- Do not add kitchen notes, family cooking records, avatars, or management controls.

## Tasks

1. Add source-level assertions for the three sections, click targets, horizontal rails, and forbidden management content.
2. Add the recipe-only discovery template and append it after `.detail-body`.
3. Bind visible feedback to every card and “查看更多” action.
4. Add compact, responsive styles with 44px minimum interaction targets and right-edge horizontal-scroll affordance.
5. Run the prototype verification suite, JavaScript syntax check, design detector, and `git diff --check`.
