import { GenericMockListPage } from '../components/GenericMockListPage';

const initialItems = [
  { id: '1', date: '2026-06-13', newUser: 185, activeUser: 1250, retention: '45.2%', familyCount: 88, favAction: 920, viewAction: 14250, submissionCount: 4 },
  { id: '2', date: '2026-06-12', newUser: 171, activeUser: 1180, retention: '44.8%', familyCount: 79, favAction: 870, viewAction: 13100, submissionCount: 2 },
  { id: '3', date: '2026-06-11', newUser: 165, activeUser: 1150, retention: '45.0%', familyCount: 82, favAction: 890, viewAction: 12400, submissionCount: 3 },
  { id: '4', date: '2026-06-10', newUser: 190, activeUser: 1210, retention: '46.1%', familyCount: 94, favAction: 950, viewAction: 12900, submissionCount: 5 },
  { id: '5', date: '2026-06-09', newUser: 142, activeUser: 1050, retention: '43.9%', familyCount: 68, favAction: 760, viewAction: 11200, submissionCount: 1 }
];

const columns = [
  { key: 'date', title: '日期' },
  { key: 'newUser', title: '新增用户' },
  { key: 'activeUser', title: '活跃用户' },
  { key: 'retention', title: '次日留存率' },
  { key: 'familyCount', title: '家庭空间创建数' },
  { key: 'favAction', title: '收藏次数' },
  { key: 'viewAction', title: '浏览行为数' },
  { key: 'submissionCount', title: '投稿数量' }
];

export const ReportsUsersPage = () => {
  return (
    <GenericMockListPage
      title="用户报表"
      description="按日期展示新增用户、日活 (DAU)、家庭空间创建量、收藏/浏览深度及用户菜谱投稿数据。"
      primaryLabel="日度用户指标"
      initialItems={initialItems}
      columns={columns}
      searchPlaceholder="输入日期搜索..."
      searchField="date"
    />
  );
};
