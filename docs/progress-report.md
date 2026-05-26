# 进度报告

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

- 确认 C 端已有独立菜谱列表路由：`/pages/recipes/index`，不属于底部“食材”Tab。
- 首页新增明显入口“全部菜谱”，点击进入 `/pages/recipes/index`；首页菜谱区右侧操作文案改为“更多菜谱”。
- 菜谱列表页移除接口失败时的静态 mock fallback，默认选中“全部”，`activeCategory=all` 时不做分类过滤，接口返回什么就展示什么。
- 菜谱列表页继续调用 `listRecipes()`，底层请求 `GET /api/recipes`，并展示接口返回的 `cover/title/description/cookTime/difficulty/servings/taste/scene`。
- 菜谱列表页补充空状态“暂无菜谱”和失败态“加载失败：... / 重试”。
- 菜谱列表页增加开发调试日志：`mounted`、`request /api/recipes`、`raw response`、`final recipes`、`selectedCategory`、`filteredRecipes`。
- `/uploads/xxx` 图片路径继续由 `frontend/src/services/public-api.ts` 的 `resolveAssetUrl` 解析为后端源地址。

### C 端入口验证记录

- `frontend`: `npm run type-check` 通过。
- `frontend`: `npm run build` 通过。

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
