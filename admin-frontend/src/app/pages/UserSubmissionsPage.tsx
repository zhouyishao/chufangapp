import { PagePlaceholder } from '../components/PagePlaceholder';

export const UserSubmissionsPage = () => (
  <PagePlaceholder
    title="用户投稿"
    description="管理用户创建菜谱、投稿详情、审核通过、驳回和重新提交。"
    modules={['投稿列表', '投稿详情', '审核弹窗', '驳回原因配置']}
    fields={['author_id / source_type / audit_status', 'reject_reason / is_draft / is_publish']}
  />
);
