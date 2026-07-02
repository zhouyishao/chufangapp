# Headroom 使用说明

## 目标

Headroom 用于压缩 AI 编码过程中的大段工具输出、日志、搜索结果、文件内容和上下文，减少无效 token，同时保留可按需取回的原文。

本项目把 Headroom 作为 Codex 工作流辅助工具使用，不作为业务运行时依赖。

## 当前安装

- 安装方式：`uv tool install "headroom-ai[all]"`
- 已验证命令：`headroom --version`
- 当前版本：`0.26.0`
- 官方文档：`https://headroom-docs.vercel.app/docs`
- GitHub：`https://github.com/chopratejas/headroom`

## 执行命令前规则

每次执行 shell 命令前，先按以下顺序调用/检查：

1. 如果当前 Codex 环境暴露 Headroom MCP 工具，先调用 Headroom 查看或压缩预计会很大的上下文：
   - `headroom_compress`：压缩大段文件、日志、搜索结果、JSON 输出。
   - `headroom_retrieve`：需要原文时按 hash 取回。
   - `headroom_stats`：查看本轮压缩统计。
2. 如果当前环境没有 Headroom MCP 工具，执行命令前先判断输出规模，并优先使用 Headroom CLI 或限制输出：
   - 项目概览优先用 `headroom loc`，避免无范围 `find`、`ls -R`。
   - 结构搜索优先用 `headroom sg` 或 `rg` 加精确路径。
   - 差异查看优先用 `headroom diff` 或 `git diff --stat` / 限定文件。
   - 长日志必须加 `--tail`、`sed -n`、`head`、`tail` 或测试框架过滤参数。
3. 禁止为了“看一下”直接输出超大文件、完整构建产物、完整 lockfile、完整日志或无范围搜索结果。

## Codex 接入方式

### 推荐：当前项目内约束

当前已通过 `AGENTS.md` 引用本文件。后续 Codex 任务执行命令前，按本文件规则使用 Headroom 或限制输出。

### 可选：MCP 工具

Headroom 文档支持 MCP 工具，常用命令：

```bash
headroom mcp status
headroom mcp install
```

MCP 工具暴露后，可以按需调用 `headroom_compress`、`headroom_retrieve`、`headroom_stats`。

### 暂不推荐：全局 Codex provider 注入

暂不执行：

```bash
headroom init codex
```

原因：该命令会修改全局 Codex provider 配置。公开 issue 中提到，某些 Codex Desktop 版本可能因此按 provider 过滤历史会话，导致旧会话看起来不可见。只有用户明确确认接受该影响时再执行。

## 不接入业务依赖

当前 `frontend/`、`admin-frontend/`、`server/` 不需要安装 `headroom-ai` 业务依赖。只有当项目新增 LLM 调用并明确需要在业务代码里压缩消息时，才按官方文档选择：

```bash
npm install headroom-ai
pip install "headroom-ai[proxy]"
```

并同步更新对应 lockfile、启动方式和环境变量说明。
