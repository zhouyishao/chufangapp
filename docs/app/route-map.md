# C 端与后台路由图

## 子项目

| 子项目 | 目录 | 说明 |
|---|---|---|
| C 端 | `frontend/` | 用户端 App/H5 |
| 后台 | `admin-frontend/` | 管理后台 |
| 后端 | `server/` | 统一 API 服务 |

## C 端核心路由

- `pages/index/index`：首页。
- `pages/ingredients/index`：食材列表。
- `pages/ingredient-detail/index`：食材详情。
- `pages/recipes/index`：菜谱列表。
- `pages/recipe-detail/index`：菜谱详情。
- `pages/basket/index`：菜篮子。
- `pages/mine/index`：我的。
- `pages/purchase-history/index`：采购历史。
- `pages/family-manage/index`：家庭管理。

## 后台核心路由

- `/login`：登录。
- `/`：工作台。
- `/categories`：分类管理。
- `/ingredients`：食材管理。
- `/recipes`：菜谱管理。
- `/recommendations`：推荐管理。
- `/seasonal`：时令食材。
- `/banners`：Banner 管理。
- `/users`：用户管理。

完整历史路由清单见：`docs/route-map.md`。
