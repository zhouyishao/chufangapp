import { GenericMockListPage } from '../components/GenericMockListPage';

const initialItems = [
  { id: '1', query: '西红柿炒鸡蛋', count: 420, hitCount: 420, noResultCount: 0, clickCount: 395, rate: '94.0%' },
  { id: '2', query: '红烧肉', count: 380, hitCount: 380, noResultCount: 0, clickCount: 342, rate: '90.0%' },
  { id: '3', query: '可乐鸡翅', count: 290, hitCount: 290, noResultCount: 0, clickCount: 261, rate: '90.0%' },
  { id: '4', query: '无糖啤酒', count: 120, hitCount: 40, noResultCount: 80, clickCount: 24, rate: '20.0%' },
  { id: '5', query: '波士顿龙虾', count: 85, hitCount: 15, noResultCount: 70, clickCount: 5, rate: '5.8%' }
];

const columns = [
  { key: 'query', title: '搜索词' },
  { key: 'count', title: '搜索次数' },
  { key: 'hitCount', title: '命中次数' },
  { key: 'noResultCount', title: '无结果次数' },
  { key: 'clickCount', title: '点击内容数' },
  { key: 'rate', title: '搜索转化率 (点击数/总搜索)' }
];

export const ReportsSearchPage = () => {
  return (
    <GenericMockListPage
      title="搜索报表"
      description="统计用户在客户端输入的搜索关键词、命中状态、无结果流失率及最终菜谱/食材详情点击转化率。"
      primaryLabel="搜索词统计"
      initialItems={initialItems}
      columns={columns}
      searchPlaceholder="搜索特定关键词..."
      searchField="query"
    />
  );
};
