# 后端 API 开发规范

## 1. 架构约束

- 所有新接口在 `server/` 实现
- 禁止在 `admin-backend/`（旧 Express+MySQL）和 `backend/`（旧 FastAPI）新增功能
- 路由文件放在 `server/src/routes/admin/`（管理端）和 `server/src/routes/api/`（C 端）
- 数据库使用 Prisma ORM，不直接写 SQL

## 2. 路由前缀

| 端 | 前缀 | 目录 |
|----|------|------|
| 管理后台 | `/api/admin/*` | `routes/admin/` |
| C 端 App | `/api/*` 或 `/api/app/*` | `routes/api/` |

## 3. 接口返回格式

统一成功：
```json
{ "code": 0, "message": "success", "data": {} }
```

统一分页：
```json
{ "code": 0, "message": "success", "data": { "list": [], "total": 0, "page": 1, "pageSize": 10 } }
```

统一失败：
```json
{ "code": 400, "message": "参数错误", "data": null }
```

## 4. 字段设计规则

新增字段时必须同时考虑：
1. 后台录入（表单字段类型、校验规则）
2. C 端展示（列表/详情哪个位置展示）
3. 默认值（null / 空字符串 / false 哪个更合理）
4. 空状态（C 端字段为空时显示什么）

## 5. 数据流向

```
后台表单 → API → 数据库
数据库 → API → C 端页面
```

不允许：
- 只改前端不落库
- 只落库不提供查询接口
- C 端继续依赖假数据
- 接口字段与数据库字段不匹配

## 6. 删除操作

- 所有删除使用软删除（设置 `deletedAt`）
- 删除前检查是否有外键引用
- 被引用时返回明确错误提示

## 7. 认证

- 管理后台：JWT Bearer Token（`requireAdminAuth` 中间件）
- C 端：按需使用手机号/微信登录

## 8. 文件上传

- 上传目录：`server/uploads/`
- 静态访问：`/uploads/xxx.png`
- 接口：`POST /api/admin/upload/image`

## 9. 环境变量

- 配置文件：`server/.env`（不提交）
- 模板：`server/.env.example`（提交）
- 禁止在代码中硬编码数据库密码、密钥、Token
