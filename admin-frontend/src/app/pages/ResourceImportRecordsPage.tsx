import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';

import { Button } from '../components/Button';
import { DataTable, type DataTableColumn } from '../components/DataTable';
import { Input } from '../components/Input';
import { PageHeader } from '../components/PageHeader';
import { StatusTag } from '../components/StatusTag';

type ResourceType = '蔬菜' | '水果' | '调料' | '酒水' | '肉类' | '菜谱';
type RecordSource = '第三方API' | 'Mock' | '手动导入';
type ImportResult = '导入成功' | '导入失败' | '重复' | '已忽略';
type ImportMode = '单个导入' | '批量导入';
type Operator = '张小北' | '李思思' | '王建国';

type ImportRecord = {
  id: string;
  imageMark: string;
  name: string;
  type: ResourceType;
  source: RecordSource;
  result: ImportResult;
  mode: ImportMode;
  operator: Operator;
  importedAt: string;
  errorReason: string;
};

const initialRecords: ImportRecord[] = [
  {
    id: 'IMP20250524001',
    imageMark: '🍅',
    name: '番茄',
    type: '蔬菜',
    source: '第三方API',
    result: '导入成功',
    mode: '单个导入',
    operator: '张小北',
    importedAt: '2025-05-24 14:32:18',
    errorReason: '—'
  },
  {
    id: 'IMP20250524002',
    imageMark: '🍎',
    name: '苹果',
    type: '水果',
    source: 'Mock',
    result: '导入失败',
    mode: '批量导入',
    operator: '李思思',
    importedAt: '2025-05-24 14:28:47',
    errorReason: '图片地址失败，封面下载失败'
  },
  {
    id: 'IMP20250524003',
    imageMark: '✴️',
    name: '八角',
    type: '调料',
    source: '第三方API',
    result: '重复',
    mode: '批量导入',
    operator: '王建国',
    importedAt: '2025-05-24 14:15:03',
    errorReason: '已存在相同资源'
  },
  {
    id: 'IMP20250524004',
    imageMark: '🍷',
    name: '红酒',
    type: '酒水',
    source: '第三方API',
    result: '导入成功',
    mode: '单个导入',
    operator: '张小北',
    importedAt: '2025-05-24 13:58:21',
    errorReason: '—'
  },
  {
    id: 'IMP20250524005',
    imageMark: '🍗',
    name: '鸡胸肉',
    type: '肉类',
    source: '手动导入',
    result: '导入失败',
    mode: '单个导入',
    operator: '李思思',
    importedAt: '2025-05-24 13:35:42',
    errorReason: '字段缺失：营养成分'
  },
  {
    id: 'IMP20250524006',
    imageMark: '🐟',
    name: '清蒸鲈鱼',
    type: '菜谱',
    source: 'Mock',
    result: '已忽略',
    mode: '批量导入',
    operator: '王建国',
    importedAt: '2025-05-24 13:20:11',
    errorReason: '用户选择忽略（不符合要求）'
  }
];

const resourceTypeOptions = ['全部', '蔬菜', '水果', '调料', '酒水', '肉类', '菜谱'] as const;
const sourceOptions = ['全部', '第三方API', 'Mock', '手动导入'] as const;
const resultOptions = ['全部', '导入成功', '导入失败', '重复', '已忽略'] as const;
const duplicateOptions = ['全部', '正常', '重复'] as const;
const modeOptions = ['全部', '单个导入', '批量导入'] as const;
const operatorOptions = ['全部', '张小北', '李思思', '王建国'] as const;

const selectClass =
  'h-11 rounded-xl border border-[#e9e2d6] bg-white px-3 text-sm text-[#2f2f2f] outline-none focus:border-[#7a8b6f] focus:ring-2 focus:ring-[#7a8b6f]/10';

const typeTone: Record<ResourceType, string> = {
  蔬菜: 'border-[#d8e9d1] bg-[#edf5ea] text-[#6ba368]',
  水果: 'border-[#f4dcc5] bg-[#fff3e8] text-[#c27b48]',
  调料: 'border-purple-100 bg-purple-50 text-purple-700',
  酒水: 'border-sky-100 bg-sky-50 text-sky-700',
  肉类: 'border-red-100 bg-red-50 text-red-700',
  菜谱: 'border-[#ead3be] bg-[#fbf1e7] text-[#c27b48]'
};

const resultTone: Record<ImportResult, 'green' | 'orange' | 'red' | 'gray'> = {
  导入成功: 'green',
  导入失败: 'red',
  重复: 'orange',
  已忽略: 'gray'
};

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

export const ResourceImportRecordsPage = () => {
  const [records, setRecords] = useState(initialRecords);
  const [keyword, setKeyword] = useState('');
  const [resourceType, setResourceType] = useState<(typeof resourceTypeOptions)[number]>('全部');
  const [source, setSource] = useState<(typeof sourceOptions)[number]>('全部');
  const [result, setResult] = useState<(typeof resultOptions)[number]>('全部');
  const [duplicate, setDuplicate] = useState<(typeof duplicateOptions)[number]>('全部');
  const [mode, setMode] = useState<(typeof modeOptions)[number]>('全部');
  const [operator, setOperator] = useState<(typeof operatorOptions)[number]>('全部');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  const filteredRecords = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    return records.filter((record) => {
      const keywordMatched =
        !normalizedKeyword ||
        [record.id, record.name, record.source, record.operator].some((value) => value.toLowerCase().includes(normalizedKeyword));
      const typeMatched = resourceType === '全部' || record.type === resourceType;
      const sourceMatched = source === '全部' || record.source === source;
      const resultMatched = result === '全部' || record.result === result;
      const duplicateMatched = duplicate === '全部' || (duplicate === '重复' ? record.result === '重复' : record.result !== '重复');
      const modeMatched = mode === '全部' || record.mode === mode;
      const operatorMatched = operator === '全部' || record.operator === operator;
      const itemDate = record.importedAt.slice(0, 10);
      const startMatched = !startDate || itemDate >= startDate;
      const endMatched = !endDate || itemDate <= endDate;
      return keywordMatched && typeMatched && sourceMatched && resultMatched && duplicateMatched && modeMatched && operatorMatched && startMatched && endMatched;
    });
  }, [duplicate, endDate, keyword, mode, operator, records, resourceType, result, source, startDate]);

  const resetFilters = () => {
    setKeyword('');
    setResourceType('全部');
    setSource('全部');
    setResult('全部');
    setDuplicate('全部');
    setMode('全部');
    setOperator('全部');
    setStartDate('');
    setEndDate('');
    setNotice('筛选条件已重置');
  };

  const retryRecord = (id: string) => {
    setRecords((current) =>
      current.map((record) => (record.id === id ? { ...record, result: '导入成功', errorReason: '—' } : record))
    );
    setNotice(`已重新导入记录：${id}`);
  };

  const columns: DataTableColumn<ImportRecord>[] = [
    {
      key: 'selection',
      title: '',
      render: () => <input type="checkbox" className="h-4 w-4 rounded border-[#d8d0c4] text-[#7a8b6f] focus:ring-[#7a8b6f]" />
    },
    { key: 'id', title: '记录ID', render: (record) => <span className="font-medium text-[#2f2f2f]">{record.id}</span> },
    {
      key: 'name',
      title: '资源名称',
      render: (record) => (
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#e9e2d6] bg-[#f5f1ea] text-2xl">{record.imageMark}</div>
          <span className="font-semibold text-[#2f2f2f]">{record.name}</span>
        </div>
      )
    },
    {
      key: 'type',
      title: '资源类型',
      render: (record) => (
        <span className={`inline-flex min-w-[64px] items-center justify-center rounded-lg border px-2.5 py-1 text-sm font-medium ${typeTone[record.type]}`}>
          {record.type}
        </span>
      )
    },
    { key: 'source', title: '数据来源', render: (record) => record.source },
    { key: 'result', title: '导入结果', render: (record) => <StatusTag label={record.result} tone={resultTone[record.result]} /> },
    { key: 'mode', title: '导入方式', render: (record) => record.mode },
    { key: 'operator', title: '操作人', render: (record) => record.operator },
    { key: 'importedAt', title: '导入时间', render: (record) => <span className="leading-6">{record.importedAt}</span> },
    {
      key: 'errorReason',
      title: '错误原因',
      widthClassName: 'min-w-[220px]',
      render: (record) => <span className="block max-w-[240px] whitespace-normal leading-6">{record.errorReason}</span>
    },
    {
      key: 'actions',
      title: '操作',
      render: (record) => (
        <div className="flex items-center gap-2 text-sm">
          <button type="button" className="text-[#7a8b6f] hover:underline" onClick={() => setNotice(`查看详情：${record.id}`)}>
            详情
          </button>
          {record.result === '导入失败' ? (
            <>
              <span className="text-[#d8d0c4]">|</span>
              <button type="button" className="text-[#c27b48] hover:underline" onClick={() => retryRecord(record.id)}>
                重试
              </button>
            </>
          ) : null}
        </div>
      )
    }
  ];

  return (
    <div className="mx-auto w-full max-w-[1480px] space-y-6">
      <PageHeader
        title="导入记录"
        description="记录所有资源的导入历史，包括成功、失败、重复和忽略的情况，便于问题排查与追溯。"
      />

      {notice ? (
        <div className="rounded-2xl border border-[#d8e9d1] bg-[#edf5ea] px-5 py-3 text-sm text-[#5f7f59]">{notice}</div>
      ) : null}

      <section className="rounded-3xl border border-[#e9e2d6] bg-[#fffdfc] p-6">
        <div className="grid gap-4 xl:grid-cols-[240px_240px_240px_240px_minmax(360px,1fr)_auto_auto_auto] xl:items-center">
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
          <FieldRow label="导入结果">
            <select className={selectClass} value={result} onChange={(event) => setResult(event.target.value as typeof result)}>
              {resultOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </FieldRow>
          <FieldRow label="去重结果">
            <select className={selectClass} value={duplicate} onChange={(event) => setDuplicate(event.target.value as typeof duplicate)}>
              {duplicateOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </FieldRow>
          <FieldRow label="关键词">
            <Input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="请输入资源名称、来源ID、操作人"
              className="h-11 rounded-xl border-[#e9e2d6]"
            />
          </FieldRow>
          <Button className="h-11 bg-[#7a8b6f] px-7 hover:bg-[#6d7f63]" onClick={() => setNotice(`查询到 ${filteredRecords.length} 条导入记录`)}>
            查询
          </Button>
          <Button variant="ghost" className="h-11 px-7" onClick={resetFilters}>
            重置
          </Button>
          <Button className="h-11 bg-[#c27b48] px-7 hover:bg-[#ad6c3e]" onClick={() => setNotice('导出任务已创建')}>
            导出记录
          </Button>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-[240px_minmax(420px,1fr)_240px] lg:items-center">
          <FieldRow label="导入方式">
            <select className={selectClass} value={mode} onChange={(event) => setMode(event.target.value as typeof mode)}>
              {modeOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </FieldRow>
          <div className="grid grid-cols-[88px_minmax(0,1fr)] items-center gap-3">
            <span className="whitespace-nowrap text-sm font-semibold text-[#2f2f2f]">时间范围</span>
            <div className="grid gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
              <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="h-11 rounded-xl border-[#e9e2d6]" />
              <span className="text-center text-[#8c8c8c]">~</span>
              <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="h-11 rounded-xl border-[#e9e2d6]" />
            </div>
          </div>
          <FieldRow label="操作人">
            <select className={selectClass} value={operator} onChange={(event) => setOperator(event.target.value as typeof operator)}>
              {operatorOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </FieldRow>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-5">
        {[
          ['全部记录', '2,856 条', 'gray'],
          ['导入成功', '1,920 条 · 67.3%', 'green'],
          ['导入失败', '528 条 · 18.5%', 'red'],
          ['重复记录', '368 条 · 12.9%', 'orange'],
          ['已忽略', '40 条 · 1.4%', 'gray']
        ].map(([label, value, tone]) => (
          <div key={label} className="rounded-2xl border border-[#e9e2d6] bg-[#fffdfc] p-5">
            <StatusTag label={label} tone={tone as 'green' | 'orange' | 'red' | 'gray'} />
            <div className="mt-4 text-2xl font-semibold text-[#2f2f2f]">{value}</div>
          </div>
        ))}
      </section>

      <DataTable columns={columns} data={filteredRecords} rowKey={(record) => record.id} emptyTitle="暂无导入记录" emptyDescription="调整筛选条件后重新查询。" />
      <div className="flex flex-col gap-3 rounded-3xl border border-[#e9e2d6] bg-[#fffdfc] px-6 py-4 text-sm text-[#8c8c8c] md:flex-row md:items-center md:justify-between">
        <span>共 2,856 条</span>
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
            286
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
  );
};
