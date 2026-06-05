import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { getRecipe } from '../api';
import type { Recipe } from '../types';
import { Button } from '../components/Button';
import { ImagePreview } from '../components/ImagePreview';

export const RecipeDetailPage = () => {
  const navigate = useNavigate();
  const params = useParams();
  const id = params.id ?? '';

  const [item, setItem] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError('无效的 ID');
      return;
    }
    setLoading(true);
    setError(null);
    void getRecipe(id)
      .then((data) => setItem(data))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : '加载失败'))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xl font-semibold">菜谱详情</div>
          <div className="mt-1 text-sm text-zinc-500">查看菜谱信息、食材清单与步骤。</div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            返回
          </Button>
          <Button onClick={() => navigate(`/content/recipes/${id}/edit`)}>编辑</Button>
        </div>
      </div>

      {error ? <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

      <div className="rounded-2xl border border-zinc-100 bg-white p-5">
        {loading ? (
          <div className="text-sm text-zinc-500">加载中...</div>
        ) : item ? (
          <div className="space-y-5">
            <ImagePreview src={item.cover} alt={item.title} className="h-64 w-full rounded-3xl" />
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <div className="text-xs text-zinc-500">ID</div>
                <div className="mt-1 text-sm">{item.id}</div>
              </div>
              <div>
                <div className="text-xs text-zinc-500">分类</div>
                <div className="mt-1 text-sm">{item.category?.name ?? '-'}</div>
              </div>
              <div className="md:col-span-2">
                <div className="text-xs text-zinc-500">标题</div>
                <div className="mt-1 text-sm font-medium">{item.title}</div>
                {item.subtitle ? <div className="mt-1 text-sm text-zinc-600">{item.subtitle}</div> : null}
              </div>
              <div>
                <div className="text-xs text-zinc-500">发布 / 推荐</div>
                <div className="mt-1 text-sm">
                  {item.isPublish ? '已发布' : '未发布'} · {item.isRecommend ? '已推荐' : '未推荐'}
                </div>
              </div>
              <div>
                <div className="text-xs text-zinc-500">审核状态</div>
                <div className="mt-1 text-sm">{item.auditStatus}</div>
              </div>
              <div>
                <div className="text-xs text-zinc-500">时间 / 份量</div>
                <div className="mt-1 text-sm">
                  {item.cookTime ?? '-'} 分钟 · {item.servings ?? '-'} 人份
                </div>
              </div>
              <div>
                <div className="text-xs text-zinc-500">浏览 / 收藏 / 评论</div>
                <div className="mt-1 text-sm">
                  {item.viewCount} / {item.favoriteCount} / {item.commentCount}
                </div>
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

            <div className="rounded-xl border border-zinc-100 p-4">
              <div className="text-sm font-medium">简介</div>
              <div className="mt-2 whitespace-pre-wrap text-sm text-zinc-600">{item.description ?? '-'}</div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-zinc-100 p-4">
                <div className="text-sm font-medium">食材清单</div>
                <div className="mt-2 space-y-1 text-sm text-zinc-700">
                  {(item.ingredients ?? []).length ? (
                    (item.ingredients ?? []).map((ing) => (
                      <div key={ing.id} className="flex items-center justify-between gap-3">
                        <div className="truncate">{ing.name}</div>
                        <div className="shrink-0 text-zinc-500">{ing.amount ?? ''}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-zinc-500">暂无</div>
                  )}
                </div>
              </div>
              <div className="rounded-xl border border-zinc-100 p-4">
                <div className="text-sm font-medium">步骤</div>
                <div className="mt-2 space-y-2 text-sm text-zinc-700">
                  {(item.steps ?? []).length ? (
                    (item.steps ?? []).map((s) => (
                      <div key={s.id} className="flex gap-3">
                        <div className="mt-0.5 w-6 shrink-0 rounded-md bg-zinc-100 text-center text-xs leading-6 text-zinc-600">{s.sortIndex}</div>
                        {s.image ? <ImagePreview src={s.image} alt={`步骤 ${s.sortIndex}`} className="h-16 w-20 rounded-2xl" /> : null}
                        <div className="whitespace-pre-wrap text-sm text-zinc-700">{s.description}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-zinc-500">暂无</div>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-100 p-4">
              <div className="text-sm font-medium">Tips</div>
              <div className="mt-2 whitespace-pre-wrap text-sm text-zinc-600">{item.tips ?? '-'}</div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-zinc-500">暂无数据。</div>
        )}
      </div>
    </div>
  );
};
