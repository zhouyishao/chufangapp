# 阻塞与风险

| 日期 | 问题 | 影响 | 当前处理 |
|---|---|---|---|
| 2026-05-24 | Figma MCP 可读取 `10:2`，但 XML 输出在工具结果中被截断 | 无法确认所有 Figma Frame 的完整 node id | 已记录到 `docs/figma-missing-info.md`，先结合已识别节点、导航目录和执行骨架补齐页面清单 |
| 2026-05-24 | 当前项目是多子项目结构，根目录没有统一 `package.json` | 测试命令需按子项目分别执行 | 已将 `/Users/oooz/Desktop/Z_ou/chufangapp` 作为 Git 工作区总根，后续分别运行 admin-frontend/frontend/server 命令 |
| 2026-05-24 | `admin-backend` 与 `server` 存在后端职责重叠 | 可能导致接口来源混乱 | 暂定以 `server` 为主线后端，`admin-backend` 仅作为历史参考 |
| 2026-05-24 | sandbox 默认不允许连接本机 PostgreSQL | migration、seed、接口冒烟测试需要数据库连接 | 已通过用户授权执行本机数据库相关命令，migration/seed 已完成 |
| 2026-05-24 | Codex in-app Browser 访问 `127.0.0.1:3002` 被拦截为 `ERR_BLOCKED_BY_CLIENT` | 无法在浏览器里完成后台登录后的真实接口页面截图 | 已通过 shell curl 完成接口冒烟；后台前端构建通过。后续可在本机浏览器手动访问或调整浏览器插件限制后复测 |
