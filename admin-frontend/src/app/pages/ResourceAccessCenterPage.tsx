import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import * as XLSX from 'xlsx';

import { Button } from '../components/Button';
import { DataTable, type DataTableColumn } from '../components/DataTable';
import { Drawer } from '../components/Drawer';
import { Input } from '../components/Input';
import { PageHeader } from '../components/PageHeader';
import { StatusTag } from '../components/StatusTag';
import {
  listImportItems,
  createImportBatch,
  updateImportItem,
  setImportItemStatus,
  confirmImportBatch
} from '../api';
import type { ResourceImportStagedItem } from '../types';

type ResourceType = ResourceImportStagedItem['resourceType'];
type ImportStatus = ResourceImportStagedItem['status'];

const resourceTypeLabels: Record<ResourceType, string> = {
  RECIPE: '菜谱',
  INGREDIENT: '食材',
  FRUIT: '水果',
  SEASONING: '调料',
  BEVERAGE: '酒水'
};

const resourceTypeOptions = [
  { label: '全部', value: '' },
  { label: '菜谱', value: 'RECIPE' },
  { label: '食材', value: 'INGREDIENT' },
  { label: '水果', value: 'FRUIT' },
  { label: '调料', value: 'SEASONING' },
  { label: '酒水', value: 'BEVERAGE' }
] as const;

const importStatusOptions = [
  { label: '全部', value: '' },
  { label: '待处理', value: 'PENDING' },
  { label: '已导入', value: 'IMPORTED' },
  { label: '导入失败', value: 'FAILED' },
  { label: '已忽略', value: 'IGNORED' }
] as const;

const duplicateOptions = [
  { label: '全部', value: '' },
  { label: '正常', value: 'false' },
  { label: '重复', value: 'true' }
] as const;

const typeTone: Record<ResourceType, string> = {
  INGREDIENT: 'border-[#d8e9d1] bg-[#edf5ea] text-[#6ba368]',
  FRUIT: 'border-[#f4dcc5] bg-[#fff3e8] text-[#c27b48]',
  SEASONING: 'border-purple-100 bg-purple-50 text-purple-700',
  BEVERAGE: 'border-sky-100 bg-sky-50 text-sky-700',
  RECIPE: 'border-[#ead3be] bg-[#fbf1e7] text-[#c27b48]'
};

const importStatusTone: Record<ImportStatus, 'green' | 'orange' | 'red' | 'gray'> = {
  PENDING: 'orange',
  IMPORTED: 'green',
  FAILED: 'red',
  IGNORED: 'gray'
};

const selectClass =
  'h-11 w-full rounded-xl border border-[#e9e2d6] bg-white px-3 text-sm text-[#2f2f2f] outline-none focus:border-[#7a8b6f] focus:ring-2 focus:ring-[#7a8b6f]/10';

export const ResourceAccessCenterPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const batchIdParam = searchParams.get('batchId');
  const batchIdFilter = batchIdParam ? Number(batchIdParam) : undefined;

  const [items, setItems] = useState<ResourceImportStagedItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [q, setQ] = useState('');
  const [appliedQ, setAppliedQ] = useState('');
  const [typeFilter, setTypeFilter] = useState<ResourceType | ''>('');
  const [statusFilter, setStatusFilter] = useState<ImportStatus | ''>('');
  const [duplicateFilter, setDuplicateFilter] = useState<'true' | 'false' | ''>('');

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [previewItem, setPreviewItem] = useState<ResourceImportStagedItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [draftContent, setDraftContent] = useState<Record<string, any>>({});
  const [saveLoading, setSaveLoading] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listImportItems({
        page,
        pageSize,
        q: appliedQ.trim() || undefined,
        resourceType: typeFilter || undefined,
        status: statusFilter || undefined,
        isDuplicate: duplicateFilter === '' ? undefined : duplicateFilter === 'true',
        batchId: batchIdFilter
      });
      setItems(data.list);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, [page, pageSize, appliedQ, typeFilter, statusFilter, duplicateFilter, batchIdFilter]);

  const handleSearch = () => {
    setPage(1);
    setAppliedQ(q);
  };

  const handleReset = () => {
    setPage(1);
    setQ('');
    setAppliedQ('');
    setTypeFilter('');
    setStatusFilter('');
    setDuplicateFilter('');
    if (searchParams.has('batchId')) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('batchId');
      setSearchParams(nextParams);
    }
  };

  const toggleSelected = (id: number) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((itemId) => itemId !== id) : [...current, id]
    );
  };

  const toggleAll = () => {
    const currentIds = items.map((item) => item.id);
    const allSelected = currentIds.every((id) => selectedIds.includes(id));
    setSelectedIds((current) =>
      allSelected
        ? current.filter((id) => !currentIds.includes(id))
        : Array.from(new Set([...current, ...currentIds]))
    );
  };

  const parseImportFile = async (file: File): Promise<Array<{ resourceType: string; name: string; content: any }>> => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    if (extension === 'json') {
      const text = await file.text();
      const raw = JSON.parse(text);
      const list = Array.isArray(raw) ? raw : [raw];
      return list.map((item: any) => {
        let typeVal = String(item.resourceType || item.type || item['资源类型'] || 'INGREDIENT').toUpperCase();
        if (typeVal === '蔬菜' || typeVal === '食材') typeVal = 'INGREDIENT';
        else if (typeVal === '水果') typeVal = 'FRUIT';
        else if (typeVal === '调料') typeVal = 'SEASONING';
        else if (typeVal === '酒水') typeVal = 'BEVERAGE';
        else if (typeVal === '菜谱') typeVal = 'RECIPE';

        const name = String(item.name || item.title || item['名称'] || item['标题'] || '').trim();
        const content = item.content || { ...item };
        
        delete content.resourceType;
        delete content.type;
        delete content.name;
        delete content.title;
        delete content['资源类型'];
        delete content['名称'];
        delete content['标题'];

        return { resourceType: typeVal, name, content };
      }).filter((i) => i.name);
    } else if (['xlsx', 'xls', 'csv'].includes(extension || '')) {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet) as any[];

      return rows.map((row: any) => {
        let typeVal = String(row['资源类型'] || row.resourceType || row.type || 'INGREDIENT').toUpperCase();
        if (typeVal === '蔬菜' || typeVal === '食材') typeVal = 'INGREDIENT';
        else if (typeVal === '水果') typeVal = 'FRUIT';
        else if (typeVal === '调料') typeVal = 'SEASONING';
        else if (typeVal === '酒水') typeVal = 'BEVERAGE';
        else if (typeVal === '菜谱') typeVal = 'RECIPE';

        const name = String(row['名称'] || row['标题'] || row.name || row.title || '').trim();
        const content: any = {};
        
        content.categoryName = row['分类'] || row['分类名称'] || row.categoryName || row.category || '';
        
        if (typeVal === 'RECIPE') {
          content.subtitle = row['副标题'] || row.subtitle || '';
          content.description = row['描述'] || row.description || '';
          content.cookTime = row['耗时'] || row.cookTime || row.cook_time || null;
          content.difficulty = row['难度'] || row.difficulty || '';
          content.servings = row['份量'] || row.servings || null;
          content.calories = row['卡路里'] || row.calories || null;
          content.taste = row['口味'] || row.taste || '';
          content.scene = row['场景'] || row.scene || '';
          content.tips = row['技巧'] || row.tips || '';
          
          const stepsText = row['步骤'] || row.steps || '';
          if (stepsText) {
            content.steps = String(stepsText).split(/\n/).map((s) => s.trim()).filter(Boolean);
          }
          
          const ingText = row['用料'] || row['配料'] || row.ingredients || '';
          if (ingText) {
            content.ingredients = String(ingText).split(/,|，|\n/).map((ing) => {
              const parts = ing.trim().split(/\s+/);
              return {
                name: parts[0] || '',
                amount: parts[1] || ''
              };
            }).filter((ing) => ing.name);
          }
        } else if (typeVal === 'BEVERAGE') {
          content.coverImage = row['图片'] || row.coverImage || row.cover || '';
          content.beverageType = row['酒水类型'] || row.beverageType || '';
          content.isAlcoholic = row['是否含酒精'] === '是' || row['是否含酒精'] === true || row.isAlcoholic === true || row.isAlcoholic === 'true';
          content.alcoholDegree = row['酒精浓度'] || row.alcoholDegree || null;
          content.description = row['描述'] || row.description || '';
        } else {
          content.cover = row['图片'] || row.cover || '';
          content.seasonMonth = row['时令月份'] || row.seasonMonth || '';
          content.nutrition = row['营养成分'] || row.nutrition || '';
          content.selectionTips = row['挑选技巧'] || row.selectionTips || '';
          content.storageMethod = row['储存方法'] || row.storageMethod || '';
          content.taboo = row['食用禁忌'] || row.taboo || '';
          content.currentPrice = row['价格'] || row.currentPrice || null;
          content.priceUnit = row['计价单位'] || row.priceUnit || '';
          content.priceSource = row['价格来源'] || row.priceSource || '';
        }

        return { resourceType: typeVal, name, content };
      }).filter((i) => i.name);
    }
    return [];
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setNotice('正在解析文件并写入待处理区...');

    try {
      const itemsToUpload = await parseImportFile(file);
      if (itemsToUpload.length === 0) {
        throw new Error('未在文件中找到有效的数据记录');
      }

      const res = await createImportBatch({
        fileName: file.name,
        sourceType: file.name.split('.').pop()?.toUpperCase() || 'JSON',
        items: itemsToUpload
      });

      setNotice(`解析成功！新增批次 ID: ${res.batch.id}，共导入待处理项 ${res.items.length} 条。`);
      setPage(1);
      setSelectedIds([]);
      await refresh();
      setTimeout(() => setNotice(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '文件解析或上传失败');
      setNotice(null);
    } finally {
      setLoading(false);
      event.target.value = '';
    }
  };

  const openPreview = (item: ResourceImportStagedItem) => {
    setPreviewItem(item);
    setDraftName(item.name);
    setDraftContent(item.content);
    setError(null);
    setDrawerOpen(true);
  };

  const handleSaveDraft = async () => {
    if (!previewItem) return;
    setSaveLoading(true);
    setError(null);
    try {
      const updated = await updateImportItem(previewItem.id, {
        name: draftName,
        content: draftContent
      });
      setDrawerOpen(false);
      setNotice(`临时记录「${updated.name}」已更新`);
      await refresh();
      setTimeout(() => setNotice(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleSingleImport = async (item: ResourceImportStagedItem) => {
    setError(null);
    setNotice(`正在写入「${item.name}」到数据库...`);
    try {
      const res = await confirmImportBatch({ itemIds: [item.id] });
      if (res.successCount > 0) {
        setNotice(`导入成功！已写入正式库`);
      } else {
        setNotice(`导入未成功，请检查重复项或字段规范`);
      }
      await refresh();
      setTimeout(() => setNotice(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '导入失败');
    }
  };

  const handleSingleIgnore = async (item: ResourceImportStagedItem) => {
    setError(null);
    const nextStatus = item.status === 'IGNORED' ? 'PENDING' : 'IGNORED';
    try {
      await setImportItemStatus(item.id, nextStatus);
      setNotice(nextStatus === 'IGNORED' ? '已标记为忽略' : '已取消忽略并移回待处理');
      await refresh();
      setTimeout(() => setNotice(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败');
    }
  };

  const handleBatchImport = async () => {
    if (selectedIds.length === 0) {
      setNotice('请先选择要导入的记录');
      return;
    }
    setError(null);
    setNotice(`正在批量导入 ${selectedIds.length} 条记录...`);
    try {
      const res = await confirmImportBatch({ itemIds: selectedIds });
      setNotice(`批量导入完成：成功 ${res.successCount} 条，失败 ${res.failCount} 条。`);
      setSelectedIds([]);
      await refresh();
      setTimeout(() => setNotice(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '批量导入失败');
    }
  };

  const allCurrentSelected = items.length > 0 && items.every((item) => selectedIds.includes(item.id));

  const columns: DataTableColumn<ResourceImportStagedItem>[] = [
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
      key: 'id',
      title: 'Staged ID',
      render: (item) => <span className="font-mono text-xs text-zinc-500">{item.id}</span>
    },
    {
      key: 'name',
      title: '资源名称',
      render: (item) => (
        <div className="flex items-center gap-3">
          <span className="font-semibold text-[#2f2f2f]">{item.name}</span>
        </div>
      )
    },
    {
      key: 'type',
      title: '资源类型',
      render: (item) => (
        <span className={`inline-flex min-w-[64px] items-center justify-center rounded-lg border px-2.5 py-0.5 text-xs font-semibold ${typeTone[item.resourceType]}`}>
          {resourceTypeLabels[item.resourceType] || item.resourceType}
        </span>
      )
    },
    {
      key: 'category',
      title: '分类名称',
      render: (item) => <span className="text-zinc-600 text-sm">{item.content.categoryName || '-'}</span>
    },
    {
      key: 'importStatus',
      title: '导入状态',
      render: (item) => <StatusTag label={item.status === 'PENDING' ? '待处理' : item.status === 'IMPORTED' ? '已导入' : item.status === 'FAILED' ? '导入失败' : '已忽略'} tone={importStatusTone[item.status]} />
    },
    {
      key: 'duplicateStatus',
      title: '是否重复',
      render: (item) => (
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${item.isDuplicate ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
          {item.isDuplicate ? '● 重复' : '✓ 正常'}
        </span>
      )
    },
    {
      key: 'errorReason',
      title: '校验错误提示',
      widthClassName: 'max-w-[200px] truncate',
      render: (item) => <span className="text-red-500 text-xs font-mono">{item.errorReason || '-'}</span>
    },
    {
      key: 'actions',
      title: '操作',
      render: (item) => (
        <div className="flex items-center gap-2 text-sm" onClick={(e) => e.stopPropagation()}>
          <button className="text-[#7a8b6f] hover:underline font-semibold" type="button" onClick={() => openPreview(item)}>
            预览
          </button>
          <span className="text-[#d8d0c4]">|</span>
          <button
            className="text-[#c27b48] hover:underline font-semibold disabled:text-zinc-300 disabled:no-underline"
            type="button"
            disabled={item.status === 'IMPORTED'}
            onClick={() => void handleSingleImport(item)}
          >
            导入
          </button>
          <span className="text-[#d8d0c4]">|</span>
          <button
            className="text-zinc-500 hover:underline font-semibold disabled:text-zinc-300 disabled:no-underline"
            type="button"
            disabled={item.status === 'IMPORTED'}
            onClick={() => void handleSingleIgnore(item)}
          >
            {item.status === 'IGNORED' ? '取消忽略' : '忽略'}
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="mx-auto w-full max-w-[1480px] space-y-6">
      <PageHeader
        title="资源接入中心"
        description="解析本地 JSON 或 Excel (xlsx/xls/csv) 导入数据到待处理区，检查重复并手动或批量确认导入到正式库。"
      />

      <input
        type="file"
        id="upload-file"
        accept=".json,.xlsx,.xls,.csv"
        onChange={handleFileUpload}
        className="hidden"
      />

      {error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      {notice ? (
        <div className="rounded-2xl border border-[#d8e9d1] bg-[#edf5ea] px-5 py-3 text-sm text-[#5f7f59]">{notice}</div>
      ) : null}

      {batchIdFilter ? (
        <div className="rounded-2xl border border-[#c27b48]/20 bg-[#fff3e8] px-5 py-3 text-sm text-[#c27b48] flex items-center justify-between">
          <span>
            正在查看导入批次 <strong>#{batchIdFilter}</strong> 的导入明细项
          </span>
          <button
            type="button"
            className="text-sm font-semibold underline hover:text-[#ad6c3e]"
            onClick={() => {
              const nextParams = new URLSearchParams(searchParams);
              nextParams.delete('batchId');
              setSearchParams(nextParams);
            }}
          >
            清除批次筛选
          </button>
        </div>
      ) : null}

      {/* Filter Options */}
      <section className="rounded-3xl border border-[#e9e2d6] bg-[#fffdfc] p-6 shadow-sm">
        <div className="grid gap-4 xl:grid-cols-[1.2fr_1.2fr_1.2fr_2fr_auto_auto] items-end">
          <div className="flex flex-col gap-1.5 text-sm">
            <span className="font-semibold text-[#2f2f2f]">资源类型</span>
            <select
              className={selectClass}
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value as ResourceType | '');
                setPage(1);
              }}
            >
              {resourceTypeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5 text-sm">
            <span className="font-semibold text-[#2f2f2f]">导入状态</span>
            <select
              className={selectClass}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as ImportStatus | '');
                setPage(1);
              }}
            >
              {importStatusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5 text-sm">
            <span className="font-semibold text-[#2f2f2f]">是否重复</span>
            <select
              className={selectClass}
              value={duplicateFilter}
              onChange={(e) => {
                setDuplicateFilter(e.target.value as 'true' | 'false' | '');
                setPage(1);
              }}
            >
              {duplicateOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5 text-sm">
            <span className="font-semibold text-[#2f2f2f]">关键词</span>
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearch();
              }}
              placeholder="请输入名称、分类搜索..."
              className="h-11 rounded-xl border-[#e9e2d6]"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button className="h-11 bg-[#7a8b6f] px-7 hover:bg-[#6d7f63]" onClick={handleSearch}>
              查询
            </Button>
            <Button variant="ghost" className="h-11 px-6" onClick={handleReset}>
              重置
            </Button>
          </div>

          <div className="flex items-center gap-2 justify-end lg:col-span-1 xl:col-span-1">
            <Button
              className="h-11 bg-[#c27b48] px-7 hover:bg-[#ad6c3e]"
              onClick={() => document.getElementById('upload-file')?.click()}
            >
              📤 上传文件
            </Button>
            <Button
              className="h-11 bg-[#2f6f2f] hover:bg-[#235623] text-white disabled:opacity-50"
              disabled={selectedIds.length === 0}
              onClick={handleBatchImport}
            >
              ✓ 批量确认导入
            </Button>
          </div>
        </div>
      </section>

      {/* Staging Items Data Table */}
      <div className="rounded-3xl border border-[#e9e2d6] bg-[#fffdfc] shadow-sm overflow-hidden">
        <div className="border-b border-[#e9e2d6] px-6 py-4 flex items-center justify-between">
          <label className="inline-flex items-center gap-3 text-sm font-semibold text-[#2f2f2f] cursor-pointer">
            <input
              type="checkbox"
              checked={allCurrentSelected}
              onChange={toggleAll}
              className="h-4 w-4 rounded border-[#d8d0c4] text-[#7a8b6f] focus:ring-[#7a8b6f]"
            />
            选择当前页 {items.length} 项 (已选 {selectedIds.length} 项)
          </label>
        </div>

        <DataTable
          columns={columns}
          data={items}
          rowKey={(item) => item.id}
          emptyTitle="暂无待处理记录"
          emptyDescription="点击右上角“上传文件”，支持菜谱、食材、水果、调料、酒水的 JSON/Excel 导入数据校验预览。"
        />

        {/* Custom Pagination Footer */}
        <div className="flex items-center justify-between gap-4 border-t border-[#f1ece4] px-5 py-4 text-sm text-[#8c8c8c]">
          <span>共 {total} 条记录</span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              上一页
            </Button>
            <span className="rounded-lg bg-[#6f8b62] px-3 py-1.5 text-white font-medium">
              {page}
            </span>
            <span>/ {totalPages}</span>
            <Button
              variant="ghost"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              下一页
            </Button>
          </div>
        </div>
      </div>

      {/* Edit/Preview Drawer */}
      <Drawer
        title={`预览与编辑 - ${previewItem ? resourceTypeLabels[previewItem.resourceType] : ''}`}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        widthClassName="max-w-2xl"
      >
        {previewItem && (
          <div className="space-y-4">
            {error ? (
              <div className="rounded-xl bg-red-50 p-3.5 text-xs text-red-700 border border-red-100">
                {error}
              </div>
            ) : null}

            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-[#2f2f2f]">资源名称 *</span>
              <Input
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                placeholder="请输入资源名称"
                className="h-10 rounded-xl"
              />
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-[#2f2f2f]">分类名称 *</span>
              <Input
                value={draftContent.categoryName || ''}
                onChange={(e) => setDraftContent({ ...draftContent, categoryName: e.target.value })}
                placeholder="例如：蔬菜、热带水果"
                className="h-10 rounded-xl"
              />
            </div>

            {/* Render conditional inputs depending on ResourceType */}
            {previewItem.resourceType === 'RECIPE' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-[#2f2f2f]">副标题</span>
                    <Input
                      value={draftContent.subtitle || ''}
                      onChange={(e) => setDraftContent({ ...draftContent, subtitle: e.target.value })}
                      className="h-10 rounded-xl"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-[#2f2f2f]">烹饪耗时 (分钟)</span>
                    <Input
                      type="number"
                      value={draftContent.cookTime || ''}
                      onChange={(e) => setDraftContent({ ...draftContent, cookTime: Number(e.target.value) })}
                      className="h-10 rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-[#2f2f2f]">难度</span>
                    <select
                      className="h-10 rounded-xl border border-[#e9e2d6] bg-white px-3 text-sm outline-none"
                      value={draftContent.difficulty || ''}
                      onChange={(e) => setDraftContent({ ...draftContent, difficulty: e.target.value })}
                    >
                      <option value="">请选择</option>
                      <option value="简单">简单</option>
                      <option value="中等">中等</option>
                      <option value="困难">困难</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-[#2f2f2f]">用餐人数</span>
                    <Input
                      type="number"
                      value={draftContent.servings || ''}
                      onChange={(e) => setDraftContent({ ...draftContent, servings: Number(e.target.value) })}
                      className="h-10 rounded-xl"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-[#2f2f2f]">卡路里</span>
                    <Input
                      type="number"
                      value={draftContent.calories || ''}
                      onChange={(e) => setDraftContent({ ...draftContent, calories: Number(e.target.value) })}
                      className="h-10 rounded-xl"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-[#2f2f2f]">描述介绍</span>
                  <textarea
                    value={draftContent.description || ''}
                    onChange={(e) => setDraftContent({ ...draftContent, description: e.target.value })}
                    className="w-full h-20 rounded-xl border border-[#e9e2d6] p-3 text-sm outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-[#2f2f2f]">用料列表 (一行一个，如: 番茄 2个)</span>
                  <textarea
                    value={
                      Array.isArray(draftContent.ingredients)
                        ? draftContent.ingredients.map((i: any) => `${i.name || ''} ${i.amount || ''}`.trim()).join('\n')
                        : ''
                    }
                    onChange={(e) => {
                      const ings = e.target.value.split('\n').map((line) => {
                        const parts = line.trim().split(/\s+/);
                        return { name: parts[0] || '', amount: parts[1] || '' };
                      }).filter((i) => i.name);
                      setDraftContent({ ...draftContent, ingredients: ings });
                    }}
                    placeholder="输入用料配比..."
                    className="w-full h-24 rounded-xl border border-[#e9e2d6] p-3 text-sm font-mono outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-[#2f2f2f]">烹饪步骤 (每行写一个步骤)</span>
                  <textarea
                    value={
                      Array.isArray(draftContent.steps)
                        ? draftContent.steps.join('\n')
                        : ''
                    }
                    onChange={(e) => {
                      const st = e.target.value.split('\n').map((line) => line.trim()).filter(Boolean);
                      setDraftContent({ ...draftContent, steps: st });
                    }}
                    placeholder="请输入步骤详情..."
                    className="w-full h-24 rounded-xl border border-[#e9e2d6] p-3 text-sm outline-none"
                  />
                </div>
              </>
            )}

            {previewItem.resourceType === 'BEVERAGE' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-[#2f2f2f]">酒水种类</span>
                    <Input
                      value={draftContent.beverageType || ''}
                      onChange={(e) => setDraftContent({ ...draftContent, beverageType: e.target.value })}
                      className="h-10 rounded-xl"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-[#2f2f2f]">酒精精度</span>
                    <Input
                      type="number"
                      value={draftContent.alcoholDegree || ''}
                      onChange={(e) => setDraftContent({ ...draftContent, alcoholDegree: Number(e.target.value) })}
                      className="h-10 rounded-xl"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 py-2">
                  <input
                    type="checkbox"
                    id="isAlcoholic"
                    checked={draftContent.isAlcoholic === true}
                    onChange={(e) => setDraftContent({ ...draftContent, isAlcoholic: e.target.checked })}
                    className="h-4 w-4 rounded accent-[#7a8b6f]"
                  />
                  <label htmlFor="isAlcoholic" className="text-sm text-zinc-700 select-none">
                    含酒精饮料
                  </label>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-[#2f2f2f]">描述介绍</span>
                  <textarea
                    value={draftContent.description || ''}
                    onChange={(e) => setDraftContent({ ...draftContent, description: e.target.value })}
                    className="w-full h-24 rounded-xl border border-[#e9e2d6] p-3 text-sm outline-none"
                  />
                </div>
              </>
            )}

            {['INGREDIENT', 'FRUIT', 'SEASONING'].includes(previewItem.resourceType) && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-[#2f2f2f]">时令月份</span>
                    <Input
                      value={draftContent.seasonMonth || ''}
                      onChange={(e) => setDraftContent({ ...draftContent, seasonMonth: e.target.value })}
                      placeholder="如: 5,6,7"
                      className="h-10 rounded-xl"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-[#2f2f2f]">价格</span>
                    <Input
                      type="number"
                      value={draftContent.currentPrice || ''}
                      onChange={(e) => setDraftContent({ ...draftContent, currentPrice: Number(e.target.value) })}
                      className="h-10 rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-[#2f2f2f]">计价单位</span>
                    <Input
                      value={draftContent.priceUnit || ''}
                      onChange={(e) => setDraftContent({ ...draftContent, priceUnit: e.target.value })}
                      placeholder="如: 斤"
                      className="h-10 rounded-xl"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-[#2f2f2f]">价格来源</span>
                    <Input
                      value={draftContent.priceSource || ''}
                      onChange={(e) => setDraftContent({ ...draftContent, priceSource: e.target.value })}
                      className="h-10 rounded-xl"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-[#2f2f2f]">挑选技巧</span>
                  <textarea
                    value={draftContent.selectionTips || ''}
                    onChange={(e) => setDraftContent({ ...draftContent, selectionTips: e.target.value })}
                    className="w-full h-20 rounded-xl border border-[#e9e2d6] p-3 text-sm outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-[#2f2f2f]">储存方法</span>
                  <textarea
                    value={draftContent.storageMethod || ''}
                    onChange={(e) => setDraftContent({ ...draftContent, storageMethod: e.target.value })}
                    className="w-full h-20 rounded-xl border border-[#e9e2d6] p-3 text-sm outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-[#2f2f2f]">营养成分</span>
                  <textarea
                    value={draftContent.nutrition || ''}
                    onChange={(e) => setDraftContent({ ...draftContent, nutrition: e.target.value })}
                    className="w-full h-20 rounded-xl border border-[#e9e2d6] p-3 text-sm outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-[#2f2f2f]">食用禁忌</span>
                  <textarea
                    value={draftContent.taboo || ''}
                    onChange={(e) => setDraftContent({ ...draftContent, taboo: e.target.value })}
                    className="w-full h-20 rounded-xl border border-[#e9e2d6] p-3 text-sm outline-none"
                  />
                </div>
              </>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t border-[#f5f1ea]">
              <Button variant="ghost" onClick={() => setDrawerOpen(false)}>
                取消
              </Button>
              <Button disabled={saveLoading} onClick={handleSaveDraft} className="bg-[#7a8b6f] hover:bg-[#68775f]">
                {saveLoading ? '保存中...' : '保存更改'}
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};
