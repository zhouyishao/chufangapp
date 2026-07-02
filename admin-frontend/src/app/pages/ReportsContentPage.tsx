import { GenericMockListPage } from '../components/GenericMockListPage';

const initialItems = [
  { id: '1', type: '菜谱', publishCount: 350, activeCount: 320, inactiveCount: 30, pv: 42500, favs: 3420, searchHit: 12500, updatedAt: '2026-06-13 14:00:00' },
  { id: '2', type: '食材', publishCount: 180, activeCount: 175, inactiveCount: 5, pv: 12400, favs: 850, searchHit: 4200, updatedAt: '2026-06-13 14:00:00' },
  { id: '3', type: '水果', publishCount: 56, activeCount: 50, inactiveCount: 6, pv: 6500, favs: 410, searchHit: 1800, updatedAt: '2026-06-13 14:00:00' },
  { id: '4', type: '调料', publishCount: 94, activeCount: 92, inactiveCount: 2, pv: 4100, favs: 290, searchHit: 980, updatedAt: '2026-06-13 14:00:00' },
  { id: '5', type: '酒水', publishCount: 45, activeCount: 40, inactiveCount: 5, pv: 3200, favs: 180, searchHit: 750, updatedAt: '2026-06-13 14:00:00' }
];

const columns = [
  { key: 'type', title: '内容类型' },
  { key: 'publishCount', title: '发布数量' },
  { key: 'activeCount', title: '上架数量' },
  { key: 'inactiveCount', title: '下架数量' },
  { key: 'pv', title: '浏览量' },
  { key: 'favs', title: '收藏量' },
  { key: 'searchHit', title: '搜索命中次数' },
  { key: 'updatedAt', title: '更新时间' }
];

export const ReportsContentPage = () => {
  return (
    <GenericMockListPage
      title="内容报表"
      description="统计和分析菜谱、食材、水果、调料及酒水饮品各维度的内容建设数量与 C 端热度表现（点击、收藏、搜索）。"
      primaryLabel="报表数据"
      initialItems={initialItems}
      columns={columns}
      searchPlaceholder="搜索内容类型..."
      searchField="type"
    />
  );
};
