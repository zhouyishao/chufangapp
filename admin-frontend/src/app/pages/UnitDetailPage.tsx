import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '../components/Button';
import { ConfirmModal } from '../components/ConfirmModal';
import { StatusTag } from '../components/StatusTag';

type UnitType = '重量' | '容量' | '数量' | '包装' | '口语';
type UnitStatus = '启用' | '禁用';

type UnitRow = {
  id: string;
  name: string;
  code: string;
  type: UnitType;
  baseUnit: string;
  ratio: string;
  target: string;
  isDefault: boolean;
  status: UnitStatus;
  updatedAt: string;
};

const mockUnits: UnitRow[] = [
  { id: '1', name: '克（g）', code: 'g', type: '重量', baseUnit: '克（g）', ratio: '1', target: '食材、菜谱、采购', isDefault: true, status: '启用', updatedAt: '2025-05-24 14:31:22' },
  { id: '2', name: '千克（kg）', code: 'kg', type: '重量', baseUnit: '克（g）', ratio: '1000', target: '食材、菜谱、采购', isDefault: false, status: '启用', updatedAt: '2025-05-24 14:30:11' },
  { id: '3', name: '斤（jin）', code: 'jin', type: '重量', baseUnit: '克（g）', ratio: '500', target: '食材、菜谱、采购', isDefault: false, status: '启用', updatedAt: '2025-05-24 14:29:45' },
  { id: '4', name: '毫升（ml）', code: 'ml', type: '容量', baseUnit: '毫升（ml）', ratio: '1', target: '食材、菜谱、采购', isDefault: true, status: '启用', updatedAt: '2025-05-24 14:28:59' },
  { id: '5', name: '升（L）', code: 'L', type: '容量', baseUnit: '毫升（ml）', ratio: '1000', target: '食材、菜谱、采购', isDefault: false, status: '启用', updatedAt: '2025-05-24 14:27:33' },
  { id: '6', name: '个', code: 'ge', type: '数量', baseUnit: '个', ratio: '1', target: '食材、菜谱、采购', isDefault: true, status: '启用', updatedAt: '2025-05-24 14:26:18' },
  { id: '7', name: '颗', code: 'ke', type: '数量', baseUnit: '个', ratio: '1', target: '食材、菜谱、采购', isDefault: false, status: '启用', updatedAt: '2025-05-24 14:25:02' },
  { id: '8', name: '根', code: 'gen', type: '数量', baseUnit: '个', ratio: '1', target: '食材、菜谱、采购', isDefault: false, status: '启用', updatedAt: '2025-05-24 14:24:11' },
  { id: '9', name: '瓶', code: 'ping', type: '包装', baseUnit: '个', ratio: '1', target: '食材、菜谱、采购', isDefault: false, status: '启用', updatedAt: '2025-05-24 14:23:30' },
  { id: '10', name: '袋', code: 'dai', type: '包装', baseUnit: '个', ratio: '1', target: '食材、菜谱、采购', isDefault: false, status: '启用', updatedAt: '2025-05-24 14:22:52' },
  { id: '11', name: '勺', code: 'shao', type: '口语', baseUnit: '毫升（ml）', ratio: '15', target: '菜谱', isDefault: false, status: '启用', updatedAt: '2025-05-24 14:22:10' },
  { id: '12', name: '适量', code: 'shiliang', type: '口语', baseUnit: '-', ratio: '-', target: '菜谱', isDefault: false, status: '启用', updatedAt: '2025-05-24 14:21:05' }
];

export const UnitDetailPage = () => {
  const navigate = useNavigate();
  const params = useParams();
  const id = params.id ?? '';

  const [item, setItem] = useState<UnitRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setLoading(true);
    const found = mockUnits.find((u) => u.id === id);
    if (found) {
      setItem(found);
      setError(null);
    } else {
      setError('未找到该单位');
    }
    setLoading(false);
  }, [id]);

  const handleToggleStatus = () => {
    if (!item) return;
    const nextStatus = item.status === '启用' ? '禁用' : '启用';
    setItem({ ...item, status: nextStatus });
  };

  const handleDelete = () => {
    setConfirmDelete(false);
    navigate('/taxonomies/units', { replace: true });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#2f2f2f]">单位详情</h1>
          <p className="mt-1 text-sm text-[#8c8c8c]">查看计量单位换算、默认属性及应用场景。</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate('/taxonomies/units')}>
            返回列表
          </Button>
          {item && (
            <>
              <Button onClick={() => navigate(`/taxonomies/units/${item.id}/edit`)} className="bg-[#7a8b6f] hover:bg-[#68775f]">
                编辑单位
              </Button>
              <Button onClick={() => void handleToggleStatus()} className={item.status === '启用' ? 'bg-[#c27b48] hover:bg-[#a5673a]' : 'bg-[#2f6f2f] hover:bg-[#235623]'}>
                {item.status === '启用' ? '禁用' : '启用'}
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
              <div className="text-xs text-[#8c8c8c]">单位名称</div>
              <div className="mt-1.5 text-base font-semibold text-[#2f2f2f]">{item.name}</div>
            </div>
            <div>
              <div className="text-xs text-[#8c8c8c]">单位符号 / 编码</div>
              <div className="mt-1.5 text-base font-medium text-[#2f2f2f]">{item.code}</div>
            </div>
            <div>
              <div className="text-xs text-[#8c8c8c]">单位类型</div>
              <div className="mt-1.5 text-base font-medium text-[#2f2f2f]">{item.type}</div>
            </div>
            <div>
              <div className="text-xs text-[#8c8c8c]">基准换算关系</div>
              <div className="mt-1.5 text-base font-medium text-[#2f2f2f]">
                1 {item.name} = {item.ratio} {item.baseUnit}
              </div>
            </div>
            <div>
              <div className="text-xs text-[#8c8c8c]">是否默认单位</div>
              <div className="mt-1.5">
                <span className={`inline-flex rounded-md border px-2.5 py-0.5 text-xs ${item.isDefault ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : 'border-zinc-200 bg-zinc-50 text-zinc-600'}`}>
                  {item.isDefault ? '默认单位' : '非默认'}
                </span>
              </div>
            </div>
            <div>
              <div className="text-xs text-[#8c8c8c]">状态</div>
              <div className="mt-1.5">
                <StatusTag label={item.status === '启用' ? '启用' : '禁用'} tone={item.status === '启用' ? 'green' : 'orange'} />
              </div>
            </div>
            <div>
              <div className="text-xs text-[#8c8c8c]">排序</div>
              <div className="mt-1.5 text-base font-medium text-[#2f2f2f]">{item.id}</div>
            </div>
            <div>
              <div className="text-xs text-[#8c8c8c]">关联内容数量</div>
              <div className="mt-1.5 text-base font-medium text-[#2f2f2f]">
                {item.isDefault ? '348' : '45'} 个
              </div>
            </div>
            <div>
              <div className="text-xs text-[#8c8c8c]">创建时间</div>
              <div className="mt-1.5 text-base font-medium text-[#2f2f2f]">2025-05-20 10:12:33</div>
            </div>
            <div>
              <div className="text-xs text-[#8c8c8c]">更新时间</div>
              <div className="mt-1.5 text-base font-medium text-[#2f2f2f]">{item.updatedAt}</div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-[#8c8c8c] py-6 text-center">暂无数据。</div>
        )}
      </div>

      <ConfirmModal
        title="确认删除单位"
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        description={item ? `确定要删除单位「${item.name}」吗？删除后将无法恢复。` : null}
        confirmText="删除"
        danger
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
};
