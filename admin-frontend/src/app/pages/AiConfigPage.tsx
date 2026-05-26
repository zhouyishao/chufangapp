import { PagePlaceholder } from '../components/PagePlaceholder';

export const AiConfigPage = () => (
  <PagePlaceholder
    title="Prompt 模板"
    description="配置今日吃什么、AI Prompt、推荐规则、用户偏好、忌口规则和 AI 生成记录。"
    modules={['今日吃什么配置', 'AI Prompt 配置', '推荐规则配置', '用户偏好规则', '忌口规则配置', 'AI 生成记录']}
    fields={['scene / prompt / model', 'temperature / max_tokens / is_enabled', 'rule_config / weight']}
  />
);
