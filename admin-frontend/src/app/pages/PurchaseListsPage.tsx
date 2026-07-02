import { GenericMockListPage } from '../components/GenericMockListPage';

const initialItems = [
  { id: 'lst_001', name: '2026年端午节家庭聚餐采购', familyName: '张三的温馨之家', creator: '张三', count: 18, price: 345.5, status: '待采购', createdAt: '2026-06-12 10:00:00', updatedAt: '2026-06-13 09:00:00' },
  { id: 'lst_002', name: '本周日常配菜采购清单', familyName: '李四的厨房生活', creator: '李四', count: 7, price: 89.2, status: '采购中', createdAt: '2026-06-13 08:30:00', updatedAt: '2026-06-13 14:00:00' },
  { id: 'lst_003', name: '周末火锅派对采购计划', familyName: '王五的小家庭', creator: '王五', count: 24, price: 512.0, status: '已完成', createdAt: '2026-06-10 14:00:00', updatedAt: '2026-06-11 18:20:00' }
];

const columns = [
  { key: 'name', title: '清单名称' },
  { key: 'familyName', title: '家庭' },
  { key: 'creator', title: '创建用户' },
  { key: 'count', title: '商品数量' },
  { key: 'price', title: '预计金额', render: (item: any) => `￥${item.price.toFixed(2)}` },
  { key: 'createdAt', title: '创建时间' },
  { key: 'updatedAt', title: '更新时间' }
];

const filters = [
  {
    key: 'status',
    label: '状态',
    type: 'select' as const,
    options: [
      { label: '待采购', value: '待采购' },
      { label: '采购中', value: '采购中' },
      { label: '已完成', value: '已完成' }
    ]
  }
];

const fields = [
  { key: 'name', label: '清单名称', type: 'text' as const, required: true },
  { key: 'familyName', label: '家庭', type: 'text' as const, required: true },
  { key: 'creator', label: '创建用户', type: 'text' as const, required: true },
  { key: 'count', label: '商品数量', type: 'number' as const, required: true },
  { key: 'price', label: '预计金额', type: 'number' as const, required: true },
  {
    key: 'status',
    label: '状态',
    type: 'select' as const,
    required: true,
    options: [
      { label: '待采购', value: '待采购' },
      { label: '采购中', value: '采购中' },
      { label: '已完成', value: '已完成' }
    ]
  }
];

export const PurchaseListsPage = () => {
  return (
    <GenericMockListPage
      title="采购清单"
      description="统一管理各家庭菜篮子生成的采购计划明细，支持清单合并、状态跟进与采购统计。"
      primaryLabel="采购清单"
      initialItems={initialItems}
      columns={columns}
      filters={filters}
      fields={fields}
      defaultNewItem={{ count: 1, price: 0, status: '待采购' }}
      searchPlaceholder="输入清单名称或创建用户搜索..."
      searchField="name"
    />
  );
};
