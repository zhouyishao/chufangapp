import { GenericMockListPage } from '../components/GenericMockListPage';

const initialItems = [
  { id: '1', name: '系统名称', configKey: 'sys.name', configValue: '家里有菜 (家庭时令菜谱系统)', desc: '管理后台及 C 端展示的主系统名称', status: 'ACTIVE', updatedAt: '2026-06-13 10:00:00' },
  { id: '2', name: '文件上传大小限制', configKey: 'sys.upload.max_size_mb', configValue: '10', desc: '图片、视频等上传文件的最大单文件大小 (MB)', status: 'ACTIVE', updatedAt: '2026-06-13 10:00:00' },
  { id: '3', name: '微信小程序 AppID', configKey: 'wechat.mini.appid', configValue: 'wx_1234567890', desc: 'C 端小程序绑定的官方 AppID 凭证', status: 'ACTIVE', updatedAt: '2026-06-13 10:00:00' },
  { id: '4', name: '热门搜索默认保留天数', configKey: 'search.hot.retention_days', configValue: '30', desc: '热门搜索日志统计分析时的滑动窗口大小', status: 'ACTIVE', updatedAt: '2026-06-13 10:00:00' },
  { id: '5', name: '单家庭成员上限', configKey: 'family.member.limit', configValue: '8', desc: '单个家庭空间中允许加入的最大成员数量', status: 'ACTIVE', updatedAt: '2026-06-13 10:00:00' }
];

const columns = [
  { key: 'name', title: '配置名称' },
  { key: 'configKey', title: '配置 Key' },
  { key: 'configValue', title: '配置值' },
  { key: 'desc', title: '配置说明' },
  { key: 'updatedAt', title: '更新时间' }
];

const fields = [
  { key: 'name', label: '配置名称', type: 'text' as const, required: true },
  { key: 'configKey', label: '配置 Key', type: 'text' as const, required: true },
  { key: 'configValue', label: '配置值', type: 'text' as const, required: true },
  { key: 'desc', label: '配置说明', type: 'textarea' as const }
];

export const SettingsBasePage = () => {
  return (
    <GenericMockListPage
      title="基础配置"
      description="管理全局系统参数，包含应用名称、文件上传配额、授权凭证以及业务逻辑控制变量。"
      primaryLabel="参数"
      initialItems={initialItems}
      columns={columns}
      fields={fields}
      defaultNewItem={{ status: 'ACTIVE' }}
      searchPlaceholder="输入参数名称或 Key 检索..."
      searchField="name"
    />
  );
};
