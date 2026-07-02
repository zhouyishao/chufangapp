import { GenericMockListPage } from '../components/GenericMockListPage';

const initialItems = [
  { id: 'file_001', name: 'tomato_cover.jpg', type: '图片', size: '124 KB', uploader: 'admin_user', module: '食材管理', time: '2026-06-13 14:02:11', status: 'ACTIVE' },
  { id: 'file_002', name: 'beef_stew_step1.jpg', type: '图片', size: '254 KB', uploader: 'user_chef_12', module: '菜谱管理', time: '2026-06-13 11:20:00', status: 'ACTIVE' },
  { id: 'file_003', name: 'welcome_banner.png', type: '图片', size: '1.2 MB', uploader: 'operation_manager', module: '运营位管理', time: '2026-06-12 17:30:00', status: 'ACTIVE' },
  { id: 'file_004', name: 'cooking_skills_guide.pdf', type: '文档', size: '4.8 MB', uploader: 'admin_user', module: '学习频道', time: '2026-06-10 09:12:00', status: 'ACTIVE' }
];

const columns = [
  { key: 'name', title: '文件名' },
  { key: 'type', title: '文件类型' },
  { key: 'size', title: '文件大小' },
  { key: 'uploader', title: '上传人' },
  { key: 'module', title: '使用模块' },
  { key: 'time', title: '上传时间' }
];

const filters = [
  {
    key: 'type',
    label: '文件类型',
    type: 'select' as const,
    options: [
      { label: '图片', value: '图片' },
      { label: '文档', value: '文档' },
      { label: '视频', value: '视频' }
    ]
  }
];

export const FilesUploadsPage = () => {
  return (
    <GenericMockListPage
      title="上传记录"
      description="查看平台中上传的所有图片、视频或静态资源文件记录，支持物理删除和引用校验。"
      primaryLabel="上传记录"
      initialItems={initialItems}
      columns={columns}
      filters={filters}
      searchPlaceholder="输入文件名或上传人过滤..."
      searchField="name"
    />
  );
};
