# Codex 项目规则

本项目是家庭菜谱 App，需要完整开发 B 端后台、C 端用户端、后端接口、数据库、接口联调、测试和上线前检查。

最高规则：

* 不允许漏页面
* 不允许只做静态页面
* 不允许只做 B 端不做 C 端
* 不允许只做前端不做后端
* 不允许只用 mock 不接真实接口
* 每完成一个页面必须更新 docs/implementation-checklist.md
* 每完成一个阶段必须更新 docs/progress-report.md
* 如果中断，下次必须从 checklist、progress-report、blockers 和 git diff 继续
* 如果页面数量、路由数量、页面文件数量不一致，必须先补齐骨架，不允许继续写 UI
* 最终必须完成 lint、typecheck、build、migration、seed、接口测试、B 端测试、C 端测试、完整业务流测试
