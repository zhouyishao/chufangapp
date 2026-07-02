import { GenericMockListPage } from '../components/GenericMockListPage';

const initialItems = [
  { id: '1', name: 'Gemini 1.5 Pro (智能推荐首选)', provider: 'Google', code: 'gemini-1.5-pro', scenario: '今日推荐生成、高难度配餐指导', tokenLimit: 2000000, temperature: 0.7, status: 'ACTIVE' },
  { id: '2', name: 'Gemini 1.5 Flash (速度优先)', provider: 'Google', code: 'gemini-1.5-flash', scenario: '菜谱分类自动标注、食材挑选技巧提炼', tokenLimit: 1000000, temperature: 0.3, status: 'ACTIVE' },
  { id: '3', name: 'DeepSeek Chat (备用中文大模型)', provider: 'DeepSeek', code: 'deepseek-chat', scenario: '菜谱名称润色、食材别名扩展', tokenLimit: 64000, temperature: 0.5, status: 'ACTIVE' }
];

const columns = [
  { key: 'name', title: '模型名称' },
  { key: 'provider', title: '模型供应商' },
  { key: 'code', title: '模型编码' },
  { key: 'scenario', title: '使用场景' },
  { key: 'tokenLimit', title: 'Token 上限' },
  { key: 'temperature', title: '温度 (Temperature)' }
];

const filters = [
  {
    key: 'provider',
    label: '供应商',
    type: 'select' as const,
    options: [
      { label: 'Google', value: 'Google' },
      { label: 'DeepSeek', value: 'DeepSeek' }
    ]
  }
];

const fields = [
  { key: 'name', label: '模型名称', type: 'text' as const, required: true },
  {
    key: 'provider',
    label: '模型供应商',
    type: 'select' as const,
    required: true,
    options: [
      { label: 'Google', value: 'Google' },
      { label: 'DeepSeek', value: 'DeepSeek' }
    ]
  },
  { key: 'code', label: '模型编码', type: 'text' as const, required: true },
  { key: 'scenario', label: '使用场景', type: 'text' as const, required: true },
  { key: 'tokenLimit', label: 'Token 上限', type: 'number' as const, required: true },
  { key: 'temperature', label: '温度', type: 'number' as const, required: true }
];

export const AiModelsPage = () => {
  return (
    <GenericMockListPage
      title="模型配置"
      description="管理关联平台的 AI 大模型。根据不同的应用场景（如高准确度的配餐推荐或高速度的菜品标签提取）分配使用不同的模型和超参数。"
      primaryLabel="模型"
      initialItems={initialItems}
      columns={columns}
      filters={filters}
      fields={fields}
      defaultNewItem={{ provider: 'Google', temperature: 0.7, tokenLimit: 128000, status: 'ACTIVE' }}
      searchPlaceholder="输入模型名称或编码过滤..."
      searchField="name"
    />
  );
};
