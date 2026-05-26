import { PagePlaceholder } from '../components/PagePlaceholder';

export const TaxonomiesPage = () => (
  <PagePlaceholder
    title="分类标签"
    description="统一管理菜谱、食材、水果、调料、调酒分类与通用标签。"
    modules={['分类列表', '标签管理', '启用/禁用', '排序与展示配置']}
    fields={['type / name / icon / color', 'sort / status / is_publish', 'content_count']}
  />
);
