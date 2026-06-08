import { ArrowLeft, RefreshCw, Upload } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  createContentModule,
  getContentModule,
  getHomeTopNav,
  listCategoriesByContentType,
  listContentSelector,
  listTags,
  updateContentModule,
  uploadImage,
  resolveAssetUrl,
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

// ====== 展示样式（6种） ======
type StyleOption = {
  value: ContentModuleDisplayStyle;
  label: string;
  desc: string;
  allowedTypes: ContentModuleContentType[];
  isNew?: boolean;
};

const displayStyleOptions: StyleOption[] = [
  { value: 'HORIZONTAL_RECIPE_CARD',    label: '横向菜谱卡片',   desc: '图片、标题、标签、时间、人数、难度、收藏', allowedTypes: ['RECIPE'] },
  { value: 'SEASONAL_INGREDIENT_CARD',  label: '时令食材卡片',   desc: '图片、名称、价格、单位',                     allowedTypes: ['INGREDIENT', 'FRUIT', 'SEASONING', 'BEVERAGE'] },
  { value: 'IMAGE_TEXT_LIST',           label: '图文列表',       desc: '左图右文、标题、简介、时间、人数、难度、收藏', allowedTypes: ['RECIPE'] },
  { value: 'TWO_COLUMN_RECIPE_GRID',    label: '双列菜谱卡片',   desc: '双列大卡片、图片、标题、简介、时间、人数、难度', allowedTypes: ['RECIPE'] },
  { value: 'LARGE_IMAGE_CAROUSEL',      label: '大矩形图片模块', desc: '单张大图或多张轮播图，可配置标题、副标题、按钮和跳转', allowedTypes: ['RECIPE', 'INGREDIENT', 'FRUIT', 'SEASONING', 'BEVERAGE'], isNew: true },
  { value: 'FOUR_CARD_GRID',            label: '四宫格小卡片模块', desc: '一排固定4个，适合展示热门内容或分类入口',         allowedTypes: ['RECIPE', 'INGREDIENT', 'FRUIT', 'SEASONING', 'BEVERAGE'], isNew: true }
];

const contentTypeOptions: { value: ContentModuleContentType; label: string }[] = [
  { value: 'RECIPE', label: '菜谱' },
  { value: 'INGREDIENT', label: '食材' },
  { value: 'FRUIT', label: '水果' },
  { value: 'SEASONING', label: '调料' },
  { value: 'BEVERAGE', label: '酒水' }
];

const contentSourceOptions: { value: ContentModuleContentSource; label: string; desc: string; disabled?: boolean }[] = [
  { value: 'MANUAL',           label: '手动选择',         desc: '运营人工选择具体内容项' },
  { value: 'CATEGORY_CONTENT', label: '分类内容自动读取', desc: '绑定分类后，内容根据所属分类自动展示，无需重复选择' },
  { value: 'CATEGORY_GROUP',   label: '分类管理入口',   desc: '展示该内容类型下的所有一级分类入口' },
  { value: 'CATEGORY',         label: '按分类筛选(旧)',    desc: '建议使用「分类内容自动读取」' },
  { value: 'TAG',              label: '按标签筛选',       desc: '按标签筛选内容' },
];

// ====== 大矩形图片项 ======
type ImageCarouselItem = {
  id: string;
  cover: string;
  title: string;
  subtitle: string;
  buttonText: string;
  jumpType: 'NONE' | 'CONTENT_DETAIL' | 'CATEGORY_PAGE' | 'BASKET' | 'EXTERNAL_LINK';
  jumpTarget: string;
  sortOrder: number;
  status: 'ENABLED' | 'DISABLED';
};

const jumpTypeOptions: { value: ImageCarouselItem['jumpType']; label: string }[] = [
  { value: 'NONE', label: '不跳转' },
  { value: 'CONTENT_DETAIL', label: '内容详情' },
  { value: 'CATEGORY_PAGE', label: '分类页' },
  { value: 'BASKET', label: '菜篮子' },
  { value: 'EXTERNAL_LINK', label: '外部链接' }
];

const emptyImageItem = (sortOrder: number): ImageCarouselItem => ({
  id: `img_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
  cover: '',
  title: '',
  subtitle: '',
  buttonText: '',
  jumpType: 'NONE',
  jumpTarget: '',
  sortOrder,
  status: 'ENABLED'
});

// ====== Toggle ======
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

  // ====== 基础字段 ======
  const [nav, setNav] = useState<HomeTopNav | null>(null);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [displayStyle, setDisplayStyle] = useState<ContentModuleDisplayStyle>('HORIZONTAL_RECIPE_CARD');
  const [contentType, setContentType] = useState<ContentModuleContentType>('RECIPE');
  const [contentSource, setContentSource] = useState<ContentModuleContentSource>('MANUAL');
  const [displayCount, setDisplayCount] = useState('6');
  const [showMore, setShowMore] = useState(false);
  const [showTitle, setShowTitle] = useState(true);
  const [moreLink, setMoreLink] = useState('');
  const [sortOrder, setSortOrder] = useState('1');
  const [status, setStatus] = useState<ContentModuleStatus>('ENABLED');
  const [items, setItems] = useState<ContentModuleItem[]>([]);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [tagId, setTagId] = useState<number | null>(null);

  // ====== 大矩形图片列表 ======
  const [imageItems, setImageItems] = useState<ImageCarouselItem[]>([emptyImageItem(1)]);

  // ====== 内容选择器 ======
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
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  const selectedStyle = useMemo(() => displayStyleOptions.find(s => s.value === displayStyle) ?? displayStyleOptions[0], [displayStyle]);
  const allowedTypes = useMemo(() => selectedStyle.allowedTypes, [selectedStyle]);
  const isLargeImage = displayStyle === 'LARGE_IMAGE_CAROUSEL';
  const isFourCardGrid = displayStyle === 'FOUR_CARD_GRID';
  const isLegacyStyle = !isLargeImage && !isFourCardGrid;

  // ====== 加载导航 ======
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

  // ====== 加载模块（编辑模式） ======
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
      setShowTitle(mod.showTitle ?? true);
      setMoreLink(mod.moreLink ?? '');
      setSortOrder(String(mod.sortOrder));
      setStatus(mod.status);

      if (mod.displayStyle === 'LARGE_IMAGE_CAROUSEL') {
        const rawItems = (mod.items as unknown[]) ?? [];
        if (Array.isArray(rawItems) && rawItems.length > 0 && typeof rawItems[0] === 'object' && 'cover' in (rawItems[0] as Record<string, unknown>)) {
          setImageItems(rawItems as unknown as ImageCarouselItem[]);
        } else {
          setImageItems([emptyImageItem(1)]);
        }
      } else {
        setItems((mod.items as ContentModuleItem[]) ?? []);
      }
      setCategoryId(mod.categoryId);
      setTagId(mod.tagId);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载模块失败');
    }
  };

  // ====== 内容选项加载 ======
  const loadContentOptions = async (page = 1) => {
    if (!['RECIPE', 'INGREDIENT', 'FRUIT', 'SEASONING', 'BEVERAGE'].includes(contentType)) return;
    setContentLoading(true);
    setContentError(null);
    try {
      const selectorTypeByContentType: Record<ContentModuleContentType, string> = {
        RECIPE: 'recipe', INGREDIENT: 'ingredient', FRUIT: 'fruit', SEASONING: 'seasoning', BEVERAGE: 'beverage'
      };
      const result = await listContentSelector({ type: selectorTypeByContentType[contentType], page, pageSize: 50 });
      if (page === 1) { setContentOptions(result.list); } else { setContentOptions(prev => [...prev, ...result.list]); }
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
      // 按当前 contentType 自动映射到对应的 CategoryType 进行筛选
      const result = await listCategoriesByContentType(contentType);
      setCategoryOptions(result.list.map(c => ({ id: Number(c.id), name: c.name })));
    } catch { /* silent */ }
  };

  const loadTagOptions = async () => {
    try {
      const result = await listTags({ page: 1, pageSize: 100, status: 'ACTIVE' });
      setTagOptions(result.list);
    } catch { /* silent */ }
  };

  useEffect(() => { void loadNav(); }, [id]);
  useEffect(() => { if (nav && moduleId) void loadModule(); }, [nav, moduleId]);
  useEffect(() => {
    if (!isLargeImage) {
      if (contentSource === 'MANUAL') void loadContentOptions(1);
      if (contentSource === 'CATEGORY' || contentSource === 'CATEGORY_CONTENT') void loadCategoryOptions();
      if (contentSource === 'TAG') void loadTagOptions();
      // CATEGORY_GROUP 不需要加载任何选择列表
    }
  }, [contentSource, contentType, nav, isLargeImage, displayStyle]);

  // ====== 展示样式切换 ======
  const handleDisplayStyleChange = (style: ContentModuleDisplayStyle) => {
    const styleOption = displayStyleOptions.find(s => s.value === style);
    if (styleOption && !styleOption.allowedTypes.includes(contentType)) {
      setContentType(styleOption.allowedTypes[0]);
      setItems([]);
      setNotice(`展示样式已切换，内容类型已自动调整为「${contentTypeOptions.find(c => c.value === styleOption.allowedTypes[0])?.label}」`);
    }
    setDisplayStyle(style);
    // Default showTitle per style
    if (style === 'LARGE_IMAGE_CAROUSEL') {
      setShowTitle(false);
      setImageItems([emptyImageItem(1)]);
    } else if (style === 'FOUR_CARD_GRID') {
      setShowTitle(true);
    }
  };

  // ====== 大矩形图片操作 ======
  const addImageItem = () => setImageItems(prev => [...prev, emptyImageItem(prev.length + 1)]);

  const removeImageItem = (itemId: string) => {
    setImageItems(prev => prev.filter(i => i.id !== itemId).map((img, idx) => ({ ...img, sortOrder: idx + 1 })));
  };

  const moveImageItem = (itemId: string, direction: 'up' | 'down') => {
    setImageItems(prev => {
      const idx = prev.findIndex(i => i.id === itemId);
      if (idx < 0) return prev;
      const next = [...prev];
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= next.length) return prev;
      [next[idx], next[targetIdx]] = [next[targetIdx], next[idx]];
      return next.map((img, i) => ({ ...img, sortOrder: i + 1 }));
    });
  };

  const updateImageItem = (itemId: string, field: keyof ImageCarouselItem, value: unknown) => {
    setImageItems(prev => prev.map(i => i.id === itemId ? { ...i, [field]: value } : i));
  };

  const handleImageUpload = async (itemId: string, file: File) => {
    setUploadingIndex(imageItems.findIndex(i => i.id === itemId));
    try {
      const result = await uploadImage(file);
      updateImageItem(itemId, 'cover', result.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : '图片上传失败');
    } finally {
      setUploadingIndex(null);
    }
  };

  // ====== 手动选择内容（旧样式） ======
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

  // ====== 校验 ======
  const validate = (): string | null => {
    if (!title.trim()) return '请输入模块名称';
    if (title.trim().length > 80) return '模块名称不能超过80字';
    if (!displayStyle) return '请选择展示样式';
    if (!contentType) return '请选择内容类型';

    if (isLargeImage) {
      const enabledImages = imageItems.filter(i => i.status === 'ENABLED');
      if (enabledImages.length === 0) return '请至少保留一张启用状态的图片';
      for (const img of enabledImages) {
        if (!img.cover) return '每张启用图片必须上传封面图';
        if (img.jumpType === 'EXTERNAL_LINK' && !img.jumpTarget.trim()) return '外部链接跳转必须填写链接地址';
      }
    } else {
      if (!contentSource) return '请选择内容来源';
      if (contentSource === 'MANUAL' && items.length === 0) return '手动选择模式下请至少选择一项内容';
      if ((contentSource === 'CATEGORY' || contentSource === 'CATEGORY_CONTENT') && !categoryId) return '请选择分类';
      if (contentSource === 'TAG' && !tagId) return '请选择标签';
      // CATEGORY_GROUP 不需要选择分类
    }

    const sortNum = Number(sortOrder);
    if (!Number.isFinite(sortNum) || sortNum < 1) return '排序值必须为大于等于1的数字';

    if (!isLargeImage) {
      const countNum = Number(displayCount);
      if (!Number.isFinite(countNum) || countNum < 1) return '展示数量必须为大于等于1的数字';
    }
    return null;
  };

  // ====== 保存 ======
  const save = async () => {
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    if (!id) return;
    setSaving(true);
    setError(null);
    try {
      const payloadItems: unknown[] = isLargeImage
        ? imageItems.filter(i => i.status === 'ENABLED' || i.cover).map(img => ({ ...img, type: 'image' }))
        : (contentSource === 'MANUAL' ? items : []);

      const payload: ContentModulePayload = {
        title: title.trim(),
        subtitle: subtitle.trim() || null,
        displayStyle,
        contentType: isLargeImage ? 'RECIPE' : contentType,
        contentSource: isLargeImage ? 'MANUAL' : contentSource,
        displayCount: isLargeImage ? imageItems.length : Number(displayCount),
        showMore: isLargeImage ? false : showMore,
        showTitle: showTitle,
        moreLink: isLargeImage ? null : (showMore ? (moreLink.trim() || null) : null),
        sortOrder: Number(sortOrder),
        status,
        items: payloadItems as ContentModuleItem[],
        categoryId: isLargeImage ? null : (contentSource === 'CATEGORY' ? categoryId : null),
        tagId: isLargeImage ? null : (contentSource === 'TAG' ? tagId : null)
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
    if (contentOptions.length < contentTotal) void loadContentOptions(contentPage + 1);
  };

  if (loading) {
    return <section className="rounded-3xl border border-[#e9e2d6] bg-[#fffdfc] p-8 text-sm text-[#8c8c8c]">加载中...</section>;
  }

  const navName = nav?.name ?? '当前导航';

  // ====== 预览项 ======
  const previewImages = imageItems.filter(i => i.status === 'ENABLED' && i.cover);
  const previewCount = Number(displayCount) || 4;

  // ====== Content config sub-components ======
  const renderLargeImageCarouselConfig = () => (<div className="space-y-4">
    <div className="rounded-lg border border-[#d6decd] bg-[#eef3ea] px-4 py-3 text-xs text-[#5f7f56] leading-relaxed"><p className="font-medium mb-1">📐 C端展示尺寸</p><p>展示宽度：361pt | 展示高度：124pt | 圆角：16pt</p><p>推荐上传尺寸：1083 × 372 px | 图片比例：约 2.91 : 1</p><p className="mt-1 text-[#8c8c8c]">如果只有1张图片，C端展示为单张大图；2张及以上展示为轮播图。</p></div>
    <div className="flex items-center justify-between"><span className={fieldLabel}>图片列表（{imageItems.length}张，启用 {imageItems.filter(i => i.status === 'ENABLED').length}张）</span><div className="flex items-center gap-4"><div className="flex items-center gap-2"><span className="text-xs text-[#5f5f5f]">显示模块标题</span><Toggle checked={showTitle} onChange={setShowTitle} /></div><Button className="h-9 rounded-lg bg-[#6f8663] text-xs" onClick={addImageItem}><span className="mr-1 h-3.5 w-3.5 bg-current" style={{ WebkitMask: `url(${plusIconUrl}) center / contain no-repeat`, mask: `url(${plusIconUrl}) center / contain no-repeat` }} aria-hidden="true" />添加图片</Button></div></div>
    {imageItems.map((img, idx) => (<div key={img.id} className="rounded-xl border border-[#e4ddd1] bg-[#faf9f6] p-4"><div className="mb-3 flex items-center justify-between"><span className="text-sm font-semibold text-[#2f2f2f]">图片 {idx + 1}</span><div className="flex items-center gap-2"><button className="text-xs text-[#6f8663] disabled:text-[#d9d2c6]" disabled={idx === 0} onClick={() => moveImageItem(img.id, 'up')}>↑</button><button className="text-xs text-[#6f8663] disabled:text-[#d9d2c6]" disabled={idx === imageItems.length - 1} onClick={() => moveImageItem(img.id, 'down')}>↓</button><select className="h-8 rounded-lg border border-[#d9d2c6] bg-[#fffdfc] px-2 text-xs" value={img.status} onChange={(e) => updateImageItem(img.id, 'status', e.target.value)}><option value="ENABLED">启用</option><option value="DISABLED">停用</option></select>{imageItems.length > 1 ? <button className="text-xs text-red-500" onClick={() => removeImageItem(img.id)}>删除</button> : null}</div></div><div className="grid gap-4 md:grid-cols-[200px_1fr]"><div><label className="flex h-32 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-[#d9d2c6] bg-[#f5f1ea] text-xs text-[#8c8c8c]">{uploadingIndex === idx ? <span>上传中...</span> : img.cover ? <img src={resolveAssetUrl(img.cover)} alt="封面预览" className="h-full w-full object-cover" /> : <span className="inline-flex items-center gap-1"><Upload className="h-3.5 w-3.5" />上传封面图</span>}<input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleImageUpload(img.id, f); }} /></label></div><div className="grid gap-3 md:grid-cols-2"><label><span className="text-xs text-[#5f5f5f]">主标题</span><input className="h-9 w-full rounded-lg border border-[#d9d2c6] bg-[#fffdfc] px-3 text-sm mt-1" value={img.title} maxLength={30} placeholder="建议12字以内" onChange={(e) => updateImageItem(img.id, 'title', e.target.value)} /></label><label><span className="text-xs text-[#5f5f5f]">副标题</span><input className="h-9 w-full rounded-lg border border-[#d9d2c6] bg-[#fffdfc] px-3 text-sm mt-1" value={img.subtitle} maxLength={50} placeholder="建议20字以内" onChange={(e) => updateImageItem(img.id, 'subtitle', e.target.value)} /></label><label><span className="text-xs text-[#5f5f5f]">按钮文案</span><input className="h-9 w-full rounded-lg border border-[#d9d2c6] bg-[#fffdfc] px-3 text-sm mt-1" value={img.buttonText} maxLength={10} placeholder="如：查看详情" onChange={(e) => updateImageItem(img.id, 'buttonText', e.target.value)} /></label><label><span className="text-xs text-[#5f5f5f]">跳转类型</span><select className="h-9 w-full rounded-lg border border-[#d9d2c6] bg-[#fffdfc] px-3 text-sm mt-1" value={img.jumpType} onChange={(e) => updateImageItem(img.id, 'jumpType', e.target.value)}>{jumpTypeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</select></label>{(img.jumpType === 'CONTENT_DETAIL' || img.jumpType === 'CATEGORY_PAGE' || img.jumpType === 'EXTERNAL_LINK') ? <label className="md:col-span-2"><span className="text-xs text-[#5f5f5f]">{img.jumpType === 'EXTERNAL_LINK' ? '外部链接' : img.jumpType === 'CONTENT_DETAIL' ? '内容ID' : '分类ID'}<span className="text-red-500">*</span></span><input className="h-9 w-full rounded-lg border border-[#d9d2c6] bg-[#fffdfc] px-3 text-sm mt-1" value={img.jumpTarget} placeholder={img.jumpType === 'EXTERNAL_LINK' ? 'https://...' : '输入ID'} onChange={(e) => updateImageItem(img.id, 'jumpTarget', e.target.value)} /></label> : null}<label className="md:col-span-2"><span className="text-xs text-[#5f5f5f]">排序值</span><input className="h-9 w-24 rounded-lg border border-[#d9d2c6] bg-[#fffdfc] px-3 text-sm mt-1" type="number" min={1} value={img.sortOrder} onChange={(e) => updateImageItem(img.id, 'sortOrder', Number(e.target.value))} /></label></div></div></div>))}
  </div>);

  const renderFourCardGridModuleConfig = () => (<div className="space-y-4">
    <div><span className={fieldLabel}>内容来源 <span className="text-red-500">*</span></span><div className="mt-2 flex flex-wrap gap-6">{contentSourceOptions.map((cs) => (<label key={cs.value} className="inline-flex items-center gap-2 text-sm text-[#2f2f2f]"><input type="radio" checked={contentSource === cs.value} onChange={() => { setContentSource(cs.value); setItems([]); }} />{cs.label}</label>))}</div></div>
    {contentSource === 'MANUAL' && (<div><div className="flex items-center justify-between mb-2"><span className={fieldLabel}>选择内容（已选 {items.length} 项）</span></div><div className="max-h-[300px] overflow-y-auto rounded-lg border border-[#d9d2c6]">{contentLoading ? <div className="p-6 text-center text-sm text-[#8c8c8c]">加载中...</div> : contentError ? <div className="p-6 text-center text-sm text-red-500">{contentError}</div> : contentOptions.length === 0 ? <div className="p-6 text-center text-sm text-[#8c8c8c]">暂无内容</div> : contentOptions.map((opt) => { const isSelected = items.some(i => i.id === opt.id); return (<div key={opt.id} className={`flex items-center justify-between border-b border-[#f0eadf] px-4 py-2.5 text-sm ${isSelected ? 'bg-[#eef3ea]' : ''}`}><span>{opt.name}</span><button className={`text-xs ${isSelected ? 'text-red-500' : 'text-[#6f8663]'}`} onClick={() => isSelected ? removeManualItem(opt.id) : addManualItem(opt)}>{isSelected ? '移除' : '选择'}</button></div>); })}{contentOptions.length < contentTotal && (<div className="p-3 text-center"><Button variant="ghost" className="text-xs text-[#6f8663]" onClick={loadMoreContentOptions}>加载更多</Button></div>)}</div>{items.length > 0 && (<div className="mt-3 rounded-lg border border-[#d9d2c6] bg-[#f5f1ea] p-3"><p className="mb-2 text-xs font-medium text-[#5f5f5f]">已选内容排序：</p>{items.map((item, idx) => (<div key={item.id} className="flex items-center justify-between py-1 text-sm"><span className="text-[#2f2f2f]">{idx + 1}. {item.id}</span><div className="flex gap-1"><button className="text-xs text-[#6f8663] disabled:text-[#d9d2c6]" disabled={idx === 0} onClick={() => moveItem(item.id, 'up')}>↑</button><button className="text-xs text-[#6f8663] disabled:text-[#d9d2c6]" disabled={idx === items.length - 1} onClick={() => moveItem(item.id, 'down')}>↓</button><button className="text-xs text-red-500 ml-2" onClick={() => removeManualItem(item.id)}>×</button></div></div>))}</div>)}</div>)}
    {contentSource === 'CATEGORY' && (<label><span className={fieldLabel}>选择分类 <span className="text-red-500">*</span></span><select className={`${fieldInput} mt-2 max-w-[400px]`} value={categoryId ?? ''} onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : null)}><option value="">请选择分类</option>{categoryOptions.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}</select></label>)}
    {contentSource === 'TAG' && (<label><span className={fieldLabel}>选择标签 <span className="text-red-500">*</span></span><select className={`${fieldInput} mt-2 max-w-[400px]`} value={tagId ?? ''} onChange={(e) => setTagId(e.target.value ? Number(e.target.value) : null)}><option value="">请选择标签</option>{tagOptions.map((t) => (<option key={t.id} value={t.id}>{t.name}</option>))}</select></label>)}
    <div className="rounded-lg border border-[#d6decd] bg-[#eef3ea] px-4 py-3 text-xs text-[#5f7f56]"><p className="font-medium">ℹ️ 四宫格规则</p><p className="mt-1">每行固定 4 个，不允许运营修改列数。</p><p>点击卡片跳转详情页由前端根据内容类型自动处理。</p></div>
    <div className="grid gap-4 md:grid-cols-2"><label><span className={fieldLabel}>展示数量 <span className="text-red-500">*</span></span><select className={`${fieldInput} mt-2`} value={displayCount} onChange={(e) => setDisplayCount(e.target.value)}><option value="4">4</option><option value="8">8</option><option value="12">12</option></select></label><div><span className={fieldLabel}>显示更多入口</span><div className="mt-2 flex items-center gap-3"><Toggle checked={showMore} onChange={setShowMore} /><span className="text-sm text-[#5f5f5f]">{showMore ? '是' : '否'}</span></div></div><div><span className={fieldLabel}>显示模块标题</span><div className="mt-2 flex items-center gap-3"><Toggle checked={showTitle} onChange={setShowTitle} /><span className="text-sm text-[#5f5f5f]">{showTitle ? '是' : '否'}</span></div></div></div>
    {showMore && (<label><span className={fieldLabel}>更多入口跳转</span><input className={`${fieldInput} mt-2 max-w-[400px]`} value={moreLink} placeholder="如 /pages/recipes/index" onChange={(e) => setMoreLink(e.target.value)} /></label>)}
  </div>);

  const renderLegacyModuleConfig = () => (<div className="space-y-4">
    <div><span className={fieldLabel}>内容来源 <span className="text-red-500">*</span></span><div className="mt-2 flex flex-wrap gap-6">{contentSourceOptions.map((cs) => (<label key={cs.value} className="inline-flex items-center gap-2 text-sm text-[#2f2f2f]"><input type="radio" checked={contentSource === cs.value} onChange={() => { setContentSource(cs.value); setItems([]); }} />{cs.label}</label>))}</div></div>
    {contentSource === 'MANUAL' && (<div><div className="flex items-center justify-between mb-2"><span className={fieldLabel}>选择内容（已选 {items.length} 项）</span></div><div className="max-h-[300px] overflow-y-auto rounded-lg border border-[#d9d2c6]">{contentLoading ? <div className="p-6 text-center text-sm text-[#8c8c8c]">加载中...</div> : contentError ? <div className="p-6 text-center text-sm text-red-500">{contentError}</div> : contentOptions.length === 0 ? <div className="p-6 text-center text-sm text-[#8c8c8c]">暂无内容</div> : contentOptions.map((opt) => { const isSelected = items.some(i => i.id === opt.id); return (<div key={opt.id} className={`flex items-center justify-between border-b border-[#f0eadf] px-4 py-2.5 text-sm ${isSelected ? 'bg-[#eef3ea]' : ''}`}><span>{opt.name}</span><button className={`text-xs ${isSelected ? 'text-red-500' : 'text-[#6f8663]'}`} onClick={() => isSelected ? removeManualItem(opt.id) : addManualItem(opt)}>{isSelected ? '移除' : '选择'}</button></div>); })}{contentOptions.length < contentTotal && (<div className="p-3 text-center"><Button variant="ghost" className="text-xs text-[#6f8663]" onClick={loadMoreContentOptions}>加载更多</Button></div>)}</div>{items.length > 0 && (<div className="mt-3 rounded-lg border border-[#d9d2c6] bg-[#f5f1ea] p-3"><p className="mb-2 text-xs font-medium text-[#5f5f5f]">已选内容排序：</p>{items.map((item, idx) => (<div key={item.id} className="flex items-center justify-between py-1 text-sm"><span className="text-[#2f2f2f]">{idx + 1}. {item.id}</span><div className="flex gap-1"><button className="text-xs text-[#6f8663] disabled:text-[#d9d2c6]" disabled={idx === 0} onClick={() => moveItem(item.id, 'up')}>↑</button><button className="text-xs text-[#6f8663] disabled:text-[#d9d2c6]" disabled={idx === items.length - 1} onClick={() => moveItem(item.id, 'down')}>↓</button><button className="text-xs text-red-500 ml-2" onClick={() => removeManualItem(item.id)}>×</button></div></div>))}</div>)}</div>)}
    {contentSource === 'CATEGORY' && (<label><span className={fieldLabel}>选择分类 <span className="text-red-500">*</span></span><select className={`${fieldInput} mt-2 max-w-[400px]`} value={categoryId ?? ''} onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : null)}><option value="">请选择分类</option>{categoryOptions.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}</select></label>)}
    {contentSource === 'TAG' && (<label><span className={fieldLabel}>选择标签 <span className="text-red-500">*</span></span><select className={`${fieldInput} mt-2 max-w-[400px]`} value={tagId ?? ''} onChange={(e) => setTagId(e.target.value ? Number(e.target.value) : null)}><option value="">请选择标签</option>{tagOptions.map((t) => (<option key={t.id} value={t.id}>{t.name}</option>))}</select></label>)}
    <div className="grid gap-4 md:grid-cols-2"><label><span className={fieldLabel}>展示数量 <span className="text-red-500">*</span></span><input className={`${fieldInput} mt-2`} type="number" min={1} max={50} value={displayCount} onChange={(e) => setDisplayCount(e.target.value)} /></label><div><span className={fieldLabel}>显示更多入口</span><div className="mt-2 flex items-center gap-3"><Toggle checked={showMore} onChange={setShowMore} /><span className="text-sm text-[#5f5f5f]">{showMore ? '是' : '否'}</span></div></div></div>
    {showMore && (<label><span className={fieldLabel}>更多入口跳转</span><input className={`${fieldInput} mt-2 max-w-[400px]`} value={moreLink} placeholder="如 /pages/recipes/index" onChange={(e) => setMoreLink(e.target.value)} /></label>)}
  </div>);

  return (
    <section className="mx-auto max-w-[1540px] space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <button className="mb-4 inline-flex items-center text-sm text-[#5f5f5f] hover:text-[#2f2f2f]" onClick={backToConfig}>
            <ArrowLeft className="mr-2 h-4 w-4" /> 返回内容配置
          </button>
          <h1 className="text-[30px] font-semibold leading-tight tracking-tight text-[#2f2f2f]">
            {isEdit ? '编辑内容模块' : '新增内容模块'}
          </h1>
          <p className="mt-2 text-sm text-[#8c8c8c]">
            为「{navName}」导航{isEdit ? '维护' : '新增'}内容模块。
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
          {/* ====== 1. 基础信息 ====== */}
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
              <div>
                <span className={fieldLabel}>是否展示模块标题</span>
                <div className="mt-2 flex items-center gap-3">
                  <Toggle checked={showTitle} onChange={setShowTitle} />
                  <span className="text-sm text-[#5f5f5f]">{showTitle ? '开启 - C端展示模块标题' : '关闭 - C端只展示内容'}</span>
                </div>
              </div>
              <label>
                <span className={fieldLabel}>所属导航</span>
                <input className={`${fieldInput} mt-2 bg-[#f5f1ea]`} value={navName} readOnly />
              </label>
              <label>
                <span className={fieldLabel}>排序 <span className="text-red-500">*</span></span>
                <input className={`${fieldInput} mt-2`} type="number" min={1} value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
              </label>
              {!isLargeImage ? (
                <label>
                  <span className={fieldLabel}>状态 <span className="text-red-500">*</span></span>
                  <select className={`${fieldInput} mt-2`} value={status} onChange={(e) => setStatus(e.target.value as ContentModuleStatus)}>
                    <option value="ENABLED">启用</option>
                    <option value="DISABLED">停用</option>
                  </select>
                </label>
              ) : null}
            </div>
          </div>

          {/* ====== 2. 展示样式 ====== */}
          <div className={sectionClass}>
            <h2 className="mb-5 flex items-center gap-3 text-xl font-semibold text-[#2f2f2f]">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#7a8b6f] text-sm text-white">2</span>
              展示样式
            </h2>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
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
                  <p className="font-semibold">
                    {option.label}
                    {option.isNew ? <span className="ml-1.5 rounded bg-[#7a8b6f] px-1.5 py-0.5 text-[10px] text-white">NEW</span> : null}
                  </p>
                  <p className="mt-1 text-xs text-[#8c8c8c]">{option.desc}</p>
                  <p className="mt-1 text-xs text-[#b7aea1]">适用：{option.allowedTypes.map(t => contentTypeOptions.find(c => c.value === t)?.label).join('、')}</p>
                </button>
              ))}
            </div>
            {isLegacyStyle ? (
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
            ) : null}
          </div>

          {/* ====== 3. 内容配置 ====== */}
          <div className={sectionClass}>
            <h2 className="mb-5 flex items-center gap-3 text-xl font-semibold text-[#2f2f2f]">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#7a8b6f] text-sm text-white">3</span>
              内容配置
            </h2>

            {/* Content config based on display style */}
            {isLargeImage ? (
              /* LARGE_IMAGE_CAROUSEL */
              renderLargeImageCarouselConfig()
            ) : isFourCardGrid ? (
              /* FOUR_CARD_GRID */
              renderFourCardGridModuleConfig()
            ) : (
              /* Legacy styles */
              renderLegacyModuleConfig()
            )}
          </div>

          <div className="rounded-xl border border-[#d6decd] bg-[#eef3ea] px-5 py-4 text-sm text-[#5f7f56]">
            ⓘ 内容模块绑定当前导航「{navName}」。{isLargeImage ? '大矩形图片模块为单图/轮播图展示。' : '停用后C端不展示。'}
          </div>
        </div>

        {/* ====== 右侧预览 ====== */}
        <div className="rounded-2xl border border-[#e4ddd1] bg-[#fffdfc] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#2f2f2f]">C端模块预览</h2>
            <button className="flex items-center gap-1 text-xs text-[#6f8663]"><RefreshCw className="h-3 w-3" /> 预览</button>
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
              <span>推荐</span><span className="font-semibold text-[#6f8663] underline decoration-1 underline-offset-4">{navName}</span><span>快手菜</span>
            </div>

            {/* 预览内容 */}
            <div className="mx-2 mt-3 mb-2">
              {isLargeImage ? (
                <div>
                  {previewImages.length > 0 ? (
                    <div className="overflow-hidden rounded-[8px]">
                      <div className="relative" style={{ height: 62 }}>
                        <img src={resolveAssetUrl(previewImages[0].cover)} alt="" className="h-full w-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                        {previewImages[0].title ? (
                          <div className="absolute bottom-1.5 left-1.5 right-1.5">
                            <div className="text-[7px] font-semibold text-white">{previewImages[0].title}</div>
                            {previewImages[0].subtitle ? <div className="text-[6px] text-white/80">{previewImages[0].subtitle}</div> : null}
                          </div>
                        ) : null}
                      </div>
                      {previewImages.length > 1 ? (
                        <div className="mt-0.5 flex justify-center gap-0.5">
                          {previewImages.map((_, i) => <span key={i} className={`h-0.5 w-0.5 rounded-full ${i === 0 ? 'bg-[#7a8b6f]' : 'bg-[#d9d2c6]'}`} />)}
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="flex h-[62px] items-center justify-center rounded-[8px] bg-[#f5f1ea] text-[8px] text-[#8c8c8c]">请上传封面图</div>
                  )}
                  <div className="mt-2 flex items-center justify-between text-[8px]">
                    <span className="font-semibold">{title || '模块标题'}</span>
                  </div>
                </div>
              ) : isFourCardGrid ? (
                <div>
                  <div className="flex items-center justify-between text-[8px]">
                    <span className="font-semibold">{title || '模块标题'}</span>
                    {showMore && <span className="text-[#7a8b6f]">更多 ›</span>}
                  </div>
                  <div className="mt-1.5 grid grid-cols-4 gap-1">
                    {Array.from({ length: Math.min(previewCount, 8) }).map((_, i) => (
                      <div key={i} className="overflow-hidden rounded-md bg-[#f5f1ea]">
                        <div className={['h-6', i % 4 === 0 ? 'bg-[#c27b48]' : i % 4 === 1 ? 'bg-[#a8b48a]' : i % 4 === 2 ? 'bg-[#b7aea1]' : 'bg-[#8c6a45]'].join(' ')} />
                        <div className="truncate p-0.5 text-[6px] text-center">{['热门', '新品', '推荐', '分类'][i % 4]}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between text-[8px]">
                    <span className="font-semibold">{title || '模块标题'}</span>
                    {showMore && <span className="text-[#7a8b6f]">更多 ›</span>}
                  </div>
                  <div className={`mt-1.5 ${
                    displayStyle === 'TWO_COLUMN_RECIPE_GRID' ? 'grid grid-cols-2 gap-1' :
                    displayStyle === 'HORIZONTAL_RECIPE_CARD' ? 'flex gap-1 overflow-hidden' :
                    displayStyle === 'IMAGE_TEXT_LIST' ? 'flex flex-col gap-1' :
                    'flex gap-1 overflow-hidden'
                  }`}>
                    {displayStyle === 'IMAGE_TEXT_LIST' ? (
                      Array.from({ length: Math.min(2, Number(displayCount) || 2) }).map((_, i) => (
                        <div key={i} className="flex gap-1.5 rounded-md bg-[#f5f1ea] p-1">
                          <div className="h-8 w-10 rounded bg-[#b7aea1]" />
                          <div className="flex-1 min-w-0">
                            <div className="text-[7px] font-medium truncate">{['番茄炒蛋', '蒜蓉西兰花'][i]}</div>
                            <div className="text-[6px] text-[#8c8c8c]">15分钟 · 简单</div>
                          </div>
                        </div>
                      ))
                    ) : displayStyle === 'TWO_COLUMN_RECIPE_GRID' ? (
                      Array.from({ length: Math.min(4, Number(displayCount) || 4) }).map((_, i) => (
                        <div key={i} className="overflow-hidden rounded-md bg-[#f5f1ea]">
                          <div className={['h-10', i === 0 ? 'bg-[#c27b48]' : i === 1 ? 'bg-[#a8b48a]' : i === 2 ? 'bg-[#b7aea1]' : 'bg-[#8c6a45]'].join(' ')} />
                          <div className="p-1"><div className="text-[7px] font-medium truncate">{['番茄炒蛋', '蒜蓉西兰花', '红烧茄子', '清蒸鲈鱼'][i]}</div></div>
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
              )}
            </div>
            <div className="flex items-center justify-around border-t border-[#e9e2d6] pt-1.5 pb-2 text-[7px] text-[#5f5f5f]">
              <span className="text-[#6f8663]">首页</span><span>分类</span><span>菜篮子</span><span>我的</span>
            </div>
          </div>
          <p className="mt-3 text-center text-xs text-[#8c8c8c]">预览展示模块效果，实际上线以后端配置为准。</p>
        </div>
      </div>
    </section>
  );
};
