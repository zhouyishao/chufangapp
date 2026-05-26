# 实现检查清单

## 开发前检查

1. Figma 识别页面总数：8 个以上，`10:2` 大画布输出被截断。
2. docs/page-manifest.md 页面/状态数：53。
3. 当前已创建路由数：B 端 21 个页面路由 + C 端 29 个 pages.json 路由。
4. 当前已创建页面文件数：B 端 21 个页面文件；C 端 29 个页面文件。
5. 当前已完成页面数：0。
6. 当前未完成页面数：53。
7. 页面数量、路由数量、文件数量是否一致：页面路由和文件骨架已补齐；交互状态按组件计入。
8. 本次开发页面：暂不进入单页 UI，先补齐防漏页骨架。
9. 本次涉及接口：仅盘点，不新增接口。
10. 本次涉及数据库表：仅盘点，不新增表。
11. 本次是否会更新 checklist：是。

## 第一阶段：页面盘点和防漏页骨架

| 任务 | 状态 | 备注 |
|---|---|---|
| 读取 AGENTS.md | 已完成 | 已读取 |
| 读取执行骨架 | 已完成 | 已读取 |
| 识别子项目 | 已完成 | admin-frontend=B端，frontend=C端，server=后端 |
| 读取 Figma MCP | 已完成 | 可用但输出截断 |
| 生成 page-manifest.md | 已完成 | 39 个页面 |
| 生成 route-map.md | 已完成 | B/C 路由盘点 |
| 生成 module-list.md | 已完成 | B/C/后端模块 |
| 生成 api-spec.md | 已完成 | 已有与缺失接口 |
| 生成 database-schema.md | 已完成 | 已有与缺失表 |
| 生成 progress-report.md | 已完成 | 本阶段记录 |
| 生成 blockers.md | 已完成 | 记录 MCP 截断等问题 |
| 生成后台 PRD / 开发交付文档 | 已完成 | `docs/admin-cms-prd-dev-spec.md`，覆盖页面、字段、交互、接口、验收 |

## 第二阶段：路由和页面文件骨架

| 任务 | 状态 | 备注 |
|---|---|---|
| 补齐 B 端缺失页面文件 | 已完成 | 已创建空页面骨架 |
| 补齐 B 端缺失路由 | 已完成 | 已更新 App.tsx |
| 补齐 C 端缺失页面文件 | 已完成 | 已创建核心规划页面骨架 |
| 补齐 C 端 pages.json 路由 | 已完成 | 已更新 pages.json |
| 更新 route-map.md | 已完成 | 已补入现有与新增路由 |

## 2026-05-25：Admin 第一阶段路由骨架复核

| 页面/模块 | 状态 | 路由 | 备注 |
|---|---|---|---|
| 登录页 | 已完成 | `/login` | 接真实 `/auth/login`，保存 token 后进入后台 |
| Admin Layout | 已完成 | 全后台路由 | 固定左侧导航、顶部区域、主内容滚动容器 |
| 路由守卫 | 已完成 | 全后台路由 | 未登录跳转 `/login` |
| 权限占位 | 已完成 | 全后台路由 | `RequirePermission` + `permissions.ts`，默认超级管理员 |
| 403 页面 | 已完成 | `/403` | 无权限状态页 |
| 404 页面 | 已完成 | `*` | 后台内未知路由展示 404 |
| 工作台 | 已完成 | `/dashboard` | Dashboard 骨架与运营概览卡片 |
| 首页运营 | 已完成 | `/home-ops` | 首页 Banner、推荐、时令、今日吃什么、App 预览骨架 |
| 内容管理 | 已完成 | `/content` | 内容总览骨架 |
| 菜谱管理 | 已完成 | `/content/recipes` | 列表、搜索筛选、分页、删除、发布/推荐/审核、详情、新增、编辑 |
| 食材管理 | 已完成 | `/content/ingredients` | 列表、搜索筛选、分页、删除、上架/下架、推荐、详情、新增、编辑 |
| 分类标签 | 已完成 | `/taxonomies` | 分类与标签运营骨架 |
| 菜篮子/采购 | 已完成 | `/purchase` | 菜篮子、采购清单、采购历史、家庭采购骨架 |
| 价格管理 | 已完成 | `/prices` | 价格总览、历史价格、趋势、导入、来源配置骨架 |
| 家庭管理 | 已完成 | `/families` | 家庭、成员、邀请、菜篮子、采购记录骨架 |
| 用户管理 | 已完成 | `/users` | 复用真实接口 CRUD 页面 |
| 用户行为 | 已完成 | `/users/behavior` | 用户行为分析骨架 |
| 用户收藏 | 已完成 | `/users/favorites` | 多类型收藏分析骨架 |
| 最近浏览 | 已完成 | `/users/recent-views` | 最近浏览分析骨架 |
| 用户投稿 | 已完成 | `/users/submissions` | 投稿菜谱审核入口骨架 |
| 审核中心 | 已完成 | `/audits` | 菜谱投稿、评论、举报、审核记录骨架 |
| 评论管理 | 已完成 | `/comments` | 复用真实接口 CRUD 页面 |
| AI 配置 | 已完成 | `/ai` | 今日吃什么、Prompt、推荐规则、偏好、忌口、生成记录骨架 |
| 搜索运营 | 已完成 | `/search-ops` | 热门搜索、关键词分析、无结果配置骨架 |
| 数据报表 | 已完成 | `/reports` | 内容、用户、收藏、浏览、搜索、价格、采购报表骨架 |
| 文件管理 | 已完成 | `/files` | 图片库、OSS、上传记录、文件分类骨架 |
| 资源接口 | 已完成 | `/resources` | 内容与价格资源接口骨架 |
| 系统设置 | 已完成 | `/settings` | 管理员、角色权限、日志、上传规则骨架 |

### 2026-05-25 导航 children 修复记录

| 项目 | 状态 | 备注 |
|---|---|---|
| navigation.ts children 树 | 已完成 | 按兜底 Figma/PRD 菜单树补齐全部二级菜单 |
| Sidebar 父级展开/收起 | 已完成 | 有 children 的一级菜单点击只展开/收起 |
| Sidebar 二级跳转 | 已完成 | 二级菜单点击跳转真实路由 |
| 刷新后父级自动展开 | 已完成 | 根据当前 pathname 自动展开命中的父级 |
| 当前子菜单高亮 | 已完成 | 根据最长路由匹配高亮二级菜单 |
| 顶部 breadcrumb | 已完成 | 显示 `家里有菜 Admin / 父级 / 子级` |
| 新增/编辑/详情不进左侧 | 已完成 | 仍由列表按钮进入 |
| 二级菜单路由骨架 | 已完成 | 所有兜底菜单子级均有路由，不 404 |

### 2026-05-25：Admin P0 核心页面真实化

| 页面/模块 | 状态 | 路由 | 备注 |
|---|---|---|---|
| 通用后台组件 | 已完成 | 全后台复用 | `PageHeader`、`FilterPanel`、`DataTable`、`StatusTag`、`ConfirmModal`、`EmptyState` |
| mock API 统一结构 | 已完成 | 本地 mock | 返回 `{ code, message, data: { list, pagination } }` |
| 工作台 | 已完成 | `/dashboard` | 删除阶段性骨架描述，保留数据概览、待办、热门内容 |
| 首页运营 | 已完成 | `/home-ops` | Banner 卡片、推荐位卡片、今日推荐、时令食材、Banner 列表、推荐位列表 |
| 菜谱管理 | 已完成 | `/content/recipes` | 补齐封面、分类、标签、难度、时间、状态、审核、推荐、更新时间、操作列 |
| 菜谱筛选参数 | 已完成 | `/content/recipes` | 默认“全部”不传中文值；发布/推荐筛选只传 boolean 或 undefined |
| 菜谱二次确认 | 已完成 | `/content/recipes` | 删除确认、上架/下架确认 |
| 食材管理 | 已完成 | `/content/ingredients` | 补齐图片、别名、类型、时令月份、关联菜谱数、状态、推荐、更新时间、操作列 |
| 食材筛选 | 已完成 | `/content/ingredients` | 食材名称、类型、时令月份、状态、推荐状态 |
| 菜谱/食材参数错误修复 | 已完成 | `/content/recipes` `/content/ingredients` | 分类请求 `pageSize` 不超过 100；查询参数自动清理 `all/empty/空值` |
| 分类管理 | 已完成 | `/taxonomies/categories` | 分类列表、新增、编辑、启用/禁用、删除确认 |
| 标签管理 | 已完成 | `/taxonomies/tags` | 标签列表、新增、编辑、分组筛选、启用/禁用、删除确认 |
| 菜系管理 | 已完成 | `/taxonomies/cuisines` | 继续使用真实接口 CRUD 页面 |
| 用户列表 | 已完成 | `/users` | 继续使用真实接口 CRUD 页面，标题对齐为“用户列表” |
| 审核中心 | 已完成 | `/audits/pending` | 待审核列表、类型筛选、状态筛选、查看、通过、驳回 |
| 审核记录 | 已完成 | `/audits/records` | 共用审核中心页面，保留审核记录入口 |
| 评论列表 | 已完成 | `/comments` | 继续使用真实接口 CRUD 页面，标题对齐为“评论列表” |
| 文件列表 | 已完成 | `/files/list` | 图片库/OSS 文件列表、上传入口、预览、复制地址、删除确认 |
| 管理员管理 | 已完成 | `/settings/admins` | 管理员列表、新增、编辑、启用/禁用、删除确认 |
| 角色权限 | 已完成 | `/settings/roles` | 角色列表、新增、编辑、权限树占位、删除确认 |

### 2026-05-26：Admin 图片上传交互修复

| 页面/模块 | 状态 | 路由 | 备注 |
|---|---|---|---|
| 后端图片上传接口 | 已完成 | `POST /api/admin/upload/image` | `multipart/form-data` 字段 `file`，保存到 `server/uploads`，返回 `/uploads/xxx.ext` |
| 静态图片访问 | 已完成 | `/uploads/xxx.ext` | Express 已挂载 `/uploads` 静态资源目录 |
| 通用封面上传组件 | 已完成 | 全后台复用 | 支持上传、预览、重新上传、删除、只读预览、格式校验、5MB 大小校验 |
| 通用图片展示组件 | 已完成 | 全后台复用 | `ImagePreview` 支持空状态和图片加载失败提示 |
| Banner 管理 | 已完成 | `/home-ops/banners` | Banner 图片改为上传组件，列表展示上传图，保存字段使用当前后端 `image` |
| 首页运营 Banner 列表 | 已完成 | `/home-ops` | Banner 列表增加图片预览列 |
| 文件管理 | 已完成 | `/files/list` | 上传图片接真实接口，返回 URL 写入文件列表并展示预览 |
| 食材新增/编辑 | 已完成 | `/content/ingredients/new` `/content/ingredients/:id/edit` | 封面 URL 输入框改为封面图片上传，编辑页回显已有封面，保存成功返回列表 |
| 食材列表 Drawer | 已完成 | `/content/ingredients` | 新增/编辑抽屉封面同步改为上传组件，列表图片用统一预览组件展示 |
| 食材保存校验 | 已完成 | `/content/ingredients` | 名称、分类、时令月份、当前价格、排序校验已补齐 |
| 菜谱新增/编辑 | 已完成 | `/content/recipes/new` `/content/recipes/:id/edit` | 封面 URL 输入框改为封面图片上传，编辑页回显已有封面，支持保存草稿/提交审核 |
| 菜谱列表 Drawer | 已完成 | `/content/recipes` | 新增/编辑抽屉封面同步改为上传组件，列表封面用统一预览组件展示 |
| 菜谱保存校验 | 已完成 | `/content/recipes` | 标题、分类、难度、制作时间、排序校验已补齐 |
| 推荐/菜系/菜单/时令/用户头像 | 已完成 | 对应资源路由 | 通用资源页图片字段已改为上传组件并补齐列表预览 |
| 图片上传 mock | 已完成 | 本地 mock | `mockUploadImage` 保留兜底，返回 `{ code, message, data: { url } }` |
| 手填图片链接排查 | 已完成 | Admin 源码 | 已排查“图片 URL / 封面 URL / 图片链接 / imageUrl / coverUrl / iconUrl”等关键词，未发现剩余图片链接输入文案 |

## 第三阶段：数据库和接口

| 任务 | 状态 | 备注 |
|---|---|---|
| 补齐 Prisma 模型 | 已完成 | users、recommendations、banners、favorites 等 |
| 生成 migration | 已完成 | `20260524142712_add_content_models` |
| 更新 seed | 已完成 | 已写入用户、推荐、Banner、菜单、评论、收藏联调数据 |
| 补齐 B 端接口 | 已完成 | 推荐、Banner、用户、晒菜、评论、菜系、时令、菜单 |
| 补齐 C 端接口 | 已完成 | mobile 首页、登录、搜索、推荐、收藏、profile；recipes/ingredients 复用现有路由 |

## 后续阶段

- B 端后台页面：接口联调中，新增同构 CRUD 页面已接入真实接口。
- C 端用户页面：接口联调中，首页已切换到 `/api/mobile/home`。
- B 到 C 联调：部分完成，seed 数据已能通过 C 端 mobile 接口读取。
- 测试与上线检查：未开始。

## 第四阶段：B 端后台

| 任务 | 状态 | 备注 |
|---|---|---|
| 推荐管理接入真实接口 | 已完成 | 列表、新增、编辑、删除 |
| Banner 管理接入真实接口 | 已完成 | 列表、新增、编辑、删除 |
| 时令食材管理接入真实接口 | 已完成 | 列表、新增、编辑、删除 |
| 菜系管理接入真实接口 | 已完成 | 列表、新增、编辑、删除 |
| 场景菜单管理接入真实接口 | 已完成 | 列表、新增、编辑、删除，菜单菜谱关系后续增强 |
| 用户管理接入真实接口 | 已完成 | 列表、新增、编辑、删除 |
| 晒菜内容管理接入真实接口 | 已完成 | 列表、新增、编辑、删除 |
| 评论管理接入真实接口 | 已完成 | 列表、新增、编辑、删除 |
| Figma 视觉 1:1 修正 | 未开始 | 需要继续按 Figma 节点细化 |

## 第五阶段：C 端用户端

| 任务 | 状态 | 备注 |
|---|---|---|
| 首页接入 mobile 首页接口 | 已完成 | `/api/mobile/home` |
| 菜谱列表/详情接入真实接口 | 已完成 | 复用 `/api/recipes` 与 `/api/mobile/recipes` |
| 食材列表/详情接入真实接口 | 已完成 | 复用 `/api/ingredients` 与 `/api/mobile/ingredients` |
| 搜索页接入真实接口 | 未开始 | 接口已完成，页面待接入 |
| 推荐页接入真实接口 | 未开始 | 接口已完成，页面待接入 |
| 收藏页接入真实接口 | 未开始 | 接口已完成，页面待接入 |

## 当前验证记录

| 命令 | 子项目 | 结果 | 备注 |
|---|---|---|---|
| npm run build | admin-frontend | 通过 | React/Vite 后台骨架可构建 |
| npm run type-check | frontend | 通过 | uni-app/Vue 类型检查通过 |
| npm run build | frontend | 通过 | app-plus 构建通过 |
| npm run build | server | 通过 | TypeScript 后端可构建 |
| DATABASE_URL=... npm run prisma:deploy | server | 通过 | 内容模型 migration 已应用 |
| DATABASE_URL=... npm run prisma:seed | server | 通过 | 联调 seed 数据已初始化 |
| curl /api/mobile/home | server | 通过 | 返回 Banner、推荐、时令、分类、菜单 |
| curl /api/mobile/search?q=番茄 | server | 通过 | 返回菜谱与食材 |
| curl /api/admin/recommendations | server | 通过 | 使用 admin token 返回推荐列表 |
| npm run build | admin-frontend | 通过 | 新增资源管理页可构建 |
| npm run type-check | frontend | 通过 | C 端首页接口切换后类型检查通过 |
| npm run build | frontend | 通过 | C 端首页接口切换后 app-plus 构建通过 |
| npx tsc -b --noEmit | admin-frontend | 通过 | Admin 第一阶段路由与页面骨架类型检查通过 |
| npm run build | admin-frontend | 通过 | Admin 第一阶段路由、布局、菜谱/食材 CRUD 页面构建通过 |
| npx tsc -b --noEmit | admin-frontend | 通过 | P0 核心页面真实化后类型检查通过 |
| npm run build | admin-frontend | 通过 | P0 核心页面真实化后 Vite 构建通过 |
| npx tsc -b --noEmit | admin-frontend | 通过 | 菜谱/食材参数错误修复后类型检查通过 |
| npm run build | admin-frontend | 通过 | 菜谱/食材参数错误修复后 Vite 构建通过 |
| npm run lint | admin-frontend | 未执行 | `package.json` 未定义 lint 脚本 |
| npx tsc -b --noEmit | admin-frontend | 通过 | 图片上传、展示、Banner/菜谱/食材闭环修复后类型检查通过 |
| npm run build | admin-frontend | 通过 | 图片上传、展示、Banner/菜谱/食材闭环修复后 Vite 构建通过 |
| npm run build | server | 通过 | 新增真实图片上传接口和 `/uploads` 静态资源后构建通过 |
