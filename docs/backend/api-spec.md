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

### C 端认证会话

`POST /api/mobile/auth/login` 成功后返回真实 App 会话：

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
- Token 缺失、过期、签名错误、类型错误，或用户已禁用时返回 HTTP 401。
- 已登录但无资源权限，或兼容 `userId` 与 Token 用户不一致时返回 HTTP 403。
- `GET/POST/PUT/DELETE /api/mobile/basket-items` 必须携带 App Token。
- 菜篮接口在兼容期仍允许传 `userId`，但它不再是可信身份；服务端始终以 Token 用户为准。
- 登录接口和公开内容接口不要求 App Token。

## 字段变更规则

新增或修改字段时必须同步检查：

1. 后台录入表单。
2. API 返回结构。
3. 数据库默认值。
4. C 端列表和详情展示。
5. 空值展示。

历史接口清单见：`docs/api-spec.md`。
