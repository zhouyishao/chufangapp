import { GenericMockListPage } from '../components/GenericMockListPage';

const initialItems = [
  { id: '1', mainWord: '马铃薯', synonyms: '土豆、洋芋、薯仔', type: '食材', status: 'ACTIVE', updatedAt: '2026-06-13 14:02:11' },
  { id: '2', mainWord: '番茄', synonyms: '西红柿、洋柿子', type: '食材', status: 'ACTIVE', updatedAt: '2026-06-13 11:20:00' },
  { id: '3', mainWord: '可口可乐', synonyms: '可乐、coke', type: '酒水', status: 'ACTIVE', updatedAt: '2026-06-12 17:30:00' },
  { id: '4', mainWord: '酱油', synonyms: '生抽、老抽、豉油', type: '调料', status: 'ACTIVE', updatedAt: '2026-06-10 09:12:00' }
];

const columns = [
  { key: 'mainWord', title: '主词' },
  { key: 'synonyms', title: '同义词列表' },
  { key: 'type', title: '内容类型' },
  { key: 'updatedAt', title: '更新时间' }
];

const filters = [
  {
    key: 'type',
    label: '内容类型',
    type: 'select' as const,
    options: [
      { label: '食材', value: '食材' },
      { label: '调料', value: '调料' },
      { label: '酒水', value: '酒水' }
    ]
  }
];

const fields = [
  { key: 'mainWord', label: '主词', type: 'text' as const, required: true },
  { key: 'synonyms', label: '同义词列表 (用逗号隔开)', type: 'text' as const, required: true },
  {
    key: 'type',
    label: '内容类型',
    type: 'select' as const,
    required: true,
    options: [
      { label: '食材', value: '食材' },
      { label: '调料', value: '调料' },
      { label: '酒水', value: '酒水' }
    ]
  }
];

export const SearchOpsSynonymsPage = () => {
  return (
    <GenericMockListPage
      title="同义词管理"
      description="维护食材、调料和酒水饮品名称的同义词词库（如西红柿/番茄，土豆/马铃薯），提升搜索引擎搜索匹配准确率。"
      primaryLabel="同义词"
      initialItems={initialItems}
      columns={columns}
      filters={filters}
      fields={fields}
      defaultNewItem={{ type: '食材', status: 'ACTIVE' }}
      searchPlaceholder="输入主词搜索同义词..."
      searchField="mainWord"
    />
  );
};
