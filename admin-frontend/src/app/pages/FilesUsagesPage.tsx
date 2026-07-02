import { GenericMockListPage } from '../components/GenericMockListPage';

const initialItems = [
  { id: '1', name: 'tomato_cover.jpg', url: '/uploads/images/tomato_cover.jpg', module: '食材管理', contentName: '精选西红柿', pageName: '西红柿详情页', time: '2026-06-13 14:02:11' },
  { id: '2', name: 'beef_stew_step1.jpg', url: '/uploads/images/beef_stew_step1.jpg', module: '菜谱管理', contentName: '家常红烧牛肉', pageName: '红烧牛肉步骤页', time: '2026-06-13 11:20:00' },
  { id: '3', name: 'welcome_banner.png', url: '/uploads/banners/welcome_banner.png', module: '运营位管理', contentName: '首页顶部Banner (六月端午推广)', pageName: 'C 端首页', time: '2026-06-12 17:30:00' }
];

const columns = [
  { key: 'name', title: '文件名' },
  { key: 'url', title: '文件地址' },
  { key: 'module', title: '引用模块' },
  { key: 'contentName', title: '引用内容' },
  { key: 'pageName', title: '引用页面' },
  { key: 'time', title: '引用时间' }
];

const filters = [
  {
    key: 'module',
    label: '引用模块',
    type: 'select' as const,
    options: [
      { label: '食材管理', value: '食材管理' },
      { label: '菜谱管理', value: '菜谱管理' },
      { label: '运营位管理', value: '运营位管理' }
    ]
  }
];

export const FilesUsagesPage = () => {
  return (
    <GenericMockListPage
      title="引用关系"
      description="追踪媒体库中的文件具体被哪些菜谱、食材、推荐位或前端页面引用，防止误删除导致客户端显示裂图。"
      primaryLabel="引用记录"
      initialItems={initialItems}
      columns={columns}
      filters={filters}
      searchPlaceholder="输入文件名搜索引用关系..."
      searchField="name"
    />
  );
};
