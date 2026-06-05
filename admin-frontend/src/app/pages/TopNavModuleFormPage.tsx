import { ArrowLeft, Plus, RefreshCw } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { getHomeTopNav, type HomeTopNav } from '../api';
import { Button } from '../components/Button';
import { loadTopNavContentConfig, saveModuleItem, type ModuleItem } from './topNavContentStore';

type ModuleStatus = 'draft' | 'online';

const fieldInput = 'h-10 w-full rounded-lg border border-[#d9d2c6] bg-[#fffdfc] px-3 text-sm text-[#2f2f2f] outline-none transition focus:border-[#7a8b6f]';
const fieldLabel = 'text-sm font-medium text-[#4f4f4f]';

const moduleTypeOptions = [
  { value: 'recipe_list', label: '菜谱列表模块', desc: '展示推荐内容，支持列表、横滑和卡片样式' },
  { value: 'seasonal', label: '时令模块', desc: '展示当季食材、水果和节气相关内容' },
  { value: 'category', label: '分类模块', desc: '展示分类导航或分类内容聚合' },
  { value: 'custom', label: '自定义模块', desc: '自定义配置模块标题、内容和跳转' }
];

const contentTypeOptions = ['菜谱', '食材', '水果', '酒水饮品', '调料', '专题'];
const displayStyleOptions = [
  { value: 'list', label: '列表样式', desc: '图文列表' },
  { value: 'horizontal', label: '横向滑动', desc: '横向卡片滑动' },
  { value: 'large_card', label: '大图样式', desc: '大图 + 标题' },
  { value: 'grid', label: '宫格样式', desc: '网格卡片' },
  { value: 'custom', label: '自定义样式', desc: '自定义配置' }
];

export const TopNavModuleFormPage = () => {
  const { id, moduleId } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(moduleId);
  const [nav, setNav] = useState<HomeTopNav | null>(null);
  const [moduleName, setModuleName] = useState('');
  const [moduleType, setModuleType] = useState('recipe_list');
  const [contentType, setContentType] = useState('');
  const [status, setStatus] = useState<ModuleStatus>('draft');
  const [sortOrder, setSortOrder] = useState('0');
  const [selectMode, setSelectMode] = useState('manual');
  const [contentSource, setContentSource] = useState('');
  const [displayStyle, setDisplayStyle] = useState('list');
  const [displayCount, setDisplayCount] = useState('10');
  const [showMore, setShowMore] = useState(true);
  const [jumpLink, setJumpLink] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    void getHomeTopNav(id)
      .then((item) => {
        setNav(item);
        const existing = moduleId ? loadTopNavContentConfig(id, item).modules.find((row) => row.id === moduleId) : null;
        if (existing) {
          const matchedType = moduleTypeOptions.find((option) => option.label === existing.type);
          setModuleName(existing.name);
          setModuleType(matchedType?.value ?? 'recipe_list');
          setContentType(existing.type.includes('食材') ? '食材' : existing.type.includes('专题') ? '专题' : '菜谱');
          setContentSource(existing.source);
          setDisplayCount(String(existing.count));
          setSortOrder(String(existing.sort));
          setStatus(existing.status === 'offline' ? 'draft' : existing.status);
          return;
        }
        setModuleName(`${item.name}菜单`);
        setContentType(item.navType === 'system_recommend' ? '菜谱' : '菜谱');
        setContentSource(item.relations?.[0]?.relationName ?? '');
      })
      .catch((err) => setError(err instanceof Error ? err.message : '加载导航失败'));
  }, [id, moduleId]);

  const previewItems = useMemo(() => {
    const sourceName = contentSource || nav?.name || '推荐内容';
    return [
      { title: '番茄炒蛋', desc: `${sourceName} · 15分钟`, image: '🍅' },
      { title: '清炒时蔬', desc: '清淡爽口 · 10分钟', image: '🥬' },
      { title: '红烧肉', desc: '家常菜 · 60分钟', image: '🥘' }
    ];
  }, [contentSource, nav?.name]);

  const backToContentConfig = () => {
    navigate(`/home-ops/top-nav/${id ?? ''}/content`);
  };

  const save = (nextStatus: ModuleStatus) => {
    if (!id || !nav) return setError('导航信息尚未加载完成');
    const nextSortOrder = Number(sortOrder);
    const nextDisplayCount = Number(displayCount);
    if (!moduleName.trim()) return setError('请填写模块名称');
    if (!contentType) return setError('请选择内容类型');
    if (!Number.isFinite(nextSortOrder) || nextSortOrder < 0) return setError('排序必须是大于等于 0 的数字');
    if (!Number.isFinite(nextDisplayCount) || nextDisplayCount <= 0) return setError('展示数量必须是大于 0 的数字');
    const current = loadTopNavContentConfig(id, nav);
    const selectedType = moduleTypeOptions.find((item) => item.value === moduleType);
    const nextItem: ModuleItem = {
      id: moduleId ?? `module_${Date.now()}`,
      name: moduleName.trim(),
      type: selectedType?.label ?? '菜谱列表模块',
      source: contentSource || '手动选择',
      count: nextDisplayCount,
      sort: nextSortOrder > 0 ? nextSortOrder : current.modules.length + 1,
      status: nextStatus
    };
    saveModuleItem(id, nav, nextItem);
    setError(null);
    setStatus(nextStatus);
    setNotice(nextStatus === 'online' ? '模块已保存并启用' : '模块草稿已保存');
    window.setTimeout(backToContentConfig, 500);
  };

  return (
    <section className="mx-auto max-w-[1540px] space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="mt-3 text-3xl font-bold text-[#2f2f2f]">{isEdit ? '编辑模块' : '新增模块'}</h1>
          <p className="mt-2 text-sm text-[#6f6f6f]">配置首页要展示的模块内容、样式和展示规则。</p>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={backToContentConfig}>取消</Button>
          <Button variant="ghost" onClick={() => save('draft')}>保存草稿</Button>
          <Button onClick={() => save('online')}>保存并启用</Button>
        </div>
      </div>

      {error && <div className="rounded-2xl bg-red-50 px-5 py-3 text-sm text-red-600">{error}</div>}
      {notice && <div className="rounded-2xl bg-[#edf5e9] px-5 py-3 text-sm text-[#5f7f57]">{notice}</div>}

      <div className="grid grid-cols-1 gap-5 2xl:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          <div className="rounded-2xl border border-[#e4dccf] bg-[#fffdfc] p-5">
            <h2 className="mb-5 flex items-center gap-3 text-xl font-semibold text-[#2f2f2f]">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#7a8b6f] text-sm text-white">1</span>
              基础信息
            </h2>
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_320px]">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className={fieldLabel}>模块名称 *</span>
                  <input className={fieldInput} value={moduleName} maxLength={20} onChange={(event) => setModuleName(event.target.value)} placeholder="请输入模块名称" />
                </label>
                <label className="space-y-2">
                  <span className={fieldLabel}>模块类型 *</span>
                  <select className={fieldInput} value={moduleType} onChange={(event) => setModuleType(event.target.value)}>
                    {moduleTypeOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </select>
                </label>
                <label className="space-y-2">
                  <span className={fieldLabel}>内容类型 *</span>
                  <select className={fieldInput} value={contentType} onChange={(event) => setContentType(event.target.value)}>
                    <option value="">请选择内容类型</option>
                    {contentTypeOptions.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </label>
                <label className="space-y-2">
                  <span className={fieldLabel}>排序 *</span>
                  <input className={fieldInput} value={sortOrder} type="number" min={0} onChange={(event) => setSortOrder(event.target.value)} />
                </label>
                <div className="space-y-2">
                  <span className={fieldLabel}>状态</span>
                  <div className="flex h-10 overflow-hidden rounded-lg border border-[#e4dccf] bg-[#f5f1ea]">
                    <button type="button" className={`flex-1 text-sm ${status === 'online' ? 'bg-[#7a8b6f] text-white' : 'text-[#6f6f6f]'}`} onClick={() => setStatus('online')}>启用</button>
                    <button type="button" className={`flex-1 text-sm ${status === 'draft' ? 'bg-[#fffdfc] text-[#2f2f2f]' : 'text-[#6f6f6f]'}`} onClick={() => setStatus('draft')}>草稿</button>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-[#e4dccf] bg-[#fffdfc] p-4">
                <p className="mb-3 text-sm font-semibold text-[#2f2f2f]">模块类型说明</p>
                <div className="space-y-2">
                  {moduleTypeOptions.map((item) => (
                    <div key={item.value} className={`rounded-lg px-3 py-2 text-sm ${moduleType === item.value ? 'bg-[#edf5e9] text-[#5f7f57]' : 'bg-[#f5f1ea] text-[#8c8c8c]'}`}>
                      <span className="font-medium">{item.label}</span>
                      <span className="ml-3">{item.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#e4dccf] bg-[#fffdfc] p-5">
            <h2 className="mb-5 flex items-center gap-3 text-xl font-semibold text-[#2f2f2f]">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#7a8b6f] text-sm text-white">2</span>
              内容配置
            </h2>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-6 text-sm text-[#4f4f4f]">
                {['manual', 'condition', 'custom'].map((item) => (
                  <label key={item} className="inline-flex items-center gap-2">
                    <input type="radio" checked={selectMode === item} onChange={() => setSelectMode(item)} />
                    {item === 'manual' ? '手动选择' : item === 'condition' ? '按条件筛选' : '自定义配置'}
                  </label>
                ))}
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto]">
                <select className={fieldInput} value={contentSource} onChange={(event) => setContentSource(event.target.value)}>
                  <option value="">请选择内容来源</option>
                  <option value="推荐内容池">推荐内容池</option>
                  <option value="家常菜分类">家常菜分类</option>
                  <option value="当季食材">当季食材</option>
                  <option value="专题列表">专题列表</option>
                </select>
                <Button variant="ghost"><Plus className="h-4 w-4" />选择内容</Button>
              </div>
              <div className="rounded-xl border border-dashed border-[#d9d2c6] bg-[#f5f1ea] p-8 text-center text-sm text-[#8c8c8c]">
                <p className="font-medium text-[#6f6f6f]">已选择 0 项内容</p>
                <p className="mt-2">点击「选择内容」按钮添加，后续接内容选择弹窗。</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#e4dccf] bg-[#fffdfc] p-5">
            <h2 className="mb-5 flex items-center gap-3 text-xl font-semibold text-[#2f2f2f]">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#7a8b6f] text-sm text-white">3</span>
              展示配置
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-5 md:col-span-2">
                {displayStyleOptions.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    className={`rounded-xl border p-3 text-left text-sm transition ${displayStyle === item.value ? 'border-[#7a8b6f] bg-[#edf5e9] text-[#2f2f2f]' : 'border-[#e4dccf] bg-[#fffdfc] text-[#6f6f6f]'}`}
                    onClick={() => setDisplayStyle(item.value)}
                  >
                    <p className="font-semibold">{item.label}</p>
                    <p className="mt-1 text-xs text-[#8c8c8c]">{item.desc}</p>
                  </button>
                ))}
              </div>
              <label className="space-y-2">
                <span className={fieldLabel}>展示数量 *</span>
                <input className={fieldInput} value={displayCount} type="number" min={1} onChange={(event) => setDisplayCount(event.target.value)} />
              </label>
              <label className="space-y-2">
                <span className={fieldLabel}>跳转链接</span>
                <select className={fieldInput} value={jumpLink} onChange={(event) => setJumpLink(event.target.value)}>
                  <option value="">请选择跳转链接</option>
                  <option value="nav_content_list">进入导航列表页</option>
                  <option value="category_list">进入分类列表页</option>
                  <option value="topic_page">进入专题页</option>
                </select>
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-[#4f4f4f]">
                <input type="checkbox" checked={showMore} onChange={(event) => setShowMore(event.target.checked)} />
                显示「更多」入口
              </label>
            </div>
          </div>
        </div>

        <aside className="rounded-2xl border border-[#e4dccf] bg-[#fffdfc] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#2f2f2f]">效果预览</h2>
            <button type="button" className="inline-flex items-center gap-1 text-sm text-[#5f7f57]">
              <RefreshCw className="h-4 w-4" />刷新预览
            </button>
          </div>
          <div className="mx-auto w-[300px] rounded-[36px] border-[8px] border-[#1f1f1f] bg-[#f5f1ea] p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between text-sm font-semibold text-[#2f2f2f]">
              <span>9:41</span>
              <span>•••</span>
            </div>
            <div className="rounded-full bg-[#fffdfc] px-4 py-3 text-sm text-[#8c8c8c]">搜索菜谱、食材</div>
            <div className="mt-4 flex gap-5 text-sm text-[#6f6f6f]">
              <span>推荐</span>
              <span className="font-semibold text-[#5f7f57] underline decoration-[#7a8b6f] decoration-2 underline-offset-8">{nav?.name ?? '家常菜'}</span>
              <span>快手菜</span>
            </div>
            <div className="mt-5 rounded-xl bg-[#fffdfc] p-3">
              <div className="mb-3 flex items-center justify-between">
                <p className="font-semibold text-[#2f2f2f]">{moduleName || '模块标题'}</p>
                {showMore && <span className="text-xs text-[#7a8b6f]">更多</span>}
              </div>
              <div className="space-y-3">
                {previewItems.map((item) => (
                  <div key={item.title} className="flex gap-3 rounded-lg bg-[#f5f1ea] p-2">
                    <div className="flex h-14 w-16 items-center justify-center rounded-lg bg-[#e9e2d6] text-2xl">{item.image}</div>
                    <div>
                      <p className="text-sm font-semibold text-[#2f2f2f]">{item.title}</p>
                      <p className="mt-1 text-xs text-[#8c8c8c]">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <Button variant="ghost" className="mt-4 w-full" onClick={backToContentConfig}>
              <ArrowLeft className="h-4 w-4" />返回配置
            </Button>
          </div>
          <p className="mt-4 text-center text-xs text-[#8c8c8c]">预览仅展示模块效果，实际上线以后端配置为准。</p>
        </aside>
      </div>
    </section>
  );
};
