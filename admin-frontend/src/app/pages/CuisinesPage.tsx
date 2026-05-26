import { AdminResourcePage } from '../components/AdminResourcePage';
import { ImagePreview } from '../components/ImagePreview';
import type { AdminResourceItem } from '../types';

export const CuisinesPage = () => {
  return (
    <AdminResourcePage<AdminResourceItem>
      title="菜系管理"
      description="维护菜系分类、排序和展示状态。"
      resource="cuisines"
      primaryLabel="菜系"
      columns={[
        { key: 'cover', label: '封面', render: (item) => <ImagePreview src={typeof item.cover === 'string' ? item.cover : null} alt={String(item.name ?? '菜系')} /> },
        { key: 'name', label: '名称' },
        { key: 'sort', label: '排序' }
      ]}
      defaults={{ name: '', cover: null, description: '', sort: 0, isPublish: true, isRecommend: false, status: 'ACTIVE' }}
      fields={[
        { key: 'name', label: '名称', required: true },
        { key: 'cover', label: '菜系封面', type: 'image' },
        { key: 'description', label: '描述', type: 'textarea' },
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
