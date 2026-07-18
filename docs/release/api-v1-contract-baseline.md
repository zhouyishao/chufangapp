# API v1 契约基线

本文件冻结当前接口事实并定义迁移目标。当前服务尚无统一 `/api/v1` 前缀，不在阶段 0 机械增加新前缀。

## 当前挂载面

| 范围 | 路径 | 当前鉴权 |
|---|---|---|
| 后台 | `/api/admin/auth` | 登录公开；其余 Admin JWT |
| 后台内容 | `/api/admin/categories`、`ingredients`、`recipes`、`beverages` 等 | Admin JWT |
| 后台首页 | `/api/admin/home/top-navs` 及 Banner/Module 子资源 | Admin JWT |
| 后台资源 | `/api/admin/resource-api-providers`、`/api/admin/*resources*` | Admin JWT |
| 公共内容 | `/api/home`、`/api/app/home`、`/api/app` | Public |
| 公共详情 | `/api/recipes`、`/api/ingredients`、`/api/beverages` | Public |
| 移动端 | `/api/mobile/*` | 混合；目前只有菜篮明确强制 App JWT |
| 兼容路径 | `/api/mobile/recipes`、`/api/mobile/ingredients` | Public，与公共详情重复 |

## 当前响应事实

当前实现使用：

```ts
type CurrentResponse<T> = {
  code: number
  message: string
  data: T | null
}

type CurrentPage<T> = {
  list: T[]
  total: number
  page: number
  pageSize: number
}
```

目标统一结构为：

```ts
type ApiSuccess<T> = { success: true; data: T; requestId: string }
type ApiFailure = {
  success: false
  error: { code: string; message: string; details?: unknown }
  requestId: string
}
type PageResult<T> = {
  items: T[]
  page: number
  pageSize: number
  total: number
  hasMore: boolean
}
```

迁移要求：先提供兼容适配层与契约测试，不能一次删除当前 envelope。

## 鉴权冻结与偏差

- Admin Token 和 App Token 类型不可互换。
- App 身份最终只允许来自 JWT `sub`。
- 当前菜篮已支持 Token 用户与旧 `userId` 一致性校验。
- favorites、history、profile、family、my-recipes、preferences、notification、upload 等私有接口必须在阶段 1 强制 `requireAppAuth`。
- 家庭接口必须在服务端区分创建者、管理员和普通成员。
- 后台权限不能只依赖前端按钮隐藏，服务端需要 RBAC/permission 校验。

## 契约冻结字段

每个接口的正式快照必须记录：method、完整 path、path/query/body、默认值、枚举、鉴权、HTTP 状态、业务错误码、分页、排序、日期/时区、金额/单位、null 语义、幂等、软删除和废弃日期。

## 纵向切片验收

1. 后台创建并发布菜谱。
2. 首页模块返回相同菜谱卡片。
3. 详情返回用料、媒体步骤、小贴士和家庭提醒。
4. 加入菜篮合并到当前家庭。
5. 去烹饪返回 GuidedFlow 并支持计时和完成。
6. 收藏、取消收藏和浏览记录出现在“我的”。
7. 后台下架后，列表、搜索和直接详情均不可继续读取。

