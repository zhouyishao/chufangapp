import { listUserRecentViews } from '../api';
import { UserActivityListPage } from './UserActivityListPage';

export const UserRecentViewsPage = () => (
  <UserActivityListPage
    title="最近浏览"
    description="查看 C 端用户最近打开的菜谱和食材，数据来自 view_histories 表。"
    eventLabel="最近浏览"
    emptyText="暂无浏览记录"
    fetcher={listUserRecentViews}
  />
);
