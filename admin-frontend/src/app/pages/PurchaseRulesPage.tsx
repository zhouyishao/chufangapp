import { GenericMockListPage } from '../components/GenericMockListPage';

const initialItems = [
  { id: '1', name: '家庭日常备菜智能规则', scenario: '周度配餐 / 冰箱补仓', mode: '自动根据菜篮子差值生成', mergeRule: '同品类合并，单位换算至斤或个', alertRule: '采购前一天 18:00 微信提醒', status: 'ACTIVE', updatedAt: '2026-06-13 11:00:00' },
  { id: '2', name: '节日宴请大宗采购规则', scenario: '家庭聚餐 / 节日宴请', mode: '根据选定菜谱用料 1.2 倍系数生成', mergeRule: '单独列出高价值海鲜与主食材', alertRule: '即时推送到发起人账户', status: 'ACTIVE', updatedAt: '2026-06-12 09:30:00' },
  { id: '3', name: '单人极简配餐规则', scenario: '工作日配餐', mode: '完全匹配菜谱步骤用量', mergeRule: '所有分类全部合并', alertRule: '无提醒', status: 'DISABLED', updatedAt: '2026-05-20 15:00:00' }
];

const columns = [
  { key: 'name', title: '规则名称' },
  { key: 'scenario', title: '适用场景' },
  { key: 'mode', title: '生成方式' },
  { key: 'mergeRule', title: '合并规则' },
  { key: 'alertRule', title: '提醒规则' },
  { key: 'updatedAt', title: '更新时间' }
];

const fields = [
  { key: 'name', label: '规则名称', type: 'text' as const, required: true },
  { key: 'scenario', label: '适用场景', type: 'text' as const, required: true },
  { key: 'mode', label: '生成方式', type: 'text' as const, required: true },
  { key: 'mergeRule', label: '合并规则', type: 'text' as const, required: true },
  { key: 'alertRule', label: '提醒规则', type: 'text' as const, required: true }
];

export const PurchaseRulesPage = () => {
  return (
    <GenericMockListPage
      title="采购规则"
      description="配置菜谱计划到买菜清单的转换行为。可配置用量倍数系数、品类合并规则、单位标准化以及提醒阈值。"
      primaryLabel="规则"
      initialItems={initialItems}
      columns={columns}
      fields={fields}
      defaultNewItem={{ status: 'ACTIVE' }}
      searchPlaceholder="输入规则名称或适用场景搜索..."
      searchField="name"
    />
  );
};
