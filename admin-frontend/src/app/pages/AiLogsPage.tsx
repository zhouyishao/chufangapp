import { GenericMockListPage } from '../components/GenericMockListPage';

const initialItems = [
  { id: '1', time: '2026-06-13 15:02:11', modelName: 'Gemini 1.5 Pro', scenario: '今日推荐生成', inputToken: 2450, outputToken: 1200, duration: '3.2s', status: '成功', error: '-' },
  { id: '2', time: '2026-06-13 15:01:45', modelName: 'Gemini 1.5 Flash', scenario: '分类提取', inputToken: 1200, outputToken: 350, duration: '1.2s', status: '成功', error: '-' },
  { id: '3', time: '2026-06-13 14:55:18', modelName: 'Gemini 1.5 Pro', scenario: '配餐规划', inputToken: 3200, outputToken: 1500, duration: '4.1s', status: '成功', error: '-' },
  { id: '4', time: '2026-06-13 14:50:00', modelName: 'DeepSeek Chat', scenario: '食材别名匹配', inputToken: 850, outputToken: 120, duration: '2.5s', status: '失败', error: 'Connect Timeout to DeepSeek API' }
];

const columns = [
  { key: 'time', title: '调用时间' },
  { key: 'modelName', title: '模型名称' },
  { key: 'scenario', title: '使用场景' },
  { key: 'inputToken', title: '输入 Token' },
  { key: 'outputToken', title: '输出 Token' },
  { key: 'duration', title: '耗时' },
  { key: 'error', title: '错误信息' }
];

const filters = [
  {
    key: 'modelName',
    label: '模型名称',
    type: 'select' as const,
    options: [
      { label: 'Gemini 1.5 Pro', value: 'Gemini 1.5 Pro' },
      { label: 'Gemini 1.5 Flash', value: 'Gemini 1.5 Flash' },
      { label: 'DeepSeek Chat', value: 'DeepSeek Chat' }
    ]
  },
  {
    key: 'status',
    label: '状态',
    type: 'select' as const,
    options: [
      { label: '成功', value: '成功' },
      { label: '失败', value: '失败' }
    ]
  }
];

export const AiLogsPage = () => {
  return (
    <GenericMockListPage
      title="调用记录"
      description="查看 AI 大模型接口调用的详细日志。监控请求的 Token 消耗、接口延迟情况以及调用异常告警。"
      primaryLabel="调用日志"
      initialItems={initialItems}
      columns={columns}
      filters={filters}
      searchPlaceholder="搜索使用场景..."
      searchField="scenario"
      stats={[
        { icon: '💰', title: '今日 Token 消耗', value: '254,800', suffix: 'tokens', tone: 'green' },
        { icon: '⏱️', title: '调用平均延迟', value: '2.4', suffix: 's', tone: 'blue' },
        { icon: '✅', title: '调用成功率', value: '98.5%', tone: 'orange' }
      ]}
    />
  );
};
