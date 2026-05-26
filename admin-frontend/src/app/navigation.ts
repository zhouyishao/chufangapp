export type AdminNavItem = {
  label: string;
  path: string;
  permission?: string;
  children?: AdminNavItem[];
};

export const adminNavigation: AdminNavItem[] = [
  {
    label: '工作台',
    path: '/dashboard',
    permission: 'dashboard:view'
  },
  {
    label: '首页运营',
    path: '/home-ops',
    permission: 'home:view',
    children: [
      { label: '首页概览', path: '/home-ops', permission: 'home:view' },
      { label: 'Banner 管理', path: '/home-ops/banners', permission: 'banner:view' },
      { label: '推荐位管理', path: '/home-ops/recommend-slots', permission: 'recommendation:view' },
      { label: '今日推荐', path: '/home-ops/today', permission: 'recommendation:view' },
      { label: '时令食材', path: '/home-ops/seasonal', permission: 'seasonal:view' },
      { label: '首页预览', path: '/home-ops/preview', permission: 'home:preview' }
    ]
  },
  {
    label: '内容管理',
    path: '/content',
    permission: 'content:view',
    children: [
      { label: '内容概览', path: '/content', permission: 'content:view' },
      { label: '菜谱管理', path: '/content/recipes', permission: 'recipe:view' },
      { label: '食材管理', path: '/content/ingredients', permission: 'ingredient:view' },
      { label: '图集管理', path: '/content/galleries', permission: 'gallery:view' }
    ]
  },
  {
    label: '分类标签',
    path: '/taxonomies',
    permission: 'taxonomy:view',
    children: [
      { label: '分类管理', path: '/taxonomies/categories', permission: 'taxonomy:view' },
      { label: '标签管理', path: '/taxonomies/tags', permission: 'tag:view' },
      { label: '菜系管理', path: '/taxonomies/cuisines', permission: 'cuisine:view' },
      { label: '频道管理', path: '/taxonomies/channels', permission: 'channel:view' }
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
      { label: '饮食偏好', path: '/families/preferences', permission: 'family:preference:view' },
      { label: '家庭菜单', path: '/families/menus', permission: 'family:menu:view' }
    ]
  },
  {
    label: '用户管理',
    path: '/users',
    permission: 'user:view',
    children: [
      { label: '用户列表', path: '/users', permission: 'user:view' },
      { label: '用户行为', path: '/users/behavior', permission: 'user:behavior:view' },
      { label: '用户收藏', path: '/users/favorites', permission: 'user:favorites:view' },
      { label: '最近浏览', path: '/users/recent-views', permission: 'user:recent-view:view' },
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
    permission: 'ai:view',
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
    permission: 'search:view',
    children: [
      { label: '搜索日志', path: '/search-ops/logs', permission: 'search:log:view' },
      { label: '热词管理', path: '/search-ops/hotwords', permission: 'search:hotword:view' },
      { label: '无结果词', path: '/search-ops/no-result', permission: 'search:no-result:view' },
      { label: '同义词管理', path: '/search-ops/synonyms', permission: 'search:synonym:view' },
      { label: '搜索置顶', path: '/search-ops/pins', permission: 'search:pin:view' }
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
    permission: 'resource:view',
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
    permission: 'system:view',
    children: [
      { label: '管理员管理', path: '/settings/admins', permission: 'system:admin:view' },
      { label: '角色权限', path: '/settings/roles', permission: 'system:role:view' },
      { label: '操作日志', path: '/settings/logs', permission: 'system:log:view' },
      { label: '基础配置', path: '/settings/base', permission: 'system:base:view' }
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
