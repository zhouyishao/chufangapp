import { GenericMockListPage } from '../components/GenericMockListPage';

const initialItems = [
  { id: '1', name: '精选西红柿', type: '食材', category: '蔬菜', region: '北京朝阳区', timeRange: '近30天', maxPrice: 4.8, minPrice: 2.9, avgPrice: 3.6, currentPrice: 3.5, diffRate: '-2.7%', source: '新发地市场' },
  { id: '2', name: '富士苹果', type: '水果', category: '苹果', region: '北京朝阳区', timeRange: '近30天', maxPrice: 7.2, minPrice: 6.2, avgPrice: 6.6, currentPrice: 6.8, diffRate: '+3.0%', source: '物美超市' },
  { id: '3', name: '特级海天生抽', type: '调料', category: '调料', region: '上海浦东', timeRange: '近90天', maxPrice: 13.5, minPrice: 12.0, avgPrice: 12.7, currentPrice: 12.9, diffRate: '+1.5%', source: '盒马鲜生' },
  { id: '4', name: '大葱', type: '食材', category: '蔬菜', region: '北京朝阳区', timeRange: '近30天', maxPrice: 5.5, minPrice: 2.2, avgPrice: 3.8, currentPrice: 4.2, diffRate: '+10.5%', source: '新发地市场' }
];

const columns = [
  { key: 'name', title: '内容名称' },
  { key: 'type', title: '内容类型' },
  { key: 'category', title: '分类' },
  { key: 'region', title: '地区' },
  { key: 'timeRange', title: '时间范围' },
  { key: 'maxPrice', title: '最高价', render: (item: any) => `￥${item.maxPrice.toFixed(2)}` },
  { key: 'minPrice', title: '最低价', render: (item: any) => `￥${item.minPrice.toFixed(2)}` },
  { key: 'avgPrice', title: '平均价', render: (item: any) => `￥${item.avgPrice.toFixed(2)}` },
  { key: 'currentPrice', title: '当前价', render: (item: any) => `￥${item.currentPrice.toFixed(2)}` },
  {
    key: 'diffRate',
    title: '涨跌幅',
    render: (item: any) => {
      const isUp = item.diffRate.startsWith('+');
      return (
        <span className={isUp ? 'text-red-600 font-semibold' : 'text-emerald-600 font-semibold'}>
          {item.diffRate}
        </span>
      );
    }
  },
  { key: 'source', title: '数据来源' }
];

const filters = [
  {
    key: 'type',
    label: '内容类型',
    type: 'select' as const,
    options: [
      { label: '食材', value: '食材' },
      { label: '水果', value: '水果' },
      { label: '调料', value: '调料' }
    ]
  }
];

export const PricesTrendsPage = () => {
  return (
    <GenericMockListPage
      title="价格趋势"
      description="多时间窗口监测主要食材和副食品价格走势与波动情况，提供峰值分析和通胀预警参考。"
      primaryLabel="价格走势"
      initialItems={initialItems}
      columns={columns}
      filters={filters}
      searchPlaceholder="输入内容名称检索历史趋势..."
      searchField="name"
      stats={[
        { icon: '📈', title: '本月价格上涨项', value: 8, suffix: '个', tone: 'orange' },
        { icon: '📉', title: '本月价格下跌项', value: 12, suffix: '个', tone: 'green' },
        { icon: '⚖️', title: '价格总体波动', value: '+1.2%', tone: 'blue' }
      ]}
    />
  );
};
