export type AdminNavItem = {
  label: string;
  path: string;
  permission?: string;
  children?: AdminNavItem[];
};

export const adminNavigation: AdminNavItem[] = [
  { label: '工作台', path: '/dashboard', permission: 'dashboard:view' },
  {
    label: '首页管理',
    path: '/home-ops',
    permission: 'home:view',
    children: [
      { label: '顶部导航管理', path: '/home-ops', permission: 'home:view' },
      { label: '模块管理', path: '/home-ops/modules', permission: 'home:view' }
    ]
  },
  {
    label: '内容管理',
    path: '/content',
    permission: 'content:view',
    children: [
      { label: '菜谱管理', path: '/content/recipes', permission: 'recipe:view' },
      { label: '食材管理', path: '/content/ingredients', permission: 'ingredient:view' },
      { label: '水果管理', path: '/content/fruits', permission: 'ingredient:view' },
      { label: '调料管理', path: '/content/seasonings', permission: 'ingredient:view' },
      { label: '酒水管理', path: '/content/beverages', permission: 'beverage:view' }
    ]
  },
  {
    label: '资源管理',
    path: '/resource-management',
    permission: 'resource:view',
    children: [
      { label: '资源接入中心', path: '/resource-management/access-center', permission: 'resource:view' },
      { label: '导入记录', path: '/resource-management/import-records', permission: 'resource:import:view' },
      { label: 'API 接口管理', path: '/resources/api-providers', permission: 'resource:provider:view' }
    ]
  },
  {
    label: '分类标签',
    path: '/taxonomies',
    permission: 'taxonomy:view',
    children: [
      { label: '分类管理', path: '/taxonomies/categories', permission: 'taxonomy:view' },
      { label: '标签管理', path: '/taxonomies/tags', permission: 'tag:view' },
      { label: '单位管理', path: '/taxonomies/units', permission: 'unit:view' }
    ]
  },
  {
    label: '价格管理',
    path: '/prices',
    permission: 'price:view',
    children: [
      { label: '食材价格', path: '/prices/ingredients', permission: 'price:view' },
      { label: '价格趋势', path: '/prices/trends', permission: 'price:trend:view' },
      { label: '价格预警', path: '/prices/alerts', permission: 'price:alert:view' },
      { label: '价格来源', path: '/prices/sources', permission: 'price:source:view' }
    ]
  },
  {
    label: '家庭管理',
    path: '/families',
    permission: 'family:view',
    children: [
      { label: '家庭列表', path: '/families/list', permission: 'family:view' },
      { label: '家庭成员', path: '/families/members', permission: 'family:member:view' },
      { label: '邀请记录', path: '/families/invites', permission: 'family:member:view' }
    ]
  },
  {
    label: '用户管理',
    path: '/users',
    permission: 'user:view',
    children: [
      { label: '用户列表', path: '/users', permission: 'user:view' },
      { label: '用户投稿', path: '/users/submissions', permission: 'user:submission:view' }
    ]
  },
  {
    label: '审核中心',
    path: '/audits',
    permission: 'audit:view',
    children: [
      { label: '待审核', path: '/audits/pending', permission: 'audit:view' },
      { label: '已通过', path: '/audits/approved', permission: 'audit:view' },
      { label: '已驳回', path: '/audits/rejected', permission: 'audit:view' },
      { label: '审核记录', path: '/audits/records', permission: 'audit:record:view' }
    ]
  },
  {
    label: '数据报表',
    path: '/reports',
    permission: 'report:view',
    children: [
      { label: '运营概览', path: '/reports/overview', permission: 'report:view' },
      { label: '内容报表', path: '/reports/content', permission: 'report:content:view' },
      { label: '用户报表', path: '/reports/users', permission: 'report:user:view' },
      { label: '搜索报表', path: '/reports/search', permission: 'report:search:view' },
      { label: '采购报表', path: '/reports/purchase', permission: 'report:purchase:view' }
    ]
  },
  {
    label: '文件管理',
    path: '/files',
    permission: 'file:view',
    children: [
      { label: '文件列表', path: '/files/list', permission: 'file:view' },
      { label: '上传记录', path: '/files/uploads', permission: 'file:upload:view' },
      { label: '引用关系', path: '/files/usages', permission: 'file:usage:view' }
    ]
  },
  {
    label: '资源接口',
    path: '/resources',
    permission: 'resource:app:view',
    children: [
      { label: '应用管理', path: '/resources/apps', permission: 'resource:app:view' },
      { label: 'API Key 管理', path: '/resources/api-keys', permission: 'resource:key:view' },
      { label: '接口权限', path: '/resources/permissions', permission: 'resource:permission:view' },
      { label: '调用日志', path: '/resources/logs', permission: 'resource:log:view' }
    ]
  },
  {
    label: '系统设置',
    path: '/settings',
    permission: 'system:admin:view',
    children: [
      { label: '管理员管理', path: '/settings/admins', permission: 'system:admin:view' },
      { label: '角色权限', path: '/settings/roles', permission: 'system:role:view' },
      { label: '操作日志', path: '/settings/logs', permission: 'system:log:view' },
      { label: '基础配置', path: '/settings/base', permission: 'system:base:view' }
    ]
  },
  {
    label: '菜篮子/采购',
    path: '/purchase',
    permission: 'purchase:view',
    children: [
      { label: '采购清单', path: '/purchase/lists', permission: 'purchase:view' },
      { label: '采购规则', path: '/purchase/rules', permission: 'purchase:rule:view' },
      { label: '单位换算', path: '/purchase/units', permission: 'purchase:unit:view' },
      { label: '损耗配置', path: '/purchase/loss', permission: 'purchase:loss:view' }
    ]
  },
  {
    label: '评论管理',
    path: '/comments',
    permission: 'comment:view',
    children: [
      { label: '评论列表', path: '/comments', permission: 'comment:view' },
      { label: '举报处理', path: '/comments/reports', permission: 'comment:report:view' }
    ]
  },
  {
    label: 'AI 配置',
    path: '/ai',
    permission: 'ai:model:view',
    children: [
      { label: '模型配置', path: '/ai/models', permission: 'ai:model:view' },
      { label: 'Prompt 模板', path: '/ai/prompts', permission: 'ai:prompt:view' },
      { label: 'AI 任务', path: '/ai/tasks', permission: 'ai:task:view' },
      { label: '调用记录', path: '/ai/logs', permission: 'ai:log:view' }
    ]
  },
  {
    label: '搜索运营',
    path: '/search-ops',
    permission: 'search:log:view',
    children: [
      { label: '搜索日志', path: '/search-ops/logs', permission: 'search:log:view' },
      { label: '热词管理', path: '/search-ops/hotwords', permission: 'search:hotword:view' },
      { label: '无结果词', path: '/search-ops/no-result', permission: 'search:no-result:view' },
      { label: '同义词管理', path: '/search-ops/synonyms', permission: 'search:synonym:view' },
      { label: '搜索置顶', path: '/search-ops/pins', permission: 'search:pin:view' }
    ]
  }
];

export const flattenNavigation = (items: AdminNavItem[] = adminNavigation): AdminNavItem[] =>
  items.flatMap((item) => [item, ...(item.children ? flattenNavigation(item.children) : [])]);

const isRouteMatch = (pathname: string, path: string) =>
  pathname === path || (path !== '/' && pathname.startsWith(`${path}/`));

export const findNavigationTrail = (
  pathname: string,
  items: AdminNavItem[] = adminNavigation
): AdminNavItem[] => {
  let bestTrail: AdminNavItem[] = [];

  const visit = (item: AdminNavItem, parents: AdminNavItem[]) => {
    const trail = [...parents, item];
    if (isRouteMatch(pathname, item.path)) {
      const currentScore = trail[trail.length - 1]?.path.length ?? 0;
      const bestScore = bestTrail[bestTrail.length - 1]?.path.length ?? -1;
      if (currentScore > bestScore || (currentScore === bestScore && trail.length > bestTrail.length)) {
        bestTrail = trail;
      }
    }
    item.children?.forEach((child) => visit(child, trail));
  };

  items.forEach((item) => visit(item, []));
  return bestTrail;
};
