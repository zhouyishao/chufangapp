# Skill / 工具调度说明

本文档说明本项目里 `pm-product-discovery`、`Superpowers`、`Headroom` 的使用入口、适用场景和默认调用规则。

## 总规则

- 每次新任务开始前，先读 `AGENTS.md`、`docs/codex/coding-rules.md`、`docs/codex/checklist.md`。
- 如果任务属于发现、规划、排障、验证、上下文压缩中的任一类，必须先判断是否要调用本文档中的 skill 或工具。
- 优先顺序：
  1. `Headroom`
  2. `Superpowers`
  3. `pm-product-discovery`

原因：
- `Headroom` 决定怎么安全读取大输出。
- `Superpowers` 决定怎么执行任务流程。
- `pm-product-discovery` 决定怎么做产品发现类分析。

## 1. Headroom

### 作用

- 压缩长日志、长文件、长搜索结果，减少无效上下文。
- 在不丢关键结论的前提下，控制 shell 输出规模。

### 什么时候用

- 每次准备执行 shell 命令前。
- 预计输出会很大时：
  - 全项目扫描
  - 长日志
  - 大 diff
  - 大 JSON
  - 多文件搜索结果

### 默认调用规则

- 有 Headroom MCP 工具时，优先用 MCP：
  - `headroom_compress`
  - `headroom_retrieve`
  - `headroom_stats`
- 没有 MCP 工具时，优先用 CLI 或限制输出：
  - `headroom loc`
  - `headroom sg`
  - `headroom diff`
  - `sed -n`
  - `head`
  - `tail`
  - 精确路径 `rg`

### 禁止

- 不要为了“先看一下”直接输出完整日志、完整 lockfile、完整构建产物。
- 不要执行 `headroom init codex`，除非用户明确确认。

## 2. Superpowers

### 作用

- 为 Codex 任务提供固定流程，而不是凭感觉直接改代码。
- 常用于排障、规划、执行计划、完成前验证。

### 推荐优先使用的 skill

- `superpowers:using-superpowers`
  - 每次任务开始先检查是否有适用 skill。
- `superpowers:systematic-debugging`
  - 任何 bug、异常行为、接口不一致、测试失败先用。
  - 规则是先找根因，再修复。
- `superpowers:writing-plans`
  - 多步骤需求、跨文件实现、要写实施方案时用。
- `superpowers:verification-before-completion`
  - 声称“已完成”“已修好”“可提交”前必须用。

### 默认调用规则

- 遇到 bug：
  - 先调用 `systematic-debugging`
  - 再决定是否改代码
- 遇到复杂需求：
  - 先调用 `writing-plans`
  - 再开始实施
- 准备结束任务、提交、推送、建 PR：
  - 先调用 `verification-before-completion`
  - 运行真实验证命令后再宣告完成

## 3. pm-product-discovery

### 作用

- 用于产品发现、需求判断、机会识别、假设分析、方案优先级，不用于直接替代工程实现。
- 适合把模糊产品问题结构化。

### 适用 skill 入口

- 需求/功能脑暴：
  - `pm-product-discovery:brainstorm-ideas-existing`
  - `pm-product-discovery:brainstorm-ideas-new`
- 方案实验设计：
  - `pm-product-discovery:brainstorm-experiments-existing`
  - `pm-product-discovery:brainstorm-experiments-new`
- 风险假设识别：
  - `pm-product-discovery:identify-assumptions-existing`
  - `pm-product-discovery:identify-assumptions-new`
- 机会树/发现结构化：
  - `pm-product-discovery:opportunity-solution-tree`
- 功能优先级：
  - `pm-product-discovery:prioritize-features`
  - `pm-product-discovery:prioritize-assumptions`
- 访谈研究：
  - `pm-product-discovery:interview-script`
  - `pm-product-discovery:summarize-interview`
- 需求池分析：
  - `pm-product-discovery:analyze-feature-requests`

### 默认调用规则

- 用户在问“做什么”“先做哪个”“机会点是什么”“这个功能值不值得做”时，优先检查 `pm-product-discovery`。
- 用户要访谈提纲、机会树、优先级表、假设清单时，必须优先检查 `pm-product-discovery`。
- 如果任务已经明确是纯工程实现，不要强行调用 `pm-product-discovery`。

## 自动调用清单

每次任务按下面顺序判断：

1. 执行 shell 前，先判断是否需要 `Headroom`。
2. 如果是 bug / 计划 / 完成验证，先判断 `Superpowers`。
3. 如果是需求发现 / 优先级 / 假设 / 访谈，先判断 `pm-product-discovery`。
4. 命中则先读取对应文档或 skill，再进入实际执行。

## 对 chufangapp 的建议约定

- 文档、规则、执行流程任务：
  - 先看 `Superpowers`
- 大输出排查、日志、diff、搜索：
  - 先用 `Headroom`
- 产品策略、功能取舍、发现类文档：
  - 先用 `pm-product-discovery`

## 关联文档

- `AGENTS.md`
- `docs/codex/coding-rules.md`
- `docs/codex/checklist.md`
- `docs/codex/headroom.md`
