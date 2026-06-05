import { ArrowLeft, Edit3, Layers3 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { getHomeTopNav, type HomeTopNav, type HomeTopNavStatus } from '../api';
import { Button } from '../components/Button';
import { StatusTag } from '../components/StatusTag';

const statusLabelMap: Record<HomeTopNavStatus, string> = {
  online: '已启用',
  draft: '草稿',
  offline: '已停用'
};

const safeDate = (value?: string) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

const Field = ({ label, value }: { label: string; value?: string | number | null }) => (
  <div className="rounded-2xl border border-[#e9e2d6] bg-[#fffdfc] px-5 py-4">
    <div className="text-xs text-[#8c8c8c]">{label}</div>
    <div className="mt-2 text-base font-semibold text-[#2f2f2f]">{value || '-'}</div>
  </div>
);

export const TopNavDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState<HomeTopNav | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    void getHomeTopNav(id)
      .then(setItem)
      .catch((err) => setError(err instanceof Error ? err.message : '加载失败'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <section className="mx-auto max-w-[1280px] text-sm text-[#8c8c8c]">加载中...</section>;
  }

  if (error || !item) {
    return (
      <section className="mx-auto max-w-[1280px] space-y-4">
        <div className="rounded-2xl bg-red-50 px-5 py-4 text-sm text-red-700">{error || '导航不存在'}</div>
        <Button variant="ghost" onClick={() => navigate('/home-ops')}>返回顶部导航管理</Button>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-[1280px] space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="mt-3 text-[32px] font-semibold leading-tight tracking-tight text-[#2f2f2f]">{item.name}</h1>
          <p className="mt-2 text-sm text-[#8c8c8c]">查看顶部导航基础信息、关联内容、状态和配置入口。</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="ghost" className="h-11 rounded-xl border-[#e1d8ca] bg-[#fffdfc]" onClick={() => navigate('/home-ops')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> 返回列表
          </Button>
          <Button variant="ghost" className="h-11 rounded-xl border-[#e1d8ca] bg-[#fffdfc]" onClick={() => navigate(`/home-ops/top-nav/${item.id}/edit`)}>
            <Edit3 className="mr-2 h-4 w-4" /> 编辑
          </Button>
          <Button className="h-11 rounded-xl bg-[#7a8b6f] hover:bg-[#6f8065]" onClick={() => navigate(`/home-ops/top-nav/${item.id}/content`)}>
            <Layers3 className="mr-2 h-4 w-4" /> 配置内容
          </Button>
        </div>
      </div>

      <div className="rounded-3xl border border-[#e9e2d6] bg-[#fffdfc] p-6 shadow-[0_18px_48px_rgba(47,47,47,0.045)]">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm text-[#8c8c8c]">导航名称</div>
            <div className="mt-2 text-2xl font-semibold text-[#2f2f2f]">{item.name}</div>
            {item.description ? <div className="mt-3 text-sm text-[#8c8c8c]">{item.description}</div> : null}
          </div>
          <StatusTag label={statusLabelMap[item.status] ?? item.statusText ?? item.status} tone={item.status === 'online' ? 'green' : item.status === 'draft' ? 'orange' : 'gray'} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Field label="展示编号" value={item.code} />
        <Field label="导航类型" value={item.navTypeText ?? item.navType} />
        <Field label="关联内容" value={item.relationName} />
        <Field label="排序值" value={item.sortOrder} />
        <Field label="默认选中" value={item.isDefault ? '是' : '否'} />
        <Field label="固定显示" value={item.isFixed ? '是' : '否'} />
        <Field label="更多入口" value={item.showMoreEntry ? '显示' : '不显示'} />
        <Field label="更新时间" value={safeDate(item.updatedAt)} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-3xl border border-[#e9e2d6] bg-[#fffdfc] p-6">
          <h2 className="text-xl font-semibold text-[#2f2f2f]">关联内容</h2>
          <div className="mt-4 space-y-3 text-sm text-[#5f5f5f]">
            {item.relations.length ? item.relations.map((relation) => (
              <div key={`${relation.relationType}-${relation.relationId}`} className="rounded-2xl bg-[#f5f1ea] px-4 py-3">
                {relation.relationName || relation.relationId}
                <span className="ml-2 text-[#8c8c8c]">({relation.relationType})</span>
              </div>
            )) : <div className="text-[#8c8c8c]">暂未配置关联内容</div>}
          </div>
        </div>

        <div className="rounded-3xl border border-[#e9e2d6] bg-[#fffdfc] p-6">
          <h2 className="text-xl font-semibold text-[#2f2f2f]">内容规则</h2>
          <div className="mt-4 grid grid-cols-1 gap-3 text-sm">
            <Field label="内容来源" value={item.contentRule?.sourceType} />
            <Field label="展示数量" value={item.contentRule?.displayCount} />
            <Field label="排序规则" value={item.contentRule?.sortRule} />
            <Field label="更多按钮" value={item.contentRule?.moreButtonText} />
          </div>
        </div>
      </div>
    </section>
  );
};
