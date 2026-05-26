import { PagePlaceholder } from '../components/PagePlaceholder';

export const ResourcesPage = () => (
  <PagePlaceholder
    title="应用管理"
    description="管理菜谱、食材、调料、水果、调酒和价格资源接口接入状态。"
    modules={['菜谱资源接口', '食材资源接口', '调料资源接口', '水果资源接口', '调酒资源接口', '价格资源接口']}
    fields={['provider / endpoint / sync_status', 'last_sync_at / error_message / enabled']}
  />
);
