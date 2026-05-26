import { PagePlaceholder } from '../components/PagePlaceholder';

export const FamiliesPage = () => (
  <PagePlaceholder
    title="家庭管理"
    description="管理家庭列表、家庭成员、邀请记录、家庭菜篮子和家庭采购记录。"
    modules={['家庭列表', '家庭详情', '家庭成员', '家庭邀请', '家庭菜篮子', '家庭采购记录']}
    fields={['family_name / owner / member_count', 'invite_status / created_at', 'family_basket_count / purchase_record_count']}
  />
);
