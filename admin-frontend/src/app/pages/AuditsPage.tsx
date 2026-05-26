import { PagePlaceholder } from '../components/PagePlaceholder';

export const AuditsPage = () => (
  <PagePlaceholder
    title="审核中心"
    description="处理菜谱投稿审核、评论审核、举报处理、内容下架记录和审核记录。"
    modules={['菜谱投稿审核', '评论审核', '举报处理', '内容下架记录', '审核记录']}
    fields={['target_type / target_id / audit_status', 'reason / operator_id / audited_at']}
  />
);
