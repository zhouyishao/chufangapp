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

### 中国菜谱资源治理

菜谱 Provider 同步只允许被标记为 `PRIMARY`（中国菜谱主源）或
`SUPPLEMENTAL`（中国菜谱补充源）的来源。当前约定为：`proj_kitchen` 是主源，
`tianapi_caipu` 是补充源；`themealdb_recipe` 是海外历史源、`mock_recipe` 是测试
历史源。海外和测试来源保留既有 Provider、批次、原始响应与历史记录以便追溯，
但不能创建新的菜谱同步批次。

- `GET/POST/PUT/DELETE /api/admin/resource-api-providers`：维护数据 Provider。
  菜谱 Provider 还需记录 `termsUrl` 和 `licenseNote`；密钥类字段只在服务端保存，
  任何列表、详情、测试或同步响应均不得返回。
- `POST /api/admin/resource-api-providers/:id/test`：仅测试 Provider 连通性。测试不
  替代生产同步许可校验。
- `POST /api/admin/resource-api-providers/:id/sync`：创建 Provider 同步批次。Provider
  必须为启用状态；中国菜谱主源或补充源还必须已填写内容许可/授权说明。一次首批
  同步最多 20 条，完成去重、分类映射、媒体完整性和审核率评估后才可提升至 50 条。
- `GET /api/admin/resource-imports/items`：支持 `isChinese`、`minQuality`、
  `maxQuality` 查询参数；质量分范围为 0–100。返回值含 `qualityScore`、
  `isChinese`、`qualityIssues`、`filterCode` 和来源追溯字段。
- `POST /api/admin/resource-imports/items/bulk-ignore`：提交 `itemIds`（1–500 个）
  和 `reason`，只允许批量忽略状态为 `PENDING` 或 `FAILED` 的菜谱导入项；操作与
  批次统计会在同一事务中更新并写入操作日志。
- `POST /api/admin/resource-imports/confirm`：确认时会重新执行中国家庭菜准入校验。
  候选菜谱必须有中文有效标题、映射后的分类、至少两项有效用料、至少一个步骤、
  可追溯来源，且质量分不低于 80；否则不能导入。

确认导入的菜谱固定以 `sourceType = IMPORT`、`auditStatus = PENDING`、
`isPublish = false` 创建，并复制导入质量分。导入菜谱在
`PATCH /api/admin/recipes/:id/publish` 发布前，必须审核通过、状态启用、上传受管
封面（`coverFileId`），并满足至少两项用料和一个步骤；任一条件不满足时返回业务
冲突错误，不能绕过审核直接发布。

历史修复命令如下，默认仅输出 JSON 预览，不删除任何数据：

```bash
cd server
npm run data:repair-chinese-recipes
```

预览输出会列出拟隐藏的海外、英文或测试正式菜谱，以及拟忽略的海外/测试待处理或
失败导入项。逐项审查后，才可由有权限的维护人员执行带 `--apply` 的命令；该命令只
下架正式菜谱、忽略导入项并刷新批次统计，不删除 Provider、批次、原始响应、菜谱或
Git 历史。

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
