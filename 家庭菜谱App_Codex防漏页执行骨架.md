# 家庭菜谱 App Codex 防漏页执行骨架

## 一、本文件用途

本文件用于约束 Codex 开发家庭菜谱 App 时不要漏页面、不要跳步骤、不要只做静态页面。

Codex 必须根据 Figma 原型、项目任务书和本文件，逐步完成：

1. Figma 页面盘点
2. 路由骨架
3. 数据库
4. 后端接口
5. B 端后台管理系统
6. C 端用户端
7. B 端到 C 端联调
8. 测试
9. 上线前检查

## 二、最高规则

1. 不允许漏页面。
2. 不允许只做一个页面。
3. 不允许只做 B 端，不做 C 端。
4. 不允许只做前端，不做后端。
5. 不允许只写 mock，不接真实接口。
6. 不允许跳过测试。
7. 不允许跳过文档更新。
8. 每完成一个页面，必须更新 docs/implementation-checklist.md。
9. 每完成一个阶段，必须更新 docs/progress-report.md。
10. 如果中断，下次必须从 checklist 和 progress-report 继续。

## 三、Figma 原型

https://www.figma.com/design/iIwYORn1ZFjUVEfONvgpTn/Chufangapp-Admin?node-id=10-2&m=dev&t=MuQBcMJjKHjrqmPp-1

## 四、防漏页机制

Codex 开发前必须先生成并维护以下文件：

* docs/page-manifest.md
* docs/route-map.md
* docs/module-list.md
* docs/api-spec.md
* docs/database-schema.md
* docs/implementation-checklist.md
* docs/progress-report.md
* docs/blockers.md

每次开始开发前，必须检查：

1. page-manifest.md 中的页面数量
2. route-map.md 中的路由数量
3. 实际项目中的页面文件数量
4. implementation-checklist.md 中的任务数量

如果数量不一致，必须先补齐骨架，不允许继续写 UI。

## 五、第一阶段：页面盘点

Codex 必须先读取 Figma 原型。

如果 Figma MCP 可用，必须读取完整 Figma 文件结构。

如果 Figma MCP 不可用，必须根据已有文档和截图先整理页面清单，并把缺失信息记录到 docs/figma-missing-info.md。

需要输出：

* docs/page-manifest.md
* docs/route-map.md
* docs/module-list.md
* docs/implementation-checklist.md

page-manifest.md 必须包含：

| 序号 | 端 | 页面名称 | Figma Node | 页面类型 | 路由 | 文件路径 | 状态 |
| -- | - | ---- | ---------- | ---- | -- | ---- | -- |

状态只能是：

* 未开始
* 骨架完成
* UI 开发中
* 接口联调中
* 待测试
* 已完成

## 六、第二阶段：路由骨架

Codex 必须先创建所有页面的路由和空页面文件。

要求：

1. 所有 page-manifest.md 中的页面都必须有页面文件。
2. 所有页面都必须有路由。
3. 不允许先做 UI 再补路由。
4. 不允许只创建当前页面。
5. 创建完成后更新 route-map.md 和 implementation-checklist.md。

## 七、第三阶段：数据库和后端接口

必须实现：

1. 用户表
2. 管理员表
3. 菜谱表
4. 菜谱步骤表
5. 菜谱用料表
6. 食材表
7. 食材挑选技巧表
8. 分类表
9. 菜系表
10. 时令食材表
11. 今日推荐表
12. 场景菜单表
13. Banner 表
14. 收藏表
15. 浏览历史表
16. 评论表
17. 晒菜内容表

所有表必须有：

* id
* createdAt
* updatedAt
* status，核心业务表必须有

接口必须包含：

* B 端登录
* C 端登录
* 菜谱 CRUD
* 食材 CRUD
* 分类 CRUD
* 今日推荐 CRUD
* Banner CRUD
* C 端首页
* C 端菜谱列表
* C 端菜谱详情
* C 端食材列表
* C 端食材详情
* C 端搜索
* C 端收藏

## 八、第四阶段：B 端后台

B 端必须完成：

1. 登录页
2. 后台布局
3. 工作台
4. 菜谱管理
5. 新增菜谱
6. 编辑菜谱
7. 菜谱详情
8. 食材管理
9. 新增食材
10. 编辑食材
11. 食材详情
12. 分类管理
13. 今日推荐管理
14. 时令食材管理
15. 菜系管理
16. 场景菜单管理
17. Banner 管理
18. 用户管理
19. 晒菜内容管理
20. 评论管理
21. 系统设置

每个页面必须完成：

* 页面路由
* UI
* 接口请求
* 加载状态
* 空状态
* 错误状态
* 新增
* 编辑
* 删除
* 查询
* 分页
* 表单校验
* 成功提示
* 失败提示

## 九、第五阶段：C 端用户端

C 端必须完成：

1. 首页
2. 今日推荐
3. 时令食材
4. 食材列表
5. 食材详情
6. 菜谱列表
7. 菜谱详情
8. 搜索页
9. 分类筛选
10. 今天吃什么
11. 几人用餐推荐
12. 家庭招待菜单
13. 收藏
14. 浏览历史
15. 我的页面

C 端数据必须来自真实接口。

B 端新增或修改的数据，C 端必须能展示。

## 十、联调验收链路

Codex 必须测试完整链路：

B 端登录
→ 新增食材
→ 新增菜谱
→ 菜谱绑定食材
→ 设置今日推荐
→ C 端首页查看今日推荐
→ C 端进入菜谱详情
→ C 端进入食材详情
→ C 端收藏菜谱
→ B 端修改菜谱
→ C 端刷新看到最新内容

## 十一、必须执行的测试

必须运行：

* npm run lint
* npm run typecheck
* npm run build
* npm run test，如果项目存在
* 数据库 migration
* seed 数据初始化

如果使用 pnpm 或 yarn，请按当前项目实际包管理器执行。

## 十二、任务中断保护

为了防止用量耗尽或任务中断，Codex 必须：

1. 每完成一个小模块，更新 docs/implementation-checklist.md。
2. 每完成一个阶段，更新 docs/progress-report.md。
3. 每次修改后记录修改文件。
4. 如果发现用量不足，停止新增功能，先保存进度。
5. 下次继续时，先读取 checklist、progress-report、blockers 和 git diff。

## 十三、最终完成标准

只有满足以下条件才算完成：

1. 所有页面已盘点。
2. 所有路由已创建。
3. 所有页面文件已创建。
4. B 端后台可访问。
5. C 端用户端可访问。
6. 后端接口可用。
7. 数据库 migration 成功。
8. seed 数据成功。
9. B 端新增的数据能在 C 端展示。
10. mock 数据已替换为真实 API。
11. lint 通过。
12. typecheck 通过。
13. build 通过。
14. 完整业务流测试通过。
15. docs/test-report.md 已更新。
16. docs/integration-report.md 已更新。
17. docs/deploy-checklist.md 已更新。
