# 进度报告

## 2026-06-02

### Admin 家庭管理原型第一批真实化

- 按三张家庭管理后台原型完成 B 端第一批家庭管理页面：家庭列表、家庭成员、邀请记录。
- 恢复 `admin-frontend/src/app/App.tsx`，避免入口仍引用已删除文件导致后台无法启动；同时保留现有新增页面路由。
- 家庭管理左侧菜单补齐「邀请记录」，三页分别挂载到 `/families/list`、`/families/members`、`/families/invites`。
- 新增 Prisma 枚举和模型：`Family`、`FamilyMember`、`FamilyInvite`，并生成 migration `20260602142000_add_family_management`。
- 新增 Admin 家庭管理接口：概览、家庭列表、家庭详情、成员列表、邀请列表、创建家庭、生成邀请、家庭启用/禁用、移除成员。
- Admin 前端 `api.ts` 新增家庭管理类型与真实接口封装，页面不再使用占位页或 mock 数据。
- `FamiliesPage.tsx` 替换占位页，补齐统计卡、筛选区、列表、分页、家庭详情抽屉、成员详情抽屉和基础操作。
- `server/prisma/seed.ts` 写入家庭管理联调数据：5 个家庭、23 个成员、5 条邀请记录。

### 家庭管理验证记录

- `admin-frontend`: `npm run build` 通过。

### Admin 菜谱新增页原型布局调整

- 菜谱新增/编辑页已按原型图的组件位置重排：顶部操作区、编号模块卡片、左侧基础信息/素材/配料/步骤/关联信息、右侧内容预览和发布提示。
- 组件形态参考原型：编号圆点标题、配料表格式行、步骤行、手机预览卡、刷新预览按钮；颜色和边框仍沿用当前后台风格。
- 「封面与图文素材」模块上传组件已进一步贴近原型：大封面上传框、4 个小图集框、视频链接输入和上传视频按钮，并继续调用现有上传接口。
- 制作步骤中的「配图」已从通用上传卡改为原型小方形加号上传位，删除按钮保持在步骤行右侧。
- `admin-frontend`: `npm run build` 通过。

### Admin 食材 / 水果 / 调料 / 酒水原型布局调整

- 食材新增/编辑页已按原型调整为编号模块、左右主表单、封面与图片、营养成分、储存与处理、其他信息和右侧手机预览。
- 水果、调料新增/编辑页切换到同一套原型式组件布局，并按页面类型展示对应标题、分类和预览标签。
- 酒水新增/编辑页按酒水原型改为基础信息、封面与图文素材、规格与属性、饮用说明/内容详情、关联信息和右侧内容预览。
- 三类上传组件均使用大封面框、4 个小图集框、视频链接输入和上传按钮，继续调用现有上传接口。
- `admin-frontend`: `npm run build` 通过。
- `server`: `npm run prisma:generate` 通过。
- `server`: `npm run build` 通过。
- `server`: `DATABASE_URL=... npm run prisma:deploy` 通过，已应用 `20260602142000_add_family_management`。
- `server`: `DATABASE_URL=... npm run prisma:seed` 通过。
- PostgreSQL 数据验证通过：`families=5`、`family_members=23`、`family_invites=5`。
- HTTP curl 验证受阻：当前工具会话中更新后的 Node HTTP 服务启动后无法保持监听；3002 上旧服务曾返回 `Cannot GET /api/admin/families/overview`，已清理旧进程。接口代码已通过 TypeScript 构建，数据库和 seed 已验证。

## 2026-05-26

### 已完成

- 新增真实后台图片上传接口 `POST /api/admin/upload/image`，使用 `multipart/form-data` 的 `file` 字段上传，限制 jpg/jpeg/png/webp 且单张不超过 5MB。
- 后端新增 `/uploads` 静态资源访问，默认文件保存目录为 `server/uploads`，接口返回 `/uploads/xxx.ext`。
- 新增 Admin 通用图片上传组件 `UploadImage`，支持点击上传、图片预览、重新上传、删除图片、编辑页回显、只读预览、格式校验和 5MB 大小校验。
- 新增 `ImagePreview` 统一图片展示组件，支持相对路径解析、空图提示和“图片加载失败”状态，避免灰色占位无法判断。
- 新增 Admin 上传接口封装 `uploadImage` 和资源地址解析 `resolveAssetUrl`，统一对接 `VITE_API_BASE` 对应后端源。
- Banner 管理图片字段由手填链接改为上传组件，新增/编辑保存 `image` 字段，列表正常展示上传图。
- 首页运营 Banner 列表接入图片预览列；推荐位、菜系、场景菜单、时令食材、用户头像等通用资源页已复用图片上传/展示能力。
- 文件管理页上传入口改为真实上传接口，上传成功后把返回 URL 写入文件列表并通过 `ImagePreview` 展示。
- 食材新增/编辑页封面字段由“封面 URL”输入框改为“封面图片上传”，表单内部保存 `coverUrl` 并写入后端 `cover` 字段。
- 菜谱新增/编辑页封面字段由“封面 URL”输入框改为“封面图片上传”，支持保存草稿和提交审核，表单内部保存 `coverUrl` 并写入后端 `cover` 字段。
- 菜谱/食材列表 Drawer 中的新增/编辑封面字段同步改为上传组件，避免后台仍出现手填图片链接入口。
- 食材保存闭环补充名称、分类、时令月份、当前价格、排序校验；保存成功后返回食材列表。
- 菜谱保存闭环补充标题、分类、难度、制作时间、排序校验；保存成功后返回菜谱列表。
- 已全局排查 Admin 页面中的“图片 URL / 封面 URL / 图片链接 / imageUrl / coverUrl / iconUrl”等手填图片入口，当前后台源码中未再发现图片链接输入文案。
- 保留 `mockUploadImage` 兜底结构，返回格式与真实接口保持 `{ code, message, data: { url } }`。

### 验证记录

- `admin-frontend`: `npx tsc -b --noEmit` 通过。
- `admin-frontend`: `npm run build` 通过。
- `server`: `npm run build` 通过。

### P0 联调闭环增量

- 先执行 `git status --short` 与 `git pull origin main`，确认工作区无冲突且 `main` 已是最新。
- 后端菜谱主链路补齐：`POST/GET/PUT/DELETE /api/admin/recipes` 继续使用真实数据库，新增 `PATCH /api/admin/recipes/:id/submit-audit`、`PATCH /api/admin/recipes/:id/offline`，并收紧 `PATCH /api/admin/recipes/:id/publish` 为“审核通过且启用后才能发布”。
- 后端审核流转补齐：保存草稿为 `DRAFT + isDraft=true + isPublish=false`，提交审核为 `PENDING`，审核通过为 `APPROVED`，审核驳回必须传驳回原因并回到草稿且下架。
- 后端上传能力从单图片扩展为媒体上传：`POST /api/admin/upload/image`、`POST /api/admin/upload/video`、`POST /api/admin/upload/media`，统一返回 `{ url, type, name, size, mimeType }`。
- Prisma 增加菜谱结构化媒体字段：菜谱 `images/video/visibility`，步骤 `video/duration`，食材行 `unit/type/note`，食材 `detailImages/selectionMedia`，并应用 migration `20260526123000_add_recipe_media_structured_fields`。
- Admin 新增通用 `MediaUploader`，支持单图、多图、视频、混合上传、预览、删除、重新上传、主图设置和上移/下移排序。
- Admin 菜谱新增/编辑页重构为结构化表单：审核状态改为只读状态标签；食材清单改为可增删改排序的行列表；步骤改为卡片编辑器并支持步骤图片、步骤视频和计时。
- Admin 食材新增/编辑页补齐月份多选、价格单位下拉、详情图多图上传、挑选指南图片/视频上传。
- C 端 `public-api` 新增 `resolveAssetUrl`，统一把 `/uploads/xxx` 拼接为后端源地址，已覆盖首页推荐、菜谱列表、菜谱详情步骤图、食材列表和食材详情。
- C 端首页顶部栏目不再只用组件内写死数组，`home-header` 支持外部传入栏目；首页从 `/api/mobile/home` 返回的分类生成栏目标题。
- C 端公开菜谱列表、详情、首页推荐、mobile 首页推荐和搜索均增加 `auditStatus=APPROVED` 过滤，草稿、待审核、审核通过未发布、已下架内容不会出现在 C 端。
- 当前仍保留的 mock：非本阶段核心链路页面仍有 `mockApi` 占位；菜谱/食材新增编辑、上传、发布、C 端读取主链路已接真实接口。

### P0 验证记录

- `server`: `DATABASE_URL=... npm run prisma:generate` 通过。
- `server`: `npm run build` 通过。
- `server`: `DATABASE_URL=... npm run prisma:deploy` 通过，已应用 `20260526123000_add_recipe_media_structured_fields`。
- `admin-frontend`: `npx tsc -b --noEmit` 通过。
- `admin-frontend`: `npm run build` 通过。
- `frontend`: `npm run type-check` 通过。
- `frontend`: `npm run build` 通过。
- 本地尝试重启 `server` 进行 curl 全链路验证时，旧端口进程已停止，但当前命令环境中的 `node dist/src/index.js` 打印监听后立即退出；因此本次完成了构建、migration 和接口代码校验，未完成浏览器/接口级完整手工链路验证。

### C 端菜谱入口修复

- 确认 C 端已有独立菜谱列表路由：`/pages/recipes/index`；后续按反馈将主入口回到“食材”页顶部 Tab。
- 首页曾新增明显入口“全部菜谱”，后续按页面反馈已移除；首页菜谱区右侧操作文案保留为“更多菜谱”。
- 菜谱列表页移除接口失败时的静态 mock fallback，默认选中“全部”，`activeCategory=all` 时不做分类过滤，接口返回什么就展示什么。
- 菜谱列表页继续调用 `listRecipes()`，底层请求 `GET /api/recipes`，并展示接口返回的 `cover/title/description/cookTime/difficulty/servings/taste/scene`。
- 菜谱列表页补充空状态“暂无菜谱”和失败态“加载失败：... / 重试”。
- 菜谱列表页增加开发调试日志：`mounted`、`request /api/recipes`、`raw response`、`final recipes`、`selectedCategory`、`filteredRecipes`。
- `/uploads/xxx` 图片路径继续由 `frontend/src/services/public-api.ts` 的 `resolveAssetUrl` 解析为后端源地址。
- 底部导航曾改为 5 项；后续按最新反馈已恢复为首页、食材、菜篮子、我的 4 项。
- 菜谱页已接入底部导航并高亮“菜谱”，进入页面时请求 `listRecipes({ page: 1, pageSize: 10 })`，底层为 `GET /api/recipes`。
- 食材页顶部 Tab 曾移除“菜谱”；后续按最新反馈已恢复“菜谱”Tab，但列表改为真实 `/api/recipes` 数据，不再使用芦笋虾仁、番茄牛腩、菌菇豆腐汤、鸡蛋灌饼等静态 mock。
- 修复 H5 直接打开 `/pages/recipes/index` 时只触发 `mounted`、未执行 `onShow` 请求的问题；菜谱页现在在 `onMounted` 兜底触发首次 `GET /api/recipes`，同时保留 `onShow` 返回刷新。
- 已在 in-app browser 验证 `http://127.0.0.1:5175/#/pages/recipes/index` 展示后端公开接口返回的 `番茄牛腩` 和 `1111111111111`。
- 按页面反馈移除首页独立“全部菜谱 / 查看后台已发布的全部菜谱 / 进入”入口卡；菜谱入口保留在底部 Tab 和首页菜谱区“更多菜谱”。
- 已在 in-app browser 验证首页不再出现“查看后台已发布的全部菜谱”入口文案。
- 按最新反馈将菜谱入口放回食材页顶部 Tab，底部导航恢复为首页、食材、菜篮子、我的 4 项。
- 食材页的“菜谱”Tab 不恢复旧 mock 数据，改为调用真实 `GET /api/recipes`；首页“更多菜谱”、快捷入口和菜篮子空态“浏览菜谱”统一跳转 `/pages/ingredients/index?tab=recipes`。
- 已在 in-app browser 验证 `http://127.0.0.1:5175/#/pages/ingredients/index?tab=recipes` 顶部显示“菜谱”，底部不显示独立“菜谱”Tab，并展示后端公开接口返回的 `番茄牛腩`、`111`、`1111111111111`。

### C 端入口验证记录

- `frontend`: `npm run type-check` 通过。
- `frontend`: `npm run build` 通过。
- `frontend`: C 端底部菜谱 Tab 与食材页 mock 菜谱移除后，`npm run type-check` 通过。
- `frontend`: C 端底部菜谱 Tab 与食材页 mock 菜谱移除后，`npm run build` 通过。
- `frontend`: 菜谱页 H5 直达加载修复后，`npm run type-check` 通过。
- `frontend`: 菜谱页 H5 直达加载修复后，`npm run build` 通过。
- `frontend`: 首页独立“全部菜谱”入口卡移除后，`npm run type-check` 通过。
- `frontend`: 首页独立“全部菜谱”入口卡移除后，`npm run build` 通过。
- `frontend`: 菜谱回到食材页顶部 Tab 后，`npm run type-check` 通过。
- `frontend`: 菜谱回到食材页顶部 Tab 后，`npm run build` 通过。

## 2026-05-25

### 已完成

- 基于 Figma `Chufangapp Admin` / `CMS 原型 · 侘寂交互版` 抽取后台原型结构。
- 识别当前原型统计：242 个 Frame，其中列表 36、表单/配置 78、详情 24、预览 13、状态页 9、弹窗/抽屉 28。
- 生成后台管理系统 PRD / 开发交付文档：`docs/admin-cms-prd-dev-spec.md`。
- 文档覆盖：页面功能、字段、按钮流转、Drawer/Modal 规则、接口路径、数据模型、前端开发要求、后端开发要求、验收标准。
- 启动 Admin 第一阶段代码开发，不再只改 docs。
- 新增统一后台导航模型：`admin-frontend/src/app/navigation.ts`。
- 重做后台布局：固定左侧导航、顶部区域、主内容滚动容器，避免 Figma 固定画布式遮挡。
- 新增权限占位：`permissions.ts` + `RequirePermission`，并接入 403 页面。
- 新增 404 页面，后台未知路由不再重定向到首页。
- 补齐核心菜单路由和页面骨架：工作台、首页运营、内容管理、分类标签、菜篮子/采购、价格管理、家庭管理、用户管理子页、审核中心、AI 配置、搜索运营、数据报表、文件管理、资源接口、系统设置。
- 菜谱管理接入新路由 `/content/recipes`，列表支持搜索、筛选、分页、批量删除、删除确认、发布/下架、推荐/取消推荐、审核状态流转；新增、编辑、详情页可访问并接真实接口。
- 食材管理接入新路由 `/content/ingredients`，列表支持搜索、筛选、分页、批量删除、删除确认、上架/下架、推荐/取消推荐、启用/禁用；新增、编辑、详情页可访问并接真实接口。
- 修复 Admin 左侧导航 children：有子级的一级菜单点击只展开/收起，不直接跳转；无子级的一级菜单点击跳转。
- 左侧菜单已按当前 Figma/PRD 兜底目录补齐二级菜单：首页运营、内容管理、分类标签、菜篮子/采购、价格管理、家庭管理、用户管理、审核中心、评论管理、AI 配置、搜索运营、数据报表、文件管理、资源接口、系统设置。
- 补齐所有二级菜单路由骨架，包含图集管理、标签管理、频道管理、采购规则、单位换算、损耗配置、价格预警、价格来源、饮食偏好、家庭菜单、审核状态、举报处理、模型配置、AI 任务、调用记录、热词管理、无结果词、同义词管理、搜索置顶、报表子页、上传记录、引用关系、API Key、接口权限、操作日志、基础配置等。
- 修复当前路由命中二级菜单时父级自动展开、当前子菜单高亮、右侧箭头展开态显示向下。
- 修复顶部 breadcrumb：按当前导航路径显示 `家里有菜 Admin / 父级 / 子级`。
- 启动 P0 核心页面真实化：新增通用组件 `PageHeader`、`FilterPanel`、`DataTable`、`StatusTag`、`ConfirmModal`、`EmptyState`，非 P0 页面继续使用 `PagePlaceholder`。
- 首页运营从占位页改为运营页面，包含 Banner 管理卡片、推荐位管理卡片、今日推荐、时令食材、Banner 列表、推荐位列表和首页预览入口。
- 菜谱管理补齐交付字段：封面、ID、标题、分类、标签、难度、制作时间、状态、审核状态、推荐状态、更新时间和操作列；默认“全部”筛选不再传中文值给接口。
- 食材管理补齐交付字段：图片、ID、名称、别名、类型、时令月份、关联菜谱数、状态、推荐状态、更新时间和操作列；增加类型、时令月份、状态、推荐筛选。
- 分类标签补齐真实标签管理页：搜索、分组筛选、状态筛选、新增、编辑、启用/禁用、删除确认和分页。
- 审核中心补齐真实审核列表：待审核、已通过、已驳回、审核记录共用页面，支持类型筛选、状态筛选、通过确认和驳回原因弹窗。
- 文件管理补齐图片库/文件列表：搜索、目录筛选、引用状态筛选、上传入口、预览、复制地址、删除确认和分页。
- 系统设置补齐管理员管理和角色权限真实页面：管理员列表、角色列表、权限树占位、启用/禁用、编辑、新增、删除确认。
- 修复菜谱管理/食材管理首次进入出现「参数错误」：根因是页面初始化分类请求使用 `pageSize: 200`，超过后端分类接口最大 100 的校验；已统一改为 100。
- 强化 Admin API 参数清洗：分页参数自动归一化并限制 `pageSize <= 100`，`all`、`empty`、空字符串、`undefined`、`null` 不再拼进查询串。
- 强化本地 `mockApi` 空列表兜底：无数据或非法分页值时返回 `code: 0` 和空列表分页结构，不返回参数错误。

### 当前结论

- 该文档作为 B 端后台从原型进入开发的主交付文档。
- 后续前端和后端实现时，必须以 `docs/admin-cms-prd-dev-spec.md`、`docs/page-manifest.md`、`docs/route-map.md`、`docs/api-spec.md`、`docs/database-schema.md` 为联动依据。
- 当前文档定义了目标接口和数据模型，其中部分接口/表尚未在 `server` 中实现，需要按优先级补齐。
- Admin 第一阶段核心路由和页面骨架已落到代码，左侧菜单点击不会 404。
- P0 页面已从“路由占位”推进到可操作页面；仍使用 mock 的页面已经按统一响应结构预留，后续需要替换为真实后端接口。
- Admin 左侧目录已支持 children 展开/收起与刷新后自动展开；新增/编辑/详情/预览页未放入左侧菜单。
- 本阶段只对 Admin 代码和进度文档做增量修改，未改 C 端和后端。
- `admin-frontend` 当前没有 lint 脚本，已记录为工具链缺口。

### 下一步

1. 按 PRD 的 P0 优先级继续把价格管理、菜篮子/采购、家庭管理接入真实 CRUD 和接口。
2. 按 PRD 的接口清单补齐缺失后端模块，替换 P0 mock 数据。
3. 为 `admin-frontend` 增加统一 lint 脚本和 ESLint 配置。
4. 对菜谱、食材、审核、文件、权限页做浏览器级交互验收。

### 验证记录

- `admin-frontend`: `npx tsc -b --noEmit` 通过。
- `admin-frontend`: `npm run build` 通过。
- `admin-frontend`: `npm run lint` 未执行成功，原因是 `package.json` 未定义 lint 脚本。
- `admin-frontend`: 导航 children 修复后 `npx tsc -b --noEmit` 通过。
- `admin-frontend`: 导航 children 修复后 `npm run build` 通过。
- `admin-frontend`: P0 页面真实化后 `npx tsc -b --noEmit` 通过。
- `admin-frontend`: P0 页面真实化后 `npm run build` 通过。
- `admin-frontend`: 菜谱/食材参数错误修复后 `npx tsc -b --noEmit` 通过。
- `admin-frontend`: 菜谱/食材参数错误修复后 `npm run build` 通过。

## 2026-05-24

### 已完成

- 重新读取根目录 `AGENTS.md`。
- 重新读取 `家庭菜谱App_Codex防漏页执行骨架.md`。
- 确认当前 Git 工作区根目录：`/Users/oooz/Desktop/Z_ou/chufangapp`。
- 识别子项目：
  - `admin-frontend`：B 端后台管理端。
  - `frontend`：C 端用户端 uni-app。
  - `server`：统一后端服务。
  - `admin-backend`：早期 MySQL 后台服务雏形，暂不作为主线。
- 通过 Figma MCP 读取 `node-id=10:2` 的结构化信息。
- 生成第一阶段基础文档：
  - `docs/page-manifest.md`
  - `docs/route-map.md`
  - `docs/module-list.md`
  - `docs/api-spec.md`
  - `docs/database-schema.md`
  - `docs/implementation-checklist.md`
  - `docs/progress-report.md`
  - `docs/blockers.md`
  - `docs/figma-missing-info.md`

### 当前结论

- 已补齐 B 端缺失页面文件和路由骨架。
- 已补齐 C 端缺失核心规划页面文件和 `pages.json` 路由。
- 已补齐 Prisma 内容模型并生成、应用 migration：`20260524142712_add_content_models`。
- 已补齐 B 端推荐、Banner、用户、晒菜、评论、菜系、时令食材、场景菜单管理接口。
- 已补齐 C 端 mobile 命名空间首页、登录、推荐、时令、搜索、收藏、profile 接口，并复用现有菜谱/食材接口。
- 已写入 seed 数据，覆盖 B 端到 C 端联调所需的用户、食材、菜谱、推荐、Banner、菜单、评论、收藏。
- B 端推荐、Banner、时令、菜系、菜单、用户、晒菜、评论页面已从占位页替换为真实接口 CRUD 页面。
- C 端首页已切换到 `/api/mobile/home`，继续沿用原有页面数据结构。
- 当前仍未进入系统性 Figma 视觉 1:1 还原，下一步应继续逐页按 Figma 修正 UI，并把 C 端推荐/搜索/收藏页接入真实接口。
- 验证通过：
  - `admin-frontend`: `npm run build`
  - `frontend`: `npm run type-check`
  - `frontend`: `npm run build`
  - `server`: `npm run build`
  - `server`: `DATABASE_URL=... npm run prisma:deploy`
  - `server`: `DATABASE_URL=... npm run prisma:seed`
  - `server`: `curl /api/mobile/home`
  - `server`: `curl /api/mobile/search?q=番茄`
  - `server`: `curl /api/admin/recommendations`
  - `admin-frontend`: `npm run build`
  - `frontend`: `npm run type-check`
  - `frontend`: `npm run build`

### 下一步

1. C 端推荐页、搜索页、收藏页接入真实接口。
2. B 端场景菜单增强菜谱选择/绑定编辑体验。
3. 执行 B 端新增/修改数据后 C 端可见的联调链路。
4. 持续运行 lint/typecheck/build 并记录结果。

## 2026-05-26

### Admin 内容管理整合

- 内容管理新增统一「内容列表」页面，整合菜谱、蔬菜、水果、生禽、水产、调料，使用顶部 Tab 切换内容类型。
- 左侧导航从分散的「菜谱管理 / 食材管理」调整为「内容列表」，详情、新增、编辑仍不进入左侧菜单。
- 内容列表复用真实 `listRecipes`、`listIngredients` 接口，操作列按内容类型跳转到对应详情和编辑页。
- 蔬菜、水果、生禽、水产、调料基于食材分类统一管理，不再为每个类型单独放左侧页面。

### Admin 内容列表验证记录

- `admin-frontend`: `npx tsc -b --noEmit` 通过。
- `admin-frontend`: `npm run build` 通过。

### Admin 内容新增入口调整

- 内容列表右上角已从「新增食材 / 新增菜谱」两个按钮收敛为单个「新增」按钮。
- 点击「新增」后弹窗选择菜谱、蔬菜、水果、生禽、水产、调料；确认后跳转菜谱新增页或食材新增页。
- 蔬菜、水果、生禽、水产、调料进入食材新增页时会通过 URL `type` 参数自动预选对应分类。
- `admin-frontend`: `npx tsc -b --noEmit` 通过。
- `admin-frontend`: `npm run build` 通过。

### Admin 内容列表交互继续修复

- 内容列表和菜谱/食材/审核列表已移除操作列「查看」按钮，统一通过标题/名称点击进入详情。
- 内容列表「推荐」列补充含义说明，并在操作列增加推荐/取消推荐动作，直接调用对应菜谱或食材推荐接口。
- 菜谱、蔬菜、水果、生禽、水产、调料新增入口继续复用单个「新增」弹窗；食材类新增页按类型切换标题、说明、封面、详情图、指南、营养/说明、挑选/使用、保存、禁忌/注意事项等字段文案。
- 菜谱和食材新增/编辑保存后统一返回 `/content/items` 内容列表。
- `admin-frontend`: `npx tsc -b --noEmit` 通过。
- `admin-frontend`: `npm run build` 通过。

### Admin 食材类新增分类修复

- 食材类新增页的分类控件从原生下拉改为当前类型内的分类按钮组，避免系统下拉遮挡字段名。
- 蔬菜、水果、生禽、水产、调料新增页只展示对应类型的分类，不再展示全部食材分类。
- 当当前类型暂无分类时，页面显示维护提示，不再回退展示所有分类。
- `admin-frontend`: `npx tsc -b --noEmit` 通过。
- `admin-frontend`: `npm run build` 通过。

## 2026-05-27

### 统一 ID 与酒水饮品模块

- 已新增统一业务 ID / 展示编号逻辑：API 对外返回带前缀业务 `id`，运营展示使用 `code`；数据库保留内部数字主键承载既有关联，新增 `biz_id`、`code`、`sort_order`、`is_deleted` 等通用字段。
- 已新增 `BEVERAGE` 分类类型、`beverages` 酒水饮品表、`recipe_beverages` 菜谱搭配饮品关联表，并补齐 Prisma migration：`20260527093000_add_business_ids_beverages`。
- 已补齐酒水饮品 Admin 接口：列表、新增、详情、编辑、删除、启用、禁用、排序；菜谱接口新增搭配饮品查询、新增、删除。
- 已补齐 Admin 酒水饮品管理页面、左侧导航与统一内容列表「酒水饮品」Tab；新增入口支持选择酒水饮品后跳转对应新增页。
- 已补齐 C 端菜谱详情推荐搭配饮品展示，菜谱公开接口返回 `beverages`，详情路由支持业务 ID。
- 已补齐基础 seed：菜谱分类、食材分类、常用食材、酒水饮品分类、无酒精饮品和番茄牛腩搭配饮品。

### 统一 ID 与酒水饮品验证记录

- `server`: `npm run build` 通过。
- `server`: `DATABASE_URL=... npm run prisma:deploy` 通过，migration 已应用。
- `server`: `DATABASE_URL=... npm run prisma:seed` 通过。
- `admin-frontend`: `npx tsc -b --noEmit` 通过。
- `admin-frontend`: `npm run build` 通过。
- `frontend`: `npm run type-check` 通过。
- `frontend`: `npm run build` 通过。
- 数据库抽查通过：`beverages` 已生成 `beverage_xxx` / `JS000001` 等编号，`categories` 已有 `BEVERAGE` 类型酒水饮品分类，`recipe_beverages` 已有番茄牛腩搭配饮品关联。

### Admin 首页运营目录调整

- 已按最新目录要求调整左侧「首页运营」子菜单为：顶部导航管理、首页轮播管理、模块管理。
- 仅修改目录名称与入口保留关系，未改动对应页面内容和路由页面实现。

## 2026-06-01

### 顶部导航管理闭环

- 已按 PRD 只开发「顶部导航管理」模块，未改动 Banner、推荐位和其它首页运营页面内容。
- 后端新增 `home_top_navs`、`home_top_nav_relations`、`home_top_nav_styles`、`home_top_nav_content_rules` 表和 migration：`20260601090000_add_home_top_navs`。
- Admin 新增顶部导航接口：统计、列表、详情、新增、编辑、删除、上线/下线、设置默认、排序、内容选择器。
- C 端新增接口：`GET /api/app/home/top-navs`、`GET /api/app/home/top-navs/:id/contents`，首页顶部导航从接口读取，不再只依赖写死分类。
- Admin 左侧「顶部导航管理」页面已替换为真实管理页；新增/编辑页支持基础信息、关联内容、展示数量、颜色与移动端预览。
- Seed 已写入默认顶部导航：推荐、家常菜、快手菜。

### 顶部导航管理验证记录

- `server`: `npx prisma validate` 通过。
- `server`: `npm run build` 通过。
- `server`: `DATABASE_URL=... npm run prisma:deploy` 通过。
- `server`: `DATABASE_URL=... npm run prisma:seed` 通过。
- `admin-frontend`: `npx tsc -b --noEmit` 通过。
- `admin-frontend`: `npm run build` 通过。
- `frontend`: `npm run type-check` 通过。
- `frontend`: `npm run build` 通过。
- 数据库抽查通过：`home_top_navs` 已生成 `top_nav_xxx` / `DH000001` 等默认导航数据。

### 顶部导航管理 C 端内容联动补充

- C 端首页点击接口返回的非默认顶部导航时，会调用 `GET /api/app/home/top-navs/:id/contents` 拉取该导航关联内容。
- 首页「更多菜谱」和快捷入口已指向独立菜谱列表 `/pages/recipes/index`，不再跳到食材 Tab。
- `frontend`: `npm run type-check` 通过。
- `frontend`: `npm run build` 通过。

### 顶部导航管理页面修复

- 修复 Admin 请求非 JSON 响应时直接抛 `Unexpected token '<'` 的问题，改为明确提示后端接口未返回 JSON，并指向需要重启/挂载的接口地址。
- 顶部导航管理页已按原型重排：顶部操作按钮、4 个数据卡片、导航项列表、下方导航配置和右侧 App 首页实时预览。
- 新增/编辑导航页已按原型重排：基础信息、关联内容配置、样式设置和右侧移动端预览。
- `admin-frontend`: `npx tsc -b --noEmit` 通过。
- `admin-frontend`: `npm run build` 通过。

### 顶部导航管理页最新原型对齐

- 按最新「顶部导航管理页」原型调整 `/home-ops`：保留顶部导航管理主页面，移除当前页面中的右侧 App 预览和下方配置区。
- 页面结构调整为：标题说明、右上角「新增导航 / 保存排序」、4 个统计卡片、搜索筛选条、导航表格、分页与跳页。
- 表格字段对齐原型：排序、导航名称、导航类型、关联内容、状态、默认选中、更新时间、操作。
- 操作列保留编辑、配置内容、上线/下线、删除；排序支持上移/下移并保存排序。
- `admin-frontend`: `npx tsc -b --noEmit` 通过。
- `admin-frontend`: `npm run build` 通过。

### 新增导航页最新原型对齐

- 按最新「新增导航」原型调整 `/home-ops/top-nav/new` 与编辑页共用表单：左侧两段式表单，右侧移动端首页实时预览。
- 基础信息区补齐返回箭头、导航名称、别名、导航类型、展示位置、排序值、默认选中、上线状态、固定显示、更多入口和描述字段。
- 关联内容区调整为内容来源单选、关联分类选择、已选内容、推荐时间段，并保留保存草稿 / 保存并上线闭环。
- 右侧预览按原型重做手机壳、首页搜索、顶部导航、推荐卡片、功能入口、推荐内容和底部导航。
- `admin-frontend`: `npx tsc -b --noEmit` 通过。
- `admin-frontend`: `npm run build` 通过。

### 顶部导航内容配置页

- 左侧菜单「首页运营」已改名为「首页管理」，子菜单仅保留「顶部导航管理」和「模块管理」。
- 顶部导航列表的「配置内容」现在跳转到 `/home-ops/top-nav/:id/content` 内容配置页。
- 所有顶部导航相关「上线 / 下线」前端文案已改为「启用 / 停用」，启用状态下列表不再展示删除按钮。
- 新增内容配置页按原型补齐：导航摘要、轮播图设置、内容模块管理、模块配置表单和右侧首页实时预览。
- `admin-frontend`: `npx tsc -b --noEmit` 通过。
- `admin-frontend`: `npm run build` 通过。

### 顶部导航内容配置交互修复

- 内容配置页移除分区标题中的 A/B/C 编号，保留「轮播图设置」「内容模块管理」「模块配置 - xxx」。
- 轮播图和内容模块表格操作列已补齐按钮点击反馈：编辑、配置内容、预览、启用、停用、删除。
- 轮播图和内容模块列表已支持拖拽图标排序，拖动后自动重排排序值并提示排序更新。
- 启用状态下继续隐藏删除按钮，非启用状态才允许删除确认。
- `admin-frontend`: `npx tsc -b --noEmit` 通过。
- `admin-frontend`: `npm run build` 通过。

### 顶部导航新增轮播图页修复

- 内容配置页「新增轮播图」从页内新增草稿改为跳转独立新增页：`/home-ops/top-nav/:id/content/carousels/new`。
- 新增轮播图页按当前要求仅保留「基础信息」「图片与跳转」和右侧首页实时预览，不再展示「3 展示预览」配置区。
- 新增页保留取消、保存草稿、保存并启用、图片上传预览、跳转配置和启用状态。
- 浏览器验证通过：点击「新增轮播图」进入新增页，页面不包含「展示预览」文本。
- `admin-frontend`: `npx tsc -b --noEmit` 通过。
- `admin-frontend`: `npm run build` 通过。

### 顶部导航轮播图编辑跳转

- 内容配置页轮播图列表的「编辑」按钮已从提示文案改为跳转编辑页：`/home-ops/top-nav/:id/content/carousels/:carouselId/edit`。
- 编辑页复用轮播图表单，标题显示「编辑轮播图」，保留基础信息、图片与跳转和右侧首页预览，不包含「展示预览」区。
- 浏览器验证通过：点击首条轮播图「编辑」进入编辑轮播图页。
- `admin-frontend`: `npx tsc -b --noEmit` 通过。
- `admin-frontend`: `npm run build` 通过。

### 顶部导航标题详情入口

- 顶部导航管理列表中「导航名称」点击行为已改为进入详情页：`/home-ops/top-nav/:id`。
- 新增顶部导航详情页，展示导航编号、类型、关联内容、状态、默认选中、排序、内容规则，并保留返回、编辑、配置内容入口。
- 列表操作列继续保留「编辑」「配置内容」「启用 / 停用」「删除」，标题点击不再进入编辑页。
- 导航名称入口已从脚本点击按钮改为真实链接，`href` 指向 `/home-ops/top-nav/:id`，避免点击事件不触发时无法进入详情。
- 浏览器验证通过：直接访问详情路由可打开详情页，列表「推荐」标题链接 `href` 指向对应详情路由。
- `admin-frontend`: `npx tsc -b --noEmit` 通过。
- `admin-frontend`: `npm run build` 通过。

### 顶部导航新增模块页

- 内容配置页「新增模块」从页内新增草稿改为跳转独立新增页：`/home-ops/top-nav/:id/content/modules/new`。
- 新增模块页按原型补齐基础信息、内容配置、展示配置和右侧效果预览。
- 新增页保留取消、保存草稿、保存并启用，保存后返回当前顶部导航内容配置页。
- `admin-frontend`: `npx tsc -b --noEmit` 通过。
- `admin-frontend`: `npm run build` 通过。

### 管理端框架布局视觉调整

- 按用户参考图红框范围调整管理端框架：左侧品牌区、侧栏底部装饰、顶栏面包屑、全局搜索、通知与管理员入口。
- 调整 `/home-ops` 顶部标题说明和操作按钮区，按钮改为「新增导航 / 预览首页 / 保存配置」的横向布局。
- 未改动顶部导航列表、筛选、接口请求、数据结构和后端逻辑。
- 浏览器验证通过：访问 `/home-ops` 后确认红框区域无文字换行、重叠或空白异常。
- `admin-frontend`: `npm run build` 通过。

### 管理端 Failed to fetch 根因修复

- 根因确认：本地管理端会在 `localhost`、`127.0.0.1` 和不同 Vite 端口之间切换，后端 CORS 只匹配单一 origin 时，浏览器会拦截请求并在前端显示 `Failed to fetch`。
- 后端 CORS 已调整为：`APP_ENV=dev` 时自动允许 `localhost` / `127.0.0.1` 本地来源，端口可选；生产环境仍依赖 `CORS_ORIGIN` 精确白名单。
- CORS 拒绝时不再向 Express 抛服务器错误，避免无关页面出现不清晰的服务端错误日志。
- 已同步 `server/.env.example`、`server/README.md` 和 `admin-frontend/README.md`，说明多 origin 配置和本地开发容错规则。
- `server`: `npm run build` 通过。

### Admin 内容管理拆分

- 左侧「内容管理」已从统一内容列表拆分为：菜谱管理、食材管理、水果管理、调料管理、酒水管理。
- `/content` 与旧 `/content/items` 现在重定向到 `/content/recipes`，避免继续进入旧统一内容列表。
- 新增 `/content/fruits` 与 `/content/seasonings` 路由，复用食材管理列表能力并按水果/调料分类过滤。
- 食材类新增/编辑保存后的返回路径按类型回到对应列表：水果回 `/content/fruits`，调料回 `/content/seasonings`，其他食材回 `/content/ingredients`。
- 酒水页面文案从「酒水饮品管理」统一为「酒水管理」。
- 浏览器验证通过：菜谱、食材、水果、调料、酒水 5 个内容管理路由均可访问且不 404。
- `admin-frontend`: `npx tsc -b --noEmit` 通过。
- `admin-frontend`: `npm run build` 通过。

### Admin 内容管理列表列结构修正

- 菜谱列表按参考图重排表头：隐藏系统 ID，封面与标题合并为「菜谱」，保留分类、主要食材、难度、状态、浏览量、收藏量、更新时间和操作。
- 食材、水果、调料列表按参考图重排表头：隐藏系统 ID，图片与名称合并为对应内容列，食材和水果增加「月份」列。
- 酒水列表按参考图重排表头：隐藏编号，图片与名称合并为「酒水」，保留分类、别名、状态、排序、创建时间和操作。
- 全局 DataTable 已开启横向不换行展示，避免列表文字竖排或表格列挤压。
- 同步恢复后端 3002 服务，登录接口 `/api/admin/auth/login` 已验证成功。
- `admin-frontend`: `npx tsc -b --noEmit` 通过。
- `admin-frontend`: `npm run build` 通过。

### Admin 登录昵称兼容

- 修复后台登录误填昵称「管理员」时失败的问题：后端登录接口同时支持 `username` 与 `nickname` 查询。
- 已重新构建并重启 3002 后端服务。
- 验证通过：`admin/admin123` 与 `管理员/admin123` 均可成功返回 token。
- `server`: `npm run build` 通过。

### Admin 登录 CORS 修复

- 定位登录页 `Failed to fetch` 根因：后端 `Access-Control-Allow-Origin` 返回了逗号拼接字符串，浏览器判定为非法 CORS 响应。
- 修复 `CORS_ORIGIN` 解析逻辑，支持逗号分隔白名单并传给 Express CORS 数组。
- 已重新构建并重启 3002 后端服务。
- 验证通过：`OPTIONS /api/admin/auth/login` 对 `http://127.0.0.1:5176` 返回合法单一 `Access-Control-Allow-Origin`。
- 验证通过：`admin/admin123` 与 `管理员/admin123` 均可成功返回 token。
- `server`: `npm run build` 通过。

### Admin 资源管理接入中心

- 左侧新增「资源管理」父级，位于「内容管理」与「分类标签」之间，包含「资源接入中心」「导入记录」。
- 「资源接入中心」已从占位页改为真实运营页面：支持资源类型、数据来源、关键词、导入状态、是否重复、更新时间、导入方式、来源 ID 筛选。
- 资源接入中心列表按原型补齐图片、名称、资源类型、来源、摘要、导入状态、是否重复、更新时间和操作，支持选择、查询、重置、预览、导入、忽略和批量导入交互。
- 所有筛选字段已改为字段名在左、控件在右，避免字段名上下排列。
- 「导入记录」已从占位页改为真实页面：支持筛选、统计卡、导入记录列表、详情、失败重试、导出记录和分页。
- `admin-frontend`: `./node_modules/.bin/tsc -b --noEmit` 通过。
- `admin-frontend`: `npm run build` 通过。

### Admin 列表操作列固定与资源摘要展示

- 通用 `DataTable` 已将 `key=actions` 或标题为「操作」的列固定在右侧，横向滚动列表时操作按钮保持可见。
- 顶部导航管理和顶部导航内容配置页中的手写表格同步固定「操作」列，避免横向滚动时丢失编辑、配置、启用、停用入口。
- 资源接入中心列表新增「来源ID」列，用于展示外部资源来源编号。
- 资源接入中心「摘要信息」列改为短文本截断展示，鼠标悬停通过提示框查看完整摘要，减少列宽占用。
- `admin-frontend`: `./node_modules/.bin/tsc -b --noEmit` 通过。
- `admin-frontend`: `npm run build` 通过。

### Admin 家庭管理菜单精简
- 按原型要求从家庭管理侧边栏移除「饮食偏好」和「家庭菜单」。
- 旧路径 `/families/preferences`、`/families/menus` 保留重定向到 `/families/list`，避免刷新旧链接出现占位页或 404。
- admin-frontend `tsc -b --noEmit` 与 `npm run build` 已通过。

### Admin 分类标签页面结构调整

- 左侧「分类标签」父级已精简为：分类管理、标签管理、单位管理；移除菜系管理、频道管理入口，旧路径重定向到分类管理。
- 分类管理页按后台原型重做为真实运营列表：横向筛选区、统计卡片、分类层级表格、固定操作列和新增/编辑/删除抽屉。
- 标签管理页按后台原型重做为真实运营列表：横向筛选区、统计卡片、标签表格、固定操作列和右侧标签详情面板。
- 单位管理页调整模块布局：标题区、筛选区、统计区、列表区与右侧详情面板分层排列，避免所有模块挤在同一行。
- `admin-frontend`: `./node_modules/.bin/tsc -b --noEmit` 通过。
- `admin-frontend`: `npm run build` 通过。

### Admin 单位 / 标签详情抽屉化

- 单位管理页移除页面常驻右侧详情面板；点击单位名称、勾选行或点击「查看」时打开右侧 Drawer 展示单位详情。
- 标签管理页移除页面常驻右侧详情面板；点击标签名称、勾选行或点击「查看」时打开右侧 Drawer 展示标签详情。
- 标签详情中点击「编辑」会先关闭详情 Drawer，再打开编辑 Drawer，避免双抽屉重叠。
- 标签列表加载失败时不再裸显示 `Failed to fetch`，改为提示后端服务未连接。
- `admin-frontend`: `./node_modules/.bin/tsc -b --noEmit` 通过。
- `admin-frontend`: `npm run build` 通过。

### Admin 用户列表真实化与接口修复

- 用户列表页从占位表格改为真实后台列表：支持关键词、注册方式、账号状态、家庭数量、时间范围筛选和分页。
- 用户列表补齐统计卡、头像、用户编号、手机号、注册方式、家庭数、收藏数、价格记录数、最近活跃时间、注册时间、账号状态和固定操作列。
- 用户详情与家庭关系改为右侧 Drawer，禁用 / 启用通过二次确认后调用真实接口。
- 后端 `/api/admin/users` 改为真实查询用户、家庭、收藏、浏览和菜谱计数，并返回前端需要的统一字段。
- 后端新增 `/api/admin/users/:id/status`，支持用户启用 / 禁用状态流转。
- 已重启本地后端 `3002`，`/health`、管理员登录和 `/api/admin/users?page=1&pageSize=20` 均验证成功。
- `server`: `npm run build` 通过。
- `admin-frontend`: `./node_modules/.bin/tsc -b --noEmit` 通过。
- `admin-frontend`: `npm run build` 通过。

### Admin 用户管理菜单精简

- 按当前原型要求，从「用户管理」左侧子菜单移除「用户行为」「用户收藏」「最近浏览」三个入口。
- 保留「用户列表」「用户投稿」两个入口；旧页面文件和路由未删除，避免已有链接直接 404。

### Admin 侧边栏底部功能组调整

- 按当前原型批注，将「菜篮子/采购」「评论管理」「AI 配置」「搜索运营」四个父级移动到左侧目录底部。
- 仅调整导航顺序，不删除页面、不改路由，已保留原有子级和权限配置。

### Admin 顶部导航内容配置精简

- 顶部导航管理页右上角删除「预览首页」按钮，保留「新增导航」和「保存配置」。
- 顶部导航内容配置页删除底部「模块配置 - xxx」表单区，保留轮播图设置、内容模块管理和右侧首页预览。
- 内容模块管理表格操作列删除「配置内容」按钮。
- 内容模块管理表格「编辑」从页内提示改为跳转模块编辑页：`/home-ops/top-nav/:id/content/modules/:moduleId/edit`。
- 修复新增模块、新增轮播图保存后列表不显示的问题：新增/编辑页保存时写入本地内容配置存储，内容配置页加载、启停、删除和排序统一从该存储读写。
- `admin-frontend`: `./node_modules/.bin/tsc -b --noEmit` 通过。
- `admin-frontend`: `npm run build` 通过。

### Admin 10 个新增 / 编辑页面续做

- 已读取 `docs/prototypes/` 下 10 张原型，按用户要求只参考大模块位置、字段分区、按钮和预览/提示内容。
- 分类管理、标签管理新增独立新增/编辑页，并把列表「新增」「编辑」从抽屉入口统一改为独立页面跳转。
- 菜谱、食材、调料、水果、酒水列表入口统一到独立新增/编辑页，避免新增/编辑仍走抽屉造成页面逻辑不一致。
- 单位管理列表「新增单位」「编辑」已改为独立页跳转。
- API 接口表单按「基础信息 / 接口配置 / 请求参数与说明」大模块展示，编辑页使用前端 mock 回显，测试连接和保存接口可点击。
- API 接口配置列表补齐筛选、表格、调用统计、限制提醒、最近调用日志；新增、编辑、测试、日志、删除操作均可点击。
- 内容管理新增/编辑页的图片上传组件已统一：菜谱、食材/水果/调料共用页、酒水页的封面与图集合并为「图片编辑」组件，封面和图片同尺寸，最多 8 张。
- 新增食材、新增水果及对应编辑页已增加「挑选指南」模块，支持分组、挑选项、小标题、说明、配图上传、删除、新增挑选项和新增分组。
- 当前未新增真实后端接口：API 接口管理、单位管理仍为前端 mock；水果/调料详情回显依赖现有通用资源接口能力，后端专用详情接口未补。
- `admin-frontend`: `npm run build` 通过。

### Admin 分类管理子分类展开

- 修复分类管理列表只能看到一级分类、点击箭头不能展开的问题。
- 分类名称前的箭头现在是可点击展开按钮，展开后在表格内直接显示二级分类行。
- 「家常菜」已可展开看到「下饭菜」「快手菜」「晚餐菜」，子分类行展示上级分类、层级、排序、关联内容数、状态、更新时间和操作。
- 当前后端分类模型还没有 `parentId` 层级字段，本次先按前端展示逻辑补齐查看能力；后续要做真实新增/保存子分类，需要补数据库字段和接口。
- `admin-frontend`: `npm run build` 通过。
