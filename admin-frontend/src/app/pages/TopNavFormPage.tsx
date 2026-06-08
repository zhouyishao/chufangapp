import { ArrowLeft, Bell, ExternalLink, Layers, Leaf, Plus, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import {
  createHomeTopNav,
  getHomeTopNav,
  listContentSelector,
  updateHomeTopNav,
  type ContentSelectorItem,
  type HomeTopNavContentType,
  type HomeTopNavDisplayPosition,
  type HomeTopNavPayload,
  type HomeTopNavType
} from '../api';
import { Button } from '../components/Button';

const contentTypeNameMap: Record<string, string> = {
  recipe: '菜谱',
  ingredient: '食材',
  fruit: '水果',
  seasoning: '调料',
  beverage: '酒水'
};

const defaultPayload: HomeTopNavPayload = {
  name: '',
  alias: '',
  navType: 'system_recommend',
  contentType: null,
  displayPosition: 'home_top',
  iconUrl: null,
  sortOrder: 1,
  status: 'online',
  isDefault: false,
  isFixed: true,
  showMoreEntry: false,
  description: '',
  remark: '',
  relations: [],
  contentRule: {
    sourceType: 'recommend_pool',
    difficultyFilter: 'all',
    durationFilter: 'all',
    cookingMethodFilter: 'all',
    displayCount: 6,
    sortRule: 'comprehensive',
    moreButtonText: '查看更多',
    jumpRule: 'nav_content_list'
  },
  style: {
    navStyle: 'text_tab',
    activeStyle: 'underline',
    layoutMode: 'fixed',
    textColor: '#666666',
    activeTextColor: '#7A8B6F',
    showDivider: true,
    tabGap: 'medium',
    reserveSpace: false
  }
};

// 首页导航类型（不含 content_type）
const homeNavTypeOptions: { value: HomeTopNavType; label: string; sourceLabel: string; selectorType: string; sourceType: string }[] = [
  { value: 'system_recommend', label: '系统推荐', sourceLabel: '推荐内容池', selectorType: 'recommend_pool', sourceType: 'recommend_pool' },
  { value: 'recipe_category', label: '菜谱分类', sourceLabel: '关联分类', selectorType: 'category', sourceType: 'category' },
  { value: 'recipe_tag', label: '菜谱标签', sourceLabel: '关联标签', selectorType: 'tag', sourceType: 'tag' },
  { value: 'recommend_pool', label: '推荐池', sourceLabel: '手动选择', selectorType: 'recommend_pool', sourceType: 'recommend_pool' },
  { value: 'topic', label: '专题', sourceLabel: '专题', selectorType: 'topic', sourceType: 'topic' }
];

const fieldInput = 'h-10 w-full rounded-lg border border-[#d9d2c6] bg-[#fffdfc] px-3 text-sm text-[#2f2f2f] outline-none transition focus:border-[#7a8b6f]';
const fieldLabel = 'text-sm font-medium text-[#4f4f4f]';
const formRow = 'grid items-center gap-3 md:grid-cols-[110px_1fr]';

const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) => (
  <button
    type="button"
    className={['relative h-7 w-12 rounded-full transition', checked ? 'bg-[#7a8b6f]' : 'bg-[#ddd6cc]'].join(' ')}
    onClick={() => onChange(!checked)}
  >
    <span className={['absolute top-1 h-5 w-5 rounded-full bg-white shadow transition', checked ? 'left-6' : 'left-1'].join(' ')} />
  </button>
);

export const TopNavFormPage = ({ mode }: { mode: 'create' | 'edit' }) => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [draft, setDraft] = useState<HomeTopNavPayload>(() => {
    const queryPos = searchParams.get('displayPosition') as HomeTopNavDisplayPosition | null;
    if (queryPos === 'category_top' || queryPos === 'home_top') {
      return {
        ...defaultPayload,
        displayPosition: queryPos,
        navType: queryPos === 'category_top' ? 'content_type' : 'system_recommend'
      };
    }
    return defaultPayload;
  });
  const [options, setOptions] = useState<ContentSelectorItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isContentType = draft.navType === 'content_type';
  const isCategoryPage = draft.displayPosition === 'category_top';
  const isHomePage = draft.displayPosition === 'home_top';

  const currentType = useMemo(() => {
    if (isContentType) return homeNavTypeOptions[0];
    return homeNavTypeOptions.find((item) => item.value === draft.navType) ?? homeNavTypeOptions[0];
  }, [draft.navType, isContentType]);

  const selectedRelation = draft.relations[0] ?? null;

  // 当选择内容类型时自动填充名称
  const autoName = useMemo(() => {
    if (isContentType && draft.contentType) {
      return contentTypeNameMap[draft.contentType] ?? '';
    }
    return '';
  }, [isContentType, draft.contentType]);

  useEffect(() => {
    const load = async () => {
      if (mode === 'edit' && id) {
        const item = await getHomeTopNav(id);
        setDraft({
          name: item.name,
          alias: item.alias ?? '',
          navType: item.navType,
          contentType: item.contentType ?? null,
          displayPosition: item.displayPosition,
          iconUrl: item.iconUrl ?? null,
          sortOrder: item.sortOrder,
          status: item.status,
          isDefault: item.isDefault,
          isFixed: item.isFixed,
          showMoreEntry: item.showMoreEntry,
          description: item.description ?? '',
          remark: item.remark ?? '',
          relations: item.relations ?? [],
          contentRule: item.contentRule ?? defaultPayload.contentRule,
          style: item.style ?? defaultPayload.style
        });
      }
    };
    void load().catch((err) => setError(err instanceof Error ? err.message : '加载失败'));
  }, [id, mode]);

  useEffect(() => {
    if (!isContentType) {
      void listContentSelector({ type: currentType.selectorType, page: 1, pageSize: 50 })
        .then((result) => setOptions(result.list))
        .catch(() => setOptions([]));
    }
  }, [currentType.selectorType, isContentType]);

  const selectContent = (item: ContentSelectorItem) => {
    setDraft({
      ...draft,
      relations: [{ relationType: currentType.sourceType, relationId: item.id, relationName: item.name }],
      contentRule: { ...draft.contentRule, sourceType: currentType.sourceType }
    });
  };

  const handleDisplayPositionChange = (pos: HomeTopNavDisplayPosition) => {
    if (pos === 'category_top') {
      setDraft({ ...draft, displayPosition: pos, navType: 'content_type', contentType: null, relations: [], name: '' });
    } else {
      setDraft({ ...draft, displayPosition: pos, navType: 'system_recommend', contentType: null, relations: [], name: '', contentRule: { ...draft.contentRule, sourceType: 'recommend_pool' } });
    }
  };

  const handleContentTypeChange = (ct: string) => {
    const name = contentTypeNameMap[ct] ?? '';
    setDraft({ ...draft, contentType: ct as HomeTopNavContentType, name, relations: [] });
  };

  const save = async (status: 'draft' | 'online') => {
    const name = draft.name.trim() || autoName;
    const sortOrder = Number(draft.sortOrder);
    if (!name) return setError('请输入导航名称');
    if (name.length < 2 || name.length > 8) return setError('导航名称需为 2-8 个字符');
    if (!Number.isInteger(sortOrder) || sortOrder < 1 || sortOrder > 999) return setError('排序值需为 1-999 的整数');
    if (!isContentType && status === 'online' && draft.relations.length === 0) return setError('请先选择关联内容');
    setSaving(true);
    setError(null);
    try {
      const payload = { ...draft, name: name || draft.name, sortOrder, status };
      if (mode === 'edit' && id) await updateHomeTopNav(id, payload);
      else await createHomeTopNav(payload);
      navigate('/home-ops');
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const displayName = draft.name || autoName || '新导航';

  return (
    <section className="mx-auto max-w-[1540px] space-y-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex items-start gap-4">
          <button
            className="mt-2 flex h-8 w-8 items-center justify-center rounded-full text-[#2f2f2f] transition hover:bg-[#f5f1ea]"
            onClick={() => navigate('/home-ops')}
            aria-label="返回顶部导航管理"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-[30px] font-semibold leading-tight tracking-tight text-[#2f2f2f]">
              {mode === 'create' ? '新增导航' : '编辑导航'}
            </h1>
            <p className="mt-2 text-sm text-[#8c8c8c]">
              {isCategoryPage ? '为分类页新增顶部导航项。' : '为首页顶部 Tab 新增导航项。'}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="ghost" className="h-11 min-w-[96px] rounded-lg border-[#d9d2c6] bg-[#fffdfc]" onClick={() => navigate('/home-ops')}>取消</Button>
          <Button variant="ghost" className="h-11 min-w-[116px] rounded-lg border-[#7a8b6f] bg-[#fffdfc] text-[#6f8663]" disabled={saving} onClick={() => void save('draft')}>保存草稿</Button>
          <Button className="h-11 min-w-[128px] rounded-lg bg-[#5f7f56] hover:bg-[#526f4b]" disabled={saving} onClick={() => void save('online')}>保存并启用</Button>
        </div>
      </div>

      {error ? <div className="rounded-2xl bg-red-50 px-5 py-4 text-sm text-red-700">{error}</div> : null}

      <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[1fr_400px]">
        <div className="space-y-5">
          {/* ====== 1. 基础信息 ====== */}
          <div className="rounded-2xl border border-[#e4ddd1] bg-[#fffdfc] p-6 shadow-[0_16px_45px_rgba(47,47,47,0.035)]">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#6f8663] text-sm font-semibold text-white">1</span>
              <h2 className="text-lg font-semibold text-[#2f2f2f]">基础信息</h2>
            </div>
            <div className="grid gap-x-8 gap-y-5 xl:grid-cols-2">
              {/* 使用页面 */}
              <label className={formRow}>
                <span className={fieldLabel}>使用页面 <span className="text-[#c27b48]">*</span></span>
                <div className="flex h-10 overflow-hidden rounded-lg border border-[#d9d2c6] bg-[#f5f1ea]">
                  <button
                    type="button"
                    className={`flex flex-1 items-center justify-center gap-1.5 text-sm font-medium transition ${isHomePage ? 'bg-[#7a8b6f] text-white' : 'text-[#6f6f6f]'}`}
                    onClick={() => handleDisplayPositionChange('home_top')}
                  >
                    <Leaf className="h-4 w-4" />首页导航
                  </button>
                  <button
                    type="button"
                    className={`flex flex-1 items-center justify-center gap-1.5 text-sm font-medium transition ${isCategoryPage ? 'bg-[#7a8b6f] text-white' : 'text-[#6f6f6f]'}`}
                    onClick={() => handleDisplayPositionChange('category_top')}
                  >
                    <Layers className="h-4 w-4" />分类页导航
                  </button>
                </div>
              </label>

              {/* 导航名称 */}
              <label className={formRow}>
                <span className={fieldLabel}>导航名称 <span className="text-[#c27b48]">*</span></span>
                <input
                  className={fieldInput}
                  maxLength={8}
                  placeholder={isContentType && draft.contentType ? `自动填充：${autoName}` : '请输入 2-8 个字符'}
                  value={draft.name}
                  onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                />
              </label>

              {/* 分类页 → 内容类型 */}
              {isCategoryPage ? (
                <label className={formRow}>
                  <span className={fieldLabel}>内容类型</span>
                  <select className={fieldInput} value={draft.contentType ?? ''} onChange={(e) => handleContentTypeChange(e.target.value)}>
                    <option value="">请选择内容类型</option>
                    <option value="recipe">菜谱 recipe</option>
                    <option value="ingredient">食材 ingredient</option>
                    <option value="fruit">水果 fruit</option>
                    <option value="seasoning">调料 seasoning</option>
                    <option value="beverage">酒水 beverage</option>
                  </select>
                </label>
              ) : (
                /* 首页 → 导航类型 */
                <div className="xl:col-span-2 grid items-center gap-3 md:grid-cols-[110px_1fr]">
                  <span className={fieldLabel}>导航类型 <span className="text-[#c27b48]">*</span></span>
                  <div className="flex flex-wrap gap-8">
                    {homeNavTypeOptions.slice(0, 4).map((item) => (
                      <label key={item.value} className="flex cursor-pointer items-center gap-2 text-sm text-[#2f2f2f]">
                        <input
                          type="radio"
                          checked={draft.navType === item.value}
                          onChange={() => setDraft({ ...draft, navType: item.value, relations: [], contentRule: { ...draft.contentRule, sourceType: item.sourceType } })}
                        />
                        {item.label}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <label className={formRow}>
                <span className={fieldLabel}>导航别名（可选）</span>
                <input className={fieldInput} placeholder="请输入别名" value={draft.alias ?? ''} onChange={(event) => setDraft({ ...draft, alias: event.target.value })} />
              </label>
              <label className={formRow}>
                <span className={fieldLabel}>排序值 <span className="text-[#c27b48]">*</span></span>
                <input className={fieldInput} type="number" min={1} max={999} step={1} value={draft.sortOrder} onChange={(event) => setDraft({ ...draft, sortOrder: Number(event.target.value) })} />
              </label>
              <div className="grid gap-4 xl:col-span-2 xl:grid-cols-2">
                <div className={formRow}>
                  <span className={fieldLabel}>默认选中</span>
                  <div className="flex items-center gap-3 text-sm text-[#5f5f5f]"><Toggle checked={draft.isDefault} onChange={(checked) => setDraft({ ...draft, isDefault: checked })} />{draft.isDefault ? '是' : '否'}</div>
                </div>
                <div className={formRow}>
                  <span className={fieldLabel}>启用状态</span>
                  <div className="flex items-center gap-3 text-sm text-[#5f5f5f]"><Toggle checked={draft.status === 'online'} onChange={(checked) => setDraft({ ...draft, status: checked ? 'online' : 'draft' })} />{draft.status === 'online' ? '已启用' : '草稿'}</div>
                </div>
                <div className={formRow}>
                  <span className={fieldLabel}>固定显示</span>
                  <div className="flex items-center gap-3 text-sm text-[#5f5f5f]"><Toggle checked={draft.isFixed} onChange={(checked) => setDraft({ ...draft, isFixed: checked })} />{draft.isFixed ? '是' : '否'}</div>
                </div>
                <div className={formRow}>
                  <span className={fieldLabel}>显示更多入口</span>
                  <div className="flex items-center gap-3 text-sm text-[#5f5f5f]"><Toggle checked={draft.showMoreEntry} onChange={(checked) => setDraft({ ...draft, showMoreEntry: checked })} />{draft.showMoreEntry ? '是' : '否'}</div>
                </div>
              </div>
              <label className="xl:col-span-2 grid gap-3 md:grid-cols-[110px_1fr]">
                <span className={fieldLabel}>导航描述 / 备注</span>
                <span>
                  <textarea className="min-h-[72px] w-full rounded-lg border border-[#d9d2c6] bg-[#fffdfc] p-3 text-sm outline-none transition focus:border-[#7a8b6f]" maxLength={200} placeholder="请输入导航的描述信息，选填" value={draft.description ?? ''} onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
                  <span className="float-right text-xs text-[#8c8c8c]">{draft.description?.length ?? 0}/200</span>
                </span>
              </label>
            </div>
          </div>

          {/* ====== 2. 关联内容配置 ====== */}
          <div className="rounded-2xl border border-[#e4ddd1] bg-[#fffdfc] p-6 shadow-[0_16px_45px_rgba(47,47,47,0.035)]">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#6f8663] text-sm font-semibold text-white">2</span>
              <h2 className="text-lg font-semibold text-[#2f2f2f]">关联内容配置</h2>
            </div>

            {isContentType ? (
              /* ====== 内容类型：自动绑定说明卡片 ====== */
              <div className="space-y-4">
                <div className="rounded-xl border border-[#d6decd] bg-[#eef3ea] p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <Layers className="h-5 w-5 text-[#7a8b6f]" />
                    <span className="font-semibold text-[#2f2f2f]">当前导航类型：内容类型</span>
                  </div>
                  {draft.contentType ? (
                    <div className="space-y-3 text-sm text-[#5f5f5f]">
                      <p><span className="font-medium">当前内容类型：</span><span className="rounded bg-[#7a8b6f] px-2 py-0.5 text-xs text-white">{contentTypeNameMap[draft.contentType] ?? draft.contentType}</span></p>
                      <div className="rounded-lg border border-[#d6decd] bg-[#fffdfc] p-4 text-xs leading-relaxed">
                        <p className="mb-2 font-medium text-[#2f2f2f]">系统将自动关联：</p>
                        <ul className="list-inside list-disc space-y-1 text-[#5f5f5f]">
                          <li>C端顶部导航 type={draft.contentType}</li>
                          <li>分类筛选来源：分类管理 / {contentTypeNameMap[draft.contentType] ?? draft.contentType}分类</li>
                          <li>内容模块默认内容类型：{contentTypeNameMap[draft.contentType] ?? draft.contentType}</li>
                          <li>C端接口：/api/app/page-modules?page=category&type={draft.contentType}</li>
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-[#8c8c8c]">请先在基础信息中选择内容类型。</p>
                  )}
                </div>
                {draft.contentType ? (
                  <Button
                    className="h-11 w-full rounded-lg border-[#7a8b6f] bg-[#fffdfc] text-[#6f8663]"
                    onClick={() => {
                      if (id) navigate(`/home-ops/top-nav/${id}/content`);
                    }}
                    disabled={!id}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    {id ? '去配置内容模块' : '保存后可配置内容模块'}
                  </Button>
                ) : null}
              </div>
            ) : (
              /* ====== 非内容类型：保留原有配置 ====== */
              <div className="grid gap-y-5">
                <div className="grid items-center gap-3 md:grid-cols-[110px_1fr]">
                  <span className={fieldLabel}>内容来源 <span className="text-[#c27b48]">*</span></span>
                  <div className="flex flex-wrap gap-8">
                    {homeNavTypeOptions.map((item) => (
                      <label key={item.value} className="flex cursor-pointer items-center gap-2 text-sm text-[#2f2f2f]">
                        <input
                          type="radio"
                          checked={draft.navType === item.value}
                          onChange={() => setDraft({ ...draft, navType: item.value, relations: [], contentRule: { ...draft.contentRule, sourceType: item.sourceType } })}
                        />
                        {item.sourceLabel}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="grid items-start gap-3 md:grid-cols-[110px_1fr_120px]">
                  <span className={fieldLabel}>关联分类 <span className="text-[#c27b48]">*</span></span>
                  <select
                    className={fieldInput}
                    value={selectedRelation?.relationId ?? ''}
                    onChange={(event) => {
                      const option = options.find((item) => item.id === event.target.value);
                      if (option) selectContent(option);
                    }}
                  >
                    <option value="">请选择关联的分类</option>
                    {options.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                  <Button variant="ghost" className="h-10 rounded-lg border-[#7a8b6f] bg-[#fffdfc] text-[#6f8663]" disabled={!options.length} onClick={() => options[0] && selectContent(options[0])}>
                    选择内容
                  </Button>
                </div>
                <div className="grid items-start gap-3 md:grid-cols-[110px_1fr]">
                  <span className={fieldLabel}>已选内容</span>
                  <div className="flex min-h-10 flex-wrap items-center gap-3">
                    {selectedRelation ? (
                      <span className="rounded-lg bg-[#eef3ea] px-3 py-2 text-sm text-[#6f8663]">{selectedRelation.relationName} ×</span>
                    ) : (
                      <span className="text-sm text-[#8c8c8c]">暂未选择内容</span>
                    )}
                  </div>
                </div>
                <label className={formRow}>
                  <span className={fieldLabel}>推荐时间段</span>
                  <select className={fieldInput}>
                    <option>全天 00:00 - 24:00</option>
                    <option>早餐 06:00 - 10:00</option>
                    <option>晚餐 17:00 - 22:00</option>
                  </select>
                </label>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-[#e4ddd1] bg-[#f6f5ee] px-5 py-4 text-sm text-[#5f5f5f]">
            ⓘ 说明：导航的颜色、字体大小、选中样式等展示规范由系统统一控制，本页无需配置。
          </div>
        </div>

        {/* ====== 右侧预览 ====== */}
        <div className="rounded-2xl border border-[#e4ddd1] bg-[#fffdfc] p-5 shadow-[0_16px_45px_rgba(47,47,47,0.04)]">
          <h2 className="text-lg font-semibold text-[#2f2f2f]">
            {isCategoryPage ? '分类页预览' : '首页预览（实时效果）'}
          </h2>
          <div className="mx-auto mt-5 w-full max-w-[330px] rounded-[2.5rem] border-[9px] border-[#1f1f1f] bg-[#fffdfc] p-4 shadow-[0_20px_55px_rgba(47,47,47,0.16)]">
            <div className="flex items-center justify-between text-xs font-semibold text-[#2f2f2f]">
              <span>9:41</span>
              <span>▮▮▮ ))) ▰</span>
            </div>
            {isHomePage ? (
              <>
                <div className="mt-5 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-base font-semibold text-[#6f8663]"><Leaf className="h-5 w-5" />家庭食谱</div>
                  <Bell className="h-5 w-5 text-[#2f2f2f]" />
                </div>
                <div className="mt-4 flex items-center gap-2 rounded-2xl bg-[#f5f1ea] px-4 py-3 text-sm text-[#8c8c8c]">
                  <Search className="h-4 w-4" /> 搜索菜谱、食材
                </div>
              </>
            ) : (
              <div className="mt-4 flex items-center gap-2 rounded-2xl bg-[#f5f1ea] px-4 py-3 text-sm text-[#8c8c8c]">
                <Search className="h-4 w-4" /> 搜索菜谱、食材、水果、调料、酒水
              </div>
            )}
            <div className="mt-4 flex gap-5 overflow-hidden whitespace-nowrap text-sm">
              <span style={{ color: draft.style.activeTextColor }} className="font-semibold underline decoration-2 underline-offset-8">{displayName}</span>
              {isCategoryPage ? (
                <>
                  <span className="text-[#2f2f2f]">{contentTypeNameMap['recipe']}</span>
                  <span className="text-[#2f2f2f]">{contentTypeNameMap['fruit']}</span>
                  <span className="text-[#2f2f2f]">{contentTypeNameMap['seasoning']}</span>
                </>
              ) : (
                <>
                  <span className="text-[#2f2f2f]">家常菜</span>
                  <span className="text-[#2f2f2f]">快手菜</span>
                  <span className="text-[#2f2f2f]">减脂餐</span>
                </>
              )}
            </div>
            {isCategoryPage ? (
              <div className="mt-4">
                <div className="flex gap-2 overflow-hidden text-[10px]">
                  <span className="rounded-full bg-[#7a8b6f] px-3 py-1.5 text-white">推荐</span>
                  {['蔬菜', '肉禽蛋', '水产海鲜', '豆制品'].map((c) => (
                    <span key={c} className="rounded-full bg-[#f5f1ea] px-3 py-1.5 text-[#5f5f5f]">{c}</span>
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-4 gap-2">
                  {['推荐', '蔬菜', '肉禽蛋', '水产'].map((name, i) => (
                    <div key={name} className="flex h-16 items-center justify-center rounded-xl bg-[#f5f1ea] text-[10px] text-[#5f5f5f]">{name}</div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div className="mt-5 overflow-hidden rounded-2xl bg-[#8c6a45] p-4 text-white">
                  <div className="text-xs opacity-80">今日推荐</div>
                  <div className="mt-2 text-xl font-semibold">红烧排骨</div>
                  <div className="mt-2 text-xs opacity-80">软烂入味，下饭必备</div>
                </div>
                <div className="mt-5">
                  <div className="flex items-center justify-between"><span className="font-semibold">为你推荐</span><span className="text-xs text-[#7a8b6f]">查看更多 ›</span></div>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {['番茄炒蛋', '清炒时蔬', '番茄滑鸡'].map((name, index) => (
                      <div key={name} className="overflow-hidden rounded-2xl bg-[#f5f1ea]">
                        <div className={['h-20', index === 0 ? 'bg-[#c27b48]' : index === 1 ? 'bg-[#a8b48a]' : 'bg-[#b7aea1]'].join(' ')} />
                        <div className="truncate p-2 text-xs font-medium">{name}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
            <div className="mt-5 flex items-center justify-around border-t border-[#e9e2d6] pt-3 text-xs text-[#5f5f5f]">
              <span className="text-[#6f8663]">首页</span>
              <span>分类</span>
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#7a8b6f] text-white">＋</span>
              <span>收藏</span>
              <span>我的</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
