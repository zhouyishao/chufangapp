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
- `pages/fruit-detail/index`：水果详情。
- `pages/seasoning-detail/index`：调料详情。
- `pages/beverage-detail/index`：酒水详情。
- `pages/recipes/index`：菜谱列表。
- `pages/recipe-detail/index`：菜谱详情。
- `pages/search/index`：搜索页，写入搜索历史。
- `pages/scan/index`：扫一扫 / 邀请码加入家庭。
- `pages/basket/index`：菜篮子。
- `pages/mine/index`：我的。
- `pages/favorites/index`：收藏。
- `pages/recent-views/index`：浏览历史。
- `pages/purchase-history/index`：采购历史。
- `pages/login/index`：登录授权入口。
- `pages/phone-login/index`：手机号授权登录。
- `pages/register/index`：注册授权。
- `pages/family-manage/index`：家庭管理。
- `pages/family/index`：家庭列表。
- `pages/family-create/index`：创建家庭。
- `pages/family-invite/index`：邀请家人。
- `pages/family-member/index`：家庭成员。
- `pages/family-preferences/index`：家庭偏好。
- `pages/settings/index`：设置。

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
