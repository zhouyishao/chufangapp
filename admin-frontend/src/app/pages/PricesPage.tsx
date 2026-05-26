import { PagePlaceholder } from '../components/PagePlaceholder';

export const PricesPage = () => (
  <PagePlaceholder
    title="价格管理"
    description="管理食材、水果、调料价格，支持历史价格、趋势图、批量导入和来源配置。"
    modules={['价格总览', '食材价格', '水果价格', '调料价格', '价格趋势', '价格批量导入', '价格来源配置']}
    fields={['target_id / target_type / price / unit', 'market_name / city / source / price_date', 'change_type / change_rate / history']}
  />
);
