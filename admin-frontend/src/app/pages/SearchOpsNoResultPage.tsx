import { GenericMockListPage } from '../components/GenericMockListPage';

const initialItems = [
  { id: '1', name: '无糖啤酒', count: 120, recommendContent: '青岛啤酒、精酿白啤', status: '已处理', updatedAt: '2026-06-13 14:02:11' },
  { id: '2', name: '波士顿龙虾', count: 85, recommendContent: '基围虾、大闸蟹', status: '待处理', updatedAt: '2026-06-13 11:20:00' },
  { id: '3', name: '纯素蛋糕', count: 42, recommendContent: '极简低脂慕斯、蒸水蛋', status: '待处理', updatedAt: '2026-06-12 17:30:00' },
  { id: '4', name: '生吃三文鱼', count: 15, recommendContent: '暂无推荐，已忽略该词', status: '已处理', updatedAt: '2026-06-10 09:12:00' }
];

const columns = [
  { key: 'name', title: '搜索词' },
  { key: 'count', title: '累计无结果搜索次数' },
  { key: 'recommendContent', title: '推荐引导内容' },
  { key: 'updatedAt', title: '最后检索时间' }
];

const filters = [
  {
    key: 'status',
    label: '处理状态',
    type: 'select' as const,
    options: [
      { label: '待处理', value: '待处理' },
      { label: '已处理', value: '已处理' }
    ]
  }
];

const fields = [
  { key: 'name', label: '搜索词', type: 'text' as const, required: true },
  { key: 'count', label: '搜索次数', type: 'number' as const, required: true },
  { key: 'recommendContent', label: '推荐内容 (用逗号隔开)', type: 'text' as const, required: true },
  {
    key: 'status',
    label: '处理状态',
    type: 'select' as const,
    required: true,
    options: [
      { label: '待处理', value: '待处理' },
      { label: '已处理', value: '已处理' }
    ]
  }
];

export const SearchOpsNoResultPage = () => {
  return (
    <GenericMockListPage
      title="无结果词"
      description="分析用户搜不到的关键词，设置重定向别名推荐或者特定引导卡片，避免用户搜索流程受阻流失。"
      primaryLabel="无结果词"
      initialItems={initialItems}
      columns={columns}
      filters={filters}
      fields={fields}
      defaultNewItem={{ count: 1, status: '待处理' }}
      searchPlaceholder="搜索特定无结果词..."
      searchField="name"
    />
  );
};
