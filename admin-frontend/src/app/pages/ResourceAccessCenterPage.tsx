import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';

import { Button } from '../components/Button';
import { DataTable, type DataTableColumn } from '../components/DataTable';
import { Input } from '../components/Input';
import { PageHeader } from '../components/PageHeader';
import { StatusTag } from '../components/StatusTag';

type ResourceType = '蔬菜' | '水果' | '调料' | '酒水' | '肉类' | '海鲜';
type ResourceSource = '第三方API' | 'Mock' | '手动导入';
type ImportStatus = '未导入' | '已导入' | '导入失败' | '已忽略';
type DuplicateStatus = '正常' | '重复';

type ResourceItem = {
  id: string;
  imageMark: string;
  name: string;
  type: ResourceType;
  source: ResourceSource;
  sourceId: string;
  summary: string;
  importStatus: ImportStatus;
  duplicateStatus: DuplicateStatus;
  importMode: '自动同步' | '批量导入' | '手动导入';
  updatedAt: string;
};

const initialItems: ResourceItem[] = [
  {
    id: 'external_tomato_001',
    imageMark: '🍅',
    name: '番茄',
    type: '蔬菜',
    source: '第三方API',
    sourceId: 'api_vegetable_0001',
    summary: '富含维生素C和番茄红素，适合炒、煮、凉拌等多种做法。',
    importStatus: '未导入',
    duplicateStatus: '正常',
    importMode: '自动同步',
    updatedAt: '2025-05-24 14:32:18'
  },
  {
    id: 'external_apple_001',
    imageMark: '🍎',
    name: '苹果',
    type: '水果',
    source: 'Mock',
    sourceId: 'mock_fruit_0008',
    summary: '富含膳食纤维与维生素，口感清脆，适合生食和烹饪。',
    importStatus: '已导入',
    duplicateStatus: '重复',
    importMode: '批量导入',
    updatedAt: '2025-05-24 13:15:42'
  },
  {
    id: 'external_star_anise_001',
    imageMark: '✴️',
    name: '八角',
    type: '调料',
    source: '第三方API',
    sourceId: 'api_seasoning_0020',
    summary: '常用于炖煮、卤制，增加香气，提升菜肴风味层次。',
    importStatus: '未导入',
    duplicateStatus: '正常',
    importMode: '自动同步',
    updatedAt: '2025-05-24 11:08:33'
  },
  {
    id: 'external_red_wine_001',
    imageMark: '🍷',
    name: '红酒',
    type: '酒水',
    source: '第三方API',
    sourceId: 'api_beverage_0016',
    summary: '由葡萄发酵酿造，口感醇厚，适合佐餐或聚会饮用。',
    importStatus: '已导入',
    duplicateStatus: '正常',
    importMode: '批量导入',
    updatedAt: '2025-05-24 10:22:05'
  },
  {
    id: 'external_chicken_breast_001',
    imageMark: '🍗',
    name: '鸡胸肉',
    type: '肉类',
    source: '手动导入',
    sourceId: 'manual_meat_0003',
    summary: '低脂高蛋白，适合健身餐、高蛋白食谱和健康饮食。',
    importStatus: '导入失败',
    duplicateStatus: '正常',
    importMode: '手动导入',
    updatedAt: '2025-05-24 09:41:12'
  },
  {
    id: 'external_steamed_bass_001',
    imageMark: '🐟',
    name: '清蒸鲈鱼',
    type: '海鲜',
    source: 'Mock',
    sourceId: 'mock_recipe_0021',
    summary: '肉质鲜嫩，清蒸后鲜香汁鲜，营养丰富，适合家庭餐桌。',
    importStatus: '已忽略',
    duplicateStatus: '重复',
    importMode: '批量导入',
    updatedAt: '2025-05-23 18:05:47'
  }
];

const resourceTypeOptions = ['全部', '蔬菜', '水果', '调料', '酒水', '肉类', '海鲜'] as const;
const sourceOptions = ['全部', '第三方API', 'Mock', '手动导入'] as const;
const importStatusOptions = ['全部', '未导入', '已导入', '导入失败', '已忽略'] as const;
const duplicateOptions = ['全部', '正常', '重复'] as const;
const importModeOptions = ['全部', '自动同步', '批量导入', '手动导入'] as const;

const typeTone: Record<ResourceType, string> = {
  蔬菜: 'border-[#d8e9d1] bg-[#edf5ea] text-[#6ba368]',
  水果: 'border-[#f4dcc5] bg-[#fff3e8] text-[#c27b48]',
  调料: 'border-purple-100 bg-purple-50 text-purple-700',
  酒水: 'border-sky-100 bg-sky-50 text-sky-700',
  肉类: 'border-red-100 bg-red-50 text-red-700',
  海鲜: 'border-blue-100 bg-blue-50 text-blue-700'
};

const importStatusTone: Record<ImportStatus, 'green' | 'orange' | 'red' | 'gray'> = {
  未导入: 'orange',
  已导入: 'green',
  导入失败: 'red',
  已忽略: 'gray'
};

const duplicateTone: Record<DuplicateStatus, 'green' | 'red'> = {
  正常: 'green',
  重复: 'red'
};

const selectClass =
  'h-11 rounded-xl border border-[#e9e2d6] bg-white px-3 text-sm text-[#2f2f2f] outline-none focus:border-[#7a8b6f] focus:ring-2 focus:ring-[#7a8b6f]/10';

type FieldRowProps = {
  label: string;
  children: ReactNode;
  className?: string;
};

const FieldRow = ({ label, children, className }: FieldRowProps) => (
  <label className={['grid grid-cols-[88px_minmax(0,1fr)] items-center gap-3', className ?? ''].join(' ')}>
    <span className="whitespace-nowrap text-sm font-semibold text-[#2f2f2f]">{label}</span>
    {children}
  </label>
);

export const ResourceAccessCenterPage = () => {
  const [items, setItems] = useState<ResourceItem[]>(initialItems);
  const [selectedIds, setSelectedIds] = useState<string[]>(['external_tomato_001']);
  const [keyword, setKeyword] = useState('');
  const [resourceType, setResourceType] = useState<(typeof resourceTypeOptions)[number]>('全部');
  const [source, setSource] = useState<(typeof sourceOptions)[number]>('全部');
  const [importStatus, setImportStatus] = useState<(typeof importStatusOptions)[number]>('全部');
  const [duplicateStatus, setDuplicateStatus] = useState<(typeof duplicateOptions)[number]>('全部');
  const [importMode, setImportMode] = useState<(typeof importModeOptions)[number]>('全部');
  const [sourceId, setSourceId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  const filteredItems = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    return items.filter((item) => {
      const keywordMatched =
        !normalizedKeyword ||
        [item.name, item.summary, item.source, item.sourceId, item.type].some((value) =>
          value.toLowerCase().includes(normalizedKeyword)
        );
      const typeMatched = resourceType === '全部' || item.type === resourceType;
      const sourceMatched = source === '全部' || item.source === source;
      const importStatusMatched = importStatus === '全部' || item.importStatus === importStatus;
      const duplicateMatched = duplicateStatus === '全部' || item.duplicateStatus === duplicateStatus;
      const importModeMatched = importMode === '全部' || item.importMode === importMode;
      const sourceIdMatched = !sourceId.trim() || item.sourceId.includes(sourceId.trim());
      const itemDate = item.updatedAt.slice(0, 10);
      const startMatched = !startDate || itemDate >= startDate;
      const endMatched = !endDate || itemDate <= endDate;
      return (
        keywordMatched &&
        typeMatched &&
        sourceMatched &&
        importStatusMatched &&
        duplicateMatched &&
        importModeMatched &&
        sourceIdMatched &&
        startMatched &&
        endMatched
      );
    });
  }, [duplicateStatus, endDate, importMode, importStatus, items, keyword, resourceType, source, sourceId, startDate]);

  const resetFilters = () => {
    setKeyword('');
    setResourceType('全部');
    setSource('全部');
    setImportStatus('全部');
    setDuplicateStatus('全部');
    setImportMode('全部');
    setSourceId('');
    setStartDate('');
    setEndDate('');
    setNotice('筛选条件已重置');
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((current) => (current.includes(id) ? current.filter((itemId) => itemId !== id) : [...current, id]));
  };

  const toggleAll = () => {
    const currentIds = filteredItems.map((item) => item.id);
    const allSelected = currentIds.every((id) => selectedIds.includes(id));
    setSelectedIds(allSelected ? selectedIds.filter((id) => !currentIds.includes(id)) : Array.from(new Set([...selectedIds, ...currentIds])));
  };

  const updateImportStatus = (id: string, nextStatus: ImportStatus, message: string) => {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, importStatus: nextStatus } : item)));
    setNotice(message);
  };

  const batchImport = () => {
    if (!selectedIds.length) {
      setNotice('请先选择需要导入的资源');
      return;
    }
    setItems((current) =>
      current.map((item) => (selectedIds.includes(item.id) ? { ...item, importStatus: '已导入' } : item))
    );
    setNotice(`已批量导入 ${selectedIds.length} 条资源`);
  };

  const columns: DataTableColumn<ResourceItem>[] = [
    {
      key: 'selection',
      title: '',
      render: (item) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(item.id)}
          onChange={() => toggleSelected(item.id)}
          className="h-4 w-4 rounded border-[#d8d0c4] text-[#7a8b6f] focus:ring-[#7a8b6f]"
        />
      )
    },
    {
      key: 'image',
      title: '图片',
      render: (item) => (
        <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-[#e9e2d6] bg-[#f5f1ea] text-3xl">
          {item.imageMark}
        </div>
      )
    },
    {
      key: 'name',
      title: '名称',
      render: (item) => <span className="font-semibold text-[#2f2f2f]">{item.name}</span>
    },
    {
      key: 'sourceId',
      title: '来源ID',
      render: (item) => <span className="font-mono text-xs text-[#8c8c8c]">{item.sourceId}</span>
    },
    {
      key: 'type',
      title: '资源类型',
      render: (item) => (
        <span className={`inline-flex min-w-[64px] items-center justify-center rounded-lg border px-2.5 py-1 text-sm font-medium ${typeTone[item.type]}`}>
          {item.type}
        </span>
      )
    },
    { key: 'source', title: '来源', render: (item) => item.source },
    {
      key: 'summary',
      title: '摘要信息',
      widthClassName: 'min-w-[220px]',
      render: (item) => (
        <span
          className="block max-w-[220px] truncate text-[#2f2f2f] decoration-dotted underline-offset-4 hover:underline"
          title={item.summary}
        >
          {item.summary}
        </span>
      )
    },
    {
      key: 'importStatus',
      title: '导入状态',
      render: (item) => <StatusTag label={item.importStatus} tone={importStatusTone[item.importStatus]} />
    },
    {
      key: 'duplicateStatus',
      title: '是否重复',
      render: (item) => <StatusTag label={item.duplicateStatus} tone={duplicateTone[item.duplicateStatus]} />
    },
    {
      key: 'updatedAt',
      title: '更新时间',
      render: (item) => <span className="leading-6">{item.updatedAt}</span>
    },
    {
      key: 'actions',
      title: '操作',
      render: (item) => (
        <div className="flex items-center gap-2 text-sm">
          <button className="text-[#7a8b6f] hover:underline" type="button" onClick={() => setNotice(`预览资源：${item.name}`)}>
            预览
          </button>
          <span className="text-[#d8d0c4]">|</span>
          <button
            className="text-[#c27b48] hover:underline disabled:text-[#b7aea1] disabled:no-underline"
            type="button"
            disabled={item.importStatus === '已导入'}
            onClick={() => updateImportStatus(item.id, '已导入', `已导入资源：${item.name}`)}
          >
            导入
          </button>
          <span className="text-[#d8d0c4]">|</span>
          <button
            className="text-[#8c8c8c] hover:underline disabled:text-[#b7aea1] disabled:no-underline"
            type="button"
            disabled={item.importStatus === '已忽略'}
            onClick={() => updateImportStatus(item.id, '已忽略', `已忽略资源：${item.name}`)}
          >
            忽略
          </button>
        </div>
      )
    }
  ];

  const allCurrentSelected = filteredItems.length > 0 && filteredItems.every((item) => selectedIds.includes(item.id));

  return (
    <div className="mx-auto w-full max-w-[1480px] space-y-6">
      <PageHeader
        title="资源接入中心"
        description="搜索外部资源并导入到本地内容库，支持菜谱、食材、水果、调料、酒水等多种资源类型。"
      />

      {notice ? (
        <div className="rounded-2xl border border-[#d8e9d1] bg-[#edf5ea] px-5 py-3 text-sm text-[#5f7f59]">{notice}</div>
      ) : null}

      <section className="rounded-3xl border border-[#e9e2d6] bg-[#fffdfc] p-6">
        <div className="grid gap-4 xl:grid-cols-[240px_210px_minmax(420px,1fr)_240px_auto_auto_auto] xl:items-center">
          <FieldRow label="资源类型">
            <select className={selectClass} value={resourceType} onChange={(event) => setResourceType(event.target.value as typeof resourceType)}>
              {resourceTypeOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </FieldRow>
          <FieldRow label="数据来源">
            <select className={selectClass} value={source} onChange={(event) => setSource(event.target.value as typeof source)}>
              {sourceOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </FieldRow>
          <FieldRow label="关键词">
            <Input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="请输入名称、摘要、来源、ID 等关键词"
              className="h-11 rounded-xl border-[#e9e2d6]"
            />
          </FieldRow>
          <FieldRow label="导入状态">
            <select className={selectClass} value={importStatus} onChange={(event) => setImportStatus(event.target.value as typeof importStatus)}>
              {importStatusOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </FieldRow>
          <Button className="h-11 bg-[#7a8b6f] px-7 hover:bg-[#6d7f63]" onClick={() => setNotice(`查询到 ${filteredItems.length} 条资源`)}>
            查询
          </Button>
          <Button variant="ghost" className="h-11 px-7" onClick={resetFilters}>
            重置
          </Button>
          <Button className="h-11 bg-[#c27b48] px-7 hover:bg-[#ad6c3e]" onClick={batchImport}>
            批量导入
          </Button>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-[240px_minmax(420px,1fr)_240px_300px] lg:items-center">
          <FieldRow label="是否重复">
            <select className={selectClass} value={duplicateStatus} onChange={(event) => setDuplicateStatus(event.target.value as typeof duplicateStatus)}>
              {duplicateOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </FieldRow>
          <div className="grid grid-cols-[88px_minmax(0,1fr)] items-center gap-3">
            <span className="whitespace-nowrap text-sm font-semibold text-[#2f2f2f]">更新时间</span>
            <div className="grid gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
              <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="h-11 rounded-xl border-[#e9e2d6]" />
              <span className="text-center text-[#8c8c8c]">→</span>
              <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="h-11 rounded-xl border-[#e9e2d6]" />
            </div>
          </div>
          <FieldRow label="导入方式">
            <select className={selectClass} value={importMode} onChange={(event) => setImportMode(event.target.value as typeof importMode)}>
              {importModeOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </FieldRow>
          <FieldRow label="来源ID">
            <Input
              value={sourceId}
              onChange={(event) => setSourceId(event.target.value)}
              placeholder="请输入来源ID"
              className="h-11 rounded-xl border-[#e9e2d6]"
            />
          </FieldRow>
        </div>
      </section>

      <div className="rounded-3xl border border-[#e9e2d6] bg-[#fffdfc]">
        <div className="border-b border-[#e9e2d6] px-6 py-4">
          <label className="inline-flex items-center gap-3 text-sm text-[#2f2f2f]">
            <input
              type="checkbox"
              checked={allCurrentSelected}
              onChange={toggleAll}
              className="h-4 w-4 rounded border-[#d8d0c4] text-[#7a8b6f] focus:ring-[#7a8b6f]"
            />
            选择当前页资源
          </label>
        </div>
        <DataTable columns={columns} data={filteredItems} rowKey={(item) => item.id} emptyTitle="暂无资源" emptyDescription="调整筛选条件后重新查询。" />
        <div className="flex flex-col gap-3 px-6 py-4 text-sm text-[#8c8c8c] md:flex-row md:items-center md:justify-between">
          <span>共 128 条</span>
          <div className="flex flex-wrap items-center gap-2">
            <button className="rounded-lg border border-[#e9e2d6] px-3 py-2 text-[#b7aea1]" type="button">
              ‹
            </button>
            {[1, 2, 3, 4, 5].map((page) => (
              <button
                key={page}
                className={`rounded-lg border px-3 py-2 ${page === 1 ? 'border-[#7a8b6f] bg-[#edf5ea] text-[#5f7f59]' : 'border-[#e9e2d6] text-[#2f2f2f]'}`}
                type="button"
              >
                {page}
              </button>
            ))}
            <span>...</span>
            <button className="rounded-lg border border-[#e9e2d6] px-3 py-2 text-[#2f2f2f]" type="button">
              13
            </button>
            <button className="rounded-lg border border-[#e9e2d6] px-3 py-2 text-[#2f2f2f]" type="button">
              ›
            </button>
            <select className={selectClass}>
              <option>10 条/页</option>
              <option>20 条/页</option>
            </select>
            <span>跳至</span>
            <Input className="h-10 w-20 rounded-xl border-[#e9e2d6] text-center" defaultValue="1" />
            <span>页</span>
          </div>
        </div>
      </div>
    </div>
  );
};
