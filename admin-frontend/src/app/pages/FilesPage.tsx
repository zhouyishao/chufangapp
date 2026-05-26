import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';

import { uploadImage } from '../api';
import { Button } from '../components/Button';
import { ConfirmModal } from '../components/ConfirmModal';
import { DataTable, type DataTableColumn } from '../components/DataTable';
import { FilterPanel } from '../components/FilterPanel';
import { ImagePreview } from '../components/ImagePreview';
import { Input } from '../components/Input';
import { PageHeader } from '../components/PageHeader';
import { StatusTag } from '../components/StatusTag';
import { resolveMockList } from '../mockApi';

type FileStatus = 'USED' | 'UNUSED';

type FileItem = {
  id: number;
  filename: string;
  url: string;
  fileType: 'image/png' | 'image/jpeg' | 'image/webp';
  size: string;
  folder: string;
  usedCount: number;
  status: FileStatus;
  createdAt: string;
};

const initialFiles: FileItem[] = [
  { id: 501, filename: 'home-banner-spring.webp', url: 'https://example.com/home-banner-spring.webp', fileType: 'image/webp', size: '428 KB', folder: 'banner', usedCount: 3, status: 'USED', createdAt: '2026-05-25 10:04' },
  { id: 502, filename: 'recipe-tomato-egg.png', url: 'https://example.com/recipe-tomato-egg.png', fileType: 'image/png', size: '612 KB', folder: 'recipe', usedCount: 12, status: 'USED', createdAt: '2026-05-24 15:22' },
  { id: 503, filename: 'ingredient-asparagus.jpg', url: 'https://example.com/ingredient-asparagus.jpg', fileType: 'image/jpeg', size: '351 KB', folder: 'ingredient', usedCount: 0, status: 'UNUSED', createdAt: '2026-05-22 08:30' }
];

const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
const maxImageSize = 5 * 1024 * 1024;

const formatFileSize = (size: number) => {
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
};

export const FilesPage = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sourceItems, setSourceItems] = useState<FileItem[]>(initialFiles);
  const [items, setItems] = useState<FileItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [q, setQ] = useState('');
  const [folder, setFolder] = useState<'all' | string>('all');
  const [status, setStatus] = useState<'all' | FileStatus>('all');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<FileItem | null>(null);

  const filteredItems = useMemo(() => {
    return sourceItems.filter((item) => {
      const matchKeyword = q.trim() ? item.filename.includes(q.trim()) || item.url.includes(q.trim()) : true;
      const matchFolder = folder === 'all' ? true : item.folder === folder;
      const matchStatus = status === 'all' ? true : item.status === status;
      return matchKeyword && matchFolder && matchStatus;
    });
  }, [folder, q, sourceItems, status]);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setLoading(true);
      const response = await resolveMockList(filteredItems, page, pageSize);
      if (!alive) return;
      setItems(response.data.list);
      setTotal(response.data.pagination.total);
      setLoading(false);
    };
    void load();
    return () => {
      alive = false;
    };
  }, [filteredItems, page, pageSize]);

  const canPrev = page > 1;
  const canNext = page * pageSize < total;

  const handleUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!allowedMimeTypes.includes(file.type)) {
      setNotice('图片格式不支持，请上传 jpg、jpeg、png 或 webp');
      return;
    }
    if (file.size > maxImageSize) {
      setNotice('图片不能超过 5MB');
      return;
    }

    const now = new Date().toLocaleString('zh-CN', { hour12: false });
    try {
      const result = await uploadImage(file);
      setSourceItems((prev) => [
        {
          id: prev.length ? Math.max(...prev.map((item) => item.id)) + 1 : 1,
          filename: file.name,
          url: result.url,
          fileType: file.type as FileItem['fileType'],
          size: formatFileSize(file.size),
          folder: 'upload',
          usedCount: 0,
          status: 'UNUSED',
          createdAt: now
        },
        ...prev
      ]);
      setNotice('图片上传成功');
    } catch (err) {
      setNotice(err instanceof Error ? err.message : '图片上传失败');
    }
  };

  const handleDelete = () => {
    if (!deleting) return;
    setSourceItems((prev) => prev.filter((item) => item.id !== deleting.id));
    setDeleting(null);
    setNotice('文件已删除');
  };

  const columns: DataTableColumn<FileItem>[] = [
    {
      key: 'preview',
      title: '预览',
      render: (item) => <ImagePreview src={item.url} alt={item.filename} />
    },
    { key: 'filename', title: '文件名', render: (item) => <span className="font-medium text-[#2f2f2f]">{item.filename}</span> },
    { key: 'folder', title: '目录', render: (item) => item.folder },
    { key: 'fileType', title: '类型', render: (item) => item.fileType },
    { key: 'size', title: '大小', render: (item) => item.size },
    { key: 'usedCount', title: '引用次数', render: (item) => item.usedCount },
    { key: 'status', title: '状态', render: (item) => <StatusTag label={item.status === 'USED' ? '已引用' : '未引用'} tone={item.status === 'USED' ? 'green' : 'gray'} /> },
    {
      key: 'actions',
      title: '操作',
      render: (item) => (
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="ghost" onClick={() => setNotice(`预览：${item.filename}`)}>预览</Button>
          <Button variant="ghost" onClick={() => setNotice(`复制地址：${item.url}`)}>复制地址</Button>
          <Button variant="danger" onClick={() => setDeleting(item)}>删除</Button>
        </div>
      )
    }
  ];

  return (
    <section className="space-y-6">
      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => void handleFileSelected(event)} />
      <PageHeader
        title="文件列表"
        description="管理图片库、OSS 文件、上传记录和引用关系，支持搜索、筛选、预览和删除。"
        actions={<Button onClick={handleUpload}>上传图片</Button>}
      />

      {notice ? <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-700">{notice}</div> : null}

      <FilterPanel>
        <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-3">
          <Input value={q} onChange={(event) => { setPage(1); setQ(event.target.value); }} placeholder="搜索文件名 / URL..." />
          <select value={folder} onChange={(event) => { setPage(1); setFolder(event.target.value); }} className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm">
            <option value="all">全部目录</option>
            <option value="banner">banner</option>
            <option value="recipe">recipe</option>
            <option value="ingredient">ingredient</option>
            <option value="upload">upload</option>
          </select>
          <select value={status} onChange={(event) => { setPage(1); setStatus(event.target.value as typeof status); }} className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm">
            <option value="all">全部状态</option>
            <option value="USED">已引用</option>
            <option value="UNUSED">未引用</option>
          </select>
        </div>
        <div className="flex items-center gap-2 text-sm text-[#8c8c8c]">
          <select value={pageSize} onChange={(event) => { setPage(1); setPageSize(Number(event.target.value)); }} className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm">
            <option value={10}>10 / 页</option>
            <option value={20}>20 / 页</option>
          </select>
          <Button variant="ghost" disabled={!canPrev || loading} onClick={() => setPage((value) => Math.max(1, value - 1))}>上一页</Button>
          <span>第 {page} 页 / 共 {Math.max(1, Math.ceil(total / pageSize))} 页</span>
          <Button variant="ghost" disabled={!canNext || loading} onClick={() => setPage((value) => value + 1)}>下一页</Button>
        </div>
      </FilterPanel>

      <DataTable columns={columns} data={items} loading={loading} rowKey={(item) => item.id} emptyTitle="暂无文件" />

      <ConfirmModal
        title="删除文件"
        open={!!deleting}
        description={deleting ? `确认删除「${deleting.filename}」？如文件仍被内容引用，开发时后端需阻止删除或提示引用关系。` : null}
        confirmText="删除"
        danger
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
      />
    </section>
  );
};
