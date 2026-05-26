# 家里有菜后台管理系统 PRD / 开发交付文档

更新时间：2026-05-25  
适用对象：产品、UI、B 端前端、后端、测试  
原型来源：Figma `Chufangapp Admin` / `CMS 原型 · 侘寂交互版`  
当前原型统计：242 个 Frame，其中列表 36、表单/配置 78、详情 24、预览 13、状态页 9、弹窗/抽屉 28。

---

## 1. 产品定位

后台不是传统 ERP，而是“高级生活方式内容运营 CMS”。

核心目标：

1. 管理 App 首页运营内容。
2. 管理菜谱、食材、水果、调料、调酒等核心内容。
3. 支持价格历史、趋势图、采购、菜篮子、家庭数据。
4. 支持用户投稿、评论、举报、审核流。
5. 支持 AI 推荐、今日吃什么、搜索运营、推荐规则配置。
6. 支持图片库、OSS 文件、系统权限、操作日志。
7. B 端配置内容必须最终同步影响 C 端 App 展示。

---

## 2. 视觉与交互规范

### 2.1 设计风格

- 风格：Linear + Notion + Craft。
- 气质：极简、侘寂、日系生活方式、高级 SaaS、内容运营平台。
- 禁止：蓝色科技后台、ERP 密集表格、高饱和颜色、强阴影、复杂渐变。

### 2.2 颜色

| Token | 色值 | 用途 |
|---|---|---|
| Primary | `#7A8B6F` | 主按钮、选中态、成功状态、主曲线 |
| Background | `#F5F1EA` | 页面背景 |
| Card | `#FFFDFC` | 卡片、弹窗、抽屉 |
| Text Primary | `#2F2F2F` | 标题、正文主文字 |
| Text Secondary | `#8C8C8C` | 辅助文字、说明 |
| Accent | `#C27B48` | 删除、警示、对比曲线、强调 |
| Divider | `#E9E2D6` | 分割线、浅边框、网格线 |
| Soft Green | `#A8B48A` | 辅助成功、浅绿卡片 |
| Warm Gray | `#B7AEA1` | 坐标轴、弱提示 |

### 2.3 字体

- 中文：思源黑体、思源宋体。
- 英文：Inter。
- 标题用较大字号与留白建立层级，不靠边框强调。

### 2.4 布局

- 左侧导航固定宽度：约 `260px`。
- 主内容区：右侧可纵向滚动，`overflow-y: auto`。
- 页面 Frame：Figma 原型已设置 `Vertical scrolling + clipsContent`。
- 长页面不允许互相遮挡，内容超过视口必须滚动。
- 操作列必须始终可见、可点击。
- 详情页采用两列布局：左侧主内容，右侧配置/状态卡片，底部操作日志只放左侧主列。

### 2.5 z-index

| 层级 | z-index |
|---|---:|
| 页面内容 | 1 |
| 固定侧边栏 | 10 |
| Drawer | 100 |
| Modal | 200 |
| Toast | 300 |

---

## 3. 信息架构

左侧菜单只放核心模块，不放详情、新增、编辑、弹窗、抽屉、预览、状态页。

```text
工作台
首页运营
内容管理
分类标签
菜篮子 / 采购
价格管理
家庭管理
用户管理
审核中心
评论管理
AI 配置
搜索运营
数据报表
文件管理
资源接口
系统设置
```

建议路由前缀：

| 模块 | 路由前缀 |
|---|---|
| 工作台 | `/dashboard` |
| 首页运营 | `/home-ops` |
| 内容管理 | `/content` |
| 分类标签 | `/taxonomies` |
| 菜篮子 / 采购 | `/purchase` |
| 价格管理 | `/prices` |
| 家庭管理 | `/families` |
| 用户管理 | `/users` |
| 审核中心 | `/audits` |
| 评论管理 | `/comments` |
| AI 配置 | `/ai` |
| 搜索运营 | `/search-ops` |
| 数据报表 | `/reports` |
| 文件管理 | `/files` |
| 资源接口 | `/resources` |
| 系统设置 | `/settings` |

---

## 4. 全局交互规则

### 4.0 中英文术语统一

后台 UI、接口、代码命名必须统一使用以下语义，避免混用：

| 中文 | 英文 | 使用场景 | 不要混用 |
|---|---|---|---|
| 审核 | Review | 进入审核流程、查看待审核内容 | 不等于通过 |
| 审核通过 | Approve | 菜谱投稿、评论、举报处理通过 | 不用 Accept |
| 驳回 | Reject | 审核不通过、退回修改 | 不用 Refuse |
| 接受 | Accept | 接受邀请、接受协议、接受成员加入 | 不用 Apply |
| 应用 / 套用 | Apply | 应用筛选、应用配置、应用规则、套用模板 | 不用 Accept |
| 保存 | Save | 保存表单草稿或配置 | 不用 Apply |
| 发布 | Publish | 内容对 App 可见 | 不等于 Approve |
| 下架 | Unpublish | 内容从 App 隐藏 | 不等于 Delete |

按钮建议：

- 待审核内容按钮：`审核 / Review`。
- 审核弹窗主按钮：`通过 / Approve`、`驳回 / Reject`。
- 配置抽屉按钮：`应用配置 / Apply` 或 `保存 / Save`。
- 家庭邀请按钮：`接受邀请 / Accept Invite`。

### 4.1 列表页统一能力

每个列表页必须具备：

1. 新增按钮。
2. 搜索框。
3. 筛选按钮。
4. 状态筛选。
5. 卡片式表格 / 大行高列表。
6. 批量操作。
7. 分页。
8. 操作列。

操作列基础按钮：

| 按钮 | 行为 |
|---|---|
| 详情 | 跳转详情页 |
| 编辑 | 默认打开右侧 Drawer；复杂内容可跳转编辑页 |
| 配置 | 打开右侧配置 Drawer |
| 删除 | 打开删除确认 Modal |

可选按钮：

| 按钮 | 适用场景 |
|---|---|
| 上架 / 下架 | 内容发布状态 |
| 推荐 / 取消推荐 | 推荐位内容 |
| 审核通过 / 驳回 | 投稿、评论、举报 |
| App 预览 | 菜谱、食材、水果、调料、调酒、Banner、首页 |
| 同步到 App | 配置变更后发布到 C 端 |

### 4.2 状态与按钮规则

| 状态 | 可操作 | 禁止操作 |
|---|---|---|
| 草稿 | 编辑、预览、发布、删除 | 下架、推荐 |
| 已发布 | 详情、编辑、下架、推荐、取消推荐、App 预览 | 再次发布 |
| 已下架 | 详情、编辑、重新上架、删除 | 推荐 |
| 待审核 | 详情、审核通过、审核驳回、编辑 | 发布、推荐 |
| 审核驳回 | 查看驳回原因、编辑、重新提交审核、删除 | 推荐 |
| 已推荐 | 取消推荐、调整推荐权重、查看推荐数据 | 无 |
| 禁用 | 启用、查看详情 | 推荐、发布 |
| 已删除 | 恢复、永久删除 | 常规编辑 |

### 4.3 Drawer 规范

所有“配置”按钮统一打开右侧 Drawer。

Drawer 必须包含：

- 标题。
- 当前数据回显。
- 可编辑表单。
- 保存。
- 取消。
- 重置。

常见字段组件：

- 输入框。
- 文本域。
- 下拉选择。
- 多选标签。
- 分类选择。
- 图片上传。
- Switch。
- 排序输入。
- 推荐位。
- 时间选择。
- 权重配置。

### 4.4 Modal 规范

删除、禁用、驳回、批量操作必须使用 Modal。

Modal 必须包含：

- 操作标题。
- 风险提示。
- 操作对象名称。
- 取消。
- 确认。

示例：

```text
是否确认删除《番茄炒蛋》？
删除后将不会在 App 展示，可在回收站恢复。
```

### 4.5 全局跳转规则

| 来源 | 操作 | 目标 |
|---|---|---|
| 列表 | 新增 | 新增页或新增 Drawer |
| 列表 | 详情 | 详情页 |
| 列表 | 编辑 | 编辑 Drawer 或编辑页 |
| 列表 | 配置 | 右侧配置 Drawer |
| 列表 | 删除 | 删除确认 Modal |
| 详情 | 返回 | 上一级列表 |
| 详情 | 编辑内容 | 编辑 Drawer 或编辑页 |
| 表单 | 保存 | 保存成功 Toast，返回详情或列表 |
| 表单 | 取消 | 返回来源页 |
| 预览 | 返回 | 来源页 |
| 上传图片 | 点击上传 | 图片上传弹窗 |
| 图片上传 | 裁剪 | 图片裁剪页 / 弹窗 |
| 审核 | 通过 | 审核通过 Modal |
| 审核 | 驳回 | 驳回原因 Modal |
| Command K | 输入关键词 | 全局搜索结果 |

---

## 5. 接口统一规范

### 5.1 请求前缀

| 端 | 前缀 |
|---|---|
| B 端后台 | `/api/admin` |
| C 端 App | `/api/mobile` |

### 5.2 返回结构

```ts
type ApiResponse<T> = {
  code: number;
  message: string;
  data: T;
};
```

### 5.3 分页结构

```ts
type PageResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
};
```

### 5.4 列表查询参数

```ts
type ListQuery = {
  page?: number;
  pageSize?: number;
  keyword?: string;
  status?: string;
  categoryId?: number;
  isPublish?: boolean;
  isRecommend?: boolean;
  auditStatus?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};
```

### 5.5 通用 CRUD 接口

| 方法 | 路径 | 用途 |
|---|---|---|
| GET | `/api/admin/{resource}` | 列表 |
| POST | `/api/admin/{resource}` | 新增 |
| GET | `/api/admin/{resource}/:id` | 详情 |
| PUT | `/api/admin/{resource}/:id` | 编辑 |
| DELETE | `/api/admin/{resource}/:id` | 删除 |
| PATCH | `/api/admin/{resource}/:id/status` | 状态变更 |
| PATCH | `/api/admin/{resource}/:id/publish` | 上下架 |
| PATCH | `/api/admin/{resource}/:id/recommend` | 推荐/取消推荐 |
| PATCH | `/api/admin/{resource}/:id/sort` | 排序 |
| POST | `/api/admin/{resource}/batch` | 批量操作 |

### 5.6 错误码

| code | 含义 |
|---:|---|
| 0 | 成功 |
| 400 | 参数错误 |
| 401 | 未登录或 Token 失效 |
| 403 | 无权限 |
| 404 | 数据不存在 |
| 409 | 状态冲突 |
| 422 | 业务校验失败 |
| 500 | 服务端错误 |

---

## 6. 核心数据字段

### 6.1 Banner

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| id | number | 是 | 主键 |
| title | string | 是 | 标题 |
| subtitle | string | 否 | 副标题 |
| image | string | 是 | Web/通用图 |
| mobile_image | string | 否 | App 图 |
| link_type | enum | 是 | recipe / ingredient / fruit / seasoning / cocktail / url / none |
| link_id | number | 否 | 内部跳转 ID |
| link_url | string | 否 | 外部链接 |
| position | string | 是 | 首页 / 分类页 / 详情页 |
| sort | number | 是 | 排序 |
| start_time | datetime | 否 | 开始展示时间 |
| end_time | datetime | 否 | 结束展示时间 |
| is_publish | boolean | 是 | 是否上架 |
| view_count | number | 是 | 曝光 |
| click_count | number | 是 | 点击 |

### 6.2 菜谱

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| title | string | 是 | 标题 |
| subtitle | string | 否 | 副标题 |
| cover | string | 是 | 封面 |
| images | string[] | 否 | 图集 |
| description | string | 否 | 描述 |
| category_id | number | 是 | 分类 |
| tags | string[] | 否 | 标签 |
| difficulty | string | 否 | 难度 |
| cook_time | number | 否 | 烹饪时间 |
| servings | number | 否 | 份数 |
| calories | number | 否 | 热量 |
| taste | string[] | 否 | 口味 |
| scene | string[] | 否 | 场景 |
| ingredients | RecipeIngredient[] | 是 | 食材 |
| seasonings | RecipeSeasoning[] | 否 | 调料 |
| steps | RecipeStep[] | 是 | 步骤 |
| tips | string | 否 | 小贴士 |
| source_type | enum | 是 | official / user |
| author_id | number | 否 | 作者 |
| audit_status | enum | 是 | pending / approved / rejected |
| reject_reason | string | 否 | 驳回原因 |
| is_draft | boolean | 是 | 草稿 |
| is_publish | boolean | 是 | 发布 |
| is_recommend | boolean | 是 | 推荐 |
| view_count | number | 是 | 浏览 |
| favorite_count | number | 是 | 收藏 |
| comment_count | number | 是 | 评论 |

### 6.3 食材 / 水果

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| name | string | 是 | 名称 |
| cover | string | 是 | 封面 |
| category_id | number | 是 | 分类 |
| season_month | number[] | 否 | 时令月份 |
| nutrition | object | 否 | 营养信息 |
| selection_tips | string | 否 | 挑选技巧 |
| storage_method | string | 否 | 保存方法 |
| taboo | string | 否 | 禁忌 |
| related_recipes | number[] | 否 | 关联菜谱 |
| current_price | number | 否 | 当前价格 |
| price_unit | string | 否 | 单位 |
| price_source | string | 否 | 来源 |
| price_date | date | 否 | 日期 |
| is_publish | boolean | 是 | 发布 |
| is_recommend | boolean | 是 | 推荐 |

### 6.4 调料

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| name | string | 是 | 名称 |
| cover | string | 是 | 封面 |
| category_id | number | 是 | 分类 |
| description | string | 否 | 说明 |
| usage_method | string | 否 | 使用方法 |
| suitable_dishes | string[] | 否 | 适合菜品 |
| substitute | string[] | 否 | 替代调料 |
| storage_method | string | 否 | 保存方法 |
| nutrition_note | string | 否 | 营养说明 |
| health_tip | string | 否 | 健康提示 |
| current_price | number | 否 | 当前价格 |
| price_unit | string | 否 | 单位 |
| is_publish | boolean | 是 | 发布 |
| is_recommend | boolean | 是 | 推荐 |
| sort | number | 是 | 排序 |

### 6.5 调酒

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| name | string | 是 | 名称 |
| cover | string | 是 | 封面 |
| images | string[] | 否 | 图集 |
| category_id | number | 是 | 分类 |
| description | string | 否 | 描述 |
| alcohol_level | string | 否 | 酒精度 |
| difficulty | string | 否 | 难度 |
| make_time | number | 否 | 制作时间 |
| glass_type | string | 否 | 杯型 |
| taste | string[] | 否 | 口味 |
| scene | string[] | 否 | 场景 |
| ingredients | CocktailIngredient[] | 是 | 材料 |
| steps | CocktailStep[] | 是 | 步骤 |
| tips | string | 否 | 小贴士 |
| is_recommend | boolean | 是 | 推荐 |
| is_publish | boolean | 是 | 发布 |
| view_count | number | 是 | 浏览 |
| favorite_count | number | 是 | 收藏 |

### 6.6 价格历史

价格不能只放在内容主表，必须单独维护历史表。

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| id | number | 是 | 主键 |
| target_id | number | 是 | 目标 ID |
| target_type | enum | 是 | ingredient / fruit / seasoning |
| price | number | 是 | 价格 |
| unit | string | 是 | 单位 |
| market_name | string | 是 | 市场/平台 |
| city | string | 否 | 城市 |
| source | string | 是 | 手动 / 抓取 / 平台 |
| price_date | date | 是 | 价格日期 |
| change_type | enum | 否 | up / down / flat |
| change_rate | number | 否 | 涨跌幅 |

### 6.7 用户、家庭、采购、互动

| 表 | 关键字段 |
|---|---|
| users | phone, nickname, avatar, gender, status, family_count, recipe_count, favorite_count, recent_view_count, last_login_at, register_source, created_at |
| families | name, owner_id, avatar, member_count, created_at |
| family_members | family_id, user_id, role, joined_at, status |
| family_invites | family_id, inviter_id, invitee_phone, invite_code, status, expired_at |
| basket_items | user_id, family_id, target_id, target_type, name, amount, unit, checked, source_type, created_at |
| purchase_records | user_id, family_id, title, total_amount, purchase_date, market_name, remark, created_at |
| purchase_items | purchase_id, ingredient_id, name, amount, unit, price, subtotal |
| favorites | user_id, target_id, target_type, created_at |
| recent_views | user_id, target_id, target_type, viewed_at |
| comments | user_id, target_id, target_type, content, images, status, audit_status, reject_reason, report_count, created_at |

### 6.8 配置表

| 表 | 用途 | 关键字段 |
|---|---|---|
| home_configs | 首页模块配置 | module_key, module_name, module_type, content_ids, sort, is_enabled, config_json |
| recommend_configs | 推荐规则 | scene, target_type, rule_name, rule_config, weight, is_enabled |
| ai_configs | AI Prompt | name, scene, prompt, model, temperature, max_tokens, is_enabled |
| files | 文件库 | url, filename, file_type, size, folder, source, used_count, created_by |
| system_configs | 系统配置 | key, value, type, description, group |

---

## 7. 模块 PRD 与接口

### 7.1 工作台

页面：

- Dashboard。
- 数据概览。
- 待办事项。
- 运营提醒。

功能：

- 展示今日新增用户、内容数、待审核数、价格异常数。
- 展示热门菜谱、热门搜索、用户增长、内容统计。
- 点击待办跳转对应审核/配置页面。

接口：

| 方法 | 路径 | 用途 |
|---|---|---|
| GET | `/api/admin/dashboard/overview` | 概览卡片 |
| GET | `/api/admin/dashboard/todos` | 待办 |
| GET | `/api/admin/dashboard/trends` | 趋势 |
| GET | `/api/admin/dashboard/hot-content` | 热门内容 |

### 7.2 首页运营

页面：

- 首页配置。
- Banner 管理。
- 推荐位配置。
- 时令推荐配置。
- App 首页预览。

管理内容：

- 首页 Banner。
- 推荐菜谱。
- 推荐食材。
- 推荐水果。
- 推荐调酒。
- 今日吃什么。
- 时令内容。
- 模块排序。

按钮：

| 按钮 | 行为 |
|---|---|
| 新增模块 | 打开模块配置 Drawer |
| 模块排序 | 打开排序 Drawer |
| 推荐内容配置 | 打开内容选择 Drawer |
| App 预览 | 跳转 App 首页实时预览 |
| 保存并同步 | 保存配置并刷新 C 端首页缓存 |

接口：

| 方法 | 路径 | 用途 |
|---|---|---|
| GET | `/api/admin/home-configs` | 首页配置 |
| PUT | `/api/admin/home-configs/:id` | 编辑模块 |
| PATCH | `/api/admin/home-configs/sort` | 模块排序 |
| POST | `/api/admin/home-configs/:id/sync` | 同步到 App |
| GET | `/api/mobile/home` | C 端首页读取 |

### 7.3 Banner 管理

页面：

- Banner 列表页。
- Banner 详情页。
- 新增 Banner 页。
- 编辑 Banner 页。
- Banner 运营配置页。
- Banner 跳转配置抽屉。
- Banner 上下架配置抽屉。
- Banner 排序配置抽屉。
- Banner App 预览页。
- Banner 删除确认弹窗。

列表字段：

- 封面。
- title。
- subtitle。
- position。
- link_type。
- start_time / end_time。
- sort。
- is_publish。
- view_count。
- click_count。

按钮：

| 按钮 | 行为 |
|---|---|
| 新增 Banner | `/home-ops/banners/create` |
| 详情 | `/home-ops/banners/:id` |
| 编辑 | 打开编辑 Drawer 或 `/home-ops/banners/:id/edit` |
| 配置 | 打开 Banner 配置 Drawer |
| 跳转配置 | Drawer 内配置 link_type/link_id/link_url |
| 上下架 | Drawer 内配置时间与状态 |
| 排序 | Drawer 内配置 sort |
| App 预览 | `/home-ops/banners/:id/preview` |
| 删除 | 删除确认 Modal |

接口：

| 方法 | 路径 |
|---|---|
| GET/POST | `/api/admin/banners` |
| GET/PUT/DELETE | `/api/admin/banners/:id` |
| PATCH | `/api/admin/banners/:id/publish` |
| PATCH | `/api/admin/banners/:id/sort` |
| PATCH | `/api/admin/banners/:id/link` |

### 7.4 菜谱管理

页面：

- 菜谱列表页。
- 菜谱详情页。
- 新增菜谱页。
- 编辑菜谱页。
- 菜谱预览页。
- 菜谱步骤编辑器。
- 菜谱食材关联弹窗。
- 菜谱调料关联配置页。
- 菜谱标签管理页。
- 菜谱分类配置页。
- 菜谱推荐位配置页。
- 菜谱草稿管理页。
- 菜谱发布状态管理页。
- 菜谱 App 预览页。
- 用户投稿菜谱审核页。
- 菜谱删除确认弹窗。

列表字段：

- cover。
- title。
- category。
- tags。
- difficulty。
- cook_time。
- source_type。
- audit_status。
- is_draft。
- is_publish。
- is_recommend。
- view_count / favorite_count / comment_count。
- updated_at。

步骤编辑器：

- step_no。
- content。
- image。
- tips。
- 可拖拽排序。
- 可新增、删除、保存草稿。

按钮流转：

| 来源 | 按钮 | 目标 |
|---|---|---|
| 菜谱列表 | 新增菜谱 | `/content/recipes/create` |
| 菜谱列表 | 详情 | `/content/recipes/:id` |
| 菜谱列表 | 编辑 | `/content/recipes/:id/edit` |
| 菜谱列表 | 配置 | 推荐/分类/标签配置 Drawer |
| 菜谱列表 | 预览 | `/content/recipes/:id/preview` |
| 菜谱列表 | 删除 | 删除确认 Modal |
| 菜谱详情 | 编辑内容 | `/content/recipes/:id/edit` |
| 菜谱编辑 | 步骤编辑 | `/content/recipes/:id/steps` |
| 菜谱编辑 | 关联食材 | 食材关联 Modal |
| 菜谱编辑 | 上传图片 | 图片上传 Modal |

接口：

| 方法 | 路径 | 用途 |
|---|---|---|
| GET/POST | `/api/admin/recipes` | 列表/新增 |
| GET/PUT/DELETE | `/api/admin/recipes/:id` | 详情/编辑/删除 |
| PATCH | `/api/admin/recipes/:id/publish` | 发布/下架 |
| PATCH | `/api/admin/recipes/:id/recommend` | 推荐 |
| PATCH | `/api/admin/recipes/:id/audit` | 审核 |
| GET/PUT | `/api/admin/recipes/:id/steps` | 步骤 |
| GET/PUT | `/api/admin/recipes/:id/ingredients` | 食材关联 |
| GET/PUT | `/api/admin/recipes/:id/seasonings` | 调料关联 |
| GET | `/api/mobile/recipes/:id` | App 详情 |

### 7.5 食材管理

页面：

- 食材列表页。
- 食材详情页。
- 新增食材页。
- 编辑食材页。
- 食材价格管理页。
- 食材价格趋势页。
- 食材价格批量导入页。
- 食材价格来源配置页。
- 食材时令配置页。
- 食材营养信息配置页。
- 食材挑选技巧配置页。
- 食材保存方法配置页。
- 食材关联菜谱页。
- 食材 App 预览页。

列表字段：

- cover。
- name。
- category。
- season_month。
- current_price。
- price_unit。
- price_source。
- price_date。
- is_publish。
- is_recommend。
- related_recipes_count。

配置按钮：

- 打开右侧 Drawer。
- 支持时令、营养、挑选技巧、保存方法、关联菜谱、推荐位、上下架、排序。

接口：

| 方法 | 路径 |
|---|---|
| GET/POST | `/api/admin/ingredients` |
| GET/PUT/DELETE | `/api/admin/ingredients/:id` |
| PATCH | `/api/admin/ingredients/:id/publish` |
| PATCH | `/api/admin/ingredients/:id/recommend` |
| GET/POST | `/api/admin/prices?targetType=ingredient` |
| GET | `/api/admin/prices/trends?targetType=ingredient&targetId=:id` |
| POST | `/api/admin/prices/import` |
| GET | `/api/mobile/ingredients/:id` |

### 7.6 水果管理

页面：

- 水果列表页。
- 水果详情页。
- 新增水果页。
- 编辑水果页。
- 水果价格管理页。
- 水果价格趋势页。
- 水果时令配置页。
- 水果营养信息配置页。
- 水果挑选技巧配置页。
- 水果保存方法配置页。
- 水果食用禁忌配置页。
- 水果 App 预览页。

字段与食材基本一致，`target_type = fruit`。

接口：

| 方法 | 路径 |
|---|---|
| GET/POST | `/api/admin/fruits` |
| GET/PUT/DELETE | `/api/admin/fruits/:id` |
| PATCH | `/api/admin/fruits/:id/publish` |
| PATCH | `/api/admin/fruits/:id/recommend` |
| GET/POST | `/api/admin/prices?targetType=fruit` |
| GET | `/api/admin/prices/trends?targetType=fruit&targetId=:id` |

### 7.7 调料管理

页面：

- 调料列表页。
- 调料详情页。
- 新增调料页。
- 编辑调料页。
- 调料分类配置页。
- 替代调料配置页。
- 适合菜品配置页。
- 调料营养/说明配置页。
- 调料推荐位配置页。
- 调料 App 预览页。

注意：

- 点击“配置”不要跳页面，统一打开右侧 Drawer。
- Drawer 内根据配置类型切换表单。

接口：

| 方法 | 路径 |
|---|---|
| GET/POST | `/api/admin/seasonings` |
| GET/PUT/DELETE | `/api/admin/seasonings/:id` |
| PATCH | `/api/admin/seasonings/:id/publish` |
| PATCH | `/api/admin/seasonings/:id/recommend` |
| GET/PUT | `/api/admin/seasonings/:id/substitutes` |
| GET/PUT | `/api/admin/seasonings/:id/suitable-dishes` |
| GET/POST | `/api/admin/prices?targetType=seasoning` |

### 7.8 调酒管理

页面：

- 调酒列表页。
- 调酒详情页。
- 新增调酒页。
- 编辑调酒页。
- 调酒材料配置页。
- 调酒步骤编辑器。
- 酒精度配置页。
- 口味标签配置页。
- 场景标签配置页。
- 调酒推荐位配置页。
- 调酒 App 预览页。

接口：

| 方法 | 路径 |
|---|---|
| GET/POST | `/api/admin/cocktails` |
| GET/PUT/DELETE | `/api/admin/cocktails/:id` |
| PATCH | `/api/admin/cocktails/:id/publish` |
| PATCH | `/api/admin/cocktails/:id/recommend` |
| GET/PUT | `/api/admin/cocktails/:id/ingredients` |
| GET/PUT | `/api/admin/cocktails/:id/steps` |

### 7.9 分类标签

页面：

- 菜谱分类。
- 食材分类。
- 水果分类。
- 调料分类。
- 调酒分类。
- 标签管理。
- 分类详情。
- 标签详情。

列表字段：

- 分类名称。
- 层级。
- 图标/色块。
- 排序。
- 内容数。
- 状态。

配置按钮用途：

- 分类层级。
- App 展示名称。
- 图标/色块。
- 排序权重。
- 启用/禁用。
- 关联内容。
- 是否参与搜索/筛选。

接口：

| 方法 | 路径 |
|---|---|
| GET/POST | `/api/admin/categories` |
| GET/PUT/DELETE | `/api/admin/categories/:id` |
| PATCH | `/api/admin/categories/:id/status` |
| PATCH | `/api/admin/categories/:id/sort` |
| GET/POST | `/api/admin/tags` |
| GET/PUT/DELETE | `/api/admin/tags/:id` |

### 7.10 菜篮子 / 采购

页面：

- 菜篮子管理页。
- 采购清单管理页。
- 采购历史管理页。
- 家庭采购记录页。
- 采购明细页。
- 采购价格配置页。

列表字段：

- 用户/家庭。
- 商品名称。
- target_type。
- amount。
- unit。
- checked。
- source_type。
- purchase_date。
- total_amount。
- market_name。

接口：

| 方法 | 路径 |
|---|---|
| GET | `/api/admin/basket-items` |
| GET | `/api/admin/basket-items/:id` |
| PATCH | `/api/admin/basket-items/:id/status` |
| GET/POST | `/api/admin/purchase-records` |
| GET/PUT/DELETE | `/api/admin/purchase-records/:id` |
| GET | `/api/admin/purchase-records/:id/items` |
| GET | `/api/admin/families/:id/purchase-records` |

### 7.11 价格管理

页面：

- 价格总览页。
- 食材价格页。
- 水果价格页。
- 调料价格页。
- 价格趋势页。
- 价格批量导入页。
- 价格来源配置页。

图表要求：

- 曲线图必须有横纵坐标。
- 主曲线：当前价格。
- 虚线：7 日均价或对比价格。
- 只保留 4 条左右横向网格线。
- 不允许新旧图层叠加。
- 图表必须限制在卡片内部。

接口：

| 方法 | 路径 | 用途 |
|---|---|---|
| GET | `/api/admin/prices/overview` | 价格概览 |
| GET/POST | `/api/admin/prices` | 列表/新增 |
| GET/PUT/DELETE | `/api/admin/prices/:id` | 详情/编辑/删除 |
| GET | `/api/admin/prices/trends` | 趋势图 |
| POST | `/api/admin/prices/import` | 批量导入 |
| GET/POST | `/api/admin/price-sources` | 来源配置 |

### 7.12 家庭管理

页面：

- 家庭列表页。
- 家庭详情页。
- 家庭成员管理页。
- 家庭邀请记录页。
- 家庭菜篮子记录页。
- 家庭收藏记录页。
- 家庭采购记录页。

接口：

| 方法 | 路径 |
|---|---|
| GET | `/api/admin/families` |
| GET | `/api/admin/families/:id` |
| GET | `/api/admin/families/:id/members` |
| GET | `/api/admin/families/:id/invites` |
| GET | `/api/admin/families/:id/basket-items` |
| GET | `/api/admin/families/:id/favorites` |
| GET | `/api/admin/families/:id/purchase-records` |

### 7.13 用户管理

页面：

- 用户列表页。
- 用户详情页。
- 用户行为分析页。
- 用户收藏记录页。
- 用户最近浏览页。
- 用户发布菜谱页。
- 用户菜篮子记录页。
- 用户家庭关系页。
- 用户禁用/启用弹窗。

接口：

| 方法 | 路径 |
|---|---|
| GET | `/api/admin/users` |
| GET | `/api/admin/users/:id` |
| PATCH | `/api/admin/users/:id/status` |
| GET | `/api/admin/users/:id/favorites` |
| GET | `/api/admin/users/:id/recent-views` |
| GET | `/api/admin/users/:id/recipes` |
| GET | `/api/admin/users/:id/basket-items` |
| GET | `/api/admin/users/:id/families` |

### 7.14 审核中心与评论

页面：

- 菜谱投稿审核。
- 投稿菜谱详情。
- 评论审核。
- 举报处理。
- 内容下架原因配置。
- 审核记录。
- 评论列表。
- 评论详情抽屉。
- 评论审核状态页。
- 评论删除确认弹窗。

接口：

| 方法 | 路径 |
|---|---|
| GET | `/api/admin/audits/recipes` |
| PATCH | `/api/admin/audits/recipes/:id/approve` |
| PATCH | `/api/admin/audits/recipes/:id/reject` |
| GET | `/api/admin/audits/comments` |
| PATCH | `/api/admin/audits/comments/:id/approve` |
| PATCH | `/api/admin/audits/comments/:id/reject` |
| GET | `/api/admin/reports` |
| PATCH | `/api/admin/reports/:id/resolve` |
| GET | `/api/admin/audit-logs` |
| GET/POST | `/api/admin/takedown-reasons` |
| GET/POST | `/api/admin/comments` |
| GET/PUT/DELETE | `/api/admin/comments/:id` |

### 7.15 AI 配置

页面：

- 今日吃什么配置页。
- AI Prompt 配置页。
- 推荐规则配置页。
- AI 菜单生成记录页。
- 用户偏好规则配置页。
- 忌口规则配置页。
- AI 推荐策略详情/编辑。

接口：

| 方法 | 路径 |
|---|---|
| GET/POST | `/api/admin/ai-configs` |
| GET/PUT/DELETE | `/api/admin/ai-configs/:id` |
| PATCH | `/api/admin/ai-configs/:id/status` |
| GET/POST | `/api/admin/recommend-configs` |
| GET/PUT/DELETE | `/api/admin/recommend-configs/:id` |
| GET | `/api/admin/ai-generation-records` |
| POST | `/api/admin/ai/test-generate` |

### 7.16 搜索运营

页面：

- 全局搜索页。
- Command K 搜索弹窗。
- 热门搜索配置页。
- 搜索关键词分析页。
- 搜索无结果配置页。

接口：

| 方法 | 路径 |
|---|---|
| GET | `/api/admin/search/global` |
| GET/POST | `/api/admin/search/hot-keywords` |
| GET | `/api/admin/search/keyword-analysis` |
| GET/PUT | `/api/admin/search/no-result-config` |
| GET | `/api/mobile/search` |

### 7.17 数据报表

页面：

- 内容数据。
- 用户数据。
- 收藏数据。
- 浏览数据。
- 搜索数据。
- 价格数据。
- 采购数据。
- 用户行为路径。

接口：

| 方法 | 路径 |
|---|---|
| GET | `/api/admin/reports/content` |
| GET | `/api/admin/reports/users` |
| GET | `/api/admin/reports/favorites` |
| GET | `/api/admin/reports/recent-views` |
| GET | `/api/admin/reports/search` |
| GET | `/api/admin/reports/prices` |
| GET | `/api/admin/reports/purchases` |
| GET | `/api/admin/reports/user-paths` |

### 7.18 文件管理

页面：

- 图片库管理页。
- OSS 文件管理页。
- 图片上传弹窗。
- 图片裁剪页。
- 图片预览页。
- 图片删除确认弹窗。
- 上传记录。
- 文件分类。

接口：

| 方法 | 路径 |
|---|---|
| GET/POST | `/api/admin/files` |
| GET/PUT/DELETE | `/api/admin/files/:id` |
| POST | `/api/admin/files/upload` |
| POST | `/api/admin/files/crop` |
| GET | `/api/admin/files/usage/:id` |
| GET/POST | `/api/admin/file-folders` |

### 7.19 资源接口

页面：

- 菜谱资源接口。
- 食材资源接口。
- 调料资源接口。
- 水果资源接口。
- 调酒资源接口。
- 价格资源接口。

功能：

- 查看外部资源同步状态。
- 配置接口来源、频率、字段映射。
- 查看同步日志。
- 手动同步。

接口：

| 方法 | 路径 |
|---|---|
| GET/POST | `/api/admin/resource-connectors` |
| GET/PUT/DELETE | `/api/admin/resource-connectors/:id` |
| POST | `/api/admin/resource-connectors/:id/sync` |
| GET | `/api/admin/resource-connectors/:id/logs` |

### 7.20 系统设置

页面：

- 管理员管理页。
- 角色权限页。
- 菜单权限配置页。
- OSS 配置页。
- 上传规则配置页。
- 缓存配置页。
- API 配置页。
- 操作日志页。
- 系统基础配置。

接口：

| 方法 | 路径 |
|---|---|
| GET/POST | `/api/admin/admins` |
| GET/PUT/DELETE | `/api/admin/admins/:id` |
| GET/POST | `/api/admin/roles` |
| GET/PUT/DELETE | `/api/admin/roles/:id` |
| GET/PUT | `/api/admin/roles/:id/permissions` |
| GET/PUT | `/api/admin/menu-permissions` |
| GET/PUT | `/api/admin/system-configs` |
| GET | `/api/admin/operation-logs` |

---

## 8. 前端开发要求

### 8.1 技术范围

- 项目：`admin-frontend`。
- 技术栈：React + TypeScript + Vite。
- 样式：继续使用现有样式体系，按原型颜色变量抽象。

### 8.2 必做组件

| 组件 | 要求 |
|---|---|
| AdminLayout | 左侧固定导航，主内容滚动 |
| ResourceListPage | 搜索、筛选、状态、批量、分页、操作列 |
| DetailPageLayout | 左主列 + 右配置列 + 左列日志 |
| FormPageLayout | 分组表单、图片上传、保存/取消 |
| ConfigDrawer | 配置项回显、保存、取消、重置 |
| ConfirmModal | 删除、禁用、驳回、批量操作 |
| ImageUploader | 上传、裁剪、预览、选择图片库 |
| StatusTag | 草稿、已发布、已下架、待审核、驳回 |
| PriceChart | 平滑面积曲线、横纵坐标、无重复线 |
| CommandK | 全局搜索弹窗 |

### 8.3 路由规则

- 左侧导航只跳核心模块列表/配置首页。
- 详情、新增、编辑、预览通过列表操作进入。
- Drawer/Modal 不进入左侧菜单。
- 所有按钮必须绑定事件；暂未接接口时必须显示 Toast 或禁用态，不允许无反应。

### 8.4 请求封装

前端统一使用：

```ts
request<T>(url, {
  method,
  params,
  body,
  token: adminToken,
});
```

要求：

- 401 自动跳登录。
- 403 跳无权限页。
- 请求 loading。
- 保存成功 Toast。
- 保存失败显示后端 message。
- 列表页请求支持取消/防抖。

---

## 9. 后端开发要求

### 9.1 技术范围

- 项目：`server`。
- 技术栈：Express + TypeScript + Prisma + PostgreSQL。
- 旧 `admin-backend` 不作为主线。

### 9.2 后端分层

建议结构：

```text
server/src/routes/admin/{resource}.ts
server/src/services/{resource}.service.ts
server/src/validators/{resource}.schema.ts
server/src/http/response.ts
server/src/http/pagination.ts
```

### 9.3 必做能力

- 管理员鉴权。
- 角色权限。
- 操作日志。
- CRUD。
- 批量操作。
- 上下架。
- 推荐配置。
- 审核流。
- 文件上传。
- 价格历史。
- C 端聚合读取。

### 9.4 数据一致性

- B 端保存后，C 端只展示 `is_publish = true` 且审核通过的数据。
- 删除默认软删除。
- 价格趋势从价格历史表生成。
- 首页内容从 `home_configs` 生成，不写死。
- AI Prompt 从 `ai_configs` 读取，不写死在代码里。

---

## 10. 验收标准

### 10.1 页面验收

- 左侧菜单只有核心模块。
- 列表页必须有新增、搜索、筛选、状态、批量、分页、操作列。
- 详情/新增/编辑不出现在左侧菜单。
- 所有配置通过 Drawer。
- 删除/禁用/驳回/批量操作通过 Modal。
- 长页面可上下滚动。
- 操作列不被遮挡。
- 图表有坐标且不重复叠线。

### 10.2 接口验收

- 所有列表接口支持分页和筛选。
- 所有详情接口返回完整字段。
- 所有新增/编辑接口校验必填字段。
- 所有状态变更接口写操作日志。
- 所有 B 端配置能影响 C 端读取。

### 10.3 联调验收

必须验证：

1. B 端新增 Banner，C 端首页可见。
2. B 端新增菜谱，发布后 C 端列表/详情可见。
3. B 端配置食材价格，趋势图接口返回历史价格。
4. C 端用户投稿菜谱，B 端审核通过后 C 端可见。
5. B 端配置今日吃什么规则，C 端推荐结果变化。
6. B 端上传图片后，图片库可复用。
7. 禁用用户后，C 端用户不可继续操作。

### 10.4 上线前检查

必须通过：

- `admin-frontend`: build。
- `frontend`: type-check。
- `frontend`: build。
- `server`: build。
- Prisma migration。
- Prisma seed。
- 管理端接口测试。
- C 端接口测试。
- B 端到 C 端完整业务流测试。

---

## 11. 当前实现差距

根据现有代码与原型对比，当前仍需补齐：

1. 原型中的完整 242 个 Frame 对应的模块化开发拆分。
2. 价格历史、趋势、批量导入、来源配置的完整后端。
3. 菜篮子 / 采购 / 家庭管理后端。
4. 水果、调料、调酒独立资源后端。
5. 首页运营配置表和同步逻辑。
6. AI Prompt、推荐规则、用户偏好、忌口规则配置。
7. 文件库、OSS、裁剪、图片复用。
8. 审核中心、举报、下架原因、审核记录。
9. 数据报表。
10. 操作日志与角色权限在所有写操作中的落地。

---

## 12. 开发优先级

### P0：必须先做

1. 左侧导航与路由结构。
2. 通用列表页、详情页、表单页、Drawer、Modal。
3. 菜谱、食材、Banner、分类标签。
4. 价格历史与价格趋势。
5. 首页运营配置。
6. 文件上传与图片库。

### P1：核心运营

1. 水果、调料、调酒。
2. 菜篮子 / 采购。
3. 家庭管理。
4. 用户管理。
5. 审核中心与评论。

### P2：增长与智能

1. AI 配置。
2. 搜索运营。
3. 数据报表。
4. 资源接口。
5. 系统设置完善。
