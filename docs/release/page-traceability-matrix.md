# 页面追踪矩阵

状态：`matched` 已有正式路由；`partial` 有页面但数据/交互未闭环；`missing` 正式端缺少；`formal-only` 正式端遗留入口，需决定保留或下线。

| 业务域 | 原型视图 | 正式路由 | 当前状态 | 数据源/主要缺口 | 后续阶段 |
|---|---|---|---|---|---|
| 首页 | 推荐、菜谱、食材、水果、饮品频道 | `pages/index/index` | partial | 首页 API 已有；频道 Banner、模块和无限流仍需后台统一驱动 | 3–5 |
| 推荐扩展 | 推荐列表 | `pages/recommendations/index` | formal-only | 与首页推荐流职责重叠，迁移时合并或隐藏 | 5 |
| 时令 | 时令果蔬 | `pages/seasonal/index` | partial | 真实内容已有基础，需统一五类卡片 DTO | 4–5 |
| 今日内容 | 今晚值得做 | `pages/today/index` | formal-only | 原型作为首页模块，不必保留独立入口 | 5 |
| 菜谱列表 | 菜谱频道/分类 | `pages/recipes/index` | partial | 统一卡片、收藏、菜篮状态 | 4–5 |
| 食材列表 | 食材频道/分类 | `pages/ingredients/index` | partial | 分类与参考价契约需收敛 | 4–5 |
| 五类分类 | 统一分类页 | `pages/category-filter/index` | partial | 水果、饮品、调料缺独立列表语义；以类型参数统一 | 4–5 |
| 菜谱详情 | recipe detail | `pages/recipe-detail/index` | partial | 用料、步骤媒体、家庭提醒、相关推荐 | 1–5 |
| 食材详情 | ingredient detail | `pages/ingredient-detail/index` | partial | 挑选/保存/吃法、价格来源、相关菜谱 | 1–5 |
| 水果详情 | fruit detail | `pages/fruit-detail/index` | partial | 与食材统一模型和卡片 DTO | 1–5 |
| 调料详情 | seasoning detail | `pages/seasoning-detail/index` | partial | 风味、建议量、替代品、相关菜谱 | 1–5 |
| 饮品详情 | drink detail | `pages/beverage-detail/index` | partial | 普通/调制类型、基酒、器具、步骤 | 1–5 |
| 烹饪 | cooking | `pages/cooking/index` | partial | GuidedFlow、媒体、计时、进度与完成态 | 4–5 |
| 搭配推荐 | serving recommendation | `pages/serving-recommendation/index` | formal-only | 迁入详情页“继续发现”模块 | 5 |
| 家庭菜单 | family menu | `pages/family-menu/index` | formal-only | 不在首发核心入口，验收后决定隐藏 | 5 |
| 搜索 | 搜索、历史、结果 | `pages/search/index` | partial | Token 用户历史、空态、结果类型统一 | 1、4–5 |
| 扫码 | 扫码加入家庭 | `pages/scan/index` | partial | 真机权限、无效码、过期码和重复加入 | 1、5、7 |
| 菜篮 | 食材/菜谱视图 | `pages/basket/index` | partial | 家庭绑定已有基础；采购批次、挑选弹层和跨成员同步缺失 | 1、4–5 |
| 采购记录 | 采购记录/详情 | `pages/purchase-history/index` | partial | 缺采购批次和独立详情数据 | 1、4–5 |
| 登录注册 | 登录/手机登录/注册/忘记密码 | `pages/login`、`phone-login`、`register`、`forgot-password` | partial | 注册、重置、限流和跨设备会话需真实闭环 | 1、4–5 |
| 我的菜谱 | 列表/添加/详情 | `pages/my-recipes`、`recipe-create`、`my-recipe-detail` | partial | 多媒体上传、可见范围、步骤数据需真实落库 | 1–5 |
| 收藏 | 收藏列表 | `pages/favorites/index` | partial | 当前身份接口需 JWT；统一五类内容和取消收藏 | 1、4–5 |
| 浏览 | 最近浏览 | `pages/recent-views/index` | partial | 当前身份接口需 JWT；统一内容类型和清理 | 1、4–5 |
| 我的 | 个人中心 | `pages/mine/index` | partial | 资料和头像未真实保存，家庭入口/隐私需闭环 | 1–5 |
| 设置 | 设置 | `pages/settings/index` | partial | 通知、隐私、注销、协议入口缺正式服务 | 1、5、9 |
| 个人资料 | 编辑资料 | `pages/profile-edit/index` | partial | `profile.ts` 仍使用本地 storage | 1、2、5 |
| 家庭列表/管理 | family management | `pages/family-manage`、`family` | partial | 层级需统一为家庭列表→家庭详情→成员管理 | 1、5 |
| 创建家庭 | family create | `pages/family-create/index` | partial | 头像上传、家庭码和失败态 | 1、2、5 |
| 家庭偏好 | preferences | `pages/family-preferences/index` | partial | 需按成员拆喜欢/忌口/过敏及共享范围 | 1、5 |
| 家庭成员 | member detail | `pages/family-member/index` | partial | 备注、角色、移除成员及权限 | 1、5 |
| 家庭邀请 | family code | `pages/family-invite/index` | partial | 家庭码展示与扫码加入协议 | 1、5 |
| 挑选指南 | guide list/detail | 无独立路由 | missing | 详情及菜篮弹层复用同一 DTO，不新增独立买菜模式 | 4–5 |
| 通知 | 通知列表/设置 | 无 | missing | 系统、家庭聚餐和开饭提醒 | 1、4–5 |
| 家庭聚餐 | gathering | 无 | missing | 家庭活动、到场与开饭提醒；不做聊天 | 1、4–5 |
| 个人偏好 | personal preferences | 无 | missing | 个人喜欢/忌口/过敏和家庭共享 | 1、5 |
| 隐私共享 | privacy sharing | 无 | missing | 家庭共享范围和账号删除 | 1、5、9 |

每个页面进入实现前，还需在任务 brief 中补齐：入口、参数、API、鉴权、Loading/Empty/Error/Retry、主要交互、响应式验收和自动化命令。

## 核心纵向切片实现映射

此表补齐“页面→API→数据表→后台页面→遗留数据”的可执行维度；详细 method/path 由 `api-v1-route-snapshot.json` 锁定。

| 页面/流程 | API 域 | Prisma 主要表 | 后台配置页面 | 当前 mock/localStorage/hardcode | 替换任务 |
|---|---|---|---|---|---|
| 首页频道/Banner/模块 | `/api/app/home`、`/api/admin/home/*` | `home_top_navs`、`home_banners`、`home_modules`、模块内容关联 | 首页配置 | C 端旧首页静态模块；后台顶部导航 localStorage | 阶段 3–5 统一发布 DTO，移除本地配置 |
| 菜谱列表/详情/烹饪 | `/api/recipes`、`/api/mobile/recipes`、Guided Flow 待建 | `recipes`、`recipe_ingredients`、`recipe_steps`、`recipe_tips` | 菜谱管理 | 部分详情与步骤媒体硬编码 | 阶段 1/3/4/5 补媒体步骤并逐页切换 |
| 食材/水果/调料详情 | `/api/ingredients`、类型详情 DTO 待收敛 | `ingredients`、`categories`、价格/指南/推荐关联待补 | 食材/分类/单位管理 | 五类页面字段映射不一致 | 阶段 1/3/4/5 建统一内容 DTO |
| 饮品/调制流程 | `/api/beverages`、Guided Flow 待建 | `beverages`、基酒/辅料/器具/步骤待补 | 饮品管理 | 普通和可调制饮品尚未真实区分 | 阶段 1/3/4/5 动态表单与制作流 |
| 收藏/最近浏览/搜索历史 | `/api/mobile/favorites`、`view-histories`、`search-histories` | `favorites`、`view_histories`、`search_histories` | 无内容配置；只做运营审计 | 客户端 `userId` 兼容参数；搜索写历史仍需 JWT 收敛 | 阶段 1/4/5 JWT sub + 五类内容统一 |
| 家庭/成员/偏好 | `/api/mobile/families*` 待拆分 | `families`、`family_members`、偏好/共享范围待补 | 家庭审计/用户管理 | 部分资料来自 C 端 storage | 阶段 1/4/5 权限矩阵和真实落库 |
| 菜篮/采购/提醒 | `/api/mobile/purchase-list*`、通知待建 | `purchase_list_items`、采购批次/通知/接收记录待补 | 通知/活动运营待建 | 采购批次与开饭提醒未闭环 | 阶段 1/4/5 完成家庭协同闭环 |
| 头像/封面/步骤媒体 | `/api/files` 待建 | 文件、引用、生命周期表待补 | 统一上传组件 | 临时 URL、静态资源和 data URL 混用 | 阶段 2 建文件 ID 协议并迁移 |
| 我的菜谱/添加菜谱 | `/api/mobile/my-recipes*` 待收敛 | `recipes`、用料、步骤、媒体、共享范围 | 菜谱审核 | 正式页存在未完整落库字段 | 阶段 1–5 使用同一 DTO 和媒体服务 |
| 通知/家庭聚餐 | `/api/mobile/notifications*`、`family-events*` 待建 | 通知、活动、接收记录待补 | 首发仅必要通知运营 | 正式页面/接口缺失 | 阶段 1/3/4/5 新增并做权限/E2E |
