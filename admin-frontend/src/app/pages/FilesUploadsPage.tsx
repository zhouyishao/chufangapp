import { useEffect, useMemo, useState } from 'react';

import { deleteStoredFile, listStoredFiles, resolveAssetUrl, type StoredFileItem } from '../api';
import { Button } from '../components/Button';
import { ConfirmModal } from '../components/ConfirmModal';

const formatSize = (bytes: number) => bytes >= 1024 * 1024
  ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
  : `${Math.max(1, Math.round(bytes / 1024))} KB`;

export const FilesUploadsPage = () => {
  const [items, setItems] = useState<StoredFileItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [appliedQ, setAppliedQ] = useState('');
  const [type, setType] = useState<'' | 'image' | 'video'>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<StoredFileItem | null>(null);
  const pageSize = 20;
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total]);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listStoredFiles({ page, pageSize, q: appliedQ || undefined, type: type || undefined });
      setItems(data.list);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载文件失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void refresh(); }, [page, appliedQ, type]);

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await deleteStoredFile(deleting.id);
      setDeleting(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
      setDeleting(null);
    }
  };

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-[#2f2f2f]">上传记录</h1>
        <p className="mt-2 text-sm text-[#8c8c8c]">显示真实文件记录；被内容引用的文件不能删除。</p>
      </header>
      {error ? <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}
      <div className="flex flex-wrap gap-3 rounded-2xl border border-[#e9e2d6] bg-white p-4">
        <input value={q} onChange={(event) => setQ(event.target.value)} placeholder="搜索文件名或 MIME" className="h-10 min-w-64 rounded-xl border border-zinc-200 px-3 text-sm" />
        <select value={type} onChange={(event) => { setPage(1); setType(event.target.value as typeof type); }} className="h-10 rounded-xl border border-zinc-200 px-3 text-sm">
          <option value="">全部类型</option><option value="image">图片</option><option value="video">视频</option>
        </select>
        <Button onClick={() => { setPage(1); setAppliedQ(q.trim()); }}>搜索</Button>
      </div>
      <div className="overflow-hidden rounded-2xl border border-[#e9e2d6] bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#faf8f3] text-[#6f6f69]"><tr><th className="p-4">文件</th><th>类型</th><th>大小</th><th>引用</th><th>存储</th><th>上传时间</th><th className="pr-4">操作</th></tr></thead>
          <tbody>{items.map((item) => <tr key={item.id} className="border-t border-[#eee9df]">
            <td className="p-4"><div className="flex items-center gap-3">{item.mimeType.startsWith('image/') ? <img src={resolveAssetUrl(item.url)} alt="" className="h-12 w-12 rounded-lg object-cover" /> : <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#f3f0e9]">视频</div>}<span className="max-w-64 truncate font-medium">{item.name}</span></div></td>
            <td>{item.mimeType}</td><td>{formatSize(item.size)}</td><td>{item.referenceCount}</td><td>{item.storageKind === 'LOCAL' ? '本地' : '对象存储'}</td><td>{new Date(item.createdAt).toLocaleString('zh-CN', { hour12: false })}</td>
            <td className="pr-4"><button disabled={item.referenceCount > 0} onClick={() => setDeleting(item)} className="text-red-600 disabled:cursor-not-allowed disabled:text-zinc-300">删除</button></td>
          </tr>)}</tbody>
        </table>
        {!loading && !items.length ? <div className="p-12 text-center text-sm text-[#8c8c8c]">暂无文件</div> : null}
        {loading ? <div className="p-8 text-center text-sm text-[#8c8c8c]">加载中…</div> : null}
      </div>
      <footer className="flex items-center justify-between text-sm text-[#6f6f69]"><span>共 {total} 条</span><div className="flex gap-2"><Button variant="ghost" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>上一页</Button><span className="px-2 py-2">{page} / {totalPages}</span><Button variant="ghost" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}>下一页</Button></div></footer>
      <ConfirmModal open={Boolean(deleting)} title="删除文件" description="仅未被任何内容引用的文件可以删除。删除后本地文件将同步移除。" confirmText="确认删除" onClose={() => setDeleting(null)} onConfirm={() => void confirmDelete()} />
    </section>
  );
};
