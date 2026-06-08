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

## 字段变更规则

新增或修改字段时必须同步检查：

1. 后台录入表单。
2. API 返回结构。
3. 数据库默认值。
4. C 端列表和详情展示。
5. 空值展示。

历史接口清单见：`docs/api-spec.md`。
