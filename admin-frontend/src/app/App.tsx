import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { Layout } from './components/Layout';
import { PagePlaceholder } from './components/PagePlaceholder';
import { RequireAuth } from './components/RequireAuth';
import { RequirePermission } from './components/RequirePermission';
import { AiConfigPage } from './pages/AiConfigPage';
import { AuditCenterPage } from './pages/AuditCenterPage';
import { BannersPage } from './pages/BannersPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { CategoryDetailPage } from './pages/CategoryDetailPage';
import { CommentsPage } from './pages/CommentsPage';
import { ContentOverviewPage } from './pages/ContentOverviewPage';
import { CuisinesPage } from './pages/CuisinesPage';
import { DashboardPage } from './pages/DashboardPage';
import { FamiliesPage } from './pages/FamiliesPage';
import { FilesPage } from './pages/FilesPage';
import { ForbiddenPage } from './pages/ForbiddenPage';
import { HomeOpsPage } from './pages/HomeOpsPage';
import { IngredientCreatePage } from './pages/IngredientCreatePage';
import { IngredientDetailPage } from './pages/IngredientDetailPage';
import { IngredientEditPage } from './pages/IngredientEditPage';
import { IngredientsPage } from './pages/IngredientsPage';
import { LoginPage } from './pages/LoginPage';
import { MenusPage } from './pages/MenusPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PostsPage } from './pages/PostsPage';
import { PricesPage } from './pages/PricesPage';
import { PurchasePage } from './pages/PurchasePage';
import { RecipeCreatePage } from './pages/RecipeCreatePage';
import { RecipeDetailPage } from './pages/RecipeDetailPage';
import { RecipeEditPage } from './pages/RecipeEditPage';
import { RecipesPage } from './pages/RecipesPage';
import { RecommendationsPage } from './pages/RecommendationsPage';
import { ReportsPage } from './pages/ReportsPage';
import { ResourcesPage } from './pages/ResourcesPage';
import { RolesPage } from './pages/RolesPage';
import { SearchOpsPage } from './pages/SearchOpsPage';
import { SeasonalPage } from './pages/SeasonalPage';
import { SettingsPage } from './pages/SettingsPage';
import { TagsPage } from './pages/TagsPage';
import { TaxonomiesPage } from './pages/TaxonomiesPage';
import { UserBehaviorPage } from './pages/UserBehaviorPage';
import { UserFavoritesPage } from './pages/UserFavoritesPage';
import { UserRecentViewsPage } from './pages/UserRecentViewsPage';
import { UserSubmissionsPage } from './pages/UserSubmissionsPage';
import { UsersPage } from './pages/UsersPage';

const withPermission = (element: JSX.Element, permission?: string) => (
  <RequirePermission permission={permission}>{element}</RequirePermission>
);

const placeholder = (title: string, description: string, permission?: string) =>
  withPermission(<PagePlaceholder title={title} description={description} />, permission);

export const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={withPermission(<DashboardPage />, 'dashboard:view')} />
          <Route path="home-ops" element={withPermission(<HomeOpsPage />, 'home:view')} />
          <Route path="home-ops/banners" element={withPermission(<BannersPage />, 'banner:view')} />
          <Route path="home-ops/recommend-slots" element={placeholder('推荐位管理', '配置首页、列表页和详情页内的推荐位置与权重。', 'recommendation:view')} />
          <Route path="home-ops/today" element={withPermission(<RecommendationsPage />, 'recommendation:view')} />
          <Route path="home-ops/seasonal" element={withPermission(<SeasonalPage />, 'seasonal:view')} />
          <Route path="home-ops/preview" element={placeholder('首页预览', '预览 App 首页模块、Banner、推荐内容和时令内容。', 'home:preview')} />

          <Route path="content" element={withPermission(<ContentOverviewPage />, 'content:view')} />
          <Route path="content/recipes" element={withPermission(<RecipesPage />, 'recipe:view')} />
          <Route path="content/recipes/create" element={withPermission(<RecipeCreatePage />, 'recipe:create')} />
          <Route path="content/recipes/:id" element={withPermission(<RecipeDetailPage />, 'recipe:view')} />
          <Route path="content/recipes/:id/edit" element={withPermission(<RecipeEditPage />, 'recipe:update')} />
          <Route path="content/ingredients" element={withPermission(<IngredientsPage />, 'ingredient:view')} />
          <Route path="content/ingredients/create" element={withPermission(<IngredientCreatePage />, 'ingredient:create')} />
          <Route path="content/ingredients/:id" element={withPermission(<IngredientDetailPage />, 'ingredient:view')} />
          <Route path="content/ingredients/:id/edit" element={withPermission(<IngredientEditPage />, 'ingredient:update')} />
          <Route path="content/galleries" element={placeholder('图集管理', '管理菜谱、食材和运营内容使用的图片图集。', 'gallery:view')} />

          <Route path="taxonomies" element={<Navigate to="/taxonomies/categories" replace />} />
          <Route path="taxonomies/categories" element={withPermission(<CategoriesPage />, 'taxonomy:view')} />
          <Route path="taxonomies/tags" element={withPermission(<TagsPage />, 'tag:view')} />
          <Route path="taxonomies/cuisines" element={withPermission(<CuisinesPage />, 'cuisine:view')} />
          <Route path="taxonomies/channels" element={placeholder('频道管理', '配置内容频道、频道排序、展示状态和 App 同步。', 'channel:view')} />

          <Route path="purchase" element={<Navigate to="/purchase/lists" replace />} />
          <Route path="purchase/lists" element={placeholder('采购清单', '查看用户和家庭采购清单、采购明细和完成状态。', 'purchase:view')} />
          <Route path="purchase/rules" element={placeholder('采购规则', '配置采购清单生成规则、合并规则和提醒规则。', 'purchase:rule:view')} />
          <Route path="purchase/units" element={placeholder('单位换算', '维护克、斤、个、勺等单位换算关系。', 'purchase:unit:view')} />
          <Route path="purchase/loss" element={placeholder('损耗配置', '配置采购食材损耗率、净含量和烹饪折算规则。', 'purchase:loss:view')} />

          <Route path="prices" element={<Navigate to="/prices/ingredients" replace />} />
          <Route path="prices/ingredients" element={placeholder('食材价格', '维护食材当前价格、单位、市场、城市和历史记录。', 'price:view')} />
          <Route path="prices/trends" element={placeholder('价格趋势', '查看食材、水果、调料价格趋势图和历史对比。', 'price:trend:view')} />
          <Route path="prices/alerts" element={placeholder('价格预警', '配置价格波动、异常上涨和缺失数据预警。', 'price:alert:view')} />
          <Route path="prices/sources" element={placeholder('价格来源', '维护价格来源、平台、市场、城市和采集优先级。', 'price:source:view')} />

          <Route path="families" element={<Navigate to="/families/list" replace />} />
          <Route path="families/list" element={placeholder('家庭列表', '查看家庭空间、创建者、成员数量和活跃状态。', 'family:view')} />
          <Route path="families/members" element={placeholder('家庭成员', '管理家庭成员、角色、加入状态和邀请关系。', 'family:member:view')} />
          <Route path="families/preferences" element={placeholder('饮食偏好', '查看家庭口味偏好、忌口规则和推荐偏好。', 'family:preference:view')} />
          <Route path="families/menus" element={placeholder('家庭菜单', '管理家庭菜单、计划菜谱和采购联动。', 'family:menu:view')} />

          <Route path="users" element={withPermission(<UsersPage />, 'user:view')} />
          <Route path="users/behavior" element={withPermission(<UserBehaviorPage />, 'user:behavior:view')} />
          <Route path="users/favorites" element={withPermission(<UserFavoritesPage />, 'user:favorites:view')} />
          <Route path="users/recent-views" element={withPermission(<UserRecentViewsPage />, 'user:recent-view:view')} />
          <Route path="users/submissions" element={withPermission(<UserSubmissionsPage />, 'user:submission:view')} />

          <Route path="audits" element={<Navigate to="/audits/pending" replace />} />
          <Route path="audits/pending" element={withPermission(<AuditCenterPage mode="pending" />, 'audit:view')} />
          <Route path="audits/approved" element={withPermission(<AuditCenterPage mode="approved" />, 'audit:view')} />
          <Route path="audits/rejected" element={withPermission(<AuditCenterPage mode="rejected" />, 'audit:view')} />
          <Route path="audits/records" element={withPermission(<AuditCenterPage mode="records" />, 'audit:record:view')} />

          <Route path="comments" element={withPermission(<CommentsPage />, 'comment:view')} />
          <Route path="comments/reports" element={placeholder('举报处理', '处理评论举报、隐藏、删除和审核记录。', 'comment:report:view')} />

          <Route path="ai" element={<Navigate to="/ai/models" replace />} />
          <Route path="ai/models" element={placeholder('模型配置', '配置 AI 模型、温度、Token、启用状态和场景。', 'ai:model:view')} />
          <Route path="ai/prompts" element={withPermission(<AiConfigPage />, 'ai:prompt:view')} />
          <Route path="ai/tasks" element={placeholder('AI 任务', '查看 AI 菜单生成、今日吃什么和推荐生成任务。', 'ai:task:view')} />
          <Route path="ai/logs" element={placeholder('调用记录', '查看 AI 调用记录、耗时、状态和错误信息。', 'ai:log:view')} />

          <Route path="search-ops" element={<Navigate to="/search-ops/logs" replace />} />
          <Route path="search-ops/logs" element={withPermission(<SearchOpsPage />, 'search:log:view')} />
          <Route path="search-ops/hotwords" element={placeholder('热词管理', '配置热门搜索词、排序、启用状态和 App 展示。', 'search:hotword:view')} />
          <Route path="search-ops/no-result" element={placeholder('无结果词', '配置无结果搜索词的推荐内容和引导策略。', 'search:no-result:view')} />
          <Route path="search-ops/synonyms" element={placeholder('同义词管理', '配置食材、菜谱、口味、别名和同义词映射。', 'search:synonym:view')} />
          <Route path="search-ops/pins" element={placeholder('搜索置顶', '配置关键词命中后的置顶内容和权重。', 'search:pin:view')} />

          <Route path="reports" element={<Navigate to="/reports/overview" replace />} />
          <Route path="reports/overview" element={withPermission(<ReportsPage />, 'report:view')} />
          <Route path="reports/content" element={placeholder('内容报表', '查看菜谱、食材、调酒等内容数据表现。', 'report:content:view')} />
          <Route path="reports/users" element={placeholder('用户报表', '查看注册、活跃、留存和用户行为数据。', 'report:user:view')} />
          <Route path="reports/search" element={placeholder('搜索报表', '查看搜索量、无结果率、热词和转化数据。', 'report:search:view')} />
          <Route path="reports/purchase" element={placeholder('采购报表', '查看采购清单、采购历史、家庭采购和价格数据。', 'report:purchase:view')} />

          <Route path="files" element={<Navigate to="/files/list" replace />} />
          <Route path="files/list" element={withPermission(<FilesPage />, 'file:view')} />
          <Route path="files/uploads" element={placeholder('上传记录', '查看图片、文件上传记录、上传人和处理状态。', 'file:upload:view')} />
          <Route path="files/usages" element={placeholder('引用关系', '查看文件被 Banner、菜谱、食材等内容引用的关系。', 'file:usage:view')} />

          <Route path="resources" element={<Navigate to="/resources/apps" replace />} />
          <Route path="resources/apps" element={withPermission(<ResourcesPage />, 'resource:app:view')} />
          <Route path="resources/api-keys" element={placeholder('API Key 管理', '管理资源接口 API Key、状态、过期时间和调用限制。', 'resource:key:view')} />
          <Route path="resources/permissions" element={placeholder('接口权限', '配置资源接口访问权限、白名单和模块授权。', 'resource:permission:view')} />
          <Route path="resources/logs" element={placeholder('调用日志', '查看资源接口调用日志、耗时、状态码和异常。', 'resource:log:view')} />

          <Route path="settings" element={<Navigate to="/settings/admins" replace />} />
          <Route path="settings/admins" element={withPermission(<SettingsPage />, 'system:admin:view')} />
          <Route path="settings/roles" element={withPermission(<RolesPage />, 'system:role:view')} />
          <Route path="settings/logs" element={placeholder('操作日志', '查看管理员登录、增删改查、审核和配置变更记录。', 'system:log:view')} />
          <Route path="settings/base" element={placeholder('基础配置', '维护系统基础配置、上传规则、缓存和 API 配置。', 'system:base:view')} />
          <Route path="403" element={<ForbiddenPage />} />

          <Route path="categories" element={<CategoriesPage />} />
          <Route path="categories/:id" element={<CategoryDetailPage />} />
          <Route path="ingredients" element={<Navigate to="/content/ingredients" replace />} />
          <Route path="ingredients/create" element={<Navigate to="/content/ingredients/create" replace />} />
          <Route path="ingredients/:id" element={<IngredientDetailPage />} />
          <Route path="ingredients/:id/edit" element={<IngredientEditPage />} />
          <Route path="recipes" element={<Navigate to="/content/recipes" replace />} />
          <Route path="recipes/create" element={<Navigate to="/content/recipes/create" replace />} />
          <Route path="recipes/:id" element={<RecipeDetailPage />} />
          <Route path="recipes/:id/edit" element={<RecipeEditPage />} />
          <Route path="recommendations" element={<RecommendationsPage />} />
          <Route path="seasonal" element={<SeasonalPage />} />
          <Route path="cuisines" element={<CuisinesPage />} />
          <Route path="menus" element={<MenusPage />} />
          <Route path="banners" element={<BannersPage />} />
          <Route path="posts" element={<PostsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
