import { PagePlaceholder } from '../components/PagePlaceholder';

export const UserFavoritesPage = () => (
  <PagePlaceholder
    title="用户收藏"
    description="查看多类型收藏数据，支持菜谱、食材、水果、调料和调酒。"
    modules={['收藏列表', '收藏趋势', '热门收藏', '用户分布']}
    fields={['user_id / target_id / target_type', 'created_at / content_status']}
  />
);
