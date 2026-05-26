import { AdminResourcePage } from '../components/AdminResourcePage';
import type { AdminResourceItem } from '../types';

export const CommentsPage = () => {
  return (
    <AdminResourcePage<AdminResourceItem>
      title="评论列表"
      description="审核、查询和删除评论内容。"
      resource="comments"
      primaryLabel="评论"
      columns={[
        { key: 'content', label: '内容' },
        { key: 'recipeId', label: '菜谱ID' },
        { key: 'userId', label: '用户ID' }
      ]}
      defaults={{ content: '', userId: null, recipeId: null, postId: null, isPublish: true, isRecommend: false, sort: 0, status: 'ACTIVE' }}
      fields={[
        { key: 'content', label: '内容', type: 'textarea', required: true },
        { key: 'userId', label: '用户 ID', type: 'number' },
        { key: 'recipeId', label: '菜谱 ID', type: 'number' },
        { key: 'postId', label: '晒菜 ID', type: 'number' },
        { key: 'isPublish', label: '展示', type: 'boolean' },
        { key: 'status', label: '状态', type: 'select', options: [
          { label: '启用', value: 'ACTIVE' },
          { label: '禁用', value: 'DISABLED' }
        ] }
      ]}
    />
  );
};
