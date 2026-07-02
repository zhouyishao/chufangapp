import { GenericMockListPage } from '../components/GenericMockListPage';

const initialItems = [
  { id: '1', keyword: '端午节', contentTitle: '传统手工蜜枣粽子做法', type: '菜谱', sort: 100, startTime: '2026-06-01 00:00:00', endTime: '2026-06-25 23:59:59', status: 'ACTIVE' },
  { id: '2', keyword: '牛排', contentTitle: '澳洲进口安格斯眼肉牛排', type: '食材', sort: 90, startTime: '2026-01-01 00:00:00', endTime: '2026-12-31 23:59:59', status: 'ACTIVE' },
  { id: '3', keyword: '微醺调酒', contentTitle: '经典莫吉托 (Mojito) 调制比例', type: '酒水', sort: 80, startTime: '2026-05-01 00:00:00', endTime: '2026-09-30 23:59:59', status: 'ACTIVE' }
];

const columns = [
  { key: 'keyword', title: '关键词' },
  { key: 'contentTitle', title: '置顶内容' },
  { key: 'type', title: '内容类型' },
  { key: 'sort', title: '置顶排序权重' },
  { key: 'startTime', title: '生效时间' },
  { key: 'endTime', title: '失效时间' }
];

const filters = [
  {
    key: 'type',
    label: '内容类型',
    type: 'select' as const,
    options: [
      { label: '菜谱', value: '菜谱' },
      { label: '食材', value: '食材' },
      { label: '酒水', value: '酒水' }
    ]
  }
];

const fields = [
  { key: 'keyword', label: '关键词', type: 'text' as const, required: true },
  { key: 'contentTitle', label: '置顶内容标题', type: 'text' as const, required: true },
  {
    key: 'type',
    label: '内容类型',
    type: 'select' as const,
    required: true,
    options: [
      { label: '菜谱', value: '菜谱' },
      { label: '食材', value: '食材' },
      { label: '酒水', value: '酒水' }
    ]
  },
  { key: 'sort', label: '置顶权重 (越大越靠前)', type: 'number' as const, required: true },
  { key: 'startTime', label: '生效时间', type: 'text' as const, required: true },
  { key: 'endTime', label: '失效时间', type: 'text' as const, required: true }
];

export const SearchOpsPinsPage = () => {
  return (
    <GenericMockListPage
      title="搜索置顶"
      description="配置特定搜索词触发时，强制将某些官方推荐菜谱、活动食材或运营广告置顶展示在搜索结果最前方。"
      primaryLabel="搜索置顶"
      initialItems={initialItems}
      columns={columns}
      filters={filters}
      fields={fields}
      defaultNewItem={{ type: '菜谱', sort: 10, status: 'ACTIVE' }}
      searchPlaceholder="输入关键词搜索置顶规则..."
      searchField="keyword"
    />
  );
};
