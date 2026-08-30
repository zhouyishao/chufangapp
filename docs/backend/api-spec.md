# API 规格

## 后端识别

- 主后端：`server/`
- 技术栈：Node.js + Express + TypeScript + Prisma + PostgreSQL
- 管理端前缀：`/api/admin/*`
- C 端前缀：`/api/*`、`/api/mobile/*`

## 统一返回结构

成功：

```json
{ "code": 0, "message": "success", "data": {} }
```

分页：

```json
{ "code": 0, "message": "success", "data": { "list": [], "total": 0, "page": 1, "pageSize": 10 } }
```

失败：

```json
{ "code": 400, "message": "错误信息", "data": null }
```

## 已有核心接口

### 管理端

- `POST /api/admin/auth/login`
- `GET /api/admin/auth/profile`
- `GET/POST/PUT/DELETE /api/admin/categories`
- `GET /api/admin/categories` 支持 `level=1|2`、`isPublish=true|false`，并返回直属、子树、C 端公开内容数及筛选结果汇总。
- 已有关联内容或子分类的分类禁止修改类型；分类层级最多两级。
- `GET/POST/PUT/DELETE /api/admin/ingredients`
- `GET/POST/PUT/DELETE /api/admin/recipes`
- `GET/POST/PUT/DELETE /api/admin/recommendations`
- `GET/POST/PUT/DELETE /api/admin/seasonal-foods`
- `GET/POST/PUT/DELETE /api/admin/cuisines`
- `GET/POST/PUT/DELETE /api/admin/menus`
- `GET/POST/PUT/DELETE /api/admin/banners`
- `GET/POST/PUT/DELETE /api/admin/users`
- `GET/POST/PUT/DELETE /api/admin/posts`
- `GET/POST/PUT/DELETE /api/admin/comments`
- `PATCH /api/admin/home/top-navs/:navId/modules/reorder`：事务保存完整、连续且无重复的首页模块顺序
- `GET /api/admin/purchase-lists`、`GET /api/admin/purchase-lists/:scopeType/:scopeId`：只读查看真实家庭/个人菜篮及明细
- `GET /api/admin/search-logs/overview`、`GET /api/admin/search-logs`：真实搜索汇总与分页日志
- `GET /api/admin/users/behavior`：统一查询浏览、收藏、搜索、加入菜篮四类真实用户行为
- `GET/POST /api/admin/admins`、`GET/PUT/DELETE /api/admin/admins/:id`：管理员查询、创建、编辑和软删除
- `PUT /api/admin/admins/:id/password`、`PATCH /api/admin/admins/:id/status`：重置密码和启停管理员
- `GET/POST /api/admin/roles`、`GET/PUT/DELETE /api/admin/roles/:id`：角色查询、创建、编辑和软删除
- `PUT /api/admin/roles/:id/permissions`、`PATCH /api/admin/roles/:id/status`：完整替换角色权限和启停角色
- `GET /api/admin/permissions`：按模块返回后台权限目录
- `GET /api/admin/operation-logs`：按管理员/模块/动作/日期分页查询只读操作日志

### 管理后台 RBAC

登录成功返回：

```json
{
  "token": "<jwt>",
  "admin": { "id": 1, "username": "admin", "nickname": "管理员", "lastLoginAt": "2026-08-13T08:00:00.000Z" },
  "role": { "id": 1, "code": "SUPER_ADMIN", "name": "超级管理员", "isSystem": true },
  "permissions": ["*"]
}
```

- 管理员列表、角色列表与操作日志均使用统一分页结构。
- 管理员密码至少 8 位并同时包含字母和数字，只保存 bcrypt 哈希；列表、详情和日志均不返回密码或哈希。
- 角色权限替换采用完整 `permissionIds` 数组，不存在或已停用的权限返回 HTTP 409。
- 无有效登录返回 401；登录有效但权限不足返回 403；自停用、最后超级管理员降权/删除、删除在用角色等业务冲突返回 409。

### C 端

- `POST /api/mobile/auth/login`
- `GET /api/mobile/home`
- `GET /api/mobile/recipes`
- `GET /api/mobile/recipes/:id`
- `GET /api/mobile/ingredients`
- `GET /api/mobile/ingredients/:id`
- `GET /api/mobile/recommendations`
- `GET /api/mobile/seasonal-foods`
- `GET /api/mobile/search`
- `GET/POST/DELETE /api/mobile/favorites`
- `GET /api/mobile/profile`

`GET /api/mobile/search` 在登录态下按用户和关键词持久化搜索历史；每次调用原子累加 `searchCount`，并更新最近的 `resultCount`。

### C 端认证会话

`POST /api/mobile/auth/login` 仅允许已由后台开通的账号登录。请求体：

```json
{ "phone": "13956785678", "password": "user12345" }
```

成功后返回真实 App 会话：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "user": { "id": 12, "phone": "13800000000", "nickname": "小周" },
    "accessToken": "<jwt>",
    "expiresIn": 604800
  }
}
```

- App Token 使用 `Authorization: Bearer <accessToken>` 传递，有效期 7 天。
- 手机号不存在或密码错误统一返回 HTTP 401“手机号或密码错误”，且不会自动创建用户。
- 历史用户尚未设置密码时返回 HTTP 403“账号尚未设置密码，请联系管理员”。
- 禁用用户返回 HTTP 403，不签发 Token。
- 登录响应和后台用户响应均不得包含 `passwordHash`。
- Token 缺失、过期、签名错误、类型错误，或用户已禁用时返回 HTTP 401。
- 已登录但无资源权限，或兼容 `userId` 与 Token 用户不一致时返回 HTTP 403。
- `GET/POST/PUT/DELETE /api/mobile/basket-items` 必须携带 App Token。
- 菜篮接口在兼容期仍允许传 `userId`，但它不再是可信身份；服务端始终以 Token 用户为准。
- 登录接口和公开内容接口不要求 App Token。

### 后台开通与重置 C 端账号

- `POST /api/admin/users` 创建 C 端账号时，手机号和初始密码必填。
- 密码至少 8 位，必须同时包含字母和数字；服务端使用 bcrypt 成本参数 10 存储哈希。
- `PUT /api/admin/users/:id` 的密码为空或不提交时保留原哈希；提交合法新密码时完成重置。
- 当前阶段未接入短信验证码，C 端注册与自助找回密码均不开放。
- 本地开发/验收账号为 `13956785678 / user12345`，不得作为生产默认账号或密码。

## 字段变更规则

新增或修改字段时必须同步检查：

1. 后台录入表单。
2. API 返回结构。
3. 数据库默认值。
4. C 端列表和详情展示。
5. 空值展示。

历史接口清单见：`docs/api-spec.md`。

## 内容图片字段

- 食材、水果、调料共用 `Ingredient.transparentImage`，酒水使用 `Beverage.transparentImage`。
- `transparentImage` 为选填的透明背景实物图 URL，建议上传 1:1 PNG/WebP，用于菜谱用料和紧凑内容卡片。
- 管理端可同时提交对应的 `transparentImageFileId`；仅提交 URL 时，后端会按已上传文件 URL 回填文件引用。
- C 端紧凑图片取值顺序为 `transparentImage ?? cover`（酒水为 `transparentImage ?? coverImage`）。详情封面和普通列表仍使用原封面字段。
