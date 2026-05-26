import { PagePlaceholder } from '../components/PagePlaceholder';

export const ContentOverviewPage = () => (
  <PagePlaceholder
    title="内容概览"
    description="内容模块总览，承接菜谱、食材、水果、调料、调酒的运营状态和待办。"
    modules={['内容统计', '待完善内容', '发布状态', 'App 同步状态']}
    fields={['target_type / target_id', 'status / audit_status', 'view_count / favorite_count / comment_count']}
  />
);
