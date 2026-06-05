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
| 用户行为 | 已隐藏 | `/users/behavior` | 按当前原型从左侧菜单移除，路由文件保留 |
| 用户收藏 | 已隐藏 | `/users/favorites` | 按当前原型从左侧菜单移除，路由文件保留 |
| 最近浏览 | 已隐藏 | `/users/recent-views` | 按当前原型从左侧菜单移除，路由文件保留 |
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

### 2026-05-26：P0 Admin 到 C 端联调闭环

| 页面/模块 | 状态 | 路由/接口 | 备注 |
|---|---|---|---|
| Git 同步检查 | 已完成 | `git status` / `git pull origin main` | 开发前确认 `main` 已最新且无冲突 |
| 后端菜谱保存 | 已完成 | `POST /api/admin/recipes` `PUT /api/admin/recipes/:id` | 真实写入 `recipes`、`recipe_steps`、`recipe_ingredients` |
| 菜谱提交审核 | 已完成 | `PATCH /api/admin/recipes/:id/submit-audit` | 流转为 `PENDING + isDraft=false + isPublish=false` |
| 菜谱审核通过/驳回 | 已完成 | `PATCH /api/admin/recipes/:id/audit` | 通过为 `APPROVED`；驳回必须传原因并回到草稿、下架 |
| 菜谱发布/下架 | 已完成 | `PATCH /api/admin/recipes/:id/publish` `/offline` | 发布前校验 `auditStatus=APPROVED` 且 `status=ACTIVE` |
| 图片/视频上传 | 已完成 | `/api/admin/upload/image` `/video` `/media` | 图片 5MB；视频 50MB；统一保存到 `server/uploads` 并通过 `/uploads` 访问 |
| 数据库字段 | 已完成 | Prisma migration | `images/video/visibility`、步骤视频/时长、食材行单位/类型/备注、食材多图/挑选媒体 |
| Admin 媒体上传组件 | 已完成 | `MediaUploader` | 单图、多图、视频、混合媒体、预览、删除、排序、设置主图 |
| 菜谱新增/编辑页 | 已完成 | `/content/recipes/create` `/content/recipes/:id/edit` | 审核状态只读；食材行结构化；步骤卡片化；支持成品图、视频、步骤图/视频 |
| 食材新增/编辑页 | 已完成 | `/content/ingredients/create` `/content/ingredients/:id/edit` | 月份多选、单位下拉、详情多图、挑选指南图片/视频 |
| C 端公开菜谱过滤 | 已完成 | `/api/recipes` `/api/recipes/:id` | 只返回 `deletedAt=null + status=ACTIVE + isPublish=true + auditStatus=APPROVED` |
| C 端首页过滤 | 已完成 | `/api/home` `/api/mobile/home` | 首页推荐、菜单关联菜谱同步过滤审核通过且发布内容 |
| C 端资源路径 | 已完成 | `frontend/src/services/public-api.ts` | `/uploads/xxx` 统一解析为后端源地址 |
| 首页栏目来源 | 已完成 | `/api/mobile/home` | C 端顶部栏目从接口分类生成，组件支持后台配置数据传入 |
| 核心 mock 替换 | 部分完成 | Admin/C 端主链路 | 菜谱/食材/上传/发布/C端读取走真实接口；非核心占位页仍保留 mock |
| C 端菜谱列表路由 | 已完成 | `/pages/recipes/index` | 独立菜谱页保留为内部页面；当前入口回到“食材”页顶部 Tab |
| C 端底部导航恢复 | 已完成 | 全 C 端底部导航 | 底部导航恢复为首页/食材/菜篮子/我的 4 项，菜谱不再作为独立底部 Tab |
| 首页全部菜谱入口移除 | 已完成 | `/pages/index/index` | 已移除首页独立“全部菜谱”入口卡，首页菜谱区“更多菜谱”跳转食材页菜谱 Tab |
| 菜谱列表真实数据 | 已完成 | `GET /api/recipes` | 移除静态 mock fallback，默认“全部”不过滤，接口有数据就展示接口数据 |
| 菜谱列表调试日志 | 已完成 | `/pages/recipes/index` | Console 输出 mounted、request、raw response、final recipes、selectedCategory、filteredRecipes |
| 食材页菜谱 Tab 真实化 | 已完成 | `/pages/ingredients/index?tab=recipes` | 菜谱回到食材页顶部 Tab，列表调用真实 `/api/recipes`，不恢复静态 mock 菜谱 |
| 菜谱页 H5 直达加载 | 已完成 | `/pages/recipes/index` | 修复 H5 直接打开路由时只 mounted 不请求列表的问题，首次进入也会请求 `/api/recipes` |

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
| npm run type-check | frontend | 通过 | C 端底部菜谱 Tab 与食材页 mock 菜谱移除后类型检查通过 |
| npm run build | frontend | 通过 | C 端底部菜谱 Tab 与食材页 mock 菜谱移除后 app-plus 构建通过 |
| npm run type-check | frontend | 通过 | 菜谱页 H5 直达加载修复后类型检查通过 |
| npm run build | frontend | 通过 | 菜谱页 H5 直达加载修复后 app-plus 构建通过 |
| npm run type-check | frontend | 通过 | 首页独立“全部菜谱”入口卡移除后类型检查通过 |
| npm run build | frontend | 通过 | 首页独立“全部菜谱”入口卡移除后 app-plus 构建通过 |
| npm run type-check | frontend | 通过 | 菜谱回到食材页顶部 Tab 后类型检查通过 |
| npm run build | frontend | 通过 | 菜谱回到食材页顶部 Tab 后 app-plus 构建通过 |
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

## Admin 内容管理整合补充

| 任务 | 状态 | 页面 / 路由 | 备注 |
|---|---|---|---|
| 统一内容列表 | 已完成 | `/content/items` | 整合菜谱、蔬菜、水果、生禽、水产、调料，顶部 Tab 切换 |
| 内容管理左侧目录调整 | 已完成 | `admin-frontend/src/app/navigation.ts` | 左侧保留内容概览、内容列表、图集管理；详情/新增/编辑不进左侧菜单 |
| 内容列表真实接口 | 已完成 | `/content/items` | 复用 `GET /api/admin/recipes` 与 `GET /api/admin/ingredients` |
| 内容列表操作列 | 已完成 | `/content/items` | 查看、编辑、上架/下架按内容类型跳转到对应菜谱/食材页面 |
| Admin 内容列表构建验证 | 已完成 | `admin-frontend` | `npx tsc -b --noEmit` 与 `npm run build` 均通过 |
| 内容列表统一新增入口 | 已完成 | `/content/items` | 单个「新增」按钮打开类型选择弹窗，确认后跳转对应新增页 |
| 食材新增类型预选 | 已完成 | `/content/ingredients/create?type=...` | 蔬菜、水果、生禽、水产、调料自动预选对应食材分类 |
| 内容列表统一新增入口构建验证 | 已完成 | `admin-frontend` | `npx tsc -b --noEmit` 与 `npm run build` 均通过 |
| 列表标题进入详情 | 已完成 | 内容列表、菜谱列表、食材列表、审核中心 | 移除操作列「查看」，标题/名称点击进入详情 |
| 内容推荐操作 | 已完成 | `/content/items` | 推荐表示进入首页/推荐位优先展示，操作列支持推荐/取消推荐 |
| 食材类新增页字段差异化 | 已完成 | `/content/ingredients/create?type=...` | 蔬菜、水果、生禽、水产、调料按类型切换表单标题和字段文案 |
| 新增编辑返回统一列表 | 已完成 | 菜谱/食材新增编辑页 | 保存后返回 `/content/items` |
| 内容列表交互修复构建验证 | 已完成 | `admin-frontend` | `npx tsc -b --noEmit` 与 `npm run build` 均通过 |
| 食材类新增分类过滤 | 已完成 | `/content/ingredients/create?type=...` | 按蔬菜/水果/生禽/水产/调料过滤分类，不再展示全部分类 |
| 分类控件遮挡修复 | 已完成 | 食材类新增页 | 原生 select 改为分类按钮组，避免下拉遮挡字段名 |
| 食材类新增分类修复构建验证 | 已完成 | `admin-frontend` | `npx tsc -b --noEmit` 与 `npm run build` 均通过 |

## 统一 ID 与酒水饮品模块

| 任务 | 状态 | 页面 / 接口 | 备注 |
|---|---|---|---|
| 统一业务 ID 字段 | 已完成 | Prisma schema / migration | 核心内容表新增 `biz_id`、`code`、`sort_order`、`is_deleted`；API 对外返回业务 `id` |
| 展示编号 code | 已完成 | 后端序列生成 | 菜谱 `CP`、分类 `FL`、食材 `SC`、酒水饮品 `JS` 等前缀已接入 |
| 外部导入去重字段 | 已完成 | `recipes` | 新增 `source_type_external`、`source_name`、`source_recipe_id`、`source_url` 与唯一约束 |
| 分类 seed 补齐 | 已完成 | `server/prisma/seed.ts` | 已补齐菜谱分类、食材分类和酒水饮品分类 |
| 常用食材 seed | 已完成 | `server/prisma/seed.ts` | 已补齐白菜、土豆、黄瓜、青椒等常用食材 |
| 酒水饮品数据模型 | 已完成 | `beverages` / `recipe_beverages` | 支持酒精字段、状态、排序、软删除和菜谱搭配原因 |
| 酒水饮品 Admin 接口 | 已完成 | `/api/admin/beverages` | 列表、新增、详情、编辑、删除、启用、禁用、排序 |
| 菜谱搭配饮品接口 | 已完成 | `/api/admin/recipes/:id/beverages` | 查询、新增、删除菜谱关联酒水饮品 |
| 酒水饮品管理页面 | 已完成 | `/content/beverages` | 列表、名称进入编辑、启用/禁用、删除、图片展示 |
| 酒水饮品新增编辑页 | 已完成 | `/content/beverages/create` `/content/beverages/:id/edit` | 分类、饮品类型、酒精信息、封面图、说明、推荐状态 |
| 内容列表酒水饮品 Tab | 已完成 | `/content/items` | 统一内容列表新增酒水饮品类型和新增入口 |
| C 端推荐搭配饮品 | 已完成 | `/pages/recipe-detail/index` | 菜谱详情展示后端返回的推荐搭配饮品 |
| 数据库 migration 应用 | 已完成 | `npm run prisma:deploy` | `20260527093000_add_business_ids_beverages` 已应用 |
| Seed 执行 | 已完成 | `npm run prisma:seed` | 已生成无酒精饮品和番茄牛腩搭配饮品 |
| 构建验证 | 已完成 | server / admin-frontend / frontend | server build、Admin typecheck/build、C端 type-check/build 均通过 |

## Admin 首页运营目录调整

| 任务 | 状态 | 页面 / 路由 | 备注 |
|---|---|---|---|
| 首页运营子菜单精简 | 已完成 | `admin-frontend/src/app/navigation.ts` | 子菜单调整为顶部导航管理、首页轮播管理、模块管理 |
| 页面内容保持不变 | 已完成 | `/home-ops` `/home-ops/banners` `/home-ops/recommend-slots` | 仅改目录展示，不改页面内容 |

## 顶部导航管理

| 任务 | 状态 | 页面 / 接口 | 备注 |
|---|---|---|---|
| 顶部导航数据模型 | 已完成 | `home_top_navs` / `home_top_nav_relations` / `home_top_nav_styles` / `home_top_nav_content_rules` | migration `20260601090000_add_home_top_navs` 已补齐 |
| 顶部导航业务 ID | 已完成 | `server/src/lib/business-id.ts` | 使用 `top_nav_xxx` 与展示编号 `DH000001` |
| Admin 顶部导航接口 | 已完成 | `/api/admin/home/top-navs` | 统计、列表、详情、新增、编辑、删除、上线/下线、默认、排序 |
| Admin 内容选择器接口 | 已完成 | `/api/admin/content-selector` | 支持分类、标签、推荐池、专题选择 |
| 顶部导航管理页 | 已完成 | `/home-ops` | 列表、统计、排序、默认、上线/下线、删除、首页预览 |
| 新增/编辑导航页 | 已完成 | `/home-ops/top-nav/new` `/home-ops/top-nav/:id/edit` | 基础信息、关联内容、规则、样式与移动端预览 |
| C 端顶部导航列表接口 | 已完成 | `/api/app/home/top-navs` | 返回已上线顶部导航，按排序展示 |
| C 端顶部导航内容接口 | 已完成 | `/api/app/home/top-navs/:id/contents` | 按导航关联分类/推荐规则返回公开已发布菜谱内容 |
| C 端首页读取顶部导航 | 已完成 | `frontend/src/pages/index/index.vue` | 首页顶部 Tab 从接口读取，点击非默认导航加载接口内容 |
| 默认导航 seed | 已完成 | `server/prisma/seed.ts` | 默认写入推荐、家常菜、快手菜 |
| 顶部导航验证 | 已完成 | server / admin-frontend / frontend | server build、Admin typecheck/build、C端 type-check/build 均通过 |
| 顶部导航错误提示修复 | 已完成 | `admin-frontend/src/app/api.ts` | 非 JSON 响应不再显示 `Unexpected token '<'`，提示后端接口未返回 JSON |
| 顶部导航管理视觉对齐 | 已完成 | `/home-ops` | 按原型补齐数据卡、列表、配置区、右侧 App 预览布局 |
| 顶部导航新增编辑视觉对齐 | 已完成 | `/home-ops/top-nav/new` `/home-ops/top-nav/:id/edit` | 按原型补齐基础信息、关联内容、样式设置、右侧移动端预览 |
| 顶部导航页面修复验证 | 已完成 | `admin-frontend` | `npx tsc -b --noEmit` 与 `npm run build` 均通过 |
| 顶部导航管理最新原型对齐 | 已完成 | `/home-ops` | 按最新原型改为统计卡、搜索筛选、全宽列表、分页，不再在列表页展示右侧预览和配置区 |
| 顶部导航管理最新验证 | 已完成 | `admin-frontend` | `npx tsc -b --noEmit` 与 `npm run build` 均通过 |
| 新增导航页最新原型对齐 | 已完成 | `/home-ops/top-nav/new` `/home-ops/top-nav/:id/edit` | 按最新原型重排基础信息、关联内容配置和右侧移动端首页预览 |
| 新增导航页最新验证 | 已完成 | `admin-frontend` | `npx tsc -b --noEmit` 与 `npm run build` 均通过 |
| 首页管理菜单调整 | 已完成 | `admin-frontend/src/app/navigation.ts` | 「首页运营」改为「首页管理」，子菜单仅保留顶部导航管理和模块管理 |
| 顶部导航内容配置跳转 | 已完成 | `/home-ops/top-nav/:id/content` | 列表「配置内容」跳转内容配置页 |
| 顶部导航状态文案 | 已完成 | `/home-ops` `/home-ops/top-nav/:id/content` | 上线/下线改为启用/停用，启用状态隐藏删除按钮 |
| 顶部导航内容配置页 | 已完成 | `/home-ops/top-nav/:id/content` | 按原型补齐轮播图设置、内容模块管理、模块配置和右侧首页预览 |
| 顶部导航内容配置验证 | 已完成 | `admin-frontend` | `npx tsc -b --noEmit` 与 `npm run build` 均通过 |
| 顶部导航内容配置标题修正 | 已完成 | `/home-ops/top-nav/:id/content` | 移除 A/B/C 分区编号 |
| 顶部导航内容配置操作按钮 | 已完成 | `/home-ops/top-nav/:id/content` | 编辑、配置内容、预览、启用、停用、删除均有交互反馈 |
| 顶部导航内容配置拖拽排序 | 已完成 | `/home-ops/top-nav/:id/content` | 轮播图和内容模块支持拖拽图标排序并更新排序值 |
| 顶部导航内容配置交互验证 | 已完成 | `admin-frontend` | `npx tsc -b --noEmit` 与 `npm run build` 均通过 |
| 顶部导航新增轮播图入口 | 已完成 | `/home-ops/top-nav/:id/content` | 「新增轮播图」跳转独立新增页 |
| 顶部导航新增轮播图页 | 已完成 | `/home-ops/top-nav/:id/content/carousels/new` | 仅保留基础信息、图片与跳转、右侧预览；移除「3 展示预览」 |
| 顶部导航新增轮播图验证 | 已完成 | `admin-frontend` | 浏览器点击验证通过，`npx tsc -b --noEmit` 与 `npm run build` 均通过 |
| 顶部导航轮播图编辑跳转 | 已完成 | `/home-ops/top-nav/:id/content/carousels/:carouselId/edit` | 列表「编辑」进入轮播图编辑页 |
| 顶部导航轮播图编辑验证 | 已完成 | `admin-frontend` | 浏览器点击验证通过，`npx tsc -b --noEmit` 与 `npm run build` 均通过 |
| 顶部导航新增模块入口 | 已完成 | `/home-ops/top-nav/:id/content` | 「新增模块」跳转独立新增模块页 |
| 顶部导航新增模块页 | 已完成 | `/home-ops/top-nav/:id/content/modules/new` | 按原型补齐基础信息、内容配置、展示配置和右侧效果预览 |
| 顶部导航详情页 | 已完成 | `/home-ops/top-nav/:id` | 导航名称点击进入详情页，展示基础信息、关联内容和内容规则 |
| 顶部导航标题点击行为 | 已完成 | `/home-ops` | 列表标题/名称改为真实链接，`href` 指向详情页，不再跳转编辑页 |
| 顶部导航详情验证 | 已完成 | `admin-frontend` | 详情路由和标题链接 href 已验证，`npx tsc -b --noEmit` 与 `npm run build` 均通过 |
| 管理端框架布局视觉调整 | 已完成 | `/home-ops` / Admin Layout | 按参考图仅调整左侧品牌与底部装饰、顶栏面包屑搜索管理员区、页面标题和操作按钮区 |
| 管理端框架布局验证 | 已完成 | `admin-frontend` | 浏览器访问 `/home-ops` 验证布局无重叠，`npm run build` 通过 |

## Admin 内容管理拆分

| 任务 | 状态 | 页面 / 路由 | 备注 |
|---|---|---|---|
| 内容管理菜单拆分 | 已完成 | `admin-frontend/src/app/navigation.ts` | 子菜单改为菜谱管理、食材管理、水果管理、调料管理、酒水管理 |
| 旧内容列表隐藏 | 已完成 | `/content` `/content/items` | 统一重定向到 `/content/recipes`，不再作为左侧入口 |
| 水果管理路由 | 已完成 | `/content/fruits` | 复用食材列表并按水果分类过滤 |
| 调料管理路由 | 已完成 | `/content/seasonings` | 复用食材列表并按调料分类过滤 |
| 酒水管理文案 | 已完成 | `/content/beverages` | 页面标题、按钮和空状态统一为酒水管理/新增酒水 |
| 表单返回路径 | 已完成 | 菜谱/食材类新增编辑页 | 菜谱回菜谱管理，水果回水果管理，调料回调料管理，其他食材回食材管理 |
| 内容管理拆分验证 | 已完成 | `admin-frontend` | 浏览器路由验证通过，`npx tsc -b --noEmit` 与 `npm run build` 均通过 |

## Admin 内容管理列表列结构修正

| 任务 | 状态 | 页面 / 路由 | 备注 |
|---|---|---|---|
| 菜谱列表列结构 | 已完成 | `/content/recipes` | 隐藏系统 ID，按截图改为菜谱、分类、主要食材、难度、状态、浏览量、收藏量、更新时间、操作 |
| 食材列表列结构 | 已完成 | `/content/ingredients` | 隐藏系统 ID，增加月份列，文字横排不换行 |
| 水果列表列结构 | 已完成 | `/content/fruits` | 隐藏系统 ID，增加月份列，文字横排不换行 |
| 调料列表列结构 | 已完成 | `/content/seasonings` | 隐藏系统 ID，按调料截图保留分类、别名、状态、排序、创建时间 |
| 酒水列表列结构 | 已完成 | `/content/beverages` | 隐藏编号，按酒水截图保留分类、别名、状态、排序、创建时间 |
| 登录连通性 | 已完成 | `/login` `/api/admin/auth/login` | 后端 3002 服务已启动，登录接口返回 token |
| 列表列结构验证 | 已完成 | `admin-frontend` | `npx tsc -b --noEmit` 与 `npm run build` 均通过 |

## Admin 登录昵称兼容

| 任务 | 状态 | 页面 / 接口 | 备注 |
|---|---|---|---|
| 登录账号兼容 | 已完成 | `/api/admin/auth/login` | 支持使用用户名 `admin` 或昵称 `管理员` 登录 |
| 登录接口验证 | 已完成 | `server` | `admin/admin123` 与 `管理员/admin123` 均返回 token |
| 后端构建验证 | 已完成 | `server` | `npm run build` 通过 |

## Admin 登录 CORS 修复

| 任务 | 状态 | 页面 / 接口 | 备注 |
|---|---|---|---|
| CORS 白名单解析 | 已完成 | `server/src/config.ts` | `CORS_ORIGIN` 支持逗号分隔并转换为数组 |
| 本地 CORS 容错 | 已完成 | `server/src/app.ts` | 开发环境自动允许 `localhost` / `127.0.0.1` 本地来源，端口可选，减少 `Failed to fetch` |
| CORS 示例文档 | 已完成 | `server/.env.example` / README | 示例改为多 origin，并说明生产环境使用真实管理端域名 |
| 登录预检验证 | 已完成 | `OPTIONS /api/admin/auth/login` | 对 `http://127.0.0.1:5176` 返回合法单一 origin |
| 登录接口验证 | 已完成 | `/api/admin/auth/login` | `admin/admin123` 与 `管理员/admin123` 均返回 token |
| 后端构建验证 | 已完成 | `server` | `npm run build` 通过 |

## Admin 资源管理

| 任务 | 状态 | 页面 / 路由 | 备注 |
|---|---|---|---|
| 资源管理菜单 | 已完成 | `admin-frontend/src/app/navigation.ts` | 新增父级「资源管理」，子级「资源接入中心」「导入记录」 |
| 资源接入中心页面 | 已完成 | `/resource-management/access-center` | 按原型补齐筛选、列表、批量导入、预览、导入、忽略交互 |
| 筛选字段横排 | 已完成 | `/resource-management/access-center` `/resource-management/import-records` | 字段名统一在控件左侧，不再上下排列 |
| 导入记录页面 | 已完成 | `/resource-management/import-records` | 按原型补齐筛选、统计、列表、详情、失败重试、导出和分页 |
| 资源管理验证 | 已完成 | `admin-frontend` | `./node_modules/.bin/tsc -b --noEmit` 与 `npm run build` 均通过 |

## Admin 列表交互统一修复

| 任务 | 状态 | 页面 / 组件 | 备注 |
|---|---|---|---|
| 操作列固定 | 已完成 | `admin-frontend/src/app/components/DataTable.tsx` | 通用列表操作列 sticky right，横向滚动不影响操作按钮 |
| 手写表格操作列固定 | 已完成 | `/home-ops` `/home-ops/top-nav/:id/content` | 顶部导航相关手写表格同步固定操作列 |
| 资源来源 ID 展示 | 已完成 | `/resource-management/access-center` | 资源接入中心列表新增来源ID列 |
| 资源摘要短文本 | 已完成 | `/resource-management/access-center` | 摘要列截断展示，鼠标悬停查看完整内容 |
| 列表操作列固定验证 | 已完成 | `admin-frontend` | `./node_modules/.bin/tsc -b --noEmit` 与 `npm run build` 均通过 |

## 2026-06-02：Admin 家庭管理原型第一批真实化

| 页面/模块 | 状态 | 路由/接口 | 备注 |
|---|---|---|---|
| Admin 路由入口恢复 | 已完成 | `admin-frontend/src/app/App.tsx` | 恢复被删除的后台入口，保留现有新增页面路由，并接入家庭管理三页 |
| 家庭列表页 | 已完成 | `/families/list` | 按原型补齐统计卡、筛选、家庭表格、详情抽屉、创建家庭、启用/禁用操作 |
| 家庭成员页 | 已完成 | `/families/members` | 按原型补齐成员统计、筛选、成员表格、成员详情抽屉、移除成员操作 |
| 邀请记录页 | 已完成 | `/families/invites` | 按原型补齐邀请统计、筛选、邀请表格、生成邀请入口 |
| 左侧导航 | 已完成 | `家庭管理` | 补齐「邀请记录」二级菜单，避免页面存在但无法从菜单进入 |
| Prisma 家庭模型 | 已完成 | `families` / `family_members` / `family_invites` | 新增家庭、家庭成员、邀请记录模型与枚举 |
| 数据库 migration | 已完成 | `20260602142000_add_family_management` | 已应用到本地 PostgreSQL |
| 家庭管理 seed | 已完成 | `server/prisma/seed.ts` | 已写入 5 个家庭、23 个成员、5 条邀请记录 |
| Admin 家庭接口 | 已完成 | `/api/admin/families/*` | 概览、家庭列表/详情、成员列表、邀请列表、创建家庭、生成邀请、成员移除、家庭状态 |
| Admin API 封装 | 已完成 | `admin-frontend/src/app/api.ts` | 新增家庭管理类型与请求方法，页面接真实接口 |
| Admin 构建验证 | 已完成 | `admin-frontend` | `npm run build` 通过 |
| Server 构建验证 | 已完成 | `server` | `npm run build` 通过 |
| Prisma generate | 已完成 | `server` | `npm run prisma:generate` 通过 |
| Prisma deploy | 已完成 | `server` | `DATABASE_URL=... npm run prisma:deploy` 通过 |
| Prisma seed | 已完成 | `server` | `DATABASE_URL=... npm run prisma:seed` 通过 |
| 数据库数据验证 | 已完成 | PostgreSQL | families=5, family_members=23, family_invites=5 |
| HTTP 接口 curl 验证 | 受阻 | `server` | 当前工具会话中更新后的 Node HTTP 服务无法保持监听；旧 3002 进程已清理，记录为验证限制 |

## Admin 家庭管理菜单调整
| 项目 | 状态 | 说明 |
| --- | --- | --- |
| 移除饮食偏好菜单 | 已完成 | 从家庭管理二级菜单删除。 |
| 移除家庭菜单菜单 | 已完成 | 从家庭管理二级菜单删除。 |
| 旧路径兼容 | 已完成 | `/families/preferences`、`/families/menus` 重定向到家庭列表。 |
| 构建验证 | 已完成 | admin-frontend typecheck/build 通过。 |

## Admin 分类标签页面结构调整
| 项目 | 状态 | 说明 |
| --- | --- | --- |
| 分类标签菜单精简 | 已完成 | 左侧仅保留「分类管理」「标签管理」「单位管理」，移除菜系管理、频道管理。 |
| 分类管理 UI 调整 | 已完成 | 改为筛选区、统计卡、表格、固定操作列和新增/编辑抽屉结构。 |
| 标签管理 UI 调整 | 已完成 | 改为筛选区、统计卡、表格、固定操作列和右侧详情面板结构。 |
| 单位管理布局调整 | 已完成 | 调整为标题、筛选、统计、列表、右侧详情分区排列，避免模块拥挤。 |
| 旧路径兼容 | 已完成 | `/taxonomies/cuisines`、`/taxonomies/channels` 重定向到分类管理。 |
| 构建验证 | 已完成 | admin-frontend typecheck/build 通过。 |

## Admin 单位 / 标签详情抽屉化
| 项目 | 状态 | 说明 |
| --- | --- | --- |
| 单位详情 Drawer | 已完成 | 单位管理不再常驻右侧详情面板，点击名称、勾选行或查看按钮打开右侧抽屉。 |
| 标签详情 Drawer | 已完成 | 标签管理不再常驻右侧详情面板，点击名称、勾选行或查看按钮打开右侧抽屉。 |
| 标签编辑联动 | 已完成 | 标签详情内点击编辑会关闭详情抽屉并打开编辑抽屉，避免重叠。 |
| 错误提示优化 | 已完成 | 标签页后端未连接时展示明确服务未连接提示，不再裸显示 Failed to fetch。 |
| 构建验证 | 已完成 | admin-frontend typecheck/build 通过。 |

## Admin 用户列表真实化
| 项目 | 状态 | 说明 |
| --- | --- | --- |
| 用户列表真实页面 | 已完成 | 用户列表替换占位页，补齐筛选、统计、表格、分页、状态和操作列。 |
| 用户详情 Drawer | 已完成 | 点击查看或查看家庭打开右侧抽屉展示基础信息和家庭关系。 |
| 用户状态操作 | 已完成 | 禁用 / 启用通过二次确认调用后端状态接口。 |
| Admin 用户列表接口 | 已完成 | `/api/admin/users` 返回用户编号、注册方式、家庭数、收藏数、浏览数、菜谱数等字段。 |
| Admin 用户状态接口 | 已完成 | `/api/admin/users/:id/status` 支持 `ACTIVE` / `DISABLED`。 |
| 本地接口验证 | 已完成 | `/health`、登录、用户列表 curl 验证成功。 |
| 构建验证 | 已完成 | server build、admin-frontend typecheck/build 通过。 |

## Admin 顶部导航内容配置精简
| 项目 | 状态 | 说明 |
| --- | --- | --- |
| 顶部预览首页按钮删除 | 已完成 | 顶部导航管理页右上角删除「预览首页」按钮。 |
| 移除模块配置表单区 | 已完成 | 删除内容配置页底部「模块配置 - xxx」表单区。 |
| 移除配置内容操作 | 已完成 | 删除内容模块管理表格操作列中的「配置内容」。 |
| 模块编辑跳转 | 已完成 | 内容模块管理表格「编辑」跳转模块编辑页。 |
| 新增模块 / 轮播图保存回显 | 已完成 | 新增模块、新增轮播图保存并启用后写入本地内容配置存储，返回内容配置页后能在对应列表显示；编辑、启停、删除、排序同步写回。 |
| 构建验证 | 已完成 | admin-frontend typecheck/build 通过。 |

## Admin 10 个新增 / 编辑页面续做
| 项目 | 状态 | 说明 |
| --- | --- | --- |
| 原型读取 | 已完成 | 已查看 `docs/prototypes/01` 至 `10`，只提取页面结构、字段分区、按钮和右侧预览/提示，不照搬视觉风格。 |
| 食材新增/编辑页 | 已完成 | 保留当前后台风格，新增/编辑独立页可用，列表新增/编辑统一跳转独立页。 |
| 酒水新增/编辑页 | 已完成 | 独立页已存在，支持取消、上传、保存，编辑页可按 ID 进入并回显真实接口数据。 |
| 调料新增/编辑页 | 进行中 | 独立页已存在，字段区块和按钮可用；详情接口暂缺时通过现有通用资源接口/前端状态兜底。 |
| 水果新增/编辑页 | 进行中 | 独立页已存在，字段区块和按钮可用；详情接口暂缺时通过现有通用资源接口/前端状态兜底。 |
| 菜谱新增/编辑页 | 已完成 | 列表新增/编辑统一跳转独立页；表单包含基础信息、媒体、食材清单、步骤编辑器等大模块。 |
| 菜谱新增页原型布局调整 | 已完成 | 按原型组件位置调整为编号模块、左右主表单、右侧手机预览和发布提示，保留当前后台视觉风格。 |
| 菜谱上传组件原型化 | 已完成 | 「封面与图文素材」模块改为大封面上传框、4 个图集上传框、视频链接输入和上传按钮。 |
| 菜谱步骤配图组件原型化 | 已完成 | 制作步骤中的配图从通用上传卡改为原型小方形加号上传位。 |
| 食材 / 水果 / 调料原型布局 | 已完成 | 食材表单重排为编号模块、封面图集、营养、储存处理、其他信息和右侧预览；水果、调料新增/编辑复用同一原型布局并按类型展示。 |
| 内容管理图片上传统一 | 已完成 | 菜谱、食材/水果/调料共用页、酒水新增/编辑页的封面与图集统一为「图片编辑」组件，封面和图片同尺寸，最多 8 张。 |
| 食材 / 水果挑选指南模块 | 已完成 | 新增食材、新增水果及对应编辑页增加「挑选指南」模块，支持分组、挑选项、小标题、说明、配图上传、删除和新增操作。 |
| 酒水原型布局 | 已完成 | 酒水新增/编辑页重排为基础信息、封面图文素材、规格属性、饮用说明、关联信息和右侧预览。 |
| 分类新增/编辑页 | 已完成 | 新增 `CategoryFormPage` 独立页，列表新增/编辑从抽屉改为独立页跳转并回显。 |
| 标签新增/编辑页 | 已完成 | 新增 `TagFormPage` 独立页，列表新增/编辑从抽屉改为独立页跳转并回显。 |
| 单位新增/编辑页 | 已完成 | 单位列表新增/编辑按钮改为独立页跳转，表单包含基础信息、换算关系和适用规则字段。 |
| API 接口新增/编辑页 | 已完成 | API 表单按基础信息、接口配置、请求参数与说明三块展示，测试连接、保存接口可点击，编辑 mock 回显。 |
| API 接口配置列表页 | 已完成 | 按原型结构补齐筛选、接口表格、调用统计、限制提醒、最近调用日志和新增/编辑/测试/日志操作。 |
| 构建验证 | 已完成 | `admin-frontend npm run build` 通过。 |

## Admin 分类管理子分类展开
| 项目 | 状态 | 说明 |
| --- | --- | --- |
| 一级分类展开入口 | 已完成 | 分类名称前的箭头改为可点击按钮，点击后在当前表格内展开二级分类行。 |
| 子分类展示 | 已完成 | 展开后展示子分类名称、分类类型、上级分类、层级、排序、关联内容数、状态、更新时间和操作。 |
| 家常菜子分类查看 | 已完成 | 「家常菜」可展开显示「下饭菜」「快手菜」「晚餐菜」。 |
| 构建验证 | 已完成 | `admin-frontend npm run build` 通过。 |
