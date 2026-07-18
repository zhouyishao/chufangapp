# UI 规则

## C 端风格

- 移动端优先。
- 食材和菜谱图片优先。
- 白色、简洁、轻量、卡片式布局。
- 高级感、极简、奶油侘寂风：安静、克制、成熟、日常、真实。
- 页面不能像低保真线框图或未完成 Demo。

## 页面布局

- 首屏突出主要内容。
- 卡片圆角统一，阴影克制，优先用边框和留白建立层级。
- 列表、分类、详情页保持统一留白和视觉节奏。
- 标题最多 2 行，描述最多 3 行。
- 图片比例优先使用 4:3 或 1:1。

## 组件原则

- C 端历史页面为 uni-app + Vue；新重构任务按 `frontend/AGENTS.md` 执行。
- 后台页面使用 Ant Design Pro / Ant Design，不从零手写复杂基础组件。
- 所有图标优先使用 `lucide-react`；后台允许 `@ant-design/icons`。

## 状态规则

- 必须有 Loading、Empty、Error、Retry。
- 接口失败不能白屏。
- 按钮重复点击必须有基础防护。

## 全局安全区适配规范

### 适用范围

本规范适用于所有 C 端页面和全屏交互，包括首页、分类页、菜谱详情、食材详情、水果详情、调料详情、酒水详情、菜篮子、家庭管理、搜索、我的、登录注册，以及弹窗、抽屉和全屏预览。任何页面不得单独忽略安全区。

### 设计基准

- 移动端设计稿基准为 iPhone 15，画布 `393 × 852pt`。
- 顶部安全区约 `59pt`，底部安全区约 `34pt`，仅用于设计稿校验。
- 实际开发必须使用系统安全区变量，不得写死设备尺寸。

### 顶部安全区

页面背景、图片和渐变可以延伸至屏幕最顶部；搜索框、返回按钮、页面标题、头像、设置按钮、新增按钮、筛选按钮、Tab 导航和其他可点击元素必须位于顶部安全区下方。

普通顶部内容统一使用：

```css
padding-top: env(safe-area-inset-top, 0px);
```

需要额外视觉间距时使用：

```css
padding-top: calc(env(safe-area-inset-top, 0px) + 12px);
```

禁止直接写死以下设备相关间距：

```css
top: 20px;
top: 24px;
top: 32px;
padding-top: 44px;
padding-top: 59px;
```

沉浸式页面应将背景与交互内容分离：

```css
.app-hero {
  position: relative;
}

.app-hero-background {
  position: absolute;
  inset: 0;
}

.app-hero-content {
  position: relative;
  padding-top: calc(env(safe-area-inset-top, 0px) + 12px);
}
```

### 底部安全区

底部导航栏、固定操作按钮、加入菜篮子按钮、开始烹饪按钮、提交按钮、底部弹窗和底部抽屉必须适配底部安全区：

```css
padding-bottom: env(safe-area-inset-bottom, 0px);
```

固定底部操作区示例：

```css
.page-bottom-action {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  padding: 12px 16px calc(12px + env(safe-area-inset-bottom, 0px));
}
```

页面正文必须预留固定底部组件的完整高度，避免最后一项内容被遮挡。

### 全局页面结构

普通页面推荐使用统一容器：

```css
.app-page {
  min-height: 100dvh;
  box-sizing: border-box;
  background: var(--page-background);
}

.app-page-content {
  padding-right: 16px;
  padding-left: 16px;
}

.app-header {
  padding-top: calc(env(safe-area-inset-top, 0px) + 12px);
}
```

安全区只能由一个明确的父级容器统一处理。禁止页面容器、Header、子组件重复添加同一方向的安全区 padding。

### H5 / PWA 配置

H5 入口必须包含 `viewport-fit=cover`，否则部分 iPhone 设备无法正确读取安全区变量：

```html
<meta
  name="viewport"
  content="width=device-width, initial-scale=1, viewport-fit=cover"
>
```

### 开发与验收要求

- 所有新页面默认继承全局安全区容器，不允许各页面自行发明一套安全区逻辑。
- 不允许仅针对 iPhone 15 写死顶部 `59px` 或底部 `34px`。
- Android、无刘海设备和桌面端安全区为 `0` 时，页面必须正常显示且不出现异常留白。
- 背景可以进入状态栏，交互内容不能进入状态栏或灵动岛区域。
- 固定底部组件不能遮挡正文，页面切换不得出现顶部跳动。
- 弹窗、全屏预览和抽屉同样必须遵守安全区规范。
- 验收时检查顶部内容、返回按钮、搜索框、顶部 Tab、底部导航、页面最后一项、写死的 `top/padding-top/bottom`、重复安全区、横屏布局和 Android 留白。

## 禁止

- 禁止高饱和色、霓虹色、复杂渐变、重阴影。
- 禁止 emoji 作为主要图标。
- 禁止混用多套 UI 组件库。
