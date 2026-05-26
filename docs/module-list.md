# 模块清单

## B 端后台模块

| 模块 | 页面 | 主要能力 | 状态 |
|---|---|---|---|
| 鉴权 | 登录页 | 管理员登录、Token 持久化、退出登录 | UI开发中 |
| 后台布局 | 后台布局、Sidebar、Header | 统一导航、页面容器、操作入口 | UI开发中 |
| 工作台 | 原型索引/工作台入口 | 数据概览、运营入口 | UI开发中 |
| 菜谱管理 | 菜谱管理、新增、编辑、详情 | CRUD、上下架、推荐、审核、步骤和用料维护 | UI开发中 |
| 食材管理 | 食材管理、新增、编辑、详情 | CRUD、分类、价格、时令、推荐 | UI开发中 |
| 分类管理 | 分类管理、详情/编辑 | 菜谱分类、食材分类、标签配置 | UI开发中 |
| 今日推荐 | 今日推荐管理 | 推荐位配置、排序、上下架 | 未开始 |
| 时令食材 | 时令食材管理 | 月份、地区、排序、展示配置 | 未开始 |
| 菜系管理 | 菜系管理 | 菜系 CRUD、排序 | 未开始 |
| 场景菜单 | 场景菜单管理 | 家庭招待、几人餐、菜单与菜谱绑定 | 未开始 |
| Banner | Banner 管理 | 轮播图、跳转、上下架 | 未开始 |
| 用户管理 | 用户管理 | 用户查询、状态管理 | 未开始 |
| 晒菜内容 | 晒菜内容管理 | UGC 内容审核、上下架 | 未开始 |
| 评论管理 | 评论管理 | 评论审核、删除 | 未开始 |
| 系统设置 | 系统设置 | 管理员、角色、菜单权限、日志、上传规则 | 未开始 |

## C 端用户端模块

| 模块 | 页面 | 主要能力 | 状态 |
|---|---|---|---|
| 首页 | 首页、今日推荐、时令食材 | 展示 B 端推荐内容、入口聚合 | UI开发中 |
| 食材 | 食材列表、食材详情、时令食材 | 浏览、筛选、详情、关联菜谱 | UI开发中 |
| 菜谱 | 菜谱列表、菜谱详情 | 浏览、筛选、步骤、用料、收藏 | UI开发中 |
| 搜索筛选 | 搜索页、分类筛选 | 关键词搜索、分类筛选 | 未开始 |
| 推荐场景 | 今天吃什么、几人用餐推荐、家庭招待菜单 | 推荐菜谱和菜单 | 未开始 |
| 用户资产 | 收藏、浏览历史、我的页面 | 收藏、历史、个人信息 | UI开发中 |

## 后端模块

| 模块 | 接口范围 | 数据表 | 状态 |
|---|---|---|---|
| 管理端鉴权 | /api/admin/auth/* | admins、roles、permissions | UI联调中 |
| C 端鉴权 | /api/mobile/auth/* | users | 未开始 |
| 菜谱 | /api/admin/recipes、/api/recipes | recipes、recipe_steps、recipe_ingredients | 接口联调中 |
| 食材 | /api/admin/ingredients、/api/ingredients | ingredients、ingredient_tips、seasonal_foods | 接口联调中 |
| 分类 | /api/admin/categories | categories | 接口联调中 |
| 推荐 | /api/admin/recommendations、/api/mobile/recommendations | recommendations | 未开始 |
| 首页 | /api/mobile/home | banners、recommendations、recipes、ingredients | 接口联调中 |
| 用户互动 | /api/mobile/favorites、浏览历史、评论 | favorites、view_histories、comments | 未开始 |
| 文件上传 | /api/admin/files | uploads/files | 未开始 |
