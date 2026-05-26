import { AdminResourcePage } from '../components/AdminResourcePage';
import { ImagePreview } from '../components/ImagePreview';
import type { AdminResourceItem } from '../types';

export const MenusPage = () => {
  return (
    <AdminResourcePage<AdminResourceItem>
      title="场景菜单管理"
      description="维护家庭招待、几人餐等场景菜单。"
      resource="menus"
      primaryLabel="菜单"
      columns={[
        { key: 'cover', label: '封面', render: (item) => <ImagePreview src={typeof item.cover === 'string' ? item.cover : null} alt={String(item.name ?? '菜单')} /> },
        { key: 'name', label: '名称' },
        { key: 'scene', label: '场景' }
      ]}
      defaults={{ name: '', scene: '', cover: null, description: '', sort: 0, isPublish: true, isRecommend: false, status: 'ACTIVE' }}
      fields={[
        { key: 'name', label: '名称', required: true },
        { key: 'scene', label: '场景' },
        { key: 'cover', label: '菜单封面', type: 'image' },
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
