import { PagePlaceholder } from '../components/PagePlaceholder';

export const UserRecentViewsPage = () => (
  <PagePlaceholder
    title="最近浏览"
    description="查看用户最近浏览记录和内容曝光路径。"
    modules={['浏览列表', '热门浏览', '用户路径', '内容召回']}
    fields={['user_id / target_id / target_type', 'viewed_at / source_page']}
  />
);
