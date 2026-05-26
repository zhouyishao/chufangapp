import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { getCategory } from '../api';
import type { IngredientCategory } from '../types';
import { Button } from '../components/Button';

export const CategoryDetailPage = () => {
  const navigate = useNavigate();
  const params = useParams();
  const id = Number.parseInt(params.id ?? '', 10);

  const [item, setItem] = useState<IngredientCategory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(id)) {
      setError('无效的 ID');
      return;
    }
    setLoading(true);
    setError(null);
    void getCategory(id)
      .then((data) => setItem(data))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : '加载失败'))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xl font-semibold">分类详情</div>
          <div className="mt-1 text-sm text-zinc-500">查看分类基础信息。</div>
        </div>
        <Button variant="ghost" onClick={() => navigate(-1)}>
          返回
        </Button>
      </div>

      {error ? <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

      <div className="rounded-2xl border border-zinc-100 bg-white p-5">
        {loading ? (
          <div className="text-sm text-zinc-500">加载中...</div>
        ) : item ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <div className="text-xs text-zinc-500">ID</div>
              <div className="mt-1 text-sm">{item.id}</div>
            </div>
            <div>
              <div className="text-xs text-zinc-500">类型</div>
              <div className="mt-1 text-sm">{item.type}</div>
            </div>
            <div>
              <div className="text-xs text-zinc-500">名称</div>
              <div className="mt-1 text-sm">{item.name}</div>
            </div>
            <div>
              <div className="text-xs text-zinc-500">状态</div>
              <div className="mt-1 text-sm">{item.status}</div>
            </div>
            <div>
              <div className="text-xs text-zinc-500">展示</div>
              <div className="mt-1 text-sm">{item.isPublish ? '展示' : '隐藏'}</div>
            </div>
            <div>
              <div className="text-xs text-zinc-500">排序</div>
              <div className="mt-1 text-sm">{item.sort}</div>
            </div>
            <div>
              <div className="text-xs text-zinc-500">创建时间</div>
              <div className="mt-1 text-sm">{new Date(item.createdAt).toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs text-zinc-500">更新时间</div>
              <div className="mt-1 text-sm">{new Date(item.updatedAt).toLocaleString()}</div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-zinc-500">暂无数据。</div>
        )}
      </div>
    </div>
  );
};

