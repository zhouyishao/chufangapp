import { GenericMockListPage } from '../components/GenericMockListPage';

const initialItems = [
  { id: '1', name: '精选西红柿', grossUnit: '克 (g)', netUnit: '克 (g)', lossRate: '12%', cookRatio: '85%', status: 'ACTIVE', updatedAt: '2026-06-13 14:20:00' },
  { id: '2', name: '西兰花', grossUnit: '克 (g)', netUnit: '克 (g)', lossRate: '25%', cookRatio: '80%', status: 'ACTIVE', updatedAt: '2026-06-13 14:20:00' },
  { id: '3', name: '菠菜', grossUnit: '克 (g)', netUnit: '克 (g)', lossRate: '15%', cookRatio: '65%', status: 'ACTIVE', updatedAt: '2026-06-13 14:20:00' },
  { id: '4', name: '五花肉', grossUnit: '克 (g)', netUnit: '克 (g)', lossRate: '3%', cookRatio: '75%', status: 'ACTIVE', updatedAt: '2026-06-13 14:20:00' },
  { id: '5', name: '海带芽', grossUnit: '克 (g)', netUnit: '克 (g)', lossRate: '0%', cookRatio: '180%', status: 'ACTIVE', updatedAt: '2026-06-13 14:20:00' }
];

const columns = [
  { key: 'name', title: '内容名称 / 分类' },
  { key: 'grossUnit', title: '毛重单位' },
  { key: 'netUnit', title: '净重单位' },
  { key: 'lossRate', title: '损耗率 (削皮/去核等)' },
  { key: 'cookRatio', title: '烹饪后折算率' },
  { key: 'updatedAt', title: '更新时间' }
];

const fields = [
  { key: 'name', label: '内容名称 / 分类', type: 'text' as const, required: true },
  { key: 'grossUnit', label: '毛重单位', type: 'text' as const, required: true },
  { key: 'netUnit', label: '净重单位', type: 'text' as const, required: true },
  { key: 'lossRate', label: '损耗率 (如 10%)', type: 'text' as const, required: true },
  { key: 'cookRatio', label: '烹饪后折算率', type: 'text' as const, required: true }
];

export const PurchaseLossPage = () => {
  return (
    <GenericMockListPage
      title="损耗配置"
      description="管理食材处理、去骨、去壳、削皮造成的损耗率，以及烹饪后的脱水收缩或吸水膨胀折算比例，实现高精度分量计算。"
      primaryLabel="损耗配置"
      initialItems={initialItems}
      columns={columns}
      fields={fields}
      defaultNewItem={{ grossUnit: '克 (g)', netUnit: '克 (g)', status: 'ACTIVE' }}
      searchPlaceholder="输入食材名称或分类过滤..."
      searchField="name"
    />
  );
};
