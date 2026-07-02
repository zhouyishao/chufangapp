import { useEffect, useState } from 'react';

import { listAdminResource } from '../api';
import { Button } from '../components/Button';
import { DataTable, type DataTableColumn } from '../components/DataTable';
import { ImagePreview } from '../components/ImagePreview';
import { PageHeader } from '../components/PageHeader';
import { StatusTag } from '../components/StatusTag';
import type { AdminResourceItem } from '../types';

const moduleCards = [
  { title: 'Banner 管理', description: '管理首页头图、跳转、排序与上下架。' },
  { title: '推荐位管理', description: '配置首页推荐位、权重和内容池。' },
  { title: '今日推荐', description: '维护今日吃什么和编辑精选内容。' },
  { title: '时令食材', description: '按月份配置时令食材与推荐理由。' }
];

export const HomeOpsPage = () => {
  const [banners, setBanners] = useState<AdminResourceItem[]>([]);
  const [recommendations, setRecommendations] = useState<AdminResourceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [bannerResult, recommendationResult] = await Promise.all([
          listAdminResource<AdminResourceItem>('banners', { page: 1, pageSize: 5 }),
          listAdminResource<AdminResourceItem>('recommendations', { page: 1, pageSize: 5 })
        ]);
        if (!alive) return;
        setBanners(bannerResult.list);
        setRecommendations(recommendationResult.list);
      } catch (err) {
        if (!alive) return;
        setError(err instanceof Error ? err.message : '加载失败');
        setBanners([]);
        setRecommendations([]);
      } finally {
        if (alive) setLoading(false);
      }
    };
    void load();
    return () => {
      alive = false;
    };
  }, []);

  const bannerColumns: DataTableColumn<AdminResourceItem>[] = [
    { key: 'image', title: '图片', render: (item) => <ImagePreview src={typeof item.image === 'string' ? item.image : null} alt={String(item.title ?? 'Banner')} /> },
    { key: 'title', title: '标题', render: (item) => String(item.title ?? item.name ?? '-') },
    { key: 'targetType', title: '跳转类型', render: (item) => String(item.targetType ?? '-') },
    { key: 'sort', title: '排序', render: (item) => String(item.sort ?? '-') },
    {
      key: 'status',
      title: '状态',
      render: (item) => <StatusTag label={item.isPublish === false ? '已下架' : '展示中'} tone={item.isPublish === false ? 'gray' : 'green'} />
    }
  ];

  const recommendationColumns: DataTableColumn<AdminResourceItem>[] = [
    { key: 'title', title: '推荐内容', render: (item) => String(item.title ?? item.name ?? '-') },
    { key: 'targetType', title: '类型', render: (item) => String(item.targetType ?? '-') },
    { key: 'sort', title: '权重/排序', render: (item) => String(item.sort ?? '-') },
    {
      key: 'status',
      title: '状态',
      render: (item) => <StatusTag label={item.isPublish === false ? '隐藏' : '启用'} tone={item.isPublish === false ? 'gray' : 'green'} />
    }
  ];

  return (
    <section className="space-y-6">
      <PageHeader
        title="首页概览"
        description="管理首页 Banner、推荐位、今日推荐、时令食材、模块排序和 App 首页预览。"
        actions={
          <>
            <Button variant="ghost" onClick={() => setNotice('模块排序抽屉待接入，当前已保留操作入口')}>模块排序</Button>
            <Button onClick={() => setNotice('首页预览页待接入 App 实时预览，当前已保留操作入口')}>首页预览</Button>
          </>
        }
      />

      {error ? <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}
      {notice ? <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-700">{notice}</div> : null}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        {moduleCards.map((card) => (
          <div key={card.title} className="rounded-3xl border border-[#e9e2d6] bg-[#fffdfc] p-5">
            <div className="text-sm text-[#8c8c8c]">{card.description}</div>
            <div className="mt-4 flex items-end justify-between">
              <div className="text-lg font-semibold text-[#2f2f2f]">{card.title}</div>
              <div className="text-3xl font-semibold text-[#7a8b6f]">-</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#2f2f2f]">Banner 列表</h2>
            <Button variant="ghost" onClick={() => setNotice('新增 Banner 抽屉待接入，当前已保留操作入口')}>新增 Banner</Button>
          </div>
          <DataTable columns={bannerColumns} data={banners} loading={loading} rowKey={(item) => item.id} emptyTitle="暂无 Banner" />
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#2f2f2f]">推荐位列表</h2>
            <Button variant="ghost" onClick={() => setNotice('推荐位配置抽屉待接入，当前已保留操作入口')}>配置推荐位</Button>
          </div>
          <DataTable columns={recommendationColumns} data={recommendations} loading={loading} rowKey={(item) => item.id} emptyTitle="暂无推荐内容" />
        </div>
      </div>
    </section>
  );
};
