import { AdminResourcePage } from '../components/AdminResourcePage';
import { ImagePreview } from '../components/ImagePreview';
import type { AdminResourceItem } from '../types';

export const UsersPage = () => {
  return (
    <AdminResourcePage<AdminResourceItem>
      title="用户列表"
      description="查看 C 端用户、状态和基础行为数据。"
      resource="users"
      primaryLabel="用户"
      columns={[
        { key: 'avatar', label: '头像', render: (item) => <ImagePreview src={typeof item.avatar === 'string' ? item.avatar : null} alt={String(item.nickname ?? '用户')} /> },
        { key: 'nickname', label: '昵称' },
        { key: 'phone', label: '手机号' }
      ]}
      defaults={{ nickname: '', phone: '', openid: '', avatar: null, gender: '', status: 'ACTIVE' }}
      fields={[
        { key: 'nickname', label: '昵称' },
        { key: 'phone', label: '手机号' },
        { key: 'openid', label: 'OpenID' },
        { key: 'avatar', label: '用户头像', type: 'image' },
        { key: 'gender', label: '性别' },
        { key: 'status', label: '状态', type: 'select', options: [
          { label: '启用', value: 'ACTIVE' },
          { label: '禁用', value: 'DISABLED' }
        ] }
      ]}
    />
  );
};
