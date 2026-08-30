# Ingredient Related Recipes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a persistent, horizontally scrollable related-recipe module to ingredient detail pages without changing the locked hero, tabs, or bottom basket action.

**Architecture:** Add one ingredient-only renderer in `app.js` and interpolate it after the Tab module. Reuse the prototype's existing recipe routes and image fallback binding, while giving the new rail its own compact CSS classes so recipe-detail discovery styles remain unchanged.

**Tech Stack:** Vanilla HTML, CSS, JavaScript, Node.js static verification scripts.

## Global Constraints

- The module appears only on ingredient detail pages.
- At 393px it exposes about 2.3 cards; every recipe image is square.
- The module remains visible when switching “怎么挑 / 怎么放 / 怎么吃”.
- Remove the duplicate related-recipe block from “怎么吃”.
- Do not change the locked 393×389 adaptive detail hero, the detail information strip, or the fixed bottom action.
- Do not modify formal `frontend/`, APIs, or the database.

---

### Task 1: Add regression coverage for the ingredient recipe module

**Files:**
- Modify: `docs/prototypes/home-feed-interactive/verify-ingredient-detail.mjs`

**Interfaces:**
- Consumes: static source strings from `app.js` and `fixes.css`.
- Produces: assertions that protect placement, card geometry, routes, and duplicate removal.

- [ ] **Step 1: Write the failing assertions**

Append these assertions before the final `console.log`:

```js
assert(js.includes('function ingredientRelatedRecipesPanel('), '食材详情缺少相关菜谱模块渲染器');
assert(js.includes("type === 'ingredient' ? ingredientRelatedRecipesPanel(data.name) : ''"), '相关菜谱模块必须只在食材详情显示');
assert(js.includes('${detailIngredientDiscovery}</section>'), '相关菜谱模块必须位于详情 Tab 模块之后');
['recipe:tomato-egg', 'recipe:tomato-beef', 'recipe:tomato-soup'].forEach((route) => assert(js.includes(`data-route="${route}"`), `相关菜谱缺少路由: ${route}`));
assert(js.includes('data-detail-ingredient-more'), '相关菜谱缺少更多入口');
assert(css.includes('.ingredient-related-rail') && css.includes('grid-auto-columns:calc((100% - 20px) / 2.3)'), '相关菜谱必须横向露出约 2.3 张');
assert(css.includes('.ingredient-related-card img') && css.includes('aspect-ratio:1'), '相关菜谱图片必须为正方形');
```

- [ ] **Step 2: Run the test and confirm it fails**

Run:

```bash
cd /Users/oooz/Desktop/Z_ou/chufangapp/docs/prototypes/home-feed-interactive
node verify-ingredient-detail.mjs
```

Expected: FAIL with `食材详情缺少相关菜谱模块渲染器`.

- [ ] **Step 3: Commit the failing test**

```bash
git add docs/prototypes/home-feed-interactive/verify-ingredient-detail.mjs
git commit -m "test: cover ingredient related recipes"
```

### Task 2: Implement the persistent related-recipe rail

**Files:**
- Modify: `docs/prototypes/home-feed-interactive/app.js`
- Modify: `docs/prototypes/home-feed-interactive/fixes.css`
- Modify: `docs/prototypes/home-feed-interactive/index.html`
- Test: `docs/prototypes/home-feed-interactive/verify-ingredient-detail.mjs`

**Interfaces:**
- Consumes: `showDetailView(type, id)`, `bindRoutes(scope)`, `showToast(message)`, existing recipe detail routes.
- Produces: `ingredientRelatedRecipesPanel(ingredientName)` returning ingredient-only module markup.

- [ ] **Step 1: Add the module renderer and remove the duplicate Tab content**

Add before `const detailData = {`:

```js
function ingredientRelatedRecipesPanel(ingredientName) {
  const recipes = [
    ['番茄炒蛋', '15 分钟 · 简单', 'tomato-egg', 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=420&q=82'],
    ['番茄炖牛腩', '90 分钟 · 适中', 'tomato-beef', 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=420&q=82'],
    ['番茄虾仁汤', '25 分钟 · 简单', 'tomato-soup', 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=420&q=82']
  ];
  return `<section class="ingredient-related-recipes" aria-labelledby="ingredientRelatedTitle"><h2 id="ingredientRelatedTitle">${ingredientName}可以这样做</h2><div class="ingredient-related-rail">${recipes.map(([name, meta, id, image]) => `<button type="button" class="ingredient-related-card" data-route="recipe:${id}"><img src="${image}" width="132" height="132" loading="lazy" alt="${name}"><span><strong>${name}</strong><small>${meta}</small></span></button>`).join('')}<button type="button" class="ingredient-related-card is-more" data-detail-ingredient-more><span><strong>更多${ingredientName}菜谱</strong><small>继续查看</small></span></button></div></section>`;
}
```

In the ingredient “怎么吃” panel, retain only `.detail-eat-note` and remove its `.detail-section-heading` plus `.detail-related` markup.

- [ ] **Step 2: Render and bind the module outside the Tab panel**

Inside `showDetailView(type, id)` add:

```js
const detailIngredientDiscovery = type === 'ingredient' ? ingredientRelatedRecipesPanel(data.name) : '';
```

Interpolate it after `.detail-tab-module` and before the closing `.detail-content` section:

```js
</div>${detailIngredientDiscovery}${detailDiscovery}</section>
```

After rendering, bind the dynamic routes and the final more card:

```js
bindRoutes(view);
view.querySelector('[data-detail-ingredient-more]')?.addEventListener('click', () => showToast(`查看更多${data.name}菜谱`));
```

- [ ] **Step 3: Add compact, responsive rail styles**

Add to `fixes.css`:

```css
.ingredient-related-recipes { padding:18px 0 4px; border-top:1px solid rgba(47,47,47,.08); }
.ingredient-related-recipes > h2 { margin:0 0 12px; font-size:18px; line-height:26px; font-weight:600; }
.ingredient-related-rail { display:grid; grid-auto-flow:column; grid-auto-columns:calc((100% - 20px) / 2.3); gap:10px; margin-right:-20px; padding-right:20px; overflow-x:auto; scroll-snap-type:x proximity; scrollbar-width:none; }
.ingredient-related-rail::-webkit-scrollbar { display:none; }
.ingredient-related-card { min-width:0; padding:0 0 9px; overflow:hidden; border:0; border-radius:12px; color:var(--text-primary); background:var(--surface-primary); text-align:left; scroll-snap-align:start; transition:transform 180ms cubic-bezier(.22,1,.36,1); }
.ingredient-related-card:active { transform:scale(.98); }
.ingredient-related-card img { display:block; width:100%; height:auto; aspect-ratio:1; object-fit:cover; background:var(--surface-sage); }
.ingredient-related-card > span { display:block; padding:8px 9px 0; }
.ingredient-related-card strong,.ingredient-related-card small { display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.ingredient-related-card strong { font-size:15px; line-height:22px; font-weight:600; }
.ingredient-related-card small { margin-top:1px; color:var(--text-secondary); font-size:12px; line-height:18px; }
.ingredient-related-card.is-more { min-height:190px; display:flex; align-items:flex-end; background:var(--surface-sage); }
.ingredient-related-card.is-more strong { white-space:normal; }
html[data-scale="2"] .ingredient-related-rail { grid-auto-columns:76%; }
html[data-scale="2"] .ingredient-related-card strong { white-space:normal; }
```

- [ ] **Step 4: Bump the prototype cache version**

In `index.html`, update the `fixes.css` and `app.js` query strings to:

```html
<link rel="stylesheet" href="./fixes.css?v=20260717-ingredient-recipes-18">
<script type="module" src="./app.js?v=20260717-ingredient-recipes-18"></script>
```

- [ ] **Step 5: Run focused and full verification**

```bash
cd /Users/oooz/Desktop/Z_ou/chufangapp/docs/prototypes/home-feed-interactive
node verify-ingredient-detail.mjs
node verify-cooking.mjs
node verify-detail-discovery.mjs
node verify.mjs
node --check app.js
node /Users/oooz/Desktop/Z_ou/chufangapp/.agents/skills/impeccable/scripts/detect.mjs --json --scope layout index.html app.js fixes.css
cd /Users/oooz/Desktop/Z_ou/chufangapp
git diff --check
```

Expected: all verification scripts print `passed`, JavaScript syntax check exits `0`, design detector returns `[]`, and `git diff --check` exits `0`.

- [ ] **Step 6: Commit the implementation**

```bash
git add docs/prototypes/home-feed-interactive/app.js docs/prototypes/home-feed-interactive/fixes.css docs/prototypes/home-feed-interactive/index.html
git commit -m "feat: add ingredient related recipes"
```
