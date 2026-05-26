import { AdminResourcePage } from '../components/AdminResourcePage';
import type { AdminResourceItem } from '../types';

export const PostsPage = () => {
  return (
    <AdminResourcePage<AdminResourceItem>
      title="晒菜内容管理"
      description="审核和管理用户发布的晒菜内容。"
      resource="posts"
      primaryLabel="晒菜"
      columns={[
        { key: 'title', label: '标题' },
        { key: 'postStatus', label: '发布状态' },
        { key: 'recipeId', label: '菜谱ID' }
      ]}
      defaults={{ title: '', content: '', userId: null, recipeId: null, postStatus: 'PUBLISHED', isPublish: true, isRecommend: false, sort: 0, status: 'ACTIVE' }}
      fields={[
        { key: 'title', label: '标题', required: true },
        { key: 'content', label: '内容', type: 'textarea' },
        { key: 'userId', label: '用户 ID', type: 'number' },
        { key: 'recipeId', label: '菜谱 ID', type: 'number' },
        { key: 'postStatus', label: '发布状态', type: 'select', options: [
          { label: '草稿', value: 'DRAFT' },
          { label: '已发布', value: 'PUBLISHED' },
          { label: '已隐藏', value: 'HIDDEN' }
        ] },
        { key: 'isPublish', label: '展示', type: 'boolean' },
        { key: 'status', label: '状态', type: 'select', options: [
          { label: '启用', value: 'ACTIVE' },
          { label: '禁用', value: 'DISABLED' }
        ] }
      ]}
    />
  );
};
