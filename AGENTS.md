# AGENTS.md — chufangapp 项目规则

## 1. 项目目标

家庭时令菜谱 App（家里有菜）包含 C 端 App、后台管理、统一后端三部分。

当前目标是完成可运行、可联调、可验收的 MVP：后台可配置内容，后端真实落库，C 端真实展示，不再依赖散落假数据。

## 2. 技术栈

| 端 | 目录 | 技术栈 |
|---|---|---|
| C 端 App | `frontend/` | 现存 uni-app + Vue3；开发规则以根目录 `AGENTS.md` 为唯一优先入口 |
| 后台管理 | `admin-frontend/` | React + TypeScript + Ant Design Pro / Ant Design |
| 统一后端 | `server/` | Express + Prisma + PostgreSQL |

历史目录 `admin-backend/`、`backend/` 仅作参考，禁止新增功能，除非用户明确要求。

## 3. 当前开发阶段

- MVP 联调阶段。
- 优先保证核心页面、接口、数据库、后台配置到 C 端展示链路闭环。
- 不开发与当前任务无关的新功能。
- 每次任务只修改必要文件。

## 4. Skill 使用规则

本项目已安装 taste-skill，位置：

```text
.agents/skills/
```

每次执行代码修改、页面设计、Figma 原型、接口联调、数据库审计任务前，必须先检查并阅读相关 skill 和项目规则文件。

根目录 `AGENTS.md` 是后续 Codex 开发、修改、生成页面时必须优先读取的项目规则文件。不要再新增 `typography.md`、`font.md`、`design.md` 等零散 AI 规范文档。

### 任务开始前必须阅读

- `AGENTS.md`
- `docs/codex/coding-rules.md`
- `docs/codex/checklist.md`

### C 端 UI / Figma / 移动端 / 视觉设计任务必须阅读

- `docs/design/ui-rules.md`
- `.agents/skills/redesign-existing-projects/SKILL.md`
- `.agents/skills/high-end-visual-design/SKILL.md`
- `.agents/skills/minimalist-ui/SKILL.md`
- `.agents/skills/imagegen-frontend-mobile/SKILL.md`

### 后端接口 / 字段 / 数据库 / Prisma 任务必须阅读

- `docs/backend/api-spec.md`
- `docs/backend/database-schema.md`
- `docs/backend/auth.md`
- `docs/admin/page-rules.md`

### 后台配置到 C 端展示任务必须阅读

- `docs/admin/page-rules.md`
- `docs/app/page-structure.md`
- `docs/codex/checklist.md`

### 删除文件 / 安装依赖 / 修改脚本 / 环境变量任务必须阅读

- `docs/codex/coding-rules.md`
- `docs/codex/checklist.md`

## 5. 开发原则

- 优先保证可运行、正确、可维护。
- 页面必须有真实交互，不做纯静态摆样子。
- 后台列表默认支持搜索、筛选、分页、增删改查。
- 接口返回结构统一，字段变更必须同步检查前后端映射。
- 数据必须从后台或后端服务流向 C 端，不允许长期依赖硬编码假数据。
- 空态、错误态、加载态、重复点击必须有基础兜底。
- 不过度设计，不提前建设复杂架构。
- 不保留无意义注释、调试日志、注释掉的旧代码。

## 6. 禁止事项

- 禁止修改本次任务无关目录。
- C 端 UI 任务只改 `frontend/`。
- 后台任务只改 `admin-frontend/`。
- 后端接口任务只改 `server/`。
- 禁止修改 `admin-backend/` 和 `backend/`，除非明确要求。
- 禁止随意删除、移动、重命名业务文件。
- 禁止清空数据库或执行破坏性数据库操作。
- 禁止泄露 `.env`、数据库密码、Token、密钥。
- 禁止修改 Git 历史。
- 禁止为了临时修复硬编码接口数据或展示数据。

## 7. 文档索引

### 总入口

- `docs/index.md`

### 产品

- `docs/product/prd.md`
- `docs/product/roadmap.md`

### 设计

- `docs/design/ui-rules.md`
- `docs/design/color-system.md`
- `docs/design/icon-rules.md`

### 后端

- `docs/backend/database-schema.md`
- `docs/backend/api-spec.md`
- `docs/backend/auth.md`

### 后台

- `docs/admin/menu-structure.md`
- `docs/admin/page-rules.md`

### C 端

- `docs/app/page-structure.md`
- `docs/app/route-map.md`

### Codex

- `docs/codex/coding-rules.md`
- `docs/codex/checklist.md`
- `docs/codex/task-template.md`

## 8. 启动方式

```bash
# 后端
cd server && npm run dev

# 后台管理
cd admin-frontend && npm run dev

# C 端 H5
cd frontend && npm run dev:h5
```

## 9. 完成输出要求

每次修改完成后必须输出：

1. 本次使用了哪些 skill
2. 修改了哪些文件
3. 每个文件改了什么
4. 如何启动测试
5. 是否影响接口 / 数据库 / 页面
6. 风险点

## 10. C 端设计规范

### 页面尺寸

- C 端页面按 iPhone 15 设计尺寸输出。
- 设计稿宽度固定 393pt。
- 首屏高度参考 852pt。
- 不要加手机壳、设备外框。
- 页面内容允许向下延展，但宽度不要变化。

### 视觉风格

- 整体风格：高级感、极简、奶油侘寂风。
- 页面要干净、克制、有留白。
- 不要做花哨渐变、重阴影、厚重边框。
- 主色参考：`#7A8B6F`。
- 背景色参考：`#F5F1EA`、`#FFFDFC`。
- 主文字颜色：`#2F2F2F`。
- 辅助文字颜色：`#B7AEA1`。
- 温暖橙色只作为少量点缀，不要大面积使用。

### 字体规范

- 全局使用系统字体：

```css
-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "PingFang SC", "Helvetica Neue", Arial, sans-serif;
```

| 用途 | 字号 / 字重 / 行高 |
|---|---|
| Hero 标题 | 28px / 600 / 36px |
| 页面标题 | 24px / 600 / 32px |
| 详情标题 | 22px / 600 / 30px |
| 模块标题 | 18px / 600 / 26px |
| 卡片标题 | 17px / 600 / 24px |
| 列表标题 | 16px / 500 / 24px |
| 正文 | 15px / 400 / 24px |
| 描述文字 | 14px / 400 / 22px |
| 辅助说明 | 13px / 400 / 20px |
| 标签文字 | 12px / 500 / 18px |
| 底部导航文字 | 11px / 500 或 600 / 14px |

### 字体使用规则

- 不允许页面里随意写死 `font-size`、`font-weight`、`line-height`。
- 不允许每个页面自己定义一套字体。
- 不允许正文小于 14px，除非是标签、底部导航或弱提示。
- 不允许大量使用 `font-weight: 700`。
- 不允许使用纯黑 `#000000` 作为正文颜色。
- 页面标题、模块标题、卡片标题、正文、标签、底部导航必须使用统一字体规范。

### 代码落地要求

- C 端统一样式 token 合并到已有全局样式文件，当前项目为 `frontend/src/styles/global.scss`。
- 不要重复创建多个样式文件，例如不要新增 `typography.md`、`font.md`、`design.md` 或零散设计规范文档。
- 后续所有 C 端页面开发时，必须优先引用全局 token，例如：

```css
font-size: var(--font-size-section-title);
font-weight: var(--font-semibold);
line-height: var(--line-section-title);
color: var(--text-primary);
```

- 不要直接写死：

```css
font-size: 18px;
font-weight: 600;
color: #000;
```

### 检查和修复要求

每次新增或修改 C 端页面时，必须检查：

1. 是否有页面内写死字体样式。
2. 是否有字号混乱。
3. 是否有标题层级不统一。
4. 是否有正文太小或太粗。
5. 是否有颜色不符合规范。
6. 是否底部导航字体超过 11px。
7. 是否使用了纯黑 `#000000`。

发现问题请直接修复。以后新增或修改 C 端页面时，自动遵守 `AGENTS.md` 和全局 tokens，不需要用户每次重复说明。
