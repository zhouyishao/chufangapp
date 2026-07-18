# 数据迁移清单

## 当前未冻结迁移

| migration | 目的 | 风险 | 进入基线条件 |
|---|---|---|---|
| `20260706090000_add_resource_api_provider_code` | provider code 及来源字段 | 已改为业务字段哈希；重复数据按稳定主键生成后缀。该 migration 已在本机早期版本执行，提交前需记录 checksum/rebaseline 策略 | 静态迁移测试通过；staging 复制数据上验证 checksum、耗时、锁和唯一约束 |
| `20260707113000_add_raw_import_records_and_provider_source_kind` | 原始导入记录及来源类型 | 需确认保留期、增长量、索引、审计模型例外 | 明确保留/清理策略并通过测试库部署 |

## 每次迁移强制记录

- migration 文件名、checksum、依赖顺序、目标 commit。
- schema 与数据库 drift 结果。
- 迁移前备份和可恢复点。
- 表规模、锁表风险和预计耗时。
- NULL、重复、未知枚举和孤儿关系预检。
- 回填脚本的幂等性及成功/跳过/失败计数。
- 应用兼容窗口、部署顺序和回滚方式。
- 迁移后约束、索引、外键、数量及 smoke test。

## 资源 provider 特别约束

- provider code 不得依赖数据库自增 ID。
- 预置 provider 的权威来源只能是 migration、seed、显式初始化任务三者之一。
- 普通服务启动不得静默写入缺失 provider 后继续报告健康。
- provider secret 不写日志、不进入 API 响应、不进入 Git。
- RawImportRecord 必须有容量、保留期和清理策略。

## 后续阶段预期新增

- 用户个人偏好、忌口、过敏和共享范围。
- 采购批次与采购明细。
- 通知、家庭活动和接收记录。
- 统一内容收藏与浏览。
- 菜谱步骤媒体与调制饮品步骤。
- 显式内容推荐关系。
- 文件元数据、引用和生命周期。

所有新增迁移遵循：新增表/字段 → 双写/回填 → 切读 → 稳定后移除旧字段；禁止清空数据库。

## 2026-07-18 开发库状态与恢复点

- PostgreSQL：16.14（Homebrew）。
- Prisma：24 个 migration，状态 `Database schema is up to date!`。
- 逻辑备份：`/private/tmp/chufangapp-stage0-20260718.dump`，custom/gzip，635483 bytes、564 TOC 条目。
- 恢复演练：隔离临时库恢复成功；24 条 migration、52 张 public 表；临时库随后删除。
- 注意：备份位于临时目录，不进入 Git，也不作为长期保留或生产恢复点。
- 已应用 migration 被修改的处理：本开发库仅用于基线；进入 staging 前必须以全新库从 0 执行全部 migration，并在 staging 复制数据上执行一次升级演练。若 Prisma 报已应用 migration checksum 变化，不得直接修改生产 `_prisma_migrations`，应停止部署并走重新基线/补偿 migration 决策。
