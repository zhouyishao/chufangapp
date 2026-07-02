import { GenericMockListPage } from '../components/GenericMockListPage';

const initialItems = [
  { id: '1', name: '西红柿炒鸡蛋', count: 4520, sort: 10, isPublish: true, status: 'ACTIVE', updatedAt: '2026-06-13 14:02:11' },
  { id: '2', name: '减脂晚餐', count: 3200, sort: 9, isPublish: true, status: 'ACTIVE', updatedAt: '2026-06-13 11:20:00' },
  { id: '3', name: '快手家常菜', count: 2950, sort: 8, isPublish: true, status: 'ACTIVE', updatedAt: '2026-06-12 17:30:00' },
  { id: '4', name: '莫吉托调制', count: 850, sort: 7, isPublish: false, status: 'ACTIVE', updatedAt: '2026-06-10 09:12:00' },
  { id: '5', name: '海鲜大餐', count: 125, sort: 1, isPublish: true, status: 'DISABLED', updatedAt: '2026-05-30 00:00:00' }
];

const columns = [
  { key: 'name', title: '热词' },
  { key: 'count', title: '搜索次数' },
  { key: 'sort', title: '排序权重' },
  { key: 'isPublish', title: 'App 中展示', render: (item: any) => (item.isPublish ? '展示' : '不展示') },
  { key: 'updatedAt', title: '更新时间' }
];

const fields = [
  { key: 'name', label: '热词名称', type: 'text' as const, required: true },
  { key: 'count', label: '默认搜索次数', type: 'number' as const, required: true },
  { key: 'sort', label: '排序权重', type: 'number' as const, required: true },
  { key: 'isPublish', label: '在 App 中默认展示', type: 'checkbox' as const }
];

export const SearchOpsHotwordsPage = () => {
  return (
    <GenericMockListPage
      title="热词管理"
      description="配置和推荐 App 搜索框中的预设热词、热门标签和底纹占位搜索词，引导用户高效发现菜谱内容。"
      primaryLabel="热词"
      initialItems={initialItems}
      columns={columns}
      fields={fields}
      defaultNewItem={{ count: 0, sort: 0, isPublish: true, status: 'ACTIVE' }}
      searchPlaceholder="搜索特定热词..."
      searchField="name"
    />
  );
};
