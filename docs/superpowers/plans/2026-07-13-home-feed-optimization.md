# C 端首页推荐流优化实施计划

> **给执行模型：** 必须逐项执行本计划。开始前读取 `AGENTS.md`、`docs/codex/coding-rules.md`、`docs/codex/checklist.md`、`docs/codex/skill-tool-routing.md`、`docs/design/ui-rules.md`，并使用 `using-superpowers`、`impeccable`、`ui-ux-pro-max`、`redesign-existing-projects`、`high-end-visual-design`、`minimalist-ui`。修改行为前使用 `test-driven-development`，完成前使用 `verification-before-completion`。不要凭空重新设计。

**目标：** 在不改变用户已确认首页结构和 Banner 几何尺寸的前提下，解决搜索框过实、铃铛位置错误、吸顶导航看不清、推荐流重复、交互不完整和移动端适配不足的问题。

**当前实现：** 独立 H5 原型，使用原生 HTML、CSS、JavaScript，入口为 `docs/prototypes/home-feed-interactive/index.html`。本轮只优化此原型，不修改 `frontend/`、接口、数据库和后台。

**验收设备：** 主尺寸固定为 iPhone 15：393 × 852 CSS px；同时检查 375 × 812、360 × 800、430 × 932。

---

## 一、绝对锁定项

执行模型不得自行修改以下内容：

1. Banner 几何尺寸固定为 `x: 0; y: 0; width: 393px; height: 420px`。不得缩小、增高、留左右边距、加手机外框或改成卡片。
2. Banner 必须位于页面最顶部并左右顶满。
3. 顶部第一行结构固定为：独立搜索框 + 独立消息铃铛。铃铛不得放进搜索框。
4. 顶部频道位于搜索行下方，顺序固定：`推荐｜菜谱｜食材｜水果｜饮品`。
5. Banner 下第一模块固定为 `时令果蔬`。
6. 底部导航固定为：`首页｜分类｜菜篮｜我的`；不得加入“消息”。
7. 首页不显示家庭选择、日期和“灵感/今日灵感”标题。
8. “菜篮”统一使用两个字；不得改为“菜篮子”。
9. 视觉方向固定：明亮、克制、奶油侘寂、轻科技感；主色 `#7A8B6F`。液态玻璃只用于搜索、铃铛、吸顶导航和底部导航等少量悬浮层。
10. 不允许大面积玻璃、厚重实体搜索框、重阴影、花哨渐变、大圆角卡片墙、三列重复菜谱墙。
11. 不允许为了“优化”重写整个页面或删除已确认模块。

任何锁定项确实需要调整时，立即停止，并向用户说明具体冲突；不得自行决定。

## 二、文件边界

只允许修改：

- `docs/prototypes/home-feed-interactive/index.html`：语义结构、模块内容、无障碍属性。
- `docs/prototypes/home-feed-interactive/styles.css`：基础设计 Token 和主样式。
- `docs/prototypes/home-feed-interactive/fixes.css`：仅允许作为迁移期覆盖；最后应尽量清空并合并回 `styles.css`。
- `docs/prototypes/home-feed-interactive/app.js`：滚动、频道、刷新、收藏、加载状态等交互。
- `docs/prototypes/home-feed-interactive/verify.mjs`：结构和锁定尺寸自动检查。
- `docs/prototypes/home-feed-interactive/README.md`：仅记录启动、验证和锁定项。

禁止修改 `frontend/`、`admin-frontend/`、`server/`、`backend/`、`admin-backend/`，禁止安装依赖。

## 三、设计 Token 与排版硬约束

先统一 Token，再调整模块。页面内不得零散写字号与颜色。

```css
:root {
  --page-width: 393px;
  --hero-height: 420px;
  --color-brand: #7A8B6F;
  --color-bg: #F5F1EA;
  --color-surface: #FFFDFC;
  --color-text: #2F2F2F;
  --color-text-secondary: #6F746D;
  --color-text-muted: #8A8E87;
  --font-family-system: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "PingFang SC", "Helvetica Neue", Arial, sans-serif;
  --font-section-size: 18px;
  --font-section-line: 26px;
  --font-card-size: 17px;
  --font-card-line: 24px;
  --font-body-size: 15px;
  --font-body-line: 24px;
  --font-description-size: 14px;
  --font-description-line: 22px;
  --font-meta-size: 13px;
  --font-meta-line: 20px;
  --font-tab-size: 11px;
  --font-tab-line: 14px;
  --weight-regular: 400;
  --weight-medium: 500;
  --weight-semibold: 600;
  --space-page: 20px;
  --radius-control: 14px;
  --radius-card: 14px;
  --tap-min: 44px;
  --z-content: 1;
  --z-sticky: 20;
  --z-tabbar: 30;
}
```

排版验收：正文不得小于 14px；模块标题为 18/26/600；卡片标题为 17/24/600；不得使用 `#000`；不得大面积 700 字重；底部导航文字为 11px。

## 四、分阶段实施

### 阶段 0：建立防回归基线

**修改：** `verify.mjs`、`README.md`

- [ ] 为以下内容增加断言：页面宽 393、Banner 高 420、频道顺序正确、底部导航顺序正确、铃铛不是搜索框后代、Banner 后第一个模块标题为“时令果蔬”。
- [ ] 增加禁用文案断言：页面不能出现“今日灵感”“灵感”“菜篮子”。
- [ ] 增加基础无障碍断言：交互按钮有可访问名称，当前频道有状态语义，当前底部页有 `aria-current="page"`。
- [ ] 运行 `node verify.mjs`，记录当前失败项；只修测试本身，不改 UI。
- [ ] 在 README 写明锁定项和验证命令。

**验收：** 后续任何模型改坏锁定结构时，`verify.mjs` 必须失败并明确指出原因。

### 阶段 1：顶部搜索、铃铛与吸顶导航

**修改：** `index.html`、`styles.css`、`app.js`

- [ ] 保持 Banner 尺寸不动，将搜索框和铃铛做成同一水平行的两个兄弟元素。
- [ ] 搜索框高度 48px，铃铛点击区域 48×48px，二者间距 10px；搜索框占剩余宽度。
- [ ] 搜索框使用“清透玻璃”：白色底透明度建议 0.14–0.22、1px 内高光、轻微模糊；禁止高不透明白底和大阴影。
- [ ] 铃铛使用独立圆角方形玻璃容器；图标视觉尺寸 22–24px并做光学居中。
- [ ] 在搜索区域后增加极轻局部暗化层，保证占位文字和图标在亮图上对比清晰；遮罩不得覆盖整个 Banner，也不得让图片发灰。
- [ ] 频道栏保持在搜索下方。未吸顶时文字为适合图片背景的高对比色；吸顶后切换为浅色半透明材质，频道文字改为 `--color-text`，选中项使用 `--color-brand` 和短下划线。
- [ ] 用 `requestAnimationFrame` 节流滚动状态；不要在每个 scroll 事件中直接反复写样式。
- [ ] 行为定义：向上滚动超过 96px 后搜索行平滑收起，频道栏吸顶；向下滚动累计 24px或回到顶部 32px内，搜索行恢复。加入迟滞避免抖动。
- [ ] 动画仅使用 `transform` 和 `opacity`，时长 220–280ms，曲线 `cubic-bezier(0.22, 1, 0.36, 1)`。
- [ ] `prefers-reduced-motion: reduce` 时取消位移动画，只做即时状态切换。
- [ ] 不支持 `backdrop-filter` 时使用 `rgba(255,253,252,.92)` 实色降级。

**验收截图：** 393×852 下分别截取页面顶部、滚动 130px 后、开始向下回滚后三种状态。三张图中频道文字都必须清晰，铃铛都不得进入搜索框。

### 阶段 2：真实图片与图片规则

**修改：** `index.html`、`styles.css`

- [ ] 不再用纯渐变色块代表食物图片。优先复用项目现有图片资源；找不到资源时保留明确的占位类，不得伪装成最终图。
- [ ] Banner 图片必须固定 `object-fit: cover`，焦点落在菜品主体，文字区域不得压住高细节背景。
- [ ] 时令果蔬统一为 1:1 图片；挑选指南图片固定为正方形；菜谱卡片使用 4:3 或既有锁定比例，不得混用。
- [ ] 所有内容图使用 `<img>`，提供真实 `alt`、`width`、`height`、`loading="lazy"`；首屏 Banner 使用高优先级加载，不加 lazy。
- [ ] 为图片增加加载失败占位，但不得显示破图图标。
- [ ] 图片色调统一为自然、明亮、低饱和暖调；禁止过曝、过度锐化和电商白底抠图混入菜谱摄影。

**验收：** 图片加载前后不发生明显布局跳动；挑选指南必须保持正方形；所有图片均能在关闭网络时显示稳定占位。

### 阶段 3：完善推荐流内容节奏

**修改：** `index.html`、`styles.css`

保持 Banner 与时令果蔬不动，从其后构建至少 6 屏可滚动内容。禁止连续出现两个完全相同的三列卡片模块。

推荐顺序：

1. `家常精选`：横向双卡或 2.2 张露出，展示菜名、口味、时间、难度、收藏。
2. `挑选指南`：单条轻量知识卡；正方形图片 + 标题 + 两个要点 + “查看挑选方法”。右侧最多两条要点，不堆三四行图标。
3. `今晚值得做`：一张宽图主推荐，信息控制为标题、场景文案、时间、难度。
4. `清爽一餐`：双列菜谱，避免与家常精选同构。
5. `食材变菜谱`：一个食材关联 2–3 道菜，突出“用它能做什么”。
6. `饮品搭配`：横向饮品图，当前只展示基础饮品，不提前实现调酒器。
7. `本周热门`：紧凑榜单或横向列表，不做编号 01/02/03 的装饰性模板。

每个模块遵守：

- [ ] 模块上下间距 28–36px，内部标题到内容 14–18px。
- [ ] “查看全部”点击区域至少 44px，不使用过浅灰。
- [ ] 卡片只展示决策所需信息；同一张卡片最多两行辅助信息。
- [ ] 收藏按钮与卡片点击分离，点击收藏不能触发卡片跳转。
- [ ] 每个横向列表最后一张有右侧预览露出，让用户知道可以横滑。
- [ ] 不使用大面积玻璃，不给普通内容卡加毛玻璃。

**验收：** 连续向下滚动 6 屏时，至少出现 5 种不同内容构图，但字体、圆角、色彩和图片风格保持同一系统。

### 阶段 4：补齐真实原型交互

**修改：** `index.html`、`app.js`、`styles.css`

- [ ] 搜索框点击后进入可输入状态，提交后在页面内展示搜索反馈；原型无法跳真实页面时，明确显示轻量 Toast，禁止无反应。
- [ ] 频道按钮切换选中状态，更新 `aria-selected`，并将内容滚动到顶部；原型阶段可以展示对应占位内容，但必须有反馈。
- [ ] 菜谱、果蔬、挑选指南、查看更多、饮品卡片均可点击，并通过统一函数输出目标类型和目标 ID。
- [ ] 收藏按钮支持未收藏/已收藏，更新 `aria-pressed`，图标填充变化，并显示不遮挡内容的 Toast。
- [ ] 刷新推荐必须真正重排或替换推荐数据，不能只转动图标。
- [ ] 无限加载至少支持 `idle → loading → loaded → end`；提供可触发的 `error → retry` 测试入口。
- [ ] 防止重复点击：加载和刷新进行时按钮 disabled，并有视觉状态。
- [ ] 底部导航有按压反馈；当前首页设置 `aria-current="page"`。
- [ ] 所有按钮加入 `:focus-visible`；点击目标最小 44×44px。

**验收：** 用键盘 Tab 可遍历全部主要入口；收藏、刷新、频道、加载更多都有可见反馈；控制台无错误。

### 阶段 5：动态字体、无障碍与适配

**修改：** `styles.css`、`index.html`、`verify.mjs`

- [ ] 删除伪造的 `font-size: 200%` 调试方式；改用根级缩放变量或浏览器真实文字缩放验证，使所有 Token 一起缩放。
- [ ] 100%、120%、150%、200% 四档下检查标题换行、按钮高度、卡片自适应和导航不遮挡。
- [ ] 文字放大后禁止固定卡片高度；使用内容撑开，并限制图片比例而非整个卡片高度。
- [ ] 当前频道使用 `aria-selected="true"`；当前底部页使用 `aria-current="page"`。
- [ ] 所有装饰图标 `aria-hidden="true"`；图片 alt 描述内容，不写“图片”。
- [ ] 文本对比度：正文至少 4.5:1，大文字至少 3:1；不得以浅灰换取“高级感”。
- [ ] 检查顶部安全区和底部安全区：使用 `env(safe-area-inset-top)`、`env(safe-area-inset-bottom)`，底部导航不得遮挡最后一张卡。
- [ ] 检查 360、375、393、430 宽度；页面不能横向溢出，Banner 在 393 宽仍为 393×420，在其他宽度保持满宽且高度规则由媒体查询明确控制，不得改变 393 基准。

**验收：** 200% 字体下所有核心内容仍可访问；无按钮文字截断；无横向页面滚动；底部最后内容可完整滚出导航上方。

### 阶段 6：样式归并与性能收尾

**修改：** `styles.css`、`fixes.css`、`app.js`

- [ ] 将确认后的覆盖规则合并回 `styles.css`；`fixes.css` 仅保留有明确原因的临时兼容规则，最好为空。
- [ ] 删除重复选择器、冲突声明、死代码和未接入的反馈函数。
- [ ] 颜色、字号、字重、行高、间距、圆角、z-index均引用 Token。
- [ ] 不给滚动内容大面积使用 `backdrop-filter`；模糊仅限固定或吸顶层。
- [ ] 图片保留尺寸，非首屏 lazy-load；滚动监听 passive，并通过 RAF 或 IntersectionObserver 控制。
- [ ] 增加空态、错误态和加载骨架的最小样式，不新增复杂框架。

**验收：** 页面滚动无明显掉帧；CSS 中无重复大段覆盖；控制台无 warning/error；网络慢速下布局稳定。

## 五、每阶段强制验证

每完成一个阶段，按顺序执行：

```bash
cd /Users/oooz/Desktop/Z_ou/chufangapp/docs/prototypes/home-feed-interactive
node verify.mjs
node --check app.js
cd /Users/oooz/Desktop/Z_ou/chufangapp
node .agents/skills/impeccable/scripts/detect.mjs --json docs/prototypes/home-feed-interactive/index.html docs/prototypes/home-feed-interactive/styles.css docs/prototypes/home-feed-interactive/fixes.css
git diff --check
```

预期结果：

- `verify.mjs` 全部通过。
- `node --check` 无输出并返回 0。
- Impeccable detector 返回空数组；若有结果必须逐条解释并修复，不能直接忽略。
- `git diff --check` 无输出。

浏览器人工验收：

1. 打开 `http://127.0.0.1:4173/`。
2. 以 393×852 截图顶部、吸顶、内容中段、底部四张。
3. 再以 375×812 和 430×932 各截一张。
4. 检查搜索框是否轻、铃铛是否独立、频道是否始终清晰、底部玻璃是否只作轻量点缀。
5. 连续滚动 6 屏，确认模块不机械重复。
6. 点击所有主要入口，确认无“看起来能点但无反应”的元素。

## 六、低级模型执行纪律

1. 一次只执行一个阶段；不要一次改完整页面。
2. 每阶段开始先复述“本阶段不会修改的锁定项”。
3. 修改前先读当前代码，不得凭截图重写 HTML。
4. 优先做局部修改，禁止全文件重新生成，尤其禁止把 `styles.css` 用另一套风格覆盖。
5. 发现规格冲突立即停止，不得自行选择。
6. 不添加依赖、不访问后端、不制造假接口。
7. 不因图片暂缺而使用渐变色冒充真实食物。
8. 不生成新原型图来替代代码验收；本任务是优化现有页面。
9. 每阶段完成后必须先跑验证，再提交下一阶段结果。
10. 若验证失败，先修复当前阶段，不得带病进入下一阶段。

## 七、阶段输出模板

每阶段执行完成必须按以下格式回复：

```text
阶段：阶段 N — 名称
使用的 skill：...
锁定项是否保持：是/否（逐项说明）
修改文件：
- 路径：修改内容
验证结果：
- verify.mjs：通过/失败
- app.js syntax：通过/失败
- Impeccable detector：通过/问题列表
- diff check：通过/失败
- 浏览器尺寸：393/375/430
接口影响：无
数据库影响：无
页面影响：...
仍存在的风险：...
下一阶段建议：...
```

## 八、最终完成标准

只有同时满足以下条件才能称为完成：

- Banner 在 393 基准下仍为 393×420，且所有锁定结构未改变。
- 搜索框轻透、铃铛独立、吸顶频道在任何滚动状态都清晰。
- 首页至少有 6 屏内容与 5 种不同模块构图，连续浏览不机械重复。
- 主要入口均有真实反馈，刷新和加载不是假动画。
- 100%–200% 字体、360–430px 宽度均无截断和横向溢出。
- 加载、空、错、重试、结束状态齐全。
- 底部导航只局部使用轻量液态玻璃，不发灰、不厚重、不遮挡内容。
- 自动验证全部通过，浏览器控制台无错误。
- 只修改计划允许的原型文件，不影响接口和数据库。

