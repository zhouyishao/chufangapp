import { PagePlaceholder } from '../components/PagePlaceholder';

export const ReportsPage = () => (
  <PagePlaceholder
    title="运营概览"
    description="聚合内容、用户、收藏、浏览、搜索、价格和采购数据。"
    modules={['内容数据', '用户数据', '收藏数据', '浏览数据', '搜索数据', '价格数据', '采购数据']}
    fields={['date / metric_key / metric_value', 'target_type / target_id / dimension']}
  />
);
