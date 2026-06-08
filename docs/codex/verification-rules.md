# 验证规则

## 构建与类型检查

按修改范围执行：

```bash
cd admin-frontend && npm run build
cd frontend && npm run type-check
cd server && npm run build
```

如项目脚本不存在，使用该子项目实际脚本，并在完成总结说明。

## 联调启动

```bash
cd server && npm run dev
cd admin-frontend && npm run dev
cd frontend && npm run dev:h5
```

## 页面验证

- 页面能打开。
- 页面无明显错位。
- 核心按钮有反馈。
- 接口错误不白屏。
- 空数据有空态。

## 接口验证

- 返回结构符合 `docs/backend/api-spec.md`。
- 分页字段完整。
- 错误信息明确。
- 字段与数据库模型一致。

## 数据库验证

- Prisma schema 可通过检查。
- migration 不做破坏性操作。
- seed 不清空用户数据。

## 完成标准

- 功能闭环。
- 构建或类型检查通过。
- 后台到 C 端展示链路可验证。
- 风险点明确列出。
