import { ArrowLeft, RefreshCw, Upload } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  createHeroBanner,
  getHeroBanner,
  getHomeTopNav,
  updateHeroBanner,
  uploadImage,
  resolveAssetUrl,
  type BannerStatus,
  type HeroBannerImageFocus,
  type HeroBannerPayload,
  type HeroBannerTargetType,
  type HomeTopNav
} from '../api';
import { Button } from '../components/Button';

const plusIconUrl = new URL('../assets/icons/icon_plus.svg', import.meta.url).href;
const searchIconUrl = new URL('../assets/icons/icon_search.svg', import.meta.url).href;

const fieldInput = 'h-10 w-full rounded-lg border border-[#d9d2c6] bg-[#fffdfc] px-3 text-sm text-[#2f2f2f] outline-none transition focus:border-[#7a8b6f]';
const fieldLabel = 'text-sm font-medium text-[#4f4f4f]';
const sectionClass = 'rounded-2xl border border-[#e4ddd1] bg-[#fffdfc] p-5';

const targetTypeOptions: { label: string; value: HeroBannerTargetType }[] = [
  { label: '菜谱', value: 'RECIPE' },
  { label: '专题', value: 'TOPIC' },
  { label: '分类', value: 'CATEGORY' },
  { label: '自定义链接', value: 'URL' },
  { label: '无跳转', value: 'NONE' }
];

const imageFocusOptions: { label: string; value: HeroBannerImageFocus }[] = [
  { label: '居中对齐', value: 'center' },
  { label: '左侧对齐', value: 'left' },
  { label: '右侧对齐', value: 'right' }
];

const emptyDraft = {
  title: '',
  subtitle: '',
  buttonText: '查看菜谱',
  cover: '',
  imageFocus: 'center' as HeroBannerImageFocus,
  targetType: 'NONE' as HeroBannerTargetType,
  targetId: '',
  targetTitleSnapshot: '',
  link: '',
  sortOrder: 1,
  status: 'DRAFT' as BannerStatus,
  startAt: '',
  endAt: '',
  remark: ''
};

const toDateTimeInput = (value: string | null | undefined) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

export const TopNavCarouselFormPage = () => {
  const { carouselId, id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(carouselId);

  const [nav, setNav] = useState<HomeTopNav | null>(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const carouselApiNavId = nav?.legacyId ? String(nav.legacyId) : id;

  const loadNav = async () => {
    if (!id) return;
    const item = await getHomeTopNav(id);
    setNav(item);
  };

  const loadBanner = async (navId: string) => {
    if (!carouselId) return;
    try {
      const banner = await getHeroBanner(navId, Number(carouselId));
      setDraft({
        title: banner.title,
        subtitle: banner.subtitle ?? '',
        buttonText: banner.buttonText ?? '查看菜谱',
        cover: banner.cover,
        imageFocus: banner.imageFocus as HeroBannerImageFocus,
        targetType: banner.targetType as HeroBannerTargetType,
        targetId: banner.targetId ?? '',
        targetTitleSnapshot: banner.targetTitleSnapshot ?? '',
        link: banner.link ?? '',
        sortOrder: banner.sortOrder,
        status: banner.status as BannerStatus,
        startAt: toDateTimeInput(banner.startAt),
        endAt: toDateTimeInput(banner.endAt),
        remark: banner.remark ?? ''
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载轮播图失败');
    }
  };

  useEffect(() => {
    void loadNav().catch((err) => setError(err instanceof Error ? err.message : '加载导航失败'));
  }, [id]);

  useEffect(() => {
    if (carouselApiNavId && nav) void loadBanner(carouselApiNavId);
  }, [carouselApiNavId, nav]);

  const set = <K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadImage(file);
      set('cover', result.url);
      setNotice('图片上传成功');
    } catch (err) {
      setError(err instanceof Error ? err.message : '图片上传失败');
    } finally {
      setUploading(false);
    }
  };

  const validate = (): string | null => {
    if (!draft.title.trim()) return '请输入轮播图标题';
    if (draft.title.trim().length > 12) return '标题建议在12字以内';
    if (draft.subtitle.trim().length > 20) return '副标题建议在20字以内';
    if (!draft.cover) return '请上传封面图';
    if (!draft.targetType) return '请选择跳转类型';
    if (['RECIPE', 'TOPIC', 'CATEGORY'].includes(draft.targetType) && !draft.targetId.trim()) return '当前跳转类型下，跳转ID为必填';
    if (draft.targetType === 'URL' && !draft.link.trim()) return '自定义链接为必填';
    if (!Number.isFinite(draft.sortOrder) || draft.sortOrder < 1) return '排序值必须为大于等于1的数字';
    if (draft.endAt && draft.startAt && new Date(draft.endAt) < new Date(draft.startAt)) return '结束时间不能早于开始时间';
    return null;
  };

  const toPayload = (status: BannerStatus): HeroBannerPayload => ({
    title: draft.title.trim(),
    subtitle: draft.subtitle.trim() || null,
    buttonText: draft.buttonText.trim() || null,
    cover: draft.cover,
    imageFocus: draft.imageFocus,
    targetType: draft.targetType,
    targetId: draft.targetId.trim() || null,
    targetTitleSnapshot: draft.targetTitleSnapshot.trim() || null,
    link: draft.link.trim() || null,
    sortOrder: draft.sortOrder,
    status,
    startAt: draft.startAt ? new Date(draft.startAt).toISOString() : null,
    endAt: draft.endAt ? new Date(draft.endAt).toISOString() : null,
    remark: draft.remark.trim() || null
  });

  const save = async (status: BannerStatus) => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    if (!id) return;
    setSaving(true);
    setError(null);
    try {
      const payload = toPayload(status);
      const apiNavId = carouselApiNavId ?? id;
      if (!apiNavId) return;
      if (isEdit && carouselId) {
        await updateHeroBanner(apiNavId, Number(carouselId), payload);
      } else {
        await createHeroBanner(apiNavId, payload);
      }
      const labelMap: Record<BannerStatus, string> = { DRAFT: '草稿已保存', ENABLED: '已保存并启用', DISABLED: '已保存并停用' };
      setNotice(labelMap[status]);
      setDraft((prev) => ({ ...prev, status }));
      if (!isEdit) window.setTimeout(backToConfig, 500);
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

  const navName = nav?.name ?? '当前导航';
  const coverPreviewUrl = draft.cover ? resolveAssetUrl(draft.cover) : null;
  const needsTargetId = ['RECIPE', 'TOPIC', 'CATEGORY'].includes(draft.targetType);
  const needsLink = draft.targetType === 'URL';

  const mobilePreview = useMemo(() => {
    const statusLabelMap: Record<string, { text: string; color: string }> = {
      DRAFT: { text: '草稿', color: 'bg-amber-50 text-amber-700 border-amber-200' },
      ENABLED: { text: '已启用', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      DISABLED: { text: '已停用', color: 'bg-zinc-100 text-zinc-600 border-zinc-200' }
    };
    const sl = statusLabelMap[draft.status] ?? statusLabelMap.DRAFT;
    const focusMap: Record<string, string> = { left: 'left center', center: 'center center', right: 'right center' };
    return { statusLabel: sl, objectPosition: focusMap[draft.imageFocus] ?? 'center center' };
  }, [draft.status, draft.imageFocus]);

  return (
    <section className="mx-auto max-w-[1540px] space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <button className="mb-4 inline-flex items-center text-sm text-[#5f5f5f] hover:text-[#2f2f2f]" onClick={backToConfig}>
            <ArrowLeft className="mr-2 h-4 w-4" /> 返回配置内容
          </button>
          <h1 className="text-[30px] font-semibold leading-tight tracking-tight text-[#2f2f2f]">
            {isEdit ? '编辑轮播图' : '新增轮播图'}
          </h1>
          <p className="mt-2 text-sm text-[#8c8c8c]">
            为「{navName}」顶部导航{isEdit ? '维护' : '新增'}轮播内容，绑定当前导航，配置展示图、跳转规则与启用状态。
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="ghost" className="h-11 min-w-[120px] rounded-lg border-[#d9d2c6] bg-[#fffdfc]" onClick={backToConfig}>取消</Button>
          <Button variant="ghost" className="h-11 min-w-[130px] rounded-lg border-[#d9d2c6] bg-[#fffdfc]" disabled={saving} onClick={() => save('DRAFT')}>
            保存草稿
          </Button>
          <Button className="h-11 min-w-[140px] rounded-lg bg-[#5f7f56] hover:bg-[#526f4b]" disabled={saving} onClick={() => save('ENABLED')}>
            {saving ? '保存中...' : '保存并启用'}
          </Button>
        </div>
      </div>

      {notice ? <div className="rounded-2xl bg-[#eef3ea] px-5 py-4 text-sm text-[#5f7f56]">{notice}</div> : null}
      {error ? <div className="rounded-2xl bg-red-50 px-5 py-4 text-sm text-red-700">{error}</div> : null}

      <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          {/* 1. 基础信息 */}
          <div className={sectionClass}>
            <h2 className="mb-5 flex items-center gap-3 text-xl font-semibold text-[#2f2f2f]">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#7a8b6f] text-sm text-white">1</span>
              基础信息
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="md:col-span-2">
                <span className={fieldLabel}>轮播图标题 <span className="text-red-500">*</span></span>
                <input className={`${fieldInput} mt-2`} value={draft.title} maxLength={120} placeholder="建议12字以内" onChange={(event) => set('title', event.target.value)} />
              </label>
              <label>
                <span className={fieldLabel}>副标题</span>
                <input className={`${fieldInput} mt-2`} value={draft.subtitle} maxLength={160} placeholder="建议20字以内" onChange={(event) => set('subtitle', event.target.value)} />
              </label>
              <label>
                <span className={fieldLabel}>按钮文案</span>
                <input className={`${fieldInput} mt-2`} value={draft.buttonText} maxLength={32} placeholder="默认：查看菜谱" onChange={(event) => set('buttonText', event.target.value)} />
              </label>
              <label>
                <span className={fieldLabel}>所属导航 <span className="text-red-500">*</span></span>
                <input className={`${fieldInput} mt-2 bg-[#f5f1ea]`} value={navName} readOnly />
              </label>
              <label>
                <span className={fieldLabel}>展示位置 <span className="text-red-500">*</span></span>
                <select className={`${fieldInput} mt-2 bg-[#f5f1ea]`} disabled>
                  <option>HOME_HERO_CAROUSEL / 顶部轮播</option>
                </select>
              </label>
              <label>
                <span className={fieldLabel}>排序值 <span className="text-red-500">*</span></span>
                <input className={`${fieldInput} mt-2`} type="number" min={1} value={draft.sortOrder} onChange={(event) => set('sortOrder', Number(event.target.value))} />
              </label>
              <label>
                <span className={fieldLabel}>状态 <span className="text-red-500">*</span></span>
                <select className={`${fieldInput} mt-2`} value={draft.status} onChange={(event) => set('status', event.target.value as BannerStatus)}>
                  <option value="DRAFT">DRAFT - 草稿</option>
                  <option value="ENABLED">ENABLED - 已启用</option>
                  <option value="DISABLED">DISABLED - 已停用</option>
                </select>
              </label>
              <label>
                <span className={fieldLabel}>开始时间</span>
                <input className={`${fieldInput} mt-2`} type="datetime-local" value={draft.startAt} onChange={(event) => set('startAt', event.target.value)} />
              </label>
              <label>
                <span className={fieldLabel}>结束时间</span>
                <input className={`${fieldInput} mt-2`} type="datetime-local" value={draft.endAt} onChange={(event) => set('endAt', event.target.value)} />
              </label>
              <label className="md:col-span-2">
                <span className={fieldLabel}>备注</span>
                <textarea className="mt-2 min-h-[80px] w-full rounded-lg border border-[#d9d2c6] bg-[#fffdfc] p-3 text-sm outline-none transition focus:border-[#7a8b6f]" value={draft.remark} maxLength={255} placeholder="备注仅后台使用，不展示到C端" onChange={(event) => set('remark', event.target.value)} />
              </label>
            </div>
          </div>

          {/* 2. 图片与跳转 */}
          <div className={sectionClass}>
            <h2 className="mb-5 flex items-center gap-3 text-xl font-semibold text-[#2f2f2f]">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#7a8b6f] text-sm text-white">2</span>
              图片与跳转
            </h2>
            <div className="grid gap-5 lg:grid-cols-2">
              <div>
                <div className={fieldLabel}>封面图 <span className="text-red-500">*</span></div>
                <label className="mt-2 flex h-56 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-[#d9d2c6] bg-[#f5f1ea] text-sm text-[#8c8c8c]">
                  {uploading ? (
                    <span>上传中...</span>
                  ) : coverPreviewUrl ? (
                    <img src={coverPreviewUrl} alt="封面图预览" className="h-full w-full object-cover" />
                  ) : (
                    <span className="inline-flex items-center gap-2"><Upload className="h-4 w-4" /> 上传封面图</span>
                  )}
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => { void handleImageUpload(event); }} />
                </label>
                <div className="mt-2 rounded-lg bg-[#eef3ea] p-3 text-xs text-[#5f7f56] leading-relaxed">
                  <p className="font-medium mb-1">📐 推荐上传尺寸</p>
                  <p>推荐尺寸：1200 × 1558px</p>
                  <p>最低尺寸：900 × 1168px</p>
                  <p>图片比例：约 393:510</p>
                  <p>格式：JPG / PNG / WEBP</p>
                  <p>建议小于 2MB</p>
                  <p className="mt-1 text-[#8c8c8c]">此为后台上传高清原图尺寸，C端展示会自动裁切</p>
                </div>
              </div>
              <div className="grid gap-4">
                <label>
                  <span className={fieldLabel}>图片焦点</span>
                  <select className={`${fieldInput} mt-2`} value={draft.imageFocus} onChange={(event) => set('imageFocus', event.target.value as HeroBannerImageFocus)}>
                    {imageFocusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
                <label>
                  <span className={fieldLabel}>跳转类型 <span className="text-red-500">*</span></span>
                  <select className={`${fieldInput} mt-2`} value={draft.targetType} onChange={(event) => set('targetType', event.target.value as HeroBannerTargetType)}>
                    {targetTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
                {needsTargetId && (
                  <>
                    <label>
                      <span className={fieldLabel}>跳转 ID <span className="text-red-500">*</span></span>
                      <input className={`${fieldInput} mt-2`} value={draft.targetId} placeholder="菜谱 / 专题 / 分类 ID" onChange={(event) => set('targetId', event.target.value)} />
                    </label>
                    <label>
                      <span className={fieldLabel}>关联内容标题快照</span>
                      <input className={`${fieldInput} mt-2`} value={draft.targetTitleSnapshot} maxLength={120} placeholder="用于后台列表展示，选填" onChange={(event) => set('targetTitleSnapshot', event.target.value)} />
                    </label>
                  </>
                )}
                {needsLink && (
                  <label>
                    <span className={fieldLabel}>自定义链接 <span className="text-red-500">*</span></span>
                    <input className={`${fieldInput} mt-2`} value={draft.link} placeholder="https://..." onChange={(event) => set('link', event.target.value)} />
                  </label>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#d6decd] bg-[#eef3ea] px-5 py-4 text-sm text-[#5f7f56]">
            ⓘ 轮播图绑定当前导航「{navName}」，C端根据当前导航Tab展示对应轮播图。草稿和已停用状态不会在C端展示。
          </div>
        </div>

        {/* 右侧预览 */}
        <div className="rounded-2xl border border-[#e4ddd1] bg-[#fffdfc] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#2f2f2f]">C端轮播图预览</h2>
            <button className="flex items-center gap-1 text-xs text-[#6f8663]" onClick={() => setNotice('预览已刷新')}>
              <RefreshCw className="h-3 w-3" /> 刷新预览
            </button>
          </div>
          <div className="mx-auto w-full max-w-[196px] overflow-hidden rounded-[1.2rem] border-[5px] border-[#1f1f1f] bg-[#fffdfc]">
            {/* 搜索栏 */}
            <div className="mx-2 mt-2 flex items-center gap-1.5">
              <div className="flex min-w-0 flex-1 items-center gap-1 rounded-lg bg-[#f5f1ea] px-2 py-1.5 text-[9px] text-[#8c8c8c]">
                <span
                  className="h-2.5 w-2.5 shrink-0 bg-current"
                  style={{
                    WebkitMask: `url(${searchIconUrl}) center / contain no-repeat`,
                    mask: `url(${searchIconUrl}) center / contain no-repeat`
                  }}
                  aria-hidden="true"
                />
                <span className="truncate">搜索菜谱、食材</span>
              </div>
              <button type="button" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#7a8b6f] text-[#fffdfc]">
                <span
                  className="h-3.5 w-3.5 bg-current"
                  style={{
                    WebkitMask: `url(${plusIconUrl}) center / contain no-repeat`,
                    mask: `url(${plusIconUrl}) center / contain no-repeat`
                  }}
                  aria-hidden="true"
                />
              </button>
            </div>
            {/* 导航Tab */}
            <div className="mt-2 mx-2 flex gap-2 overflow-hidden whitespace-nowrap text-[8px]">
              <span>推荐</span>
              <span className="font-semibold text-[#6f8663] underline decoration-1 underline-offset-4">{navName}</span>
              <span>快手菜</span>
            </div>
            {/* 轮播图区域 */}
            <div className="mt-2 overflow-hidden" style={{ height: 255 }}>
              {coverPreviewUrl ? (
                <div className="relative h-full w-full">
                  <img
                    src={coverPreviewUrl}
                    alt="轮播图预览"
                    className="h-full w-full object-cover"
                    style={{ objectPosition: mobilePreview.objectPosition }}
                  />
                  <div className="absolute inset-0 flex flex-col justify-end p-3 bg-gradient-to-t from-black/60 via-transparent to-transparent">
                    {draft.title && <span className="text-white text-[11px] font-bold leading-tight">{draft.title}</span>}
                    {draft.subtitle && <span className="text-white/90 text-[8px] mt-1 leading-tight">{draft.subtitle}</span>}
                    {draft.buttonText && (
                      <span className="mt-1.5 inline-block self-start rounded px-2 py-0.5 bg-white/90 text-[8px] font-semibold text-[#2f2f2f]">
                        {draft.buttonText}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[#8c6a45]/20 text-[9px] text-[#8c8c8c]">
                  请上传封面图
                </div>
              )}
            </div>
            {/* 状态标签 */}
            <div className="mx-2 my-2">
              <span className={`inline-block rounded-full px-2 py-0.5 text-[8px] border ${mobilePreview.statusLabel.color}`}>
                {mobilePreview.statusLabel.text}
              </span>
            </div>
            {/* 内容模块占位 */}
            <div className="mx-2 mt-1 mb-2">
              <div className="flex items-center justify-between text-[8px]">
                <span className="font-semibold">为你推荐</span>
                <span className="text-[#7a8b6f]">查看更多 ›</span>
              </div>
              <div className="mt-1.5 grid grid-cols-3 gap-1">
                {['番茄炒蛋', '蒜蓉西兰花', '红烧茄子'].map((name, i) => (
                  <div key={name} className="overflow-hidden rounded-md bg-[#f5f1ea]">
                    <div className={['h-8', i === 0 ? 'bg-[#c27b48]' : i === 1 ? 'bg-[#a8b48a]' : 'bg-[#b7aea1]'].join(' ')} />
                    <div className="truncate p-1 text-[7px]">{name}</div>
                  </div>
                ))}
              </div>
            </div>
            {/* 底部导航 */}
            <div className="flex items-center justify-around border-t border-[#e9e2d6] pt-1.5 pb-2 text-[7px] text-[#5f5f5f]">
              <span className="text-[#6f8663]">首页</span><span>食材</span><span>菜篮子</span><span>我的</span>
            </div>
          </div>
          <p className="mt-3 text-center text-xs text-[#8c8c8c]">按C端 393×510px 等比例缩小，实时跟随表单</p>
        </div>
      </div>
    </section>
  );
};
