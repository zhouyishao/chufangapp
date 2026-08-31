# Family Management Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the mixed family page into a family directory and a separate member-management page with correct navigation, permissions, notes, role changes, and removal confirmations.

**Architecture:** Keep the existing single-file HTML prototype and generic `mineSubpageView`. Add family/member prototype state in `app.js`, render `family:manage` as a directory, render `family:members` from the selected family, and reuse the existing bottom-sheet overlay for member actions and confirmations. Keep visual rules in `fixes.css`; do not modify the formal C-end application, API, or database.

**Tech Stack:** Semantic HTML, vanilla JavaScript, CSS, existing prototype verification script.

## Global Constraints

- The 393px prototype width and existing mine-page visual language remain unchanged.
- “周家 ▼” only switches the active family.
- The family-management content starts directly with the family list; no kicker, repeated page title, Hero, or explanatory paragraph.
- Clicking a family row opens that family’s member-management page.
- The member-management page starts with a compact summary and member list; no repeated title or explanatory paragraph.
- Creator-only operations are hidden from administrators and members.
- Administrators may remove ordinary members, but may not remove the creator or another administrator.
- Destructive operations require explicit confirmation.
- Member notes are personal labels for the current user and never replace the member's account nickname.
- Family-code, preference, basket, and mine surfaces resolve the same active family.
- Changes stay inside `docs/prototypes/home-feed-interactive/`.

---

### Task 1: Add Family and Member Prototype State

**Files:**
- Modify: `docs/prototypes/home-feed-interactive/app.js`
- Test: `docs/prototypes/home-feed-interactive/verify.mjs`

**Interfaces:**
- Produces: `familyMembersByFamily`, `selectedManagedFamilyId`, `familyRoleLabel(role)`, `activeManagedFamily()`.
- Consumes: existing `basketFamilies` and `activeBasketFamily`.

- [ ] **Step 1: Add verification assertions for the two family routes**

Add static assertions that `app.js` contains `familyMembersByFamily`, `openManagedFamily`, and `openFamilyMemberSheet`.

- [ ] **Step 2: Run verification and confirm failure**

Run: `cd docs/prototypes/home-feed-interactive && node verify.mjs`

Expected: FAIL because the new family state and handlers do not exist.

- [ ] **Step 3: Add family/member state**

Add mutable prototype data with exact role keys `creator`, `admin`, and `member`:

```js
const familyMembersByFamily = {
  zhou: [
    { id: 'self', name: '小周', note: '我', role: 'creator' },
    { id: 'dad', name: '爸爸', note: '少辣', role: 'member' },
    { id: 'mom', name: '妈妈', note: '不吃香菜', role: 'admin' },
    { id: 'grandma', name: '奶奶', note: '少油', role: 'member' }
  ]
};
let selectedManagedFamilyId = 'zhou';
```

Add helpers that return the selected family and localized role label.

- [ ] **Step 4: Run syntax and verification checks**

Run: `node --check app.js && node verify.mjs`

Expected: both commands pass.

### Task 2: Render a Family-First Directory

**Files:**
- Modify: `docs/prototypes/home-feed-interactive/app.js`
- Modify: `docs/prototypes/home-feed-interactive/fixes.css`

**Interfaces:**
- Produces: `renderFamilyDirectory()` and `openManagedFamily(familyId)`.
- Consumes: `basketFamilies`, `familyMembersByFamily`, `showMineSubpage()`.

- [ ] **Step 1: Replace the mixed `family:manage` markup**

Render only:

```html
<div class="family-directory-count">3 个家庭</div>
<section class="family-directory" aria-label="我的家庭">
  <button class="family-directory-row" data-open-family-members="zhou">...</button>
</section>
<div class="family-directory-actions">
  <button data-create-family>创建家庭</button>
  <button data-scan-family>扫一扫加入家庭</button>
</div>
```

Each row contains family name, member count, current-user role, current-family status, and a chevron. It contains no member permission controls.

- [ ] **Step 2: Add focused directory styles**

Use a single white surface with divided rows, 12–14px radius, 44px minimum targets, and no large introductory block. Keep create/scan actions visually separate below the list.

- [ ] **Step 3: Wire family-row navigation**

`openManagedFamily(familyId)` sets `selectedManagedFamilyId` and calls `showMineSubpage('family:members', { parentRoute: 'family:manage' })`.

- [ ] **Step 4: Run verification**

Run: `node --check app.js && node verify.mjs && git diff --check`

Expected: all pass.

### Task 3: Build the Member-Management Page

**Files:**
- Modify: `docs/prototypes/home-feed-interactive/app.js`
- Modify: `docs/prototypes/home-feed-interactive/fixes.css`

**Interfaces:**
- Produces: `renderFamilyMembers(familyId)` and `openFamilyMemberSheet(memberId)`.
- Consumes: `familyMembersByFamily`, `selectedManagedFamilyId`, existing `basketOverlayOpen()`.

- [ ] **Step 1: Replace the old simple `family:members` markup**

Render a compact summary and member rows:

```html
<div class="family-member-summary">
  <span>4 位成员 · 我是创建者</span>
  <button data-route="family:code">家庭码</button>
</div>
<section class="family-member-directory">
  <button data-family-member="dad">...</button>
</section>
```

Each member row shows avatar, name, personal note, role, and chevron. The row itself opens member actions.

- [ ] **Step 2: Add member-action bottom sheet**

`openFamilyMemberSheet(memberId)` shows:

- editable note input and save button;
- set/cancel administrator action when current user is creator;
- remove-member action when permitted;
- no creator removal action for the creator row.

- [ ] **Step 3: Add permission-based rendering**

Use the current user’s role in the selected family:

```js
const canSetAdmin = currentUser.role === 'creator' && member.role !== 'creator';
const canRemove = currentUser.role === 'creator'
  ? member.role !== 'creator'
  : currentUser.role === 'admin' && member.role === 'member';
```

Do not render unavailable actions.

- [ ] **Step 4: Style compact member rows and action sheet**

Member rows use one primary text line and one muted note line. Permission labels are secondary; action buttons remain in the bottom sheet.

- [ ] **Step 5: Run syntax and verification checks**

Run: `node --check app.js && node verify.mjs && git diff --check`

Expected: all pass.

### Task 4: Implement Notes, Roles, Removal, and Back Navigation

**Files:**
- Modify: `docs/prototypes/home-feed-interactive/app.js`
- Modify: `docs/prototypes/home-feed-interactive/fixes.css`

**Interfaces:**
- Produces: `saveFamilyMemberNote`, `confirmFamilyRoleChange`, `confirmFamilyMemberRemoval`, `mineSubpageParentRoute`.
- Consumes: `renderMineSubpage`, `basketOverlayOpen`, `closeBasketOverlay`.

- [ ] **Step 1: Add prototype mutations**

Save edited notes into `familyMembersByFamily[selectedManagedFamilyId]`, toggle `admin`/`member`, and remove confirmed non-creator members from the array.

- [ ] **Step 2: Add confirmation sheets**

Role changes and removals show the member name and exact result. Confirmation buttons are explicit: `确认设为管理员`, `确认取消管理员`, or `确认移除`.

Add family-level actions below the member list: creators see `转让创建者` and `解散家庭`; administrators and members see `退出家庭`. The creator cannot exit before transferring ownership.

- [ ] **Step 3: Add the two-level back stack**

When `family:members` is open, the back button returns to `family:manage`. When `family:manage` is open, back returns to mine. Other mine subpages keep their existing behavior.

- [ ] **Step 4: Keep family state synchronized**

Switching a family from the mine dropdown updates both `activeBasketFamily` and `selectedManagedFamilyId`. Opening a family from the directory selects it for member management without silently changing the active basket family.

The family-code page resolves the selected family, shows a validity message, and exposes refresh, share, and save actions. Empty family state shows separate `创建家庭` and `扫一扫加入家庭` actions.

- [ ] **Step 5: Run verification**

Run: `node --check app.js && node verify.mjs && git diff --check`

Expected: all pass.

### Task 5: Browser and Accessibility Regression

**Files:**
- Modify if needed: `docs/prototypes/home-feed-interactive/index.html`
- Modify if needed: `docs/prototypes/home-feed-interactive/app.js`
- Modify if needed: `docs/prototypes/home-feed-interactive/fixes.css`

**Interfaces:**
- Consumes: all family-management UI and state from Tasks 1–4.
- Produces: verified prototype behavior.

- [ ] **Step 1: Verify the family flow in the browser**

At 393px width:

1. Open 我的.
2. Open 管理.
3. Confirm the first content is the family list.
4. Click 周家.
5. Confirm the member-management page opens.
6. Edit 爸爸’s note.
7. Set 爸爸 as administrator.
8. Remove a non-creator member through confirmation.
9. Press back and confirm it returns to the family list.

- [ ] **Step 2: Verify responsive and large-text behavior**

Check 360px and 393px widths with 100%, 150%, and 200% type scale. Expected: no horizontal scrolling, clipped member actions, or repeated page titles.

- [ ] **Step 3: Run final automated checks**

Run:

```bash
cd docs/prototypes/home-feed-interactive
node verify.mjs
node --check app.js
git diff --check
cd ../../..
node .agents/skills/impeccable/scripts/detect.mjs --json docs/prototypes/home-feed-interactive/index.html docs/prototypes/home-feed-interactive/styles.css docs/prototypes/home-feed-interactive/fixes.css
```

Expected: verification passes, syntax passes, diff check is clean, and detector returns `[]`.
