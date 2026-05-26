import { PagePlaceholder } from '../components/PagePlaceholder';

export const SearchOpsPage = () => (
  <PagePlaceholder
    title="搜索日志"
    description="查看搜索日志，配置热门搜索、搜索关键词分析、搜索无结果推荐和全局搜索配置。"
    modules={['热门搜索', '搜索关键词分析', '搜索无结果配置', '全局搜索配置', 'Command K 面板']}
    fields={['keyword / search_count / result_count', 'sort / is_enabled / recommend_content_ids']}
  />
);
