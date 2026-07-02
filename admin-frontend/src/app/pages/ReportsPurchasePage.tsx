import { GenericMockListPage } from '../components/GenericMockListPage';

const initialItems = [
  { id: '1', date: '2026-06-13', listCount: 12, completedCount: 8, topIngredient: '西红柿、鸡蛋、五花肉', estAmount: 1280.5, actualAmount: 1195.2, familyStats: '新建15个采购计划' },
  { id: '2', date: '2026-06-12', listCount: 15, completedCount: 11, topIngredient: '排骨、土豆、生抽', estAmount: 1850.0, actualAmount: 1780.0, familyStats: '新建18个采购计划' },
  { id: '3', date: '2026-06-11', listCount: 10, completedCount: 9, topIngredient: '鸡胸肉、西兰花、适量精盐', estAmount: 920.0, actualAmount: 910.5, familyStats: '新建12个采购计划' },
  { id: '4', date: '2026-06-10', listCount: 8, completedCount: 6, topIngredient: '牛肉、洋葱、青椒', estAmount: 780.2, actualAmount: 750.0, familyStats: '新建9个采购计划' }
];

const columns = [
  { key: 'date', title: '日期' },
  { key: 'listCount', title: '采购清单数' },
  { key: 'completedCount', title: '完成数量' },
  { key: 'topIngredient', title: '最常采购食材' },
  { key: 'estAmount', title: '预计总金额', render: (item: any) => `￥${item.estAmount.toFixed(2)}` },
  { key: 'actualAmount', title: '实际总金额', render: (item: any) => `￥${item.actualAmount.toFixed(2)}` },
  { key: 'familyStats', title: '家庭空间统计' }
];

export const ReportsPurchasePage = () => {
  return (
    <GenericMockListPage
      title="采购报表"
      description="统计系统内各家庭生成的采购清单总量、履约率、主流采购种类以及预估金额同商超实付金额偏差率。"
      primaryLabel="采购统计"
      initialItems={initialItems}
      columns={columns}
      searchPlaceholder="按日期搜索..."
      searchField="date"
    />
  );
};
