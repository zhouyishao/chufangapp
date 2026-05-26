import { AdminResourcePage } from '../components/AdminResourcePage';
import { ImagePreview } from '../components/ImagePreview';
import type { AdminResourceItem } from '../types';

export const SeasonalPage = () => {
  return (
    <AdminResourcePage<AdminResourceItem>
      title="时令食材"
      description="维护按月份展示的时令食材。"
      resource="seasonal-foods"
      primaryLabel="时令食材"
      columns={[
        { key: 'cover', label: '封面', render: (item) => <ImagePreview src={typeof item.cover === 'string' ? item.cover : null} alt={String(item.name ?? '时令食材')} /> },
        { key: 'name', label: '名称' },
        { key: 'month', label: '月份' }
      ]}
      defaults={{ name: '', ingredientId: null, month: 1, cover: null, reason: '', sort: 0, isPublish: true, isRecommend: false, status: 'ACTIVE' }}
      fields={[
        { key: 'name', label: '名称', required: true },
        { key: 'ingredientId', label: '食材 ID', type: 'number' },
        { key: 'month', label: '月份', type: 'number', required: true },
        { key: 'cover', label: '时令封面', type: 'image' },
        { key: 'reason', label: '推荐理由', type: 'textarea' },
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
