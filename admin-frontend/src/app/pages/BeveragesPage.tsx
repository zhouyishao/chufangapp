import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { deleteBeverage, disableBeverage, enableBeverage, listBeverages, type Beverage } from '../api';
import { Button } from '../components/Button';
import { DataTable, type DataTableColumn } from '../components/DataTable';
import { FilterPanel } from '../components/FilterPanel';
import { ImagePreview } from '../components/ImagePreview';
import { Input } from '../components/Input';
import { PageHeader } from '../components/PageHeader';
import { StatusTag } from '../components/StatusTag';

export const BeveragesPage = () => {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [items, setItems] = useState<Beverage[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listBeverages({ page: 1, pageSize: 50, q: q.trim() || undefined });
      setItems(result.list);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, [q]);

  const toggleSelected = (id: string) => {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  const columns: DataTableColumn<Beverage>[] = [
    {
      key: 'select',
      title: '',
      render: (item) => <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => toggleSelected(item.id)} />
    },
    {
      key: 'beverage',
      title: '酒水',
      render: (item) => (
        <button type="button" className="flex min-w-[220px] items-center gap-3 text-left" onClick={() => navigate(`/content/beverages/${item.id}/edit`)}>
          <ImagePreview src={item.coverImage} alt={item.name} />
          <span className="min-w-0">
            <span className="block font-medium text-[#2f2f2f]">{item.name}</span>
            <span className="mt-1 block text-xs font-normal text-[#8c8c8c]">{item.description ?? '未填写别名'}</span>
          </span>
        </button>
      )
    },
    { key: 'category', title: '分类', render: (item) => item.category?.name ?? item.beverageType ?? '-' },
    { key: 'alias', title: '别名', render: (item) => item.description ?? '-' },
    { key: 'status', title: '状态', render: (item) => <StatusTag label={item.status === 'ACTIVE' ? '启用' : '禁用'} tone={item.status === 'ACTIVE' ? 'green' : 'gray'} /> },
    { key: 'sort', title: '排序', render: (item) => item.sortOrder ?? item.sort ?? '-' },
    { key: 'createdAt', title: '创建时间', render: (item) => new Date(item.createdAt).toLocaleString('zh-CN', { hour12: false }) },
    {
      key: 'actions',
      title: '操作',
      render: (item) => (
        <div className="flex min-w-[160px] justify-end gap-3">
          <Button variant="ghost" onClick={() => navigate(`/content/beverages/${item.id}/edit`)}>编辑</Button>
          <Button variant="ghost" onClick={async () => { item.status === 'ACTIVE' ? await disableBeverage(item.id) : await enableBeverage(item.id); await refresh(); }}>{item.status === 'ACTIVE' ? '停用' : '启用'}</Button>
          <Button variant="danger" onClick={async () => { if (window.confirm(`确认删除「${item.name}」？`)) { await deleteBeverage(item.id); await refresh(); } }}>删除</Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="酒水管理"
        description="管理平台酒水信息，支持新增、编辑、删除、启用/停用与批量操作。"
        actions={<Button onClick={() => navigate('/content/beverages/create')}>新增酒水</Button>}
      />
      {error ? <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
      <FilterPanel>
        <Input value={q} onChange={(event) => setQ(event.target.value)} placeholder="搜索酒水名称 / 别名" />
      </FilterPanel>
      <DataTable columns={columns} data={items} loading={loading} error={error} rowKey={(item) => item.id} emptyTitle="暂无酒水" emptyDescription="新增无酒精饮品后，可在菜谱详情里配置推荐搭配。" />
    </div>
  );
};
