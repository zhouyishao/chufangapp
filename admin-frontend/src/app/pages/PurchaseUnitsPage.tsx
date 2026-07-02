import { GenericMockListPage } from '../components/GenericMockListPage';

const initialItems = [
  { id: '1', srcUnit: '千克 (kg)', destUnit: '克 (g)', ratio: '1:1000', contentType: '食材', category: '全部', status: 'ACTIVE', updatedAt: '2026-06-13 14:00:00' },
  { id: '2', name: '斤换克', srcUnit: '斤', destUnit: '克 (g)', ratio: '1:500', contentType: '食材', category: '蔬菜、肉类', status: 'ACTIVE', updatedAt: '2026-06-13 14:00:00' },
  { id: '3', srcUnit: '升 (L)', destUnit: '毫升 (ml)', ratio: '1:1000', contentType: '酒水', category: '酒水、果汁', status: 'ACTIVE', updatedAt: '2026-06-13 14:00:00' },
  { id: '4', srcUnit: '汤匙 (tbsp)', destUnit: '毫升 (ml)', ratio: '1:15', contentType: '调料', category: '液体调料', status: 'ACTIVE', updatedAt: '2026-06-13 14:00:00' },
  { id: '5', srcUnit: '茶匙 (tsp)', destUnit: '毫升 (ml)', ratio: '1:5', contentType: '调料', category: '液体调料', status: 'ACTIVE', updatedAt: '2026-06-13 14:00:00' }
];

const columns = [
  { key: 'srcUnit', title: '原单位' },
  { key: 'destUnit', title: '目标单位' },
  { key: 'ratio', title: '换算比例 (原 : 目标)' },
  { key: 'contentType', title: '内容类型' },
  { key: 'category', title: '适用分类' },
  { key: 'updatedAt', title: '更新时间' }
];

const filters = [
  {
    key: 'contentType',
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
  { key: 'srcUnit', label: '原单位', type: 'text' as const, required: true },
  { key: 'destUnit', label: '目标单位', type: 'text' as const, required: true },
  { key: 'ratio', label: '换算比例 (例如 1:500)', type: 'text' as const, required: true },
  {
    key: 'contentType',
    label: '内容类型',
    type: 'select' as const,
    required: true,
    options: [
      { label: '食材', value: '食材' },
      { label: '调料', value: '调料' },
      { label: '酒水', value: '酒水' }
    ]
  },
  { key: 'category', label: '适用分类', type: 'text' as const, required: true }
];

export const PurchaseUnitsPage = () => {
  return (
    <GenericMockListPage
      title="单位换算"
      description="配置采购结算和配料计量中的单位折算算法（例如大宗包装千克到克，或者口语化汤匙到毫升），实现计价和用料对齐。"
      primaryLabel="单位换算"
      initialItems={initialItems}
      columns={columns}
      filters={filters}
      fields={fields}
      defaultNewItem={{ contentType: '食材', category: '全部', status: 'ACTIVE' }}
      searchPlaceholder="输入原单位或目标单位搜索..."
      searchField="srcUnit"
    />
  );
};
