import { listUserFavorites } from '../api';
import { UserActivityListPage } from './UserActivityListPage';

export const UserFavoritesPage = () => (
  <UserActivityListPage
    title="用户收藏"
    description="查看 C 端用户收藏的菜谱和食材，数据来自 favorites 表。"
    eventLabel="收藏时间"
    emptyText="暂无收藏记录"
    fetcher={listUserFavorites}
  />
);
