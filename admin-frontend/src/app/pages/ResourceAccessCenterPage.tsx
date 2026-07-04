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
  listResourceApiProviders,
  syncResourceApiProvider,
  testSavedResourceApiProvider,
  listImportItems,
  createImportBatch,
  updateImportItem,
  setImportItemStatus,
  confirmImportBatch
} from '../api';
import type { ResourceApiProviderItem, ResourceImportStagedItem } from '../types';

type ResourceType = ResourceImportStagedItem['importType'];
type ImportStatus = ResourceImportStagedItem['status'];

const resourceTypeLabels: Record<ResourceType, string> = {
  RECIPE: '菜谱',
  INGREDIENT: '食材',
  FRUIT: '水果',
  SEASONING: '调料',
  BEVERAGE: '酒水'
};

const resourceTypeOptions = [
  { label: '菜谱', value: 'RECIPE' },
  { label: '食材', value: 'INGREDIENT' },
  { label: '水果', value: 'FRUIT' },
  { label: '调料', value: 'SEASONING' },
  { label: '酒水', value: 'BEVERAGE' }
] as const;

const importStatusOptions = [
  { label: '全部状态', value: '' },
  { label: '待处理', value: 'PENDING' },
  { label: '已导入', value: 'IMPORTED' },
  { label: '导入失败', value: 'FAILED' },
  { label: '已忽略', value: 'IGNORED' }
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
  const [statusFilter, setStatusFilter] = useState<ImportStatus | ''>('');
  const [uploadType, setUploadType] = useState<ResourceType>('RECIPE');
  const [providerItems, setProviderItems] = useState<ResourceApiProviderItem[]>([]);
  const [providerLoading, setProviderLoading] = useState(false);
  const [selectedProviderId, setSelectedProviderId] = useState<number | ''>('');
  const [syncLimit, setSyncLimit] = useState(100);
  const [syncParamsText, setSyncParamsText] = useState('{\n  "page": 1,\n  "pageSize": 100\n}');
  const [syncLoading, setSyncLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);

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
        status: statusFilter || undefined,
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

  const refreshProviders = async () => {
    setProviderLoading(true);
    try {
      const data = await listResourceApiProviders({
        page: 1,
        pageSize: 100,
        status: 'ACTIVE',
        resourceType: uploadType
      });
      setProviderItems(data.list);
      setSelectedProviderId((current) => {
        if (typeof current === 'number' && data.list.some((item) => item.id === current)) return current;
        return data.list[0]?.id ?? '';
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载接口提供方失败');
    } finally {
      setProviderLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, [page, pageSize, appliedQ, statusFilter, batchIdFilter]);

  useEffect(() => {
    void refreshProviders();
  }, [uploadType]);

  const handleSearch = () => {
    setPage(1);
    setAppliedQ(q);
  };

  const handleReset = () => {
    setPage(1);
    setQ('');
    setAppliedQ('');
    setStatusFilter('');
    if (searchParams.has('batchId')) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('batchId');
      setSearchParams(nextParams);
    }
  };

  const handleTestProvider = async () => {
    if (typeof selectedProviderId !== 'number') {
      setNotice('请先选择一个 API 提供方');
      return;
    }
    setTestLoading(true);
    setError(null);
    try {
      const result = await testSavedResourceApiProvider(selectedProviderId);
      setNotice(`测试通过：解析 ${result.total} 条，预览 ${result.preview.length} 条`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '测试连接失败');
    } finally {
      setTestLoading(false);
    }
  };

  const handleSyncProvider = async () => {
    if (typeof selectedProviderId !== 'number') {
      setNotice('请先选择一个 API 提供方');
      return;
    }
    let parsedParams: Record<string, unknown> | null = null;
    if (syncParamsText.trim()) {
      try {
        parsedParams = JSON.parse(syncParamsText) as Record<string, unknown>;
      } catch {
        setError('同步参数 JSON 格式无效');
        return;
      }
    }

    setSyncLoading(true);
    setError(null);
    try {
      const result = await syncResourceApiProvider(selectedProviderId, {
        limit: Math.min(500, Math.max(1, syncLimit || 100)),
        params: parsedParams
      });
      setNotice(`已同步到导入池，批次 #${result.batch.id}，待处理 ${result.summary.pending} 条，失败 ${result.summary.failed} 条`);
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set('batchId', String(result.batch.id));
      setSearchParams(nextParams);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '同步失败');
    } finally {
      setSyncLoading(false);
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

  const downloadTemplate = (type: ResourceType) => {
    let headers: string[] = [];
    let example: Record<string, any> = {};

    if (type === 'RECIPE') {
      headers = [
        '名称', '分类', '副标题', '描述', '耗时', '难度', '份量', '卡路里', '口味', '场景', '技巧', '用料', '步骤'
      ];
      example = {
        '名称': '西红柿炒鸡蛋 (必填)',
        '分类': '家常菜',
        '副标题': '经典下饭菜，酸甜适口',
        '描述': '这是一道最经典的家常菜，富含维生素，营养丰富。',
        '耗时': 15,
        '难度': '简单',
        '份量': 2,
        '卡路里': 200,
        '口味': '酸甜',
        '场景': '午餐/晚餐',
        '技巧': '鸡蛋液里加一点水能让炒蛋更嫩。',
        '用料': '西红柿 2个, 鸡蛋 3个, 盐 适量, 糖 5克',
        '步骤': '1. 西红柿洗净切块，鸡蛋打散。\n2. 锅中倒油，鸡蛋炒熟盛出。\n3. 锅中留底油，下西红柿炒出沙，倒入炒好的蛋和调料翻炒均匀。'
      };
    } else if (type === 'BEVERAGE') {
      headers = [
        '名称', '分类', '图片', '酒水类型', '是否含酒精', '酒精浓度', '描述'
      ];
      example = {
        '名称': '莫吉托 (必填)',
        '分类': '鸡尾酒',
        '图片': 'https://example.com/mojito.jpg',
        '酒水类型': '鸡尾酒',
        '是否含酒精': '是',
        '酒精浓度': 12,
        '描述': '清爽的薄荷和青柠味，是夏日消暑的经典鸡尾酒。'
      };
    } else {
      headers = [
        '名称', '分类', '图片', '时令月份', '营养成分', '挑选技巧', '储存方法', '食用禁忌', '价格', '计价单位', '价格来源'
      ];
      example = {
        '名称': type === 'FRUIT' ? '红富士苹果 (必填)' : type === 'SEASONING' ? '酿造生抽 (必填)' : '小油菜 (必填)',
        '分类': type === 'FRUIT' ? '温带水果' : type === 'SEASONING' ? '酱油调味' : '绿叶蔬菜',
        '图片': 'https://example.com/item.jpg',
        '时令月份': '9,10,11',
        '营养成分': '富含维生素和膳食纤维',
        '挑选技巧': '选择色泽鲜亮，无虫眼，叶片挺拔的。',
        '储存方法': '冷藏保鲜，常温避光。',
        '食用禁忌': '无特殊食用禁忌。',
        '价格': 4.5,
        '计价单位': '斤',
        '价格来源': '农贸市场平均价'
      };
    }

    const worksheet = XLSX.utils.json_to_sheet([example], { header: headers });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '导入模板');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blobData = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    const url = window.URL.createObjectURL(blobData);
    const link = document.createElement('a');
    link.href = url;
    const typeNames: Record<ResourceType, string> = {
      RECIPE: '菜谱',
      INGREDIENT: '食材',
      FRUIT: '水果',
      SEASONING: '调料',
      BEVERAGE: '酒水'
    };
    link.setAttribute('download', `${typeNames[type]}导入模板.xlsx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const parseImportFile = async (file: File): Promise<Array<{ rowIndex: number; rawData: Record<string, any> }>> => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    if (extension === 'json') {
      const text = await file.text();
      const raw = JSON.parse(text);
      const list = Array.isArray(raw) ? raw : [raw];
      return list.map((item: any, idx: number) => ({
        rowIndex: idx + 1,
        rawData: item
      }));
    } else if (['xlsx', 'xls', 'csv'].includes(extension || '')) {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet) as any[];

      return rows.map((row: any, idx: number) => ({
        rowIndex: idx + 1,
        rawData: row
      }));
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
      const parsedItems = await parseImportFile(file);
      if (parsedItems.length === 0) {
        throw new Error('未在文件中找到有效的数据记录');
      }

      const res = await createImportBatch({
        importType: uploadType,
        sourceType: file.name.split('.').pop()?.toUpperCase() || 'JSON',
        fileName: file.name,
        items: parsedItems
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
    const mapped = item.mappedData || {};
    const raw = item.rawData || {};

    setDraftName(mapped.name || raw.name || raw['名称'] || raw.title || raw['标题'] || '');
    
    setDraftContent({
      categoryName: mapped.categoryName || raw.categoryName || raw.category || raw['分类'] || raw['分类名称'] || '',
      subtitle: mapped.subtitle || raw.subtitle || raw['副标题'] || '',
      description: mapped.description || raw.description || raw['描述'] || '',
      cookTime: mapped.cookTime !== undefined && mapped.cookTime !== null ? mapped.cookTime : (raw.cookTime || raw.cook_time || raw['耗时'] || ''),
      difficulty: mapped.difficulty || raw.difficulty || raw['难度'] || '',
      servings: mapped.servings !== undefined && mapped.servings !== null ? mapped.servings : (raw.servings || raw['份量'] || ''),
      calories: mapped.calories !== undefined && mapped.calories !== null ? mapped.calories : (raw.calories || raw['卡路里'] || ''),
      taste: mapped.taste || raw.taste || raw['口味'] || '',
      scene: mapped.scene || raw.scene || raw['场景'] || '',
      tips: mapped.tips || raw.tips || raw['技巧'] || '',
      steps: mapped.steps || raw.steps || [],
      ingredients: mapped.ingredients || raw.ingredients || [],
      // For BEVERAGE:
      coverImage: mapped.coverImage || raw.coverImage || raw.cover || raw['图片'] || '',
      beverageType: mapped.beverageType || raw.beverageType || raw['酒水类型'] || '',
      isAlcoholic: mapped.isAlcoholic !== undefined ? mapped.isAlcoholic : (raw.isAlcoholic === true || String(raw.isAlcoholic) === 'true' || raw['是否含酒精'] === '是'),
      alcoholDegree: mapped.alcoholDegree !== undefined && mapped.alcoholDegree !== null ? mapped.alcoholDegree : (raw.alcoholDegree || raw['酒精浓度'] || ''),
      // For INGREDIENT/FRUIT/SEASONING:
      cover: mapped.cover || raw.cover || raw['图片'] || '',
      seasonMonth: mapped.seasonMonth || raw.seasonMonth || raw['时令月份'] || '',
      nutrition: mapped.nutrition || raw.nutrition || raw['营养成分'] || '',
      selectionTips: mapped.selectionTips || raw.selectionTips || raw['挑选技巧'] || '',
      storageMethod: mapped.storageMethod || raw.storageMethod || raw['储存方法'] || '',
      taboo: mapped.taboo || raw.taboo || raw['食用禁忌'] || '',
      currentPrice: mapped.currentPrice !== undefined && mapped.currentPrice !== null ? mapped.currentPrice : (raw.currentPrice || raw['价格'] || ''),
      priceUnit: mapped.priceUnit || raw.priceUnit || raw['计价单位'] || '',
      priceSource: mapped.priceSource || raw.priceSource || raw['价格来源'] || '',
      priceDate: mapped.priceDate || raw.priceDate || raw['价格时间'] || ''
    });

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
      setNotice(`临时记录「${updated.mappedData?.name || draftName}」已更新`);
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
    const itemName = item.mappedData?.name || item.rawData?.name || item.rawData?.['名称'] || item.rawData?.title || item.rawData?.['标题'] || '未命名';
    setNotice(`正在写入「${itemName}」到数据库...`);
    try {
      const res = await confirmImportBatch({ importId: item.importId, itemIds: [item.id] });
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
    const firstSelected = items.find((item) => selectedIds.includes(item.id));
    if (!firstSelected) {
      setNotice('未找到所选记录');
      return;
    }
    setError(null);
    setNotice(`正在批量导入 ${selectedIds.length} 条记录...`);
    try {
      const res = await confirmImportBatch({ importId: firstSelected.importId, itemIds: selectedIds });
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
      render: (item) => {
        const nameVal = item.mappedData?.name || item.rawData?.name || item.rawData?.['名称'] || item.rawData?.title || item.rawData?.['标题'] || '-';
        return (
          <div className="flex items-center gap-3">
            <span className="font-semibold text-[#2f2f2f]">{nameVal}</span>
          </div>
        );
      }
    },
    {
      key: 'type',
      title: '资源类型',
      render: (item) => (
        <span className={`inline-flex min-w-[64px] items-center justify-center rounded-lg border px-2.5 py-0.5 text-xs font-semibold ${typeTone[item.importType]}`}>
          {resourceTypeLabels[item.importType] || item.importType}
        </span>
      )
    },
    {
      key: 'category',
      title: '分类名称',
      render: (item) => <span className="text-zinc-600 text-sm">{item.mappedData?.categoryName || '-'}</span>
    },
    {
      key: 'provider',
      title: '提供方',
      render: (item) => <span className="text-zinc-600 text-sm">{item.providerName || '-'}</span>
    },
    {
      key: 'externalId',
      title: '外部 ID',
      render: (item) => <span className="font-mono text-xs text-zinc-500">{item.externalId || '-'}</span>
    },
    {
      key: 'importStatus',
      title: '导入状态',
      render: (item) => <StatusTag label={item.status === 'PENDING' ? '待处理' : item.status === 'IMPORTED' ? '已导入' : item.status === 'FAILED' ? '导入失败' : '已忽略'} tone={importStatusTone[item.status]} />
    },
    {
      key: 'filterCode',
      title: '过滤码',
      render: (item) => <span className="font-mono text-xs text-zinc-500">{item.filterCode || '-'}</span>
    },
    {
      key: 'duplicateTargetId',
      title: '重复目标',
      render: (item) => <span className="font-mono text-xs text-zinc-500">{item.duplicateTargetId || '-'}</span>
    },
    {
      key: 'duplicateStatus',
      title: '是否重复',
      render: (item) => {
        const isDup = item.errorMessage?.includes('数据重复');
        return (
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${isDup ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
            {isDup ? '● 重复' : '✓ 正常'}
          </span>
        );
      }
    },
    {
      key: 'errorReason',
      title: '校验错误提示',
      widthClassName: 'max-w-[200px] truncate',
      render: (item) => <span className="text-red-500 text-xs font-mono" title={item.errorMessage || ''}>{item.errorMessage || '-'}</span>
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

      <div className="rounded-2xl border border-[#7a8b6f]/20 bg-[#fbfbfa] p-4.5 text-sm text-[#4d463f] flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-[#7a8b6f] font-bold">💡 操作指引：</span>
          <span>请先在右侧下拉菜单选择<b>导入类型</b>并点击<b>“下载模板”</b>，在本地按模板规范填写数据后，再点击<b>“上传文件”</b>进行格式校验与确认。</span>
        </div>
      </div>

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

      <section className="rounded-3xl border border-[#e9e2d6] bg-[#fffdfc] p-6 shadow-sm">
        <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr_1fr_auto] items-end">
          <div className="flex flex-col gap-1.5 text-sm">
            <span className="font-semibold text-[#2f2f2f]">API 提供方</span>
            <select
              className={selectClass}
              value={selectedProviderId}
              onChange={(e) => setSelectedProviderId(e.target.value ? Number(e.target.value) : '')}
              disabled={providerLoading}
            >
              <option value="">{providerLoading ? '加载中...' : '请选择提供方'}</option>
              {providerItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.providerName} - {item.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5 text-sm">
            <span className="font-semibold text-[#2f2f2f]">同步条数</span>
            <Input
              type="number"
              value={syncLimit}
              onChange={(e) => setSyncLimit(Number(e.target.value))}
              min={1}
              max={500}
              className="h-11 rounded-xl border-[#e9e2d6]"
            />
          </div>
          <div className="flex flex-col gap-1.5 text-sm">
            <span className="font-semibold text-[#2f2f2f]">请求参数 JSON</span>
            <textarea
              className="min-h-11 rounded-xl border border-[#e9e2d6] bg-white px-3 py-2 text-sm text-[#2f2f2f] outline-none focus:border-[#7a8b6f] focus:ring-2 focus:ring-[#7a8b6f]/10"
              value={syncParamsText}
              onChange={(e) => setSyncParamsText(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 xl:justify-end">
            <Button variant="ghost" className="h-11 px-5" onClick={handleTestProvider} disabled={testLoading}>
              {testLoading ? '测试中...' : '测试连接'}
            </Button>
            <Button className="h-11 bg-[#7a8b6f] px-6 hover:bg-[#6d7f63]" onClick={handleSyncProvider} disabled={syncLoading}>
              {syncLoading ? '同步中...' : '同步到导入池'}
            </Button>
          </div>
        </div>
      </section>

      {/* Filter Options */}
      <section className="rounded-3xl border border-[#e9e2d6] bg-[#fffdfc] p-6 shadow-sm">
        <div className="grid gap-4 xl:grid-cols-[1.5fr_2fr_auto_auto] items-end">
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
            <span className="font-semibold text-[#2f2f2f]">关键词</span>
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearch();
              }}
              placeholder="请输入资源名称进行搜索..."
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
            <span className="text-sm font-semibold text-[#2f2f2f] whitespace-nowrap">导入为：</span>
            <select
              className="h-11 rounded-xl border border-[#e9e2d6] bg-white px-3 text-sm text-[#2f2f2f] outline-none focus:border-[#7a8b6f] w-28"
              value={uploadType}
              onChange={(e) => setUploadType(e.target.value as ResourceType)}
            >
              {resourceTypeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <Button
              variant="ghost"
              className="h-11 px-5 border border-[#e9e2d6] text-[#7a8b6f] hover:bg-[#7a8b6f]/5 whitespace-nowrap flex items-center gap-1.5"
              onClick={() => downloadTemplate(uploadType)}
            >
              📥 下载模板
            </Button>
            <Button
              className="h-11 bg-[#c27b48] px-7 hover:bg-[#ad6c3e] whitespace-nowrap"
              onClick={() => document.getElementById('upload-file')?.click()}
            >
              📤 上传文件
            </Button>
            <Button
              className="h-11 bg-[#2f6f2f] hover:bg-[#235623] text-white disabled:opacity-50 whitespace-nowrap"
              disabled={selectedIds.length === 0}
              onClick={handleBatchImport}
            >
              ✓ 批量确认
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
          emptyDescription="点击右上角选择类型后“上传文件”，支持菜谱、食材、水果、调料、酒水的 JSON/Excel 导入数据校验预览。"
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
        title={`预览与编辑 - ${previewItem ? resourceTypeLabels[previewItem.importType] : ''}`}
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

            {/* Render conditional inputs depending on importType */}
            {previewItem.importType === 'RECIPE' && (
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
                      onChange={(e) => setDraftContent({ ...draftContent, cookTime: e.target.value ? Number(e.target.value) : null })}
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
                      onChange={(e) => setDraftContent({ ...draftContent, servings: e.target.value ? Number(e.target.value) : null })}
                      className="h-10 rounded-xl"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-[#2f2f2f]">卡路里</span>
                    <Input
                      type="number"
                      value={draftContent.calories || ''}
                      onChange={(e) => setDraftContent({ ...draftContent, calories: e.target.value ? Number(e.target.value) : null })}
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

            {previewItem.importType === 'BEVERAGE' && (
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
                      onChange={(e) => setDraftContent({ ...draftContent, alcoholDegree: e.target.value ? Number(e.target.value) : null })}
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

            {['INGREDIENT', 'FRUIT', 'SEASONING'].includes(previewItem.importType) && (
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
                      onChange={(e) => setDraftContent({ ...draftContent, currentPrice: e.target.value ? Number(e.target.value) : null })}
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
