import { GenericMockListPage } from '../components/GenericMockListPage';

const initialItems = [
  { id: 'task_001', name: '今日吃什么膳食推荐', type: '推荐生成', input: '配餐条件: 减脂、少盐, 人数: 3, 偏好: 粤菜', output: '生成三菜一汤: 白灼芥兰、清蒸鲈鱼...', status: '成功', duration: '3.2s', createdAt: '2026-06-13 14:02:11' },
  { id: 'task_002', name: '红烧牛肉菜谱步骤补全', type: '步骤分析', input: '食材: 牛腩500g, 大料, 生抽; 原步骤简易', output: '自动补全为规范的六步火候与翻炒指导', status: '成功', duration: '5.8s', createdAt: '2026-06-13 11:20:00' },
  { id: 'task_003', name: '时令水果挑选技巧提取', type: '挑选提炼', input: '水果: 红富士苹果, 季节: 秋季', output: '提炼出从果蒂颜色、果皮纹理判定甜度的四条要诀', status: '成功', duration: '1.9s', createdAt: '2026-06-12 17:30:00' },
  { id: 'task_004', name: '家庭周度买菜预算模型分析', type: '预算推演', input: '家庭ID: fam_391, 上周采购: 890元', output: '由于接口限流，API 调用失败。', status: '失败', duration: '15.0s', createdAt: '2026-06-10 09:12:00' }
];

const columns = [
  { key: 'name', title: '任务名称' },
  { key: 'type', title: '任务类型' },
  { key: 'input', title: '输入内容' },
  { key: 'output', title: '输出内容' },
  { key: 'duration', title: '耗时' },
  { key: 'createdAt', title: '创建时间' }
];

const filters = [
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

export const AiTasksPage = () => {
  return (
    <GenericMockListPage
      title="AI 任务"
      description="查看系统后台通过 AI 执行的批量菜谱文本清洗、推荐生成、挑选技巧总结任务的运行日志及输出质量监控。"
      primaryLabel="任务"
      initialItems={initialItems}
      columns={columns}
      filters={filters}
      searchPlaceholder="输入任务名称搜索..."
      searchField="name"
    />
  );
};
