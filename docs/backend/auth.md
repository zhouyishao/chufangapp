# 鉴权规则

## 管理后台

- 使用 JWT Bearer Token。
- 登录接口：`POST /api/admin/auth/login`。
- 用户信息接口：`GET /api/admin/auth/profile`。
- 需要鉴权的管理接口必须经过 `requireAdminAuth`。

## C 端

- MVP 支持手机号登录。
- 后续可扩展微信登录。
- 涉及收藏、浏览历史、家庭、采购记录的接口需要识别用户身份。

## 安全要求

- 不在代码中硬编码 JWT Secret。
- `.env` 不提交。
- `.env.example` 只保留字段名和示例值。
- Token 失效时前端必须跳转登录或提示重新登录。
