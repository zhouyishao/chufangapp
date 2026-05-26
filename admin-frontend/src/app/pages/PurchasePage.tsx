import { PagePlaceholder } from '../components/PagePlaceholder';

export const PurchasePage = () => (
  <PagePlaceholder
    title="菜篮子/采购"
    description="查看用户菜篮子、采购清单、采购历史、家庭采购记录和采购价格配置。"
    modules={['菜篮子管理', '采购清单', '采购历史', '家庭采购记录', '采购价格配置']}
    fields={['user_id / family_id / target_type', 'amount / unit / checked', 'purchase_date / market_name / total_amount']}
  />
);
