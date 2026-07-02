import { GenericMockListPage } from '../components/GenericMockListPage';

const initialItems = [
  { id: '1', name: '精选西红柿', type: '食材', category: '蔬菜', price: 3.5, unit: '斤', region: '北京朝阳区', source: '新发地市场', date: '2026-06-13', status: 'ACTIVE' },
  { id: '2', name: '富士苹果', type: '水果', category: '苹果', price: 6.8, unit: '斤', region: '北京朝阳区', source: '物美超市', date: '2026-06-13', status: 'ACTIVE' },
  { id: '3', name: '特级海天生抽', type: '调料', category: '调料', price: 12.9, unit: '瓶', region: '上海浦东', source: '盒马鲜生', date: '2026-06-12', status: 'ACTIVE' },
  { id: '4', name: '青岛啤酒 (金麦)', type: '酒水', category: '啤酒', price: 5.5, unit: '罐', region: '青岛市', source: '大润发', date: '2026-06-13', status: 'ACTIVE' },
  { id: '5', name: '优质土豆', type: '食材', category: '蔬菜', price: 1.8, unit: '斤', region: '北京朝阳区', source: '社区菜市场', date: '2026-06-13', status: 'ACTIVE' }
];

const columns = [
  { key: 'name', title: '内容名称' },
  { key: 'type', title: '内容类型' },
  { key: 'category', title: '分类' },
  { key: 'price', title: '当前价格', render: (item: any) => `￥${item.price.toFixed(2)}` },
  { key: 'unit', title: '单位' },
  { key: 'region', title: '地区' },
  { key: 'source', title: '来源' },
  { key: 'date', title: '采集日期' }
];

const filters = [
  {
    key: 'type',
    label: '内容类型',
    type: 'select' as const,
    options: [
      { label: '食材', value: '食材' },
      { label: '水果', value: '水果' },
      { label: '调料', value: '调料' },
      { label: '酒水', value: '酒水' }
    ]
  }
];

const fields = [
  { key: 'name', label: '内容名称', type: 'text' as const, required: true },
  {
    key: 'type',
    label: '内容类型',
    type: 'select' as const,
    required: true,
    options: [
      { label: '食材', value: '食材' },
      { label: '水果', value: '水果' },
      { label: '调料', value: '调料' },
      { label: '酒水', value: '酒水' }
    ]
  },
  { key: 'category', label: '分类', type: 'text' as const, required: true },
  { key: 'price', label: '当前价格', type: 'number' as const, required: true },
  { key: 'unit', label: '单位', type: 'text' as const, required: true },
  { key: 'region', label: '地区', type: 'text' as const, required: true },
  { key: 'source', label: '来源', type: 'text' as const, required: true },
  { key: 'date', label: '采集日期', type: 'text' as const, required: true }
];

export const PricesIngredientsPage = () => {
  return (
    <GenericMockListPage
      title="食材价格"
      description="采集和管理各地区、多来源的食材最新参考价格，用于用户买菜清单的金额预测和价格走势比对。"
      primaryLabel="价格记录"
      initialItems={initialItems}
      columns={columns}
      filters={filters}
      fields={fields}
      defaultNewItem={{ type: '食材', date: new Date().toISOString().split('T')[0], status: 'ACTIVE' }}
      searchPlaceholder="输入内容名称或分类搜索..."
      searchField="name"
    />
  );
};
