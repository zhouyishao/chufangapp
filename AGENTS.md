# Codex 项目规则

本项目是家庭菜谱 App，需要完整开发 B 端后台、C 端用户端、后端接口、数据库、接口联调、测试和上线前检查。

## 最新前端组件库覆盖规则

用户已明确更新前端组件库规范。后续涉及对应目录时，以目录内 `AGENTS.md` 为准：

* 管理后台 `admin-frontend/`：React + TypeScript + Ant Design Pro / Ant Design
* C 端 `frontend/`：React + TypeScript + TailwindCSS + shadcn/ui
* 图标统一优先使用 `lucide-react`；管理后台也允许使用 `@ant-design/icons` 或 `react-icons`
* 不从零手写复杂基础组件，按页面功能组合现成组件库能力
* 所有可复用组件独立封装到 `components` 目录

注意：`frontend/` 当前历史代码仍包含 uni-app + Vue，实现新 C 端页面或重构 C 端页面时必须按上述 React 技术栈逐步迁移，不再新增 Vue/NutUI 页面。

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
## Figma 原型图与 C 端页面实现规则

当任务涉及 Figma、高保真原型图、C 端页面、移动端 UI、截图还原、页面重构、前端样式优化时，必须使用 `figma-prototype-to-mobile-ui` Skill。

用户提供的原型图是唯一视觉参考。不要自由发挥重新设计。

如果当前代码页面与用户原型图不一致，以用户原型图为准。

页面结构、模块顺序、间距、颜色、圆角、字体层级、卡片样式、按钮样式、底部导航、顶部搜索和 Tab，都必须尽量按原型图还原。

所有 C 端页面必须使用真实接口数据，不允许使用 mock、mockData、fakeData、demoData、staticData、sampleData 或写死数组冒充接口数据。

完成页面修改后，必须输出：
1. 已修改页面清单
2. 对应原型图来源
3. 抽取或复用的公共组件
4. 页面绑定接口
5. 已替换的假数据位置
6. 与原型图仍不一致的地方
7. lint/build 结果
