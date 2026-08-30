# Mixed Drink Recipe Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add working alcoholic cocktail and Mocktail detail experiences to the existing home-feed prototype, including ingredients, tools, steps, tips, basket behavior, and a step-by-step mixing flow.

**Architecture:** Extend the existing `detailData` factory pattern with a dedicated `mixedDrinkProfiles` map and `buildMixedDrinkDetail(profile)` renderer. Reuse the current detail shell and cooking view, but make the guided flow consume data from the active detail item so recipe cooking and drink mixing remain separate experiences.

**Tech Stack:** Static HTML, CSS, vanilla JavaScript, Node.js verification scripts.

## Global Constraints

- Only modify `docs/prototypes/home-feed-interactive/` and this plan.
- Keep the locked full-bleed detail hero ratio and existing top actions unchanged.
- Cocktail and Mocktail share one component and differ through `alcoholic` data.
- Ordinary wine, beer, tea, coffee, and fruit drink details keep their current structures.
- Glass effects remain limited to hero floating controls and fixed bottom actions.
- Main click targets remain at least 44px and body text remains at least 14px.
- No interface, database, `frontend/`, `server/`, or admin changes.

---

### Task 1: Mixed-drink data and detail tabs

**Files:**
- Create: `docs/prototypes/home-feed-interactive/verify-mixed-drink.mjs`
- Modify: `docs/prototypes/home-feed-interactive/app.js`

**Interfaces:**
- Produces: `buildMixedDrinkDetail(profile)`, `mixedDrinkProfiles`, and detail objects with `action: 'mixology'`.
- Consumes: existing `showDetailView(type, id)`, `drinkRelatedDiscoveryPanel()`, and detail Tab behavior.

- [ ] **Step 1: Write the failing verification**

Assert that source contains two profiles (`gin-tonic`, `citrus-fizz`), shared tabs `['配方', '步骤', '小贴士']`, alcohol-specific warning, Mocktail without alcohol warning, ingredient categories, tool metadata, and mixology actions.

- [ ] **Step 2: Run the verification and confirm failure**

Run: `node verify-mixed-drink.mjs`

Expected: FAIL because `buildMixedDrinkDetail` is absent.

- [ ] **Step 3: Add mixed-drink factories and realistic profiles**

Implement:

```js
function buildMixedDrinkDetail(profile) {
  return {
    typeLabel: profile.alcoholic ? '鸡尾酒' : '无酒精调饮',
    name: profile.name,
    image: profile.image,
    subtitle: profile.subtitle,
    info: profile.alcoholic
      ? [['含酒精', '类型'], [`${profile.abv}%vol`, '酒精度'], [`${profile.duration} 分钟`, '制作时间']]
      : [['无酒精', '类型'], [profile.sweetness, '甜度'], [`${profile.duration} 分钟`, '制作时间']],
    tabs: ['配方', '步骤', '小贴士'],
    panels: mixedDrinkPanels(profile),
    alcoholic: profile.alcoholic,
    action: 'mixology',
    basketTarget: 'ingredients',
    guidedSteps: profile.steps
  };
}
```

Use “金汤力” for the alcoholic example and “柑橘气泡饮” for the Mocktail example. Each profile must contain ingredients, glassware, ice type, technique, tools, steps, tips, and substitutions.

- [ ] **Step 4: Route the channel entry and discovery cards**

Map `drink:mixology` and `drink:gin-tonic` to 金汤力, and `drink:citrus-fizz` to the Mocktail profile. Change the existing channel copy from “未来可…” to a real entry that opens the cocktail detail.

- [ ] **Step 5: Run verification**

Run: `node verify-mixed-drink.mjs`

Expected: PASS.

### Task 2: Guided mixing flow

**Files:**
- Modify: `docs/prototypes/home-feed-interactive/app.js`
- Modify: `docs/prototypes/home-feed-interactive/verify-mixed-drink.mjs`

**Interfaces:**
- Produces: `guidedFlowData`, `showGuidedFlow(data)`, and data-driven `renderCookingStep()` copy.
- Consumes: mixed-drink detail `guidedSteps`; recipe details continue to consume `cookingSteps`.

- [ ] **Step 1: Extend the failing test**

Assert that `showGuidedFlow(data)` receives the current detail object, the header and completion text are data-driven, and the mixology CTA is `开始调制`.

- [ ] **Step 2: Run the verification and confirm failure**

Run: `node verify-mixed-drink.mjs`

Expected: FAIL because the existing cooking flow is hard-coded to 清蒸鲈鱼.

- [ ] **Step 3: Generalize the guided flow without changing recipe behavior**

Create a current flow object:

```js
guidedFlowData = {
  name: data.name,
  mode: data.action === 'mixology' ? 'mixology' : 'recipe',
  steps: data.guidedSteps || cookingSteps
};
```

Render “退出调制模式 / 调制进度 / 完成调制” for mixology and retain existing cooking wording for recipes. The bottom detail actions must render equal-width `加入菜篮` and `开始调制` buttons when `action === 'mixology'`.

- [ ] **Step 4: Verify previous cooking behavior**

Run: `node verify-cooking.mjs && node verify-mixed-drink.mjs`

Expected: both PASS.

### Task 3: Visual system and responsive behavior

**Files:**
- Modify: `docs/prototypes/home-feed-interactive/fixes.css`
- Modify: `docs/prototypes/home-feed-interactive/index.html`
- Modify: `docs/prototypes/home-feed-interactive/verify-mixed-drink.mjs`

**Interfaces:**
- Consumes: `.mixed-drink-*` markup from Task 1.
- Produces: responsive ingredient grid, compact tools row, step cards, tips, responsible drinking note, and dual bottom actions.

- [ ] **Step 1: Add failing CSS and cache assertions**

Require `.mixed-drink-ingredient-grid`, `.mixed-drink-tools`, `.mixed-drink-step-list`, `.mixed-drink-tips`, `.mixed-drink-warning`, responsive large-text rules, and cache version `20260717-mixed-drink-21`.

- [ ] **Step 2: Run the test and confirm failure**

Run: `node verify-mixed-drink.mjs`

Expected: FAIL on missing style selectors.

- [ ] **Step 3: Implement restrained visual styles**

Use square ingredient images, four compact metadata cells, a vertical numbered step list, and plain content surfaces. At 150% and 200% text scale, switch the ingredient grid and metadata row to layouts that grow vertically without clipping.

- [ ] **Step 4: Refresh static asset version**

Update both `fixes.css` and `app.js` query strings in `index.html` to `20260717-mixed-drink-21`.

- [ ] **Step 5: Run all automated checks**

Run:

```bash
for test in verify*.mjs; do node "$test" || exit 1; done
node --check app.js
node ../../../.agents/skills/impeccable/scripts/detect.mjs --json --scope layout index.html app.js fixes.css
node ../../../.agents/skills/impeccable/scripts/detect.mjs --json --scope type index.html app.js fixes.css
git -C /Users/oooz/Desktop/Z_ou/chufangapp diff --check
```

Expected: all tests pass, both Impeccable scans return `[]`, and diff check exits 0.

- [ ] **Step 6: Browser verification**

At 393×852 verify:

- `调酒灵感` opens 金汤力.
- Full-bleed hero does not change size.
- 配方、步骤、小贴士 switch real content.
- Mocktail does not show alcohol warning.
- Adding to basket names the required ingredients.
- 开始调制 opens a working step flow.
- No horizontal overflow or console errors.
