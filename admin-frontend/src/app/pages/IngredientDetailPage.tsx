import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { getIngredient } from '../api';
import type { Ingredient } from '../types';
import { Button } from '../components/Button';
import { ImagePreview } from '../components/ImagePreview';

export const IngredientDetailPage = () => {
  const navigate = useNavigate();
  const params = useParams();
  const id = params.id ?? '';

  const [item, setItem] = useState<Ingredient | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError('无效的 ID');
      return;
    }
    setLoading(true);
    setError(null);
    void getIngredient(id)
      .then((data) => setItem(data))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : '加载失败'))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xl font-semibold">食材详情</div>
          <div className="mt-1 text-sm text-zinc-500">查看食材基础信息。</div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            返回
          </Button>
          <Button onClick={() => navigate(`/content/ingredients/${id}/edit`)}>编辑</Button>
        </div>
      </div>

      {error ? <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

      <div className="rounded-2xl border border-zinc-100 bg-white p-5">
        {loading ? (
          <div className="text-sm text-zinc-500">加载中...</div>
        ) : item ? (
          <div className="space-y-4">
            <ImagePreview src={item.cover} alt={item.name} className="h-56 w-full rounded-3xl" />
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <div className="text-xs text-zinc-500">ID</div>
                <div className="mt-1 text-sm">{item.id}</div>
              </div>
              <div>
                <div className="text-xs text-zinc-500">分类</div>
                <div className="mt-1 text-sm">{item.category?.name ?? '-'}</div>
              </div>
              <div>
                <div className="text-xs text-zinc-500">名称</div>
                <div className="mt-1 text-sm">{item.name}</div>
              </div>
              <div>
                <div className="text-xs text-zinc-500">时令月份</div>
                <div className="mt-1 text-sm">{item.seasonMonth ?? '-'}</div>
              </div>
              <div>
                <div className="text-xs text-zinc-500">状态</div>
                <div className="mt-1 text-sm">{item.status}</div>
              </div>
              <div>
                <div className="text-xs text-zinc-500">展示 / 推荐</div>
                <div className="mt-1 text-sm">
                  {item.isPublish ? '展示' : '隐藏'} · {item.isRecommend ? '推荐' : '未推荐'}
                </div>
              </div>
              <div>
                <div className="text-xs text-zinc-500">当前价格</div>
                <div className="mt-1 text-sm">
                  {item.currentPrice ?? '-'} {item.priceUnit ?? ''}
                </div>
              </div>
              <div>
                <div className="text-xs text-zinc-500">价格来源</div>
                <div className="mt-1 text-sm">{item.priceSource ?? '-'}</div>
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

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-zinc-100 p-4">
                <div className="text-sm font-medium">营养</div>
                <div className="mt-2 whitespace-pre-wrap text-sm text-zinc-600">{item.nutrition ?? '-'}</div>
              </div>
              <div className="rounded-xl border border-zinc-100 p-4">
                <div className="text-sm font-medium">挑选技巧</div>
                <div className="mt-2 whitespace-pre-wrap text-sm text-zinc-600">{item.selectionTips ?? '-'}</div>
              </div>
              <div className="rounded-xl border border-zinc-100 p-4">
                <div className="text-sm font-medium">保存方法</div>
                <div className="mt-2 whitespace-pre-wrap text-sm text-zinc-600">{item.storageMethod ?? '-'}</div>
              </div>
              <div className="rounded-xl border border-zinc-100 p-4">
                <div className="text-sm font-medium">禁忌</div>
                <div className="mt-2 whitespace-pre-wrap text-sm text-zinc-600">{item.taboo ?? '-'}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-zinc-500">暂无数据。</div>
        )}
      </div>
    </div>
  );
};
