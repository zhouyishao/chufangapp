import { GenericMockListPage } from '../components/GenericMockListPage';

const initialItems = [
  { id: 'rep_001', reportContent: '人身攻击，语言过激', type: '恶意攻击/谩骂', reporter: '微信用户A', reportedUser: '美食达人123', comment: '这个菜谱根本做不熟，骗子写的吧！太恶心了。', status: '待处理', time: '2026-06-13 14:02:11' },
  { id: 'rep_002', reportContent: '发布小红书卖货引流广告', type: '广告垃圾信息', reporter: '微信用户B', reportedUser: '小红书代购_Lisa', comment: '加我微v，全网最低价拿进口黄油和淡奶油！', status: '已处理', time: '2026-06-12 11:20:00' },
  { id: 'rep_003', reportContent: '恶意差评刷屏', type: '恶意攻击/谩骂', reporter: '微信用户C', reportedUser: '无聊的路人', comment: '垃圾垃圾垃圾，这都是什么菜，完全吃不下。', status: '已驳回', time: '2026-06-11 17:30:00' }
];

const columns = [
  { key: 'reportContent', title: '举报内容' },
  { key: 'type', title: '举报类型' },
  { key: 'reporter', title: '举报人' },
  { key: 'reportedUser', title: '被举报用户' },
  { key: 'comment', title: '关联评论' },
  { key: 'time', title: '举报时间' }
];

const filters = [
  {
    key: 'status',
    label: '状态',
    type: 'select' as const,
    options: [
      { label: '待处理', value: '待处理' },
      { label: '已处理', value: '已处理' },
      { label: '已驳回', value: '已驳回' }
    ]
  }
];

const fields = [
  { key: 'reportContent', label: '举报内容', type: 'text' as const, required: true },
  { key: 'type', label: '举报类型', type: 'text' as const, required: true },
  { key: 'reporter', label: '举报人', type: 'text' as const, required: true },
  { key: 'reportedUser', label: '被举报用户', type: 'text' as const, required: true },
  { key: 'comment', label: '关联评论', type: 'textarea' as const, required: true },
  {
    key: 'status',
    label: '处理状态',
    type: 'select' as const,
    required: true,
    options: [
      { label: '待处理', value: '待处理' },
      { label: '已处理', value: '已处理' },
      { label: '已驳回', value: '已驳回' }
    ]
  }
];

export const CommentsReportsPage = () => {
  return (
    <GenericMockListPage
      title="举报处理"
      description="审查和处理 C 端用户对菜谱下评论的举报。支持判定通过（删除评论并处罚用户）、驳回举报或标记已处理操作。"
      primaryLabel="举报"
      initialItems={initialItems}
      columns={columns}
      filters={filters}
      fields={fields}
      defaultNewItem={{ status: '待处理', time: new Date().toISOString() }}
      searchPlaceholder="输入被举报用户或评论内容搜索..."
      searchField="reportedUser"
    />
  );
};
