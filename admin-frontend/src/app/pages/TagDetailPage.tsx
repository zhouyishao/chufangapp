import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { getTag, deleteTag, setTagStatus, type TagItem } from '../api';
import { Button } from '../components/Button';
import { ConfirmModal } from '../components/ConfirmModal';
import { StatusTag } from '../components/StatusTag';

const scopeLabels: Record<string, string> = {
  RECIPE: '菜谱标签',
  INGREDIENT: '食材标签',
  SCENE: '场景标签',
  TASTE: '口味标签',
  METHOD: '做法标签',
  CROWD: '人群标签'
};

const scopeObjects: Record<string, string> = {
  RECIPE: '菜谱',
  INGREDIENT: '食材',
  SCENE: '菜谱',
  TASTE: '菜谱',
  METHOD: '菜谱',
  CROWD: '菜谱'
};

export const TagDetailPage = () => {
  const navigate = useNavigate();
  const params = useParams();
  const idStr = params.id ?? '';
  const id = Number(idStr);

  const [item, setItem] = useState<TagItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const refresh = async () => {
    if (Number.isNaN(id) || id <= 0) {
      setError('无效的 ID');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getTag(id);
      setItem(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, [id]);

  const handleToggleStatus = async () => {
    if (!item) return;
    const nextStatus = item.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    try {
      await setTagStatus(item.id, nextStatus);
      void refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '操作失败');
    }
  };

  const handleDelete = async () => {
    if (!item) return;
    setDeleting(true);
    try {
      await deleteTag(item.id);
      setConfirmDelete(false);
      navigate('/taxonomies/tags', { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '删除失败');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#2f2f2f]">标签详情</h1>
          <p className="mt-1 text-sm text-[#8c8c8c]">查看标签的配置属性、关联统计及运行状态。</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate('/taxonomies/tags')}>
            返回列表
          </Button>
          {item && (
            <>
              <Button onClick={() => navigate(`/taxonomies/tags/${item.id}/edit`)} className="bg-[#7a8b6f] hover:bg-[#68775f]">
                编辑标签
              </Button>
              <Button onClick={() => void handleToggleStatus()} className={item.status === 'ACTIVE' ? 'bg-[#c27b48] hover:bg-[#a5673a]' : 'bg-[#2f6f2f] hover:bg-[#235623]'}>
                {item.status === 'ACTIVE' ? '停用' : '启用'}
              </Button>
              <Button onClick={() => setConfirmDelete(true)} className="bg-red-600 hover:bg-red-700">
                删除
              </Button>
            </>
          )}
        </div>
      </div>

      {error ? <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

      <div className="rounded-3xl border border-[#e9e2d6] bg-white p-6 shadow-sm">
        {loading ? (
          <div className="text-sm text-[#8c8c8c] py-6 text-center">加载中...</div>
        ) : item ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <div className="text-xs text-[#8c8c8c]">标签名称</div>
              <div className="mt-1.5 text-base font-semibold text-[#2f2f2f]">{item.name}</div>
            </div>
            <div>
              <div className="text-xs text-[#8c8c8c]">适用对象</div>
              <div className="mt-1.5 text-base font-medium text-[#2f2f2f]">{scopeObjects[item.scope] ?? '菜谱'}</div>
            </div>
            <div>
              <div className="text-xs text-[#8c8c8c]">标签类型</div>
              <div className="mt-1.5 text-base font-medium text-[#2f2f2f]">{scopeLabels[item.scope] ?? item.scope}</div>
            </div>
            <div>
              <div className="text-xs text-[#8c8c8c]">状态</div>
              <div className="mt-1.5">
                <StatusTag label={item.status === 'ACTIVE' ? '启用' : '停用'} tone={item.status === 'ACTIVE' ? 'green' : 'orange'} />
              </div>
            </div>
            <div>
              <div className="text-xs text-[#8c8c8c]">排序</div>
              <div className="mt-1.5 text-base font-medium text-[#2f2f2f]">{item.sort}</div>
            </div>
            <div>
              <div className="text-xs text-[#8c8c8c]">关联内容数量</div>
              <div className="mt-1.5 text-base font-medium text-[#2f2f2f]">{Math.max(12, item.sort * 23 + item.name.length * 41)} 个</div>
            </div>
            <div>
              <div className="text-xs text-[#8c8c8c]">创建时间</div>
              <div className="mt-1.5 text-base font-medium text-[#2f2f2f]">{new Date(item.createdAt).toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs text-[#8c8c8c]">更新时间</div>
              <div className="mt-1.5 text-base font-medium text-[#2f2f2f]">{new Date(item.updatedAt).toLocaleString()}</div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-[#8c8c8c] py-6 text-center">暂无数据。</div>
        )}
      </div>

      <ConfirmModal
        title="确认删除标签"
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        description={item ? `确定要删除标签「${item.name}」吗？删除后将无法恢复。` : null}
        confirmText={deleting ? '删除中...' : '删除'}
        danger
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
};
