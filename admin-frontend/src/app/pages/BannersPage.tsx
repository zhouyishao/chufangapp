import { AdminResourcePage } from '../components/AdminResourcePage';
import { ImagePreview } from '../components/ImagePreview';
import type { AdminResourceItem } from '../types';

export const BannersPage = () => {
  return (
    <AdminResourcePage<AdminResourceItem>
      title="Banner 管理"
      description="维护首页 Banner、跳转和上下架状态。"
      resource="banners"
      primaryLabel="Banner"
      columns={[
        { key: 'image', label: '图片', render: (item) => <ImagePreview src={typeof item.image === 'string' ? item.image : null} alt={String(item.title ?? 'Banner')} /> },
        { key: 'title', label: '标题' },
        { key: 'targetType', label: '跳转' }
      ]}
      defaults={{ title: '', image: null, targetType: 'NONE', targetUrl: '', recipeId: null, sort: 0, isPublish: true, isRecommend: false, status: 'ACTIVE' }}
      fields={[
        { key: 'title', label: '标题', required: true },
        { key: 'image', label: 'Banner 图片', type: 'image', required: true },
        { key: 'targetType', label: '跳转类型', type: 'select', options: [
          { label: '无', value: 'NONE' },
          { label: '链接', value: 'URL' },
          { label: '菜谱', value: 'RECIPE' }
        ] },
        { key: 'targetUrl', label: '跳转 URL' },
        { key: 'recipeId', label: '菜谱 ID', type: 'number' },
        { key: 'sort', label: '排序', type: 'number' },
        { key: 'isPublish', label: '展示', type: 'boolean' },
        { key: 'status', label: '状态', type: 'select', options: [
          { label: '启用', value: 'ACTIVE' },
          { label: '禁用', value: 'DISABLED' }
        ] }
      ]}
    />
  );
};
