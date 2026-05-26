# API 规格

## 统一返回结构

```ts
type ApiResponse<T> = {
  code: number;
  message: string;
  data: T;
};
```

## 当前后端识别

- 主后端：`server`
- 技术栈：Node.js + Express + TypeScript + Prisma + PostgreSQL
- 当前已实现路由：
  - `POST /api/admin/auth/login`
  - `GET /api/admin/auth/profile`
  - `GET/POST /api/admin/categories`
  - `GET/PUT/DELETE /api/admin/categories/:id`
  - `PATCH /api/admin/categories/:id/publish`
  - `PATCH /api/admin/categories/:id/status`
  - `GET/POST /api/admin/ingredients`
  - `GET/PUT/DELETE /api/admin/ingredients/:id`
  - `PATCH /api/admin/ingredients/:id/publish`
  - `PATCH /api/admin/ingredients/:id/recommend`
  - `PATCH /api/admin/ingredients/:id/status`
  - `GET/POST /api/admin/recipes`
  - `GET/PUT/DELETE /api/admin/recipes/:id`
  - `PATCH /api/admin/recipes/:id/publish`
  - `PATCH /api/admin/recipes/:id/recommend`
  - `PATCH /api/admin/recipes/:id/status`
  - `PATCH /api/admin/recipes/:id/audit`
  - `GET /api/home`
  - `GET /api/recipes`
  - `GET /api/recipes/:id`
  - `GET /api/ingredients`
  - `GET /api/ingredients/:id`
  - `GET/POST/PUT/DELETE /api/admin/recommendations`
  - `GET/POST/PUT/DELETE /api/admin/seasonal-foods`
  - `GET/POST/PUT/DELETE /api/admin/cuisines`
  - `GET/POST/PUT/DELETE /api/admin/menus`
  - `GET/POST/PUT/DELETE /api/admin/banners`
  - `GET/POST/PUT/DELETE /api/admin/users`
  - `GET/POST/PUT/DELETE /api/admin/posts`
  - `GET/POST/PUT/DELETE /api/admin/comments`
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

## 必补 B 端接口

| 方法 | 路径 | 用途 | 状态 |
|---|---|---|---|
| GET | /api/admin/recommendations | 今日推荐列表 | 已完成 |
| POST | /api/admin/recommendations | 新增今日推荐 | 已完成 |
| PUT | /api/admin/recommendations/:id | 编辑今日推荐 | 已完成 |
| DELETE | /api/admin/recommendations/:id | 删除今日推荐 | 已完成 |
| GET | /api/admin/seasonal-foods | 时令食材列表 | 已完成 |
| POST | /api/admin/seasonal-foods | 新增时令食材 | 已完成 |
| GET | /api/admin/cuisines | 菜系列表 | 已完成 |
| POST | /api/admin/cuisines | 新增菜系 | 已完成 |
| GET | /api/admin/menus | 场景菜单列表 | 已完成 |
| POST | /api/admin/menus | 新增场景菜单 | 已完成 |
| GET | /api/admin/banners | Banner 列表 | 已完成 |
| POST | /api/admin/banners | 新增 Banner | 已完成 |
| GET | /api/admin/users | 用户列表 | 已完成 |
| GET | /api/admin/posts | 晒菜内容列表 | 已完成 |
| GET | /api/admin/comments | 评论列表 | 已完成 |
| GET | /api/admin/settings | 系统设置 | 未开始 |

## 必补 C 端接口

| 方法 | 路径 | 用途 | 状态 |
|---|---|---|---|
| POST | /api/mobile/auth/login | C 端登录 | 已完成 |
| GET | /api/mobile/home | C 端首页 | 已完成 |
| GET | /api/mobile/recipes | 菜谱列表 | 已完成 |
| GET | /api/mobile/recipes/:id | 菜谱详情 | 已完成 |
| GET | /api/mobile/ingredients | 食材列表 | 已完成 |
| GET | /api/mobile/ingredients/:id | 食材详情 | 已完成 |
| GET | /api/mobile/recommendations | 今日推荐 | 已完成 |
| GET | /api/mobile/search | 搜索 | 已完成 |
| POST | /api/mobile/favorites | 收藏 | 已完成 |
| DELETE | /api/mobile/favorites/:id | 取消收藏 | 已完成 |
| GET | /api/mobile/profile | 我的页面 | 已完成 |
