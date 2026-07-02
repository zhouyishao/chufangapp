import type { ReactElement } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { Layout } from './components/Layout';
import { PagePlaceholder } from './components/PagePlaceholder';
import { RequireAuth } from './components/RequireAuth';
import { RequirePermission } from './components/RequirePermission';
import { AiConfigPage } from './pages/AiConfigPage';
import { ApiProviderCreatePage } from './pages/ApiProviderCreatePage';
import { ApiProviderEditPage } from './pages/ApiProviderEditPage';
import { ApiProviderListPage } from './pages/ApiProviderListPage';
import { AuditCenterPage } from './pages/AuditCenterPage';
import { BannersPage } from './pages/BannersPage';
import { BeverageFormPage } from './pages/BeverageFormPage';
import { BeveragesPage } from './pages/BeveragesPage';
import { BeverageDetailPage } from './pages/BeverageDetailPage';
import { CategoryFormPage } from './pages/CategoryFormPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { CategoryDetailPage } from './pages/CategoryDetailPage';
import { CommentsPage } from './pages/CommentsPage';
import { ContentOverviewPage } from './pages/ContentOverviewPage';
import { DashboardPage } from './pages/DashboardPage';
import { FamiliesPage } from './pages/FamiliesPage';
import { FilesPage } from './pages/FilesPage';
import { ForbiddenPage } from './pages/ForbiddenPage';
import { FruitCreatePage } from './pages/FruitCreatePage';
import { FruitEditPage } from './pages/FruitEditPage';
import { HomeOpsPage } from './pages/HomeOpsPage';
import { IngredientCreatePage } from './pages/IngredientCreatePage';
import { IngredientDetailPage } from './pages/IngredientDetailPage';
import { IngredientEditPage } from './pages/IngredientEditPage';
import { IngredientsPage } from './pages/IngredientsPage';
import { LoginPage } from './pages/LoginPage';
import { MenusPage } from './pages/MenusPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PostsPage } from './pages/PostsPage';
import { RecipeCreatePage } from './pages/RecipeCreatePage';
import { RecipeDetailPage } from './pages/RecipeDetailPage';
import { RecipeEditPage } from './pages/RecipeEditPage';
import { RecipesPage } from './pages/RecipesPage';
import { RecommendationsPage } from './pages/RecommendationsPage';
import { ResourceAccessCenterPage } from './pages/ResourceAccessCenterPage';
import { ResourceImportRecordsPage } from './pages/ResourceImportRecordsPage';
import { RolesPage } from './pages/RolesPage';
import { SearchOpsPage } from './pages/SearchOpsPage';
import { SeasonalPage } from './pages/SeasonalPage';
import { SeasoningCreatePage } from './pages/SeasoningCreatePage';
import { SeasoningEditPage } from './pages/SeasoningEditPage';
import { SettingsPage } from './pages/SettingsPage';
import { TagsPage } from './pages/TagsPage';
import { TagFormPage } from './pages/TagFormPage';
import { TagDetailPage } from './pages/TagDetailPage';
import { UnitCreatePage } from './pages/UnitCreatePage';
import { UnitEditPage } from './pages/UnitEditPage';
import { UnitDetailPage } from './pages/UnitDetailPage';
import { TopNavCarouselFormPage } from './pages/TopNavCarouselFormPage';
import { TopNavContentConfigPage } from './pages/TopNavContentConfigPage';
import { TopNavDetailPage } from './pages/TopNavDetailPage';
import { TopNavFormPage } from './pages/TopNavFormPage';
import { TopNavModuleFormPage } from './pages/TopNavModuleFormPage';
import { TopNavPage } from './pages/TopNavPage';
import { UnitsPage } from './pages/UnitsPage';
import { UserBehaviorPage } from './pages/UserBehaviorPage';
import { UserFavoritesPage } from './pages/UserFavoritesPage';
import { UserRecentViewsPage } from './pages/UserRecentViewsPage';
import { UserSubmissionsPage } from './pages/UserSubmissionsPage';
import { UsersPage } from './pages/UsersPage';

import { ResourceAppsPage } from './pages/ResourceAppsPage';
import { ResourceApiKeysPage } from './pages/ResourceApiKeysPage';
import { ResourcePermissionsPage } from './pages/ResourcePermissionsPage';
import { ResourceLogsPage } from './pages/ResourceLogsPage';
import { PricesIngredientsPage } from './pages/PricesIngredientsPage';
import { PricesTrendsPage } from './pages/PricesTrendsPage';
import { PricesAlertsPage } from './pages/PricesAlertsPage';
import { PricesSourcesPage } from './pages/PricesSourcesPage';
import { PurchaseListsPage } from './pages/PurchaseListsPage';
import { PurchaseRulesPage } from './pages/PurchaseRulesPage';
import { PurchaseUnitsPage } from './pages/PurchaseUnitsPage';
import { PurchaseLossPage } from './pages/PurchaseLossPage';
import { ReportsOverviewPage } from './pages/ReportsOverviewPage';
import { ReportsContentPage } from './pages/ReportsContentPage';
import { ReportsUsersPage } from './pages/ReportsUsersPage';
import { ReportsSearchPage } from './pages/ReportsSearchPage';
import { ReportsPurchasePage } from './pages/ReportsPurchasePage';
import { FilesUploadsPage } from './pages/FilesUploadsPage';
import { FilesUsagesPage } from './pages/FilesUsagesPage';
import { CommentsReportsPage } from './pages/CommentsReportsPage';
import { AiModelsPage } from './pages/AiModelsPage';
import { AiTasksPage } from './pages/AiTasksPage';
import { AiLogsPage } from './pages/AiLogsPage';
import { SearchOpsHotwordsPage } from './pages/SearchOpsHotwordsPage';
import { SearchOpsNoResultPage } from './pages/SearchOpsNoResultPage';
import { SearchOpsSynonymsPage } from './pages/SearchOpsSynonymsPage';
import { SearchOpsPinsPage } from './pages/SearchOpsPinsPage';
import { SettingsLogsPage } from './pages/SettingsLogsPage';
import { SettingsBasePage } from './pages/SettingsBasePage';

const withPermission = (element: ReactElement, permission?: string) => (
  <RequirePermission permission={permission}>{element}</RequirePermission>
);

const placeholder = (title: string, description: string, permission?: string) =>
  withPermission(<PagePlaceholder title={title} description={description} />, permission);

export const App = () => (
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

        <Route path="home-ops" element={withPermission(<TopNavPage />, 'home:view')} />
        <Route path="home-ops/top-nav/new" element={withPermission(<TopNavFormPage mode="create" />, 'home:update')} />
        <Route path="home-ops/top-nav/:id" element={withPermission(<TopNavDetailPage />, 'home:view')} />
        <Route path="home-ops/top-nav/:id/edit" element={withPermission(<TopNavFormPage mode="edit" />, 'home:update')} />
        <Route path="home-ops/top-nav/:id/content" element={withPermission(<TopNavContentConfigPage />, 'home:update')} />
        <Route path="home-ops/top-nav/:id/content/carousels/new" element={withPermission(<TopNavCarouselFormPage />, 'home:update')} />
        <Route path="home-ops/top-nav/:id/content/carousels/:carouselId/edit" element={withPermission(<TopNavCarouselFormPage />, 'home:update')} />
        <Route path="home-ops/top-nav/:id/content/modules/new" element={withPermission(<TopNavModuleFormPage />, 'home:update')} />
        <Route path="home-ops/top-nav/:id/content/modules/:moduleId/edit" element={withPermission(<TopNavModuleFormPage />, 'home:update')} />
        {/* 首页顶部轮播图已迁移至顶部导航管理 → 配置内容 → 轮播图设置，不再作为独立页面 */}
        {/* <Route path="home-ops/hero-banners" element={withPermission(<HomeHeroBannersPage />, 'banner:view')} /> */}
        <Route path="home-ops/banners" element={withPermission(<BannersPage />, 'banner:view')} />
        <Route path="home-ops/recommend-slots" element={withPermission(<RecommendationsPage />, 'recommendation:view')} />
        <Route path="home-ops/today" element={withPermission(<RecommendationsPage />, 'recommendation:view')} />
        <Route path="home-ops/seasonal" element={withPermission(<SeasonalPage />, 'seasonal:view')} />
        <Route path="home-ops/modules" element={withPermission(<HomeOpsPage />, 'home:view')} />

        <Route path="content" element={<Navigate to="/content/recipes" replace />} />
        <Route path="content/overview" element={withPermission(<ContentOverviewPage />, 'content:view')} />
        <Route path="content/recipes" element={withPermission(<RecipesPage />, 'recipe:view')} />
        <Route path="content/recipes/create" element={withPermission(<RecipeCreatePage />, 'recipe:create')} />
        <Route path="content/recipes/:id" element={withPermission(<RecipeDetailPage />, 'recipe:view')} />
        <Route path="content/recipes/:id/edit" element={withPermission(<RecipeEditPage />, 'recipe:update')} />
        <Route path="content/ingredients" element={withPermission(<IngredientsPage />, 'ingredient:view')} />
        <Route path="content/fruits" element={withPermission(<IngredientsPage variant="fruit" />, 'ingredient:view')} />
        <Route path="content/fruits/create" element={withPermission(<FruitCreatePage />, 'ingredient:create')} />
        <Route path="content/fruits/:id" element={withPermission(<IngredientDetailPage variant="fruit" />, 'ingredient:view')} />
        <Route path="content/fruits/:id/edit" element={withPermission(<FruitEditPage />, 'ingredient:update')} />
        <Route path="content/seasonings" element={withPermission(<IngredientsPage variant="seasoning" />, 'ingredient:view')} />
        <Route path="content/seasonings/create" element={withPermission(<SeasoningCreatePage />, 'ingredient:create')} />
        <Route path="content/seasonings/:id" element={withPermission(<IngredientDetailPage variant="seasoning" />, 'ingredient:view')} />
        <Route path="content/seasonings/:id/edit" element={withPermission(<SeasoningEditPage />, 'ingredient:update')} />
        <Route path="content/ingredients/create" element={withPermission(<IngredientCreatePage />, 'ingredient:create')} />
        <Route path="content/ingredients/:id" element={withPermission(<IngredientDetailPage variant="ingredient" />, 'ingredient:view')} />
        <Route path="content/ingredients/:id/edit" element={withPermission(<IngredientEditPage />, 'ingredient:update')} />
        <Route path="content/beverages" element={withPermission(<BeveragesPage />, 'beverage:view')} />
        <Route path="content/beverages/create" element={withPermission(<BeverageFormPage mode="create" />, 'beverage:create')} />
        <Route path="content/beverages/:id" element={withPermission(<BeverageDetailPage />, 'beverage:view')} />
        <Route path="content/beverages/:id/edit" element={withPermission(<BeverageFormPage mode="edit" />, 'beverage:update')} />
        <Route path="content/galleries" element={placeholder('图集管理', '管理菜谱、食材和运营内容使用的图片图集。', 'gallery:view')} />
        <Route path="content/items" element={<Navigate to="/content/recipes" replace />} />

        <Route path="resource-management" element={<Navigate to="/resource-management/access-center" replace />} />
        <Route path="resource-management/access-center" element={withPermission(<ResourceAccessCenterPage />, 'resource:view')} />
        <Route path="resource-management/import-records" element={withPermission(<ResourceImportRecordsPage />, 'resource:import:view')} />

        <Route path="taxonomies" element={<Navigate to="/taxonomies/categories" replace />} />
        <Route path="taxonomies/categories" element={withPermission(<CategoriesPage />, 'taxonomy:view')} />
        <Route path="taxonomies/categories/create" element={withPermission(<CategoryFormPage mode="create" />, 'taxonomy:create')} />
        <Route path="taxonomies/categories/:id" element={withPermission(<CategoryDetailPage />, 'taxonomy:view')} />
        <Route path="taxonomies/categories/:id/edit" element={withPermission(<CategoryFormPage mode="edit" />, 'taxonomy:update')} />
        <Route path="taxonomies/tags" element={withPermission(<TagsPage />, 'tag:view')} />
        <Route path="taxonomies/tags/create" element={withPermission(<TagFormPage mode="create" />, 'tag:create')} />
        <Route path="taxonomies/tags/:id" element={withPermission(<TagDetailPage />, 'tag:view')} />
        <Route path="taxonomies/tags/:id/edit" element={withPermission(<TagFormPage mode="edit" />, 'tag:update')} />
        <Route path="taxonomies/cuisines" element={<Navigate to="/taxonomies/categories" replace />} />
        <Route path="taxonomies/channels" element={<Navigate to="/taxonomies/categories" replace />} />
        <Route path="taxonomies/units" element={withPermission(<UnitsPage />, 'unit:view')} />
        <Route path="taxonomies/units/create" element={withPermission(<UnitCreatePage />, 'unit:create')} />
        <Route path="taxonomies/units/:id" element={withPermission(<UnitDetailPage />, 'unit:view')} />
        <Route path="taxonomies/units/:id/edit" element={withPermission(<UnitEditPage />, 'unit:update')} />

        <Route path="purchase" element={<Navigate to="/purchase/lists" replace />} />
        <Route path="purchase/lists" element={withPermission(<PurchaseListsPage />, 'purchase:view')} />
        <Route path="purchase/rules" element={withPermission(<PurchaseRulesPage />, 'purchase:rule:view')} />
        <Route path="purchase/units" element={withPermission(<PurchaseUnitsPage />, 'purchase:unit:view')} />
        <Route path="purchase/loss" element={withPermission(<PurchaseLossPage />, 'purchase:loss:view')} />

        <Route path="prices" element={<Navigate to="/prices/ingredients" replace />} />
        <Route path="prices/ingredients" element={withPermission(<PricesIngredientsPage />, 'price:view')} />
        <Route path="prices/trends" element={withPermission(<PricesTrendsPage />, 'price:trend:view')} />
        <Route path="prices/alerts" element={withPermission(<PricesAlertsPage />, 'price:alert:view')} />
        <Route path="prices/sources" element={withPermission(<PricesSourcesPage />, 'price:source:view')} />

        <Route path="families" element={<Navigate to="/families/list" replace />} />
        <Route path="families/list" element={withPermission(<FamiliesPage mode="list" />, 'family:view')} />
        <Route path="families/members" element={withPermission(<FamiliesPage mode="members" />, 'family:member:view')} />
        <Route path="families/invites" element={withPermission(<FamiliesPage mode="invites" />, 'family:member:view')} />
        <Route path="families/preferences" element={<Navigate to="/families/list" replace />} />
        <Route path="families/menus" element={<Navigate to="/families/list" replace />} />

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
        <Route path="comments/reports" element={withPermission(<CommentsReportsPage />, 'comment:report:view')} />

        <Route path="ai" element={<Navigate to="/ai/models" replace />} />
        <Route path="ai/models" element={withPermission(<AiModelsPage />, 'ai:model:view')} />
        <Route path="ai/prompts" element={withPermission(<AiConfigPage />, 'ai:prompt:view')} />
        <Route path="ai/tasks" element={withPermission(<AiTasksPage />, 'ai:task:view')} />
        <Route path="ai/logs" element={withPermission(<AiLogsPage />, 'ai:log:view')} />

        <Route path="search-ops" element={<Navigate to="/search-ops/logs" replace />} />
        <Route path="search-ops/logs" element={withPermission(<SearchOpsPage />, 'search:log:view')} />
        <Route path="search-ops/hotwords" element={withPermission(<SearchOpsHotwordsPage />, 'search:hotword:view')} />
        <Route path="search-ops/no-result" element={withPermission(<SearchOpsNoResultPage />, 'search:no-result:view')} />
        <Route path="search-ops/synonyms" element={withPermission(<SearchOpsSynonymsPage />, 'search:synonym:view')} />
        <Route path="search-ops/pins" element={withPermission(<SearchOpsPinsPage />, 'search:pin:view')} />

        <Route path="reports" element={<Navigate to="/reports/overview" replace />} />
        <Route path="reports/overview" element={withPermission(<ReportsOverviewPage />, 'report:view')} />
        <Route path="reports/content" element={withPermission(<ReportsContentPage />, 'report:content:view')} />
        <Route path="reports/users" element={withPermission(<ReportsUsersPage />, 'report:user:view')} />
        <Route path="reports/search" element={withPermission(<ReportsSearchPage />, 'report:search:view')} />
        <Route path="reports/purchase" element={withPermission(<ReportsPurchasePage />, 'report:purchase:view')} />

        <Route path="files" element={<Navigate to="/files/list" replace />} />
        <Route path="files/list" element={withPermission(<FilesPage />, 'file:view')} />
        <Route path="files/uploads" element={withPermission(<FilesUploadsPage />, 'file:upload:view')} />
        <Route path="files/usages" element={withPermission(<FilesUsagesPage />, 'file:usage:view')} />

        <Route path="resources" element={<Navigate to="/resources/apps" replace />} />
        <Route path="resources/apps" element={withPermission(<ResourceAppsPage />, 'resource:app:view')} />
        <Route path="resources/api-providers" element={withPermission(<ApiProviderListPage />, 'resource:provider:view')} />
        <Route path="resources/api-providers/create" element={withPermission(<ApiProviderCreatePage />, 'resource:provider:create')} />
        <Route path="resources/api-providers/:id/edit" element={withPermission(<ApiProviderEditPage />, 'resource:provider:update')} />
        <Route path="resources/api-keys" element={withPermission(<ResourceApiKeysPage />, 'resource:key:view')} />
        <Route path="resources/permissions" element={withPermission(<ResourcePermissionsPage />, 'resource:permission:view')} />
        <Route path="resources/logs" element={withPermission(<ResourceLogsPage />, 'resource:log:view')} />

        <Route path="settings" element={<Navigate to="/settings/admins" replace />} />
        <Route path="settings/admins" element={withPermission(<SettingsPage />, 'system:admin:view')} />
        <Route path="settings/roles" element={withPermission(<RolesPage />, 'system:role:view')} />
        <Route path="settings/logs" element={withPermission(<SettingsLogsPage />, 'system:log:view')} />
        <Route path="settings/base" element={withPermission(<SettingsBasePage />, 'system:base:view')} />

        <Route path="403" element={<ForbiddenPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  </BrowserRouter>
);
