export const ADMIN_PERMISSION_CATALOG = [
  { key: 'dashboard:view', name: '查看工作台', module: 'dashboard', moduleName: '工作台', action: 'view', sort: 10 },

  { key: 'home:configuration:view', name: '查看首页配置', module: 'home', moduleName: '首页运营', action: 'view', sort: 100 },
  { key: 'home:configuration:create', name: '新增首页配置', module: 'home', moduleName: '首页运营', action: 'create', sort: 101 },
  { key: 'home:configuration:update', name: '编辑首页配置', module: 'home', moduleName: '首页运营', action: 'update', sort: 102 },
  { key: 'home:configuration:status', name: '启停首页配置', module: 'home', moduleName: '首页运营', action: 'status', sort: 103 },
  { key: 'home:configuration:delete', name: '删除首页配置', module: 'home', moduleName: '首页运营', action: 'delete', sort: 104 },

  { key: 'content:recipe:view', name: '查看菜谱', module: 'content', moduleName: '内容管理', action: 'view', sort: 200 },
  { key: 'content:recipe:create', name: '新增菜谱', module: 'content', moduleName: '内容管理', action: 'create', sort: 201 },
  { key: 'content:recipe:update', name: '编辑菜谱', module: 'content', moduleName: '内容管理', action: 'update', sort: 202 },
  { key: 'content:recipe:publish', name: '发布菜谱', module: 'content', moduleName: '内容管理', action: 'publish', sort: 203 },
  { key: 'content:recipe:delete', name: '删除菜谱', module: 'content', moduleName: '内容管理', action: 'delete', sort: 204 },
  { key: 'content:ingredient:view', name: '查看食材', module: 'content', moduleName: '内容管理', action: 'view', sort: 210 },
  { key: 'content:ingredient:create', name: '新增食材', module: 'content', moduleName: '内容管理', action: 'create', sort: 211 },
  { key: 'content:ingredient:update', name: '编辑食材', module: 'content', moduleName: '内容管理', action: 'update', sort: 212 },
  { key: 'content:ingredient:publish', name: '发布食材', module: 'content', moduleName: '内容管理', action: 'publish', sort: 213 },
  { key: 'content:ingredient:delete', name: '删除食材', module: 'content', moduleName: '内容管理', action: 'delete', sort: 214 },
  { key: 'content:beverage:view', name: '查看酒水', module: 'content', moduleName: '内容管理', action: 'view', sort: 220 },
  { key: 'content:beverage:create', name: '新增酒水', module: 'content', moduleName: '内容管理', action: 'create', sort: 221 },
  { key: 'content:beverage:update', name: '编辑酒水', module: 'content', moduleName: '内容管理', action: 'update', sort: 222 },
  { key: 'content:beverage:publish', name: '发布酒水', module: 'content', moduleName: '内容管理', action: 'publish', sort: 223 },
  { key: 'content:beverage:delete', name: '删除酒水', module: 'content', moduleName: '内容管理', action: 'delete', sort: 224 },
  { key: 'content:configuration:view', name: '查看内容配置', module: 'content', moduleName: '内容管理', action: 'view', sort: 230 },
  { key: 'content:configuration:manage', name: '管理内容配置', module: 'content', moduleName: '内容管理', action: 'manage', sort: 231 },

  { key: 'taxonomy:view', name: '查看分类标签', module: 'taxonomy', moduleName: '分类标签', action: 'view', sort: 300 },
  { key: 'taxonomy:create', name: '新增分类标签', module: 'taxonomy', moduleName: '分类标签', action: 'create', sort: 301 },
  { key: 'taxonomy:update', name: '编辑分类标签', module: 'taxonomy', moduleName: '分类标签', action: 'update', sort: 302 },
  { key: 'taxonomy:status', name: '启停分类标签', module: 'taxonomy', moduleName: '分类标签', action: 'status', sort: 303 },
  { key: 'taxonomy:delete', name: '删除分类标签', module: 'taxonomy', moduleName: '分类标签', action: 'delete', sort: 304 },

  { key: 'family:view', name: '查看家庭', module: 'family', moduleName: '家庭管理', action: 'view', sort: 400 },
  { key: 'family:manage', name: '管理家庭', module: 'family', moduleName: '家庭管理', action: 'manage', sort: 401 },
  { key: 'user:account:view', name: '查看用户', module: 'user', moduleName: '用户管理', action: 'view', sort: 410 },
  { key: 'user:account:create', name: '新增用户账号', module: 'user', moduleName: '用户管理', action: 'create', sort: 411 },
  { key: 'user:account:update', name: '编辑用户账号', module: 'user', moduleName: '用户管理', action: 'update', sort: 412 },
  { key: 'user:account:reset-password', name: '重置用户密码', module: 'user', moduleName: '用户管理', action: 'reset-password', sort: 413 },
  { key: 'user:account:status', name: '启停用户账号', module: 'user', moduleName: '用户管理', action: 'status', sort: 414 },
  { key: 'user:account:delete', name: '删除用户账号', module: 'user', moduleName: '用户管理', action: 'delete', sort: 415 },
  { key: 'user:behavior:view', name: '查看用户行为', module: 'user', moduleName: '用户管理', action: 'view', sort: 416 },

  { key: 'audit:view', name: '查看审核', module: 'audit', moduleName: '审核中心', action: 'view', sort: 500 },
  { key: 'audit:manage', name: '执行审核', module: 'audit', moduleName: '审核中心', action: 'manage', sort: 501 },
  { key: 'comment:view', name: '查看评论', module: 'comment', moduleName: '评论管理', action: 'view', sort: 510 },
  { key: 'comment:manage', name: '管理评论', module: 'comment', moduleName: '评论管理', action: 'manage', sort: 511 },
  { key: 'search:log:view', name: '查看搜索日志', module: 'search', moduleName: '搜索运营', action: 'view', sort: 520 },
  { key: 'purchase:view', name: '查看采购数据', module: 'purchase', moduleName: '采购管理', action: 'view', sort: 530 },

  { key: 'file:view', name: '查看文件', module: 'file', moduleName: '文件管理', action: 'view', sort: 600 },
  { key: 'file:upload', name: '上传文件', module: 'file', moduleName: '文件管理', action: 'upload', sort: 601 },
  { key: 'file:delete', name: '删除文件', module: 'file', moduleName: '文件管理', action: 'delete', sort: 602 },
  { key: 'resource:view', name: '查看资源接口', module: 'resource', moduleName: '资源接口', action: 'view', sort: 610 },
  { key: 'resource:manage', name: '管理资源接口', module: 'resource', moduleName: '资源接口', action: 'manage', sort: 611 },
  { key: 'resource:import', name: '导入资源', module: 'resource', moduleName: '资源接口', action: 'import', sort: 612 },

  { key: 'system:admin:view', name: '查看管理员', module: 'system', moduleName: '系统设置', action: 'view', sort: 900 },
  { key: 'system:admin:manage', name: '管理管理员', module: 'system', moduleName: '系统设置', action: 'manage', sort: 901 },
  { key: 'system:role:view', name: '查看角色', module: 'system', moduleName: '系统设置', action: 'view', sort: 910 },
  { key: 'system:role:manage', name: '管理角色', module: 'system', moduleName: '系统设置', action: 'manage', sort: 911 },
  { key: 'system:log:view', name: '查看操作日志', module: 'system', moduleName: '系统设置', action: 'view', sort: 920 },
  { key: 'system:base:view', name: '查看基础配置', module: 'system', moduleName: '系统设置', action: 'view', sort: 930 },
  { key: 'system:base:manage', name: '管理基础配置', module: 'system', moduleName: '系统设置', action: 'manage', sort: 931 }
] as const;

export type AdminPermissionKey = (typeof ADMIN_PERMISSION_CATALOG)[number]['key'];

const contentOperatorPermissions = ADMIN_PERMISSION_CATALOG
  .filter((item) => !item.key.startsWith('system:'))
  .map((item) => item.key);

const readOnlyPermissions = ADMIN_PERMISSION_CATALOG
  .filter((item) => item.action === 'view')
  .map((item) => item.key);

export const SYSTEM_ROLE_PRESETS = [
  { code: 'SUPER_ADMIN', name: '超级管理员', description: '拥有全部后台权限', permissions: ['*'] as const },
  { code: 'CONTENT_OPERATOR', name: '内容运营', description: '管理首页、内容、用户和审核', permissions: contentOperatorPermissions },
  { code: 'READ_ONLY', name: '只读人员', description: '只读查看已开放数据', permissions: readOnlyPermissions }
] as const;
