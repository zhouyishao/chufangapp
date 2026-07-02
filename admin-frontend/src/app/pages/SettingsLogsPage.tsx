import { GenericMockListPage } from '../components/GenericMockListPage';

const initialItems = [
  { id: '1', time: '2026-06-13 15:02:11', adminName: 'super_admin', module: '菜谱管理', actionType: '更新', target: '红烧牛肉 (ID: 102)', ip: '112.96.12.84', result: '成功', detail: '修改制作步骤第3步的火候说明为中小火慢炖' },
  { id: '2', time: '2026-06-13 14:59:02', adminName: 'super_admin', module: '分类管理', actionType: '新增', target: '时令水果 (ID: 25)', ip: '112.96.12.84', result: '成功', detail: '创建二级分类：夏季瓜果，排序权重为10' },
  { id: '3', time: '2026-06-13 11:20:00', adminName: 'editor_zhang', module: '食材价格', actionType: '更新', target: '富士苹果 (ID: 2)', ip: '192.168.1.10', result: '成功', detail: '更正当前价格为6.8元/斤，采集来源设为新发地' },
  { id: '4', time: '2026-06-12 17:30:00', adminName: 'reviewer_li', module: '审核中心', actionType: '审核通过', target: '家庭自制酸奶 (ID: 412)', ip: '124.205.76.10', result: '成功', detail: '审核通过用户投稿菜谱，并同步发布到App' }
];

const columns = [
  { key: 'time', title: '操作时间' },
  { key: 'adminName', title: '管理员' },
  { key: 'module', title: '操作模块' },
  { key: 'actionType', title: '操作类型' },
  { key: 'target', title: '操作对象' },
  { key: 'ip', title: 'IP 地址' },
  { key: 'result', title: '操作结果' },
  { key: 'detail', title: '操作详情' }
];

const filters = [
  {
    key: 'module',
    label: '操作模块',
    type: 'select' as const,
    options: [
      { label: '菜谱管理', value: '菜谱管理' },
      { label: '分类管理', value: '分类管理' },
      { label: '食材价格', value: '食材价格' },
      { label: '审核中心', value: '审核中心' }
    ]
  },
  {
    key: 'actionType',
    label: '操作类型',
    type: 'select' as const,
    options: [
      { label: '新增', value: '新增' },
      { label: '更新', value: '更新' },
      { label: '删除', value: '删除' },
      { label: '审核通过', value: '审核通过' }
    ]
  }
];

export const SettingsLogsPage = () => {
  return (
    <GenericMockListPage
      title="操作日志"
      description="审计管理员及后台编辑在平台执行的登录、配置修改、审核、增删改查动作日志流，保障系统操作安全合规。"
      primaryLabel="审计日志"
      initialItems={initialItems}
      columns={columns}
      filters={filters}
      searchPlaceholder="输入管理员或操作详情检索..."
      searchField="adminName"
    />
  );
};
