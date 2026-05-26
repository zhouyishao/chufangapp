import { AdminResourcePage } from '../components/AdminResourcePage';
import { ImagePreview } from '../components/ImagePreview';
import type { AdminResourceItem } from '../types';

export const RecommendationsPage = () => {
  return (
    <AdminResourcePage<AdminResourceItem>
      title="今日推荐"
      description="维护 C 端首页和推荐页展示内容。"
      resource="recommendations"
      primaryLabel="推荐"
      columns={[
        { key: 'cover', label: '封面', render: (item) => <ImagePreview src={typeof item.cover === 'string' ? item.cover : null} alt={String(item.title ?? '推荐内容')} /> },
        { key: 'title', label: '标题' },
        { key: 'targetType', label: '类型' }
      ]}
      defaults={{ title: '', description: '', cover: null, targetType: 'RECIPE', recipeId: null, ingredientId: null, sort: 0, isPublish: true, isRecommend: true, status: 'ACTIVE' }}
      fields={[
        { key: 'title', label: '标题', required: true },
        { key: 'description', label: '描述', type: 'textarea' },
        { key: 'cover', label: '推荐封面', type: 'image' },
        { key: 'targetType', label: '跳转类型', type: 'select', options: [
          { label: '菜谱', value: 'RECIPE' },
          { label: '食材', value: 'INGREDIENT' },
          { label: '分类', value: 'CATEGORY' },
          { label: '链接', value: 'URL' },
          { label: '无', value: 'NONE' }
        ] },
        { key: 'recipeId', label: '菜谱 ID', type: 'number' },
        { key: 'ingredientId', label: '食材 ID', type: 'number' },
        { key: 'sort', label: '排序', type: 'number' },
        { key: 'isPublish', label: '展示', type: 'boolean' },
        { key: 'isRecommend', label: '推荐', type: 'boolean' },
        { key: 'status', label: '状态', type: 'select', options: [
          { label: '启用', value: 'ACTIVE' },
          { label: '禁用', value: 'DISABLED' }
        ] }
      ]}
    />
  );
};
