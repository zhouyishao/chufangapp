import { GenericMockListPage } from '../components/GenericMockListPage';

const initialItems = [
  { id: '1', name: '新发地农产品批发价格库', type: '公开数据', url: 'http://www.xinfadi.com.cn/marketanalysis/0/list/1.shtml', categories: '蔬菜、水果、生肉', region: '华北地区 / 北京', frequency: '每日一次', status: 'ACTIVE', lastSyncAt: '2026-06-13 06:30:00' },
  { id: '2', name: '美团买菜商家价格接口', type: '第三方接口', url: 'https://api.meituan.com/price/v1/query', categories: '食材、水果、调料、酒水', region: '全国主要城市', frequency: '每4小时一次', status: 'ACTIVE', lastSyncAt: '2026-06-13 12:00:00' },
  { id: '3', name: '社区市场人工采集记录', type: '手动', url: 'N/A', categories: '时令鲜菜、散装海鲜', region: '北京朝阳区部分市场', frequency: '每周两次', status: 'ACTIVE', lastSyncAt: '2026-06-11 17:30:00' },
  { id: '4', name: '淘宝食品超市参考价', type: '第三方接口', url: 'https://eco.taobao.com/router/rest', categories: '包装调配料、零食酒水', region: '全国', frequency: '每周一次', status: 'DISABLED', lastSyncAt: '2026-05-30 00:00:00' }
];

const columns = [
  { key: 'name', title: '来源名称' },
  { key: 'type', title: '来源类型' },
  { key: 'url', title: '来源 URL' },
  { key: 'categories', title: '覆盖品类' },
  { key: 'region', title: '覆盖地区' },
  { key: 'frequency', title: '更新频率' },
  { key: 'lastSyncAt', title: '最后同步时间' }
];

const filters = [
  {
    key: 'type',
    label: '来源类型',
    type: 'select' as const,
    options: [
      { label: '手动', value: '手动' },
      { label: '公开数据', value: '公开数据' },
      { label: '第三方接口', value: '第三方接口' },
      { label: '市场采集', value: '市场采集' }
    ]
  }
];

const fields = [
  { key: 'name', label: '来源名称', type: 'text' as const, required: true },
  {
    key: 'type',
    label: '来源类型',
    type: 'select' as const,
    required: true,
    options: [
      { label: '手动', value: '手动' },
      { label: '公开数据', value: '公开数据' },
      { label: '第三方接口', value: '第三方接口' },
      { label: '市场采集', value: '市场采集' }
    ]
  },
  { key: 'url', label: '来源 URL', type: 'text' as const, required: true },
  { key: 'categories', label: '覆盖品类', type: 'text' as const, required: true },
  { key: 'region', label: '覆盖地区', type: 'text' as const, required: true },
  { key: 'frequency', label: '更新频率', type: 'text' as const, required: true }
];

export const PricesSourcesPage = () => {
  return (
    <GenericMockListPage
      title="价格来源"
      description="配置并管理食材价格数据的获取渠道，包含自动爬取接口、第三方 API 服务以及线下录入采集。"
      primaryLabel="价格来源"
      initialItems={initialItems}
      columns={columns}
      filters={filters}
      fields={fields}
      defaultNewItem={{ type: '公开数据', status: 'ACTIVE', lastSyncAt: '从未同步' }}
      searchPlaceholder="输入来源名称或覆盖地区搜索..."
      searchField="name"
    />
  );
};
