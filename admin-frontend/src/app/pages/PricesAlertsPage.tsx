import { GenericMockListPage } from '../components/GenericMockListPage';

const initialItems = [
  { id: '1', name: '蔬菜涨幅过高预警', type: '食材', target: '蔬菜大类', rule: '上涨超过 N%', threshold: '15%', status: 'ACTIVE', lastTrigger: '2026-06-13 11:20:00' },
  { id: '2', name: '猪肉价格暴跌预警', type: '食材', target: '五花肉 / 排骨', rule: '下跌超过 N%', threshold: '20%', status: 'ACTIVE', lastTrigger: '2026-06-08 09:15:00' },
  { id: '3', name: '基准调料缺失预警', type: '调料', target: '生抽 / 食盐', rule: '价格缺失', threshold: '-', status: 'ACTIVE', lastTrigger: '2026-06-12 18:30:00' },
  { id: '4', name: '热销水果断档监控', type: '水果', target: '红富士苹果', rule: '价格缺失', threshold: '-', status: 'DISABLED', lastTrigger: '无' }
];

const columns = [
  { key: 'name', title: '预警名称' },
  { key: 'type', title: '内容类型' },
  { key: 'target', title: '关联内容' },
  { key: 'rule', title: '预警规则' },
  { key: 'threshold', title: '阈值' },
  { key: 'lastTrigger', title: '最近触发时间' }
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
  },
  {
    key: 'rule',
    label: '预警规则',
    type: 'select' as const,
    options: [
      { label: '上涨超过 N%', value: '上涨超过 N%' },
      { label: '下跌超过 N%', value: '下跌超过 N%' },
      { label: '价格缺失', value: '价格缺失' }
    ]
  }
];

const fields = [
  { key: 'name', label: '预警名称', type: 'text' as const, required: true },
  {
    key: 'type',
    label: '内容类型',
    type: 'select' as const,
    required: true,
    options: [
      { label: '食材', value: '食材' },
      { label: '水果', value: '水果' },
      { label: '调料', value: '调料' }
    ]
  },
  { key: 'target', label: '关联内容', type: 'text' as const, required: true },
  {
    key: 'rule',
    label: '预警规则',
    type: 'select' as const,
    required: true,
    options: [
      { label: '上涨超过 N%', value: '上涨超过 N%' },
      { label: '下跌超过 N%', value: '下跌超过 N%' },
      { label: '价格缺失', value: '价格缺失' }
    ]
  },
  { key: 'threshold', label: '阈值', type: 'text' as const, required: true }
];

export const PricesAlertsPage = () => {
  return (
    <GenericMockListPage
      title="价格预警"
      description="配置异常价格变动、暴涨暴跌或价格接口采集数据缺失的警告阈值，支持对接系统通知。"
      primaryLabel="预警规则"
      initialItems={initialItems}
      columns={columns}
      filters={filters}
      fields={fields}
      defaultNewItem={{ type: '食材', rule: '上涨超过 N%', status: 'ACTIVE', lastTrigger: '无' }}
      searchPlaceholder="输入预警名称或关联内容搜索..."
      searchField="name"
    />
  );
};
