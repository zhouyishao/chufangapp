import { ArrowLeft, RefreshCw } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  createContentModule,
  getContentModule,
  getHomeTopNav,
  listCategories,
  listContentSelector,
  listTags,
  updateContentModule,
  type ContentModuleContentSource,
  type ContentModuleContentType,
  type ContentModuleDisplayStyle,
  type ContentModuleItem,
  type ContentModulePayload,
  type ContentModuleStatus,
  type ContentSelectorItem,
  type HomeTopNav,
  type TagItem
} from '../api';
import { Button } from '../components/Button';

const plusIconUrl = new URL('../assets/icons/icon_plus.svg', import.meta.url).href;
const searchIconUrl = new URL('../assets/icons/icon_search.svg', import.meta.url).href;

const fieldInput = 'h-10 w-full rounded-lg border border-[#d9d2c6] bg-[#fffdfc] px-3 text-sm text-[#2f2f2f] outline-none transition focus:border-[#7a8b6f]';
const fieldLabel = 'text-sm font-medium text-[#4f4f4f]';
const sectionClass = 'rounded-2xl border border-[#e4ddd1] bg-[#fffdfc] p-5';

const displayStyleOptions: { value: ContentModuleDisplayStyle; label: string; desc: string; allowedTypes: ContentModuleContentType[] }[] = [
  { value: 'HORIZONTAL_RECIPE_CARD', label: '横向菜谱卡片', desc: '图片、标题、标签、时间、人数、难度、收藏', allowedTypes: ['RECIPE'] },
  { value: 'SEASONAL_INGREDIENT_CARD', label: '时令食材卡片', desc: '图片、名称、价格、单位', allowedTypes: ['INGREDIENT', 'FRUIT', 'SEASONING', 'BEVERAGE'] },
  { value: 'IMAGE_TEXT_LIST', label: '图文列表', desc: '左图右文、标题、简介、时间、人数、难度、收藏', allowedTypes: ['RECIPE'] },
  { value: 'TWO_COLUMN_RECIPE_GRID', label: '双列菜谱卡片', desc: '双列大卡片、图片、标题、简介、时间、人数、难度', allowedTypes: ['RECIPE'] }
];

const contentTypeOptions: { value: ContentModuleContentType; label: string }[] = [
  { value: 'RECIPE', label: '菜谱' },
  { value: 'INGREDIENT', label: '食材' },
  { value: 'FRUIT', label: '水果' },
  { value: 'SEASONING', label: '调料' },
  { value: 'BEVERAGE', label: '酒水' }
];

const contentSourceOptions: { value: ContentModuleContentSource; label: string }[] = [
  { value: 'MANUAL', label: '手动选择' },
  { value: 'CATEGORY', label: '按分类筛选' },
  { value: 'TAG', label: '按标签筛选' }
];

const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) => (
  <button
    type="button"
    className={['relative h-7 w-12 rounded-full transition', checked ? 'bg-[#7a8b6f]' : 'bg-[#ddd6cc]'].join(' ')}
    onClick={() => onChange(!checked)}
  >
    <span className={['absolute top-1 h-5 w-5 rounded-full bg-white shadow transition', checked ? 'left-6' : 'left-1'].join(' ')} />
  </button>
);

export const TopNavModuleFormPage = () => {
  const { id, moduleId } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(moduleId);

  const [nav, setNav] = useState<HomeTopNav | null>(null);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [displayStyle, setDisplayStyle] = useState<ContentModuleDisplayStyle>('HORIZONTAL_RECIPE_CARD');
  const [contentType, setContentType] = useState<ContentModuleContentType>('RECIPE');
  const [contentSource, setContentSource] = useState<ContentModuleContentSource>('MANUAL');
  const [displayCount, setDisplayCount] = useState('6');
  const [showMore, setShowMore] = useState(false);
  const [moreLink, setMoreLink] = useState('');
  const [sortOrder, setSortOrder] = useState('1');
  const [status, setStatus] = useState<ContentModuleStatus>('ENABLED');
  const [items, setItems] = useState<ContentModuleItem[]>([]);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [tagId, setTagId] = useState<number | null>(null);

  // Content selectors
  const [contentOptions, setContentOptions] = useState<ContentSelectorItem[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<{ id: number; name: string }[]>([]);
  const [tagOptions, setTagOptions] = useState<TagItem[]>([]);
  const [contentPage, setContentPage] = useState(1);
  const [contentTotal, setContentTotal] = useState(0);
  const [contentLoading, setContentLoading] = useState(false);
  const [contentError, setContentError] = useState<string | null>(null);

  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const selectedStyle = useMemo(() => displayStyleOptions.find(s => s.value === displayStyle) ?? displayStyleOptions[0], [displayStyle]);
  const allowedTypes = useMemo(() => selectedStyle.allowedTypes, [selectedStyle]);

  const loadNav = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const item = await getHomeTopNav(id);
      setNav(item);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载导航失败');
    } finally {
      setLoading(false);
    }
  };

  const loadModule = async () => {
    if (!id || !moduleId) return;
    try {
      const mod = await getContentModule(id, Number(moduleId));
      setTitle(mod.title);
      setSubtitle(mod.subtitle ?? '');
      setDisplayStyle(mod.displayStyle);
      setContentType(mod.contentType);
      setContentSource(mod.contentSource);
      setDisplayCount(String(mod.displayCount));
      setShowMore(mod.showMore);
      setMoreLink(mod.moreLink ?? '');
      setSortOrder(String(mod.sortOrder));
      setStatus(mod.status);
      setItems((mod.items as ContentModuleItem[]) ?? []);
      setCategoryId(mod.categoryId);
      setTagId(mod.tagId);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载模块失败');
    }
  };

  const loadContentOptions = async (page = 1) => {
    if (!['RECIPE', 'INGREDIENT', 'FRUIT', 'SEASONING', 'BEVERAGE'].includes(contentType)) return;
    setContentLoading(true);
    setContentError(null);
    try {
      const selectorTypeByContentType: Record<ContentModuleContentType, string> = {
        RECIPE: 'recipe',
        INGREDIENT: 'ingredient',
        FRUIT: 'fruit',
        SEASONING: 'seasoning',
        BEVERAGE: 'beverage'
      };
      const selectorType = selectorTypeByContentType[contentType];
      const result = await listContentSelector({ type: selectorType, page, pageSize: 50 });
      if (page === 1) {
        setContentOptions(result.list);
      } else {
        setContentOptions(prev => [...prev, ...result.list]);
      }
      setContentPage(page);
      setContentTotal(result.total);
    } catch (err) {
      if (page === 1) setContentOptions([]);
      setContentError(err instanceof Error ? err.message : '内容列表加载失败');
    } finally {
      setContentLoading(false);
    }
  };

  const loadCategoryOptions = async () => {
    try {
      const result = await listCategories({ page: 1, pageSize: 100, status: 'ACTIVE' });
      setCategoryOptions(result.list.map(c => ({ id: Number(c.id), name: c.name })));
    } catch {
      // silent
    }
  };

  const loadTagOptions = async () => {
    try {
      const result = await listTags({ page: 1, pageSize: 100, status: 'ACTIVE' });
      setTagOptions(result.list);
    } catch {
      // silent
    }
  };

  useEffect(() => {
    void loadNav();
  }, [id]);

  useEffect(() => {
    if (nav && moduleId) void loadModule();
  }, [nav, moduleId]);

  useEffect(() => {
    if (contentSource === 'MANUAL') void loadContentOptions(1);
    if (contentSource === 'CATEGORY') void loadCategoryOptions();
    if (contentSource === 'TAG') void loadTagOptions();
  }, [contentSource, contentType, nav]);

  // When display style changes, check contentType compatibility
  const handleDisplayStyleChange = (style: ContentModuleDisplayStyle) => {
    const styleOption = displayStyleOptions.find(s => s.value === style);
    if (styleOption && !styleOption.allowedTypes.includes(contentType)) {
      setContentType(styleOption.allowedTypes[0]);
      setItems([]);
      setNotice(`展示样式已切换，内容类型已自动调整为「${contentTypeOptions.find(c => c.value === styleOption.allowedTypes[0])?.label}」`);
    }
    setDisplayStyle(style);
  };

  const addManualItem = (item: ContentSelectorItem) => {
    if (items.some(i => i.id === item.id)) return;
    setItems(prev => [...prev, { id: item.id, type: item.type, sortOrder: prev.length }]);
  };

  const removeManualItem = (itemId: string) => {
    setItems(prev => prev.filter(i => i.id !== itemId).map((i, idx) => ({ ...i, sortOrder: idx })));
  };

  const moveItem = (itemId: string, direction: 'up' | 'down') => {
    setItems(prev => {
      const idx = prev.findIndex(i => i.id === itemId);
      if (idx < 0) return prev;
      const next = [...prev];
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= next.length) return prev;
      [next[idx], next[targetIdx]] = [next[targetIdx], next[idx]];
      return next.map((i, j) => ({ ...i, sortOrder: j }));
    });
  };

  const validate = (): string | null => {
    if (!title.trim()) return '请输入模块名称';
    if (title.trim().length > 80) return '模块名称不能超过80字';
    if (!displayStyle) return '请选择展示样式';
    if (!contentType) return '请选择内容类型';
    if (!contentSource) return '请选择内容来源';
    if (contentSource === 'MANUAL' && items.length === 0) return '手动选择模式下请至少选择一项内容';
    if (contentSource === 'CATEGORY' && !categoryId) return '请选择分类';
    if (contentSource === 'TAG' && !tagId) return '请选择标签';
    const sortNum = Number(sortOrder);
    if (!Number.isFinite(sortNum) || sortNum < 1) return '排序值必须为大于等于1的数字';
    const countNum = Number(displayCount);
    if (!Number.isFinite(countNum) || countNum < 1) return '展示数量必须为大于等于1的数字';
    return null;
  };

  const save = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    if (!id) return;
    setSaving(true);
    setError(null);
    try {
      const payload: ContentModulePayload = {
        title: title.trim(),
        subtitle: subtitle.trim() || null,
        displayStyle,
        contentType,
        contentSource,
        displayCount: Number(displayCount),
        showMore,
        moreLink: showMore ? (moreLink.trim() || null) : null,
        sortOrder: Number(sortOrder),
        status,
        items: contentSource === 'MANUAL' ? items : [],
        categoryId: contentSource === 'CATEGORY' ? categoryId : null,
        tagId: contentSource === 'TAG' ? tagId : null
      };
      if (isEdit && moduleId) {
        await updateContentModule(id, Number(moduleId), payload);
      } else {
        await createContentModule(id, payload);
      }
      setNotice(isEdit ? '模块已保存' : '模块已创建');
      window.setTimeout(backToConfig, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const backToConfig = () => {
    if (!id) return navigate('/home-ops');
    navigate(`/home-ops/top-nav/${id}/content`);
  };

  const loadMoreContentOptions = () => {
    if (contentOptions.length < contentTotal) {
      void loadContentOptions(contentPage + 1);
    }
  };

  if (loading) {
    return (
      <section className="rounded-3xl border border-[#e9e2d6] bg-[#fffdfc] p-8 text-sm text-[#8c8c8c]">
        加载中...
      </section>
    );
  }

  const navName = nav?.name ?? '当前导航';

  return (
    <section className="mx-auto max-w-[1540px] space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <button className="mb-4 inline-flex items-center text-sm text-[#5f5f5f] hover:text-[#2f2f2f]" onClick={backToConfig}>
            <ArrowLeft className="mr-2 h-4 w-4" /> 返回内容配置
          </button>
          <h1 className="text-[30px] font-semibold leading-tight tracking-tight text-[#2f2f2f]">
            {isEdit ? '编辑内容模块' : '新增内容模块'}
          </h1>
          <p className="mt-2 text-sm text-[#8c8c8c]">
            为「{navName}」导航{isEdit ? '维护' : '新增'}内容模块，配置展示样式、内容来源与排序。
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="ghost" className="h-11 min-w-[96px] rounded-lg border-[#d9d2c6] bg-[#fffdfc]" onClick={backToConfig}>取消</Button>
          <Button className="h-11 min-w-[140px] rounded-lg bg-[#5f7f56] hover:bg-[#526f4b]" disabled={saving} onClick={() => void save()}>
            {saving ? '保存中...' : '保存'}
          </Button>
        </div>
      </div>

      {notice ? <div className="rounded-2xl bg-[#eef3ea] px-5 py-4 text-sm text-[#5f7f56]">{notice}</div> : null}
      {error ? <div className="rounded-2xl bg-red-50 px-5 py-4 text-sm text-red-700">{error}</div> : null}

      <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          {/* Section 1: Basic Info */}
          <div className={sectionClass}>
            <h2 className="mb-5 flex items-center gap-3 text-xl font-semibold text-[#2f2f2f]">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#7a8b6f] text-sm text-white">1</span>
              基础信息
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <label>
                <span className={fieldLabel}>模块名称 <span className="text-red-500">*</span></span>
                <input className={`${fieldInput} mt-2`} value={title} maxLength={80} placeholder="C端直接展示的模块标题" onChange={(e) => setTitle(e.target.value)} />
              </label>
              <label>
                <span className={fieldLabel}>模块副标题</span>
                <input className={`${fieldInput} mt-2`} value={subtitle} maxLength={160} placeholder="选填，C端展示" onChange={(e) => setSubtitle(e.target.value)} />
              </label>
              <label>
                <span className={fieldLabel}>所属导航</span>
                <input className={`${fieldInput} mt-2 bg-[#f5f1ea]`} value={navName} readOnly />
              </label>
              <label>
                <span className={fieldLabel}>排序 <span className="text-red-500">*</span></span>
                <input className={`${fieldInput} mt-2`} type="number" min={1} value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
              </label>
              <label>
                <span className={fieldLabel}>状态 <span className="text-red-500">*</span></span>
                <select className={`${fieldInput} mt-2`} value={status} onChange={(e) => setStatus(e.target.value as ContentModuleStatus)}>
                  <option value="ENABLED">启用</option>
                  <option value="DISABLED">停用</option>
                </select>
              </label>
            </div>
          </div>

          {/* Section 2: Display Style */}
          <div className={sectionClass}>
            <h2 className="mb-5 flex items-center gap-3 text-xl font-semibold text-[#2f2f2f]">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#7a8b6f] text-sm text-white">2</span>
              展示样式
            </h2>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {displayStyleOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`rounded-xl border p-4 text-left text-sm transition ${
                    displayStyle === option.value
                      ? 'border-[#7a8b6f] bg-[#eef3ea] text-[#2f2f2f]'
                      : 'border-[#e4ddd1] bg-[#fffdfc] text-[#6f6f6f]'
                  }`}
                  onClick={() => handleDisplayStyleChange(option.value)}
                >
                  <p className="font-semibold">{option.label}</p>
                  <p className="mt-1 text-xs text-[#8c8c8c]">{option.desc}</p>
                  <p className="mt-1 text-xs text-[#b7aea1]">适用：{option.allowedTypes.map(t => contentTypeOptions.find(c => c.value === t)?.label).join('、')}</p>
                </button>
              ))}
            </div>
            <div className="mt-4">
              <label>
                <span className={fieldLabel}>内容类型 <span className="text-red-500">*</span></span>
                <select
                  className={`${fieldInput} mt-2 max-w-[300px]`}
                  value={contentType}
                  onChange={(e) => {
                    const newType = e.target.value as ContentModuleContentType;
                    if (!allowedTypes.includes(newType)) {
                      setError(`当前展示样式不支持内容类型「${contentTypeOptions.find(c => c.value === newType)?.label}」`);
                      return;
                    }
                    setContentType(newType);
                    setItems([]);
                  }}
                >
                  {contentTypeOptions.filter(c => allowedTypes.includes(c.value)).map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {/* Section 3: Content Config */}
          <div className={sectionClass}>
            <h2 className="mb-5 flex items-center gap-3 text-xl font-semibold text-[#2f2f2f]">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#7a8b6f] text-sm text-white">3</span>
              内容配置
            </h2>
            <div className="space-y-4">
              <div>
                <span className={fieldLabel}>内容来源 <span className="text-red-500">*</span></span>
                <div className="mt-2 flex flex-wrap gap-6">
                  {contentSourceOptions.map((cs) => (
                    <label key={cs.value} className="inline-flex items-center gap-2 text-sm text-[#2f2f2f]">
                      <input
                        type="radio"
                        checked={contentSource === cs.value}
                        onChange={() => {
                          setContentSource(cs.value);
                          setItems([]);
                        }}
                      />
                      {cs.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Manual selection */}
              {contentSource === 'MANUAL' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={fieldLabel}>选择内容（已选 {items.length} 项）</span>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto rounded-lg border border-[#d9d2c6]">
                    {contentOptions.length === 0 ? (
                      <div className="p-6 text-center text-sm text-[#8c8c8c]">
                        {contentLoading ? '加载内容列表...' : contentError ? contentError : '暂无可选内容'}
                      </div>
                    ) : (
                      <>
                        {contentOptions.map((opt) => {
                          const isSelected = items.some(i => i.id === opt.id);
                          return (
                            <div
                              key={opt.id}
                              className={`flex items-center justify-between border-b border-[#f0eadf] px-4 py-2.5 text-sm ${isSelected ? 'bg-[#eef3ea]' : ''}`}
                            >
                              <span>{opt.name}</span>
                              <button
                                className={`text-xs ${isSelected ? 'text-red-500' : 'text-[#6f8663]'}`}
                                onClick={() => isSelected ? removeManualItem(opt.id) : addManualItem(opt)}
                              >
                                {isSelected ? '移除' : '选择'}
                              </button>
                            </div>
                          );
                        })}
                        {contentOptions.length < contentTotal && (
                          <div className="p-3 text-center">
                            <Button variant="ghost" className="text-xs text-[#6f8663]" onClick={loadMoreContentOptions}>加载更多</Button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  {/* Selected items with sort */}
                  {items.length > 0 && (
                    <div className="mt-3 rounded-lg border border-[#d9d2c6] bg-[#f5f1ea] p-3">
                      <p className="mb-2 text-xs font-medium text-[#5f5f5f]">已选内容排序：</p>
                      {items.map((item, idx) => (
                        <div key={item.id} className="flex items-center justify-between py-1 text-sm">
                          <span className="text-[#2f2f2f]">{idx + 1}. {item.id}</span>
                          <div className="flex gap-1">
                            <button className="text-xs text-[#6f8663] disabled:text-[#d9d2c6]" disabled={idx === 0} onClick={() => moveItem(item.id, 'up')}>↑</button>
                            <button className="text-xs text-[#6f8663] disabled:text-[#d9d2c6]" disabled={idx === items.length - 1} onClick={() => moveItem(item.id, 'down')}>↓</button>
                            <button className="text-xs text-red-500 ml-2" onClick={() => removeManualItem(item.id)}>×</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Category filter */}
              {contentSource === 'CATEGORY' && (
                <div>
                  <label>
                    <span className={fieldLabel}>选择分类 <span className="text-red-500">*</span></span>
                    <select
                      className={`${fieldInput} mt-2 max-w-[400px]`}
                      value={categoryId ?? ''}
                      onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : null)}
                    >
                      <option value="">请选择分类</option>
                      {categoryOptions.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </label>
                </div>
              )}

              {/* Tag filter */}
              {contentSource === 'TAG' && (
                <div>
                  <label>
                    <span className={fieldLabel}>选择标签 <span className="text-red-500">*</span></span>
                    <select
                      className={`${fieldInput} mt-2 max-w-[400px]`}
                      value={tagId ?? ''}
                      onChange={(e) => setTagId(e.target.value ? Number(e.target.value) : null)}
                    >
                      <option value="">请选择标签</option>
                      {tagOptions.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </label>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <label>
                  <span className={fieldLabel}>展示数量 <span className="text-red-500">*</span></span>
                  <input className={`${fieldInput} mt-2`} type="number" min={1} max={50} value={displayCount} onChange={(e) => setDisplayCount(e.target.value)} />
                </label>
                <div>
                  <span className={fieldLabel}>显示更多入口</span>
                  <div className="mt-2 flex items-center gap-3">
                    <Toggle checked={showMore} onChange={setShowMore} />
                    <span className="text-sm text-[#5f5f5f]">{showMore ? '是' : '否'}</span>
                  </div>
                </div>
              </div>
              {showMore && (
                <label>
                  <span className={fieldLabel}>更多入口跳转</span>
                  <input className={`${fieldInput} mt-2 max-w-[400px]`} value={moreLink} placeholder="如 /pages/recipes/index" onChange={(e) => setMoreLink(e.target.value)} />
                </label>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-[#d6decd] bg-[#eef3ea] px-5 py-4 text-sm text-[#5f7f56]">
            ⓘ 内容模块绑定当前导航「{navName}」。停用后C端不展示。内容卡片点击跳转详情页由前端根据内容类型自动处理。
          </div>
        </div>

        {/* Right: Preview */}
        <div className="rounded-2xl border border-[#e4ddd1] bg-[#fffdfc] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#2f2f2f]">C端模块预览</h2>
            <button className="flex items-center gap-1 text-xs text-[#6f8663]">
              <RefreshCw className="h-3 w-3" /> 预览
            </button>
          </div>
          <div className="mx-auto w-full max-w-[196px] overflow-hidden rounded-[1.2rem] border-[5px] border-[#1f1f1f] bg-[#fffdfc]">
            <div className="mx-2 mt-2 flex items-center gap-1.5">
              <div className="flex min-w-0 flex-1 items-center gap-1 rounded-lg bg-[#f5f1ea] px-2 py-1.5 text-[9px] text-[#8c8c8c]">
                <span className="h-2.5 w-2.5 shrink-0 bg-current" style={{ WebkitMask: `url(${searchIconUrl}) center / contain no-repeat`, mask: `url(${searchIconUrl}) center / contain no-repeat` }} aria-hidden="true" />
                <span className="truncate">搜索菜谱、食材</span>
              </div>
              <button type="button" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#7a8b6f] text-[#fffdfc]">
                <span className="h-3.5 w-3.5 bg-current" style={{ WebkitMask: `url(${plusIconUrl}) center / contain no-repeat`, mask: `url(${plusIconUrl}) center / contain no-repeat` }} aria-hidden="true" />
              </button>
            </div>
            <div className="mx-2 mt-2 flex gap-2 overflow-hidden whitespace-nowrap text-[8px]">
              <span>推荐</span>
              <span className="font-semibold text-[#6f8663] underline decoration-1 underline-offset-4">{navName}</span>
              <span>快手菜</span>
            </div>
            <div className="mx-2 mt-3 mb-2">
              <div className="flex items-center justify-between text-[8px]">
                <span className="font-semibold">{title || '模块标题'}</span>
                {showMore && <span className="text-[#7a8b6f]">更多 ›</span>}
              </div>
              {subtitle && <p className="text-[7px] text-[#8c8c8c] mt-0.5">{subtitle}</p>}
              <div className={`mt-1.5 ${
                displayStyle === 'TWO_COLUMN_RECIPE_GRID' ? 'grid grid-cols-2 gap-1' :
                displayStyle === 'HORIZONTAL_RECIPE_CARD' ? 'flex gap-1 overflow-hidden' :
                displayStyle === 'IMAGE_TEXT_LIST' ? 'flex flex-col gap-1' :
                'flex gap-1 overflow-hidden'
              }`}>
                {displayStyle === 'IMAGE_TEXT_LIST' ? (
                  Array.from({ length: Math.min(3, Number(displayCount) || 2) }).map((_, i) => (
                    <div key={i} className="flex gap-1.5 rounded-md bg-[#f5f1ea] p-1">
                      <div className="h-8 w-10 rounded bg-[#b7aea1]" />
                      <div className="flex-1 min-w-0">
                        <div className="text-[7px] font-medium truncate">{i === 0 ? '番茄炒蛋' : i === 1 ? '蒜蓉西兰花' : '红烧茄子'}</div>
                        <div className="text-[6px] text-[#8c8c8c]">15分钟 · 简单</div>
                      </div>
                    </div>
                  ))
                ) : displayStyle === 'TWO_COLUMN_RECIPE_GRID' ? (
                  Array.from({ length: Math.min(4, Number(displayCount) || 4) }).map((_, i) => (
                    <div key={i} className="overflow-hidden rounded-md bg-[#f5f1ea]">
                      <div className={['h-10', i === 0 ? 'bg-[#c27b48]' : i === 1 ? 'bg-[#a8b48a]' : i === 2 ? 'bg-[#b7aea1]' : 'bg-[#8c6a45]'].join(' ')} />
                      <div className="p-1">
                        <div className="text-[7px] font-medium truncate">{['番茄炒蛋', '蒜蓉西兰花', '红烧茄子', '清蒸鲈鱼'][i]}</div>
                        <div className="text-[6px] text-[#8c8c8c]">15分钟 · 简单</div>
                      </div>
                    </div>
                  ))
                ) : (
                  Array.from({ length: Math.min(3, Number(displayCount) || 3) }).map((_, i) => (
                    <div key={i} className="min-w-[60px] overflow-hidden rounded-md bg-[#f5f1ea]">
                      <div className={['h-10', i === 0 ? 'bg-[#c27b48]' : i === 1 ? 'bg-[#a8b48a]' : 'bg-[#b7aea1]'].join(' ')} />
                      <div className="truncate p-1 text-[7px]">{['番茄炒蛋', '蒜蓉西兰花', '红烧茄子'][i]}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="flex items-center justify-around border-t border-[#e9e2d6] pt-1.5 pb-2 text-[7px] text-[#5f5f5f]">
              <span className="text-[#6f8663]">首页</span><span>食材</span><span>菜篮子</span><span>我的</span>
            </div>
          </div>
          <p className="mt-3 text-center text-xs text-[#8c8c8c]">预览展示模块效果，实际上线以后端配置为准。</p>
        </div>
      </div>
    </section>
  );
};
