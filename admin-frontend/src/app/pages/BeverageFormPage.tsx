import type { ChangeEvent, ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { createBeverage, createCategory, getBeverage, listCategories, resolveAssetUrl, updateBeverage, uploadMedia, type Beverage, type BeverageWritePayload } from '../api';
import { Button } from '../components/Button';
import { ImageEditorUploader } from '../components/ImageEditorUploader';
import { Input } from '../components/Input';
import type { IngredientCategory } from '../types';

const beverageTypes = ['茶饮', '果汁', '乳饮', '咖啡', '啤酒', '红酒', '白酒', '黄酒', '无酒精饮品'];

type Draft = BeverageWritePayload;

const emptyDraft: Draft = {
  name: '',
  coverImage: null,
  categoryId: null,
  beverageType: '无酒精饮品',
  isAlcoholic: false,
  alcoholDegree: null,
  description: null,
  status: 'ACTIVE',
  sort: 0,
  sortOrder: 0,
  isPublish: true,
  isRecommend: false
};

const toDraft = (item: Beverage): Draft => ({
  name: item.name,
  coverImage: item.coverImage,
  categoryId: item.categoryId,
  beverageType: item.beverageType,
  isAlcoholic: item.isAlcoholic,
  alcoholDegree: item.alcoholDegree,
  description: item.description,
  status: item.status,
  sort: item.sort,
  sortOrder: item.sortOrder ?? item.sort,
  isPublish: item.isPublish,
  isRecommend: item.isRecommend
});

const ensureBeverageCategories = async () => {
  const result = await listCategories({ page: 1, pageSize: 100, type: 'BEVERAGE' });
  const existing = result.list.find((item) => item.name === '酒水饮品');
  if (existing) return result.list;

  const created = await createCategory({
    name: '酒水饮品',
    type: 'BEVERAGE',
    sort: 100,
    status: 'ACTIVE',
    isPublish: true
  });
  return [created, ...result.list];
};

export const BeverageFormPage = ({ mode }: { mode: 'create' | 'edit' }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [categories, setCategories] = useState<IngredientCategory[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [gallery, setGallery] = useState<string[]>([]);
  const [video, setVideo] = useState<string | null>(null);
  const [pairings, setPairings] = useState(['海鲜', '烧烤', '火锅']);
  const [notes, setNotes] = useState(['清爽入口，适合佐餐。', '建议冰镇后饮用。', '适合聚会、晚餐等场景。']);

  useEffect(() => {
    const load = async () => {
      const categoryResult = await ensureBeverageCategories();
      setCategories(categoryResult);
      if (mode === 'edit' && id) {
        const item = await getBeverage(id);
        setDraft(toDraft(item));
      } else {
        const beverageCategory = categoryResult.find((item) => item.name === '酒水饮品');
        setDraft((current) => ({ ...current, categoryId: beverageCategory?.id ?? null }));
      }
    };
    void load().catch((err) => setError(err instanceof Error ? err.message : '加载失败'));
  }, [id, mode]);

  const save = async (publish: boolean) => {
    const nextDraft = { ...draft, isPublish: publish, status: publish ? 'ACTIVE' as const : 'DISABLED' as const };
    if (!nextDraft.name.trim()) {
      setError('酒水名称必填');
      return;
    }
    if (!nextDraft.categoryId) {
      setError('酒水分类必选');
      return;
    }
    if (nextDraft.isAlcoholic && (nextDraft.alcoholDegree === null || Number.isNaN(Number(nextDraft.alcoholDegree)))) {
      setError('含酒精饮品必须填写酒精度数');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = { ...nextDraft, name: nextDraft.name.trim(), description: nextDraft.description?.trim() || null };
      if (mode === 'edit' && id) await updateBeverage(id, payload);
      else await createBeverage(payload);
      setNotice(publish ? '保存并发布成功' : '草稿已保存');
      window.setTimeout(() => navigate('/content/beverages', { replace: true }), 350);
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="mt-2 text-3xl font-semibold text-[#2f2f2f]">{mode === 'create' ? '新增酒水' : '编辑酒水'}</h1>
          <p className="mt-2 text-sm text-[#8c8c8c]">创建新的酒水内容，配置基础信息、图文素材、规格属性与发布状态。</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => navigate('/content/beverages')}>取消</Button>
          <Button variant="ghost" disabled={saving} onClick={() => void save(false)}>保存草稿</Button>
          <Button disabled={saving} onClick={() => void save(true)}>保存并发布</Button>
        </div>
      </div>
      {error ? <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
      {notice ? <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</div> : null}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid grid-cols-1 gap-5 2xl:grid-cols-2">
          <BeverageSection number={1} title="基础信息">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <BeverageField label="酒水名称 *"><Input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="请输入酒水名称" /></BeverageField>
              <BeverageField label="酒水副标题"><Input placeholder="请输入酒水副标题（可选）" /></BeverageField>
              <BeverageField label="酒水分类 *">
                <div className="flex flex-wrap gap-2">
                  {['白酒', '红酒', '啤酒', '鸡尾酒', '茶饮', '果汁', '咖啡', '乳饮'].map((item) => <button key={item} type="button" onClick={() => setDraft({ ...draft, beverageType: item })} className={['rounded-lg border px-4 py-2 text-sm', draft.beverageType === item ? 'border-[#6f8b62] bg-[#edf5ea] text-[#6f8b62]' : 'border-zinc-200 bg-white text-[#6f6a61]'].join(' ')}>{item}</button>)}
                </div>
              </BeverageField>
              <BeverageField label="酒水类型 *"><div className="flex h-10 items-center gap-8 text-sm"><label className="flex items-center gap-2"><input type="radio" checked={draft.isAlcoholic} onChange={() => setDraft({ ...draft, isAlcoholic: true })} />酒精饮品</label><label className="flex items-center gap-2"><input type="radio" checked={!draft.isAlcoholic} onChange={() => setDraft({ ...draft, isAlcoholic: false, alcoholDegree: null })} />非酒精饮品</label></div></BeverageField>
              <BeverageField label="产地"><Input placeholder="如：中国 / 法国 / 日本" /></BeverageField>
              <BeverageField label="品牌"><Input placeholder="如：茅台 / 拉菲 / 青岛" /></BeverageField>
              <BeverageField label="容量规格 *"><Input placeholder="如：330ml" /></BeverageField>
              <BeverageField label="酒精度 (%vol)"><Input type="number" disabled={!draft.isAlcoholic} value={draft.alcoholDegree ?? ''} onChange={(event) => setDraft({ ...draft, alcoholDegree: event.target.value === '' ? null : Number(event.target.value) })} placeholder="如：12" /></BeverageField>
              <BeverageField label="甜度"><Input placeholder="如：微甜" /></BeverageField>
              <BeverageField label="口感"><Input placeholder="如：清爽" /></BeverageField>
              <BeverageField label="发布状态 *"><div className="flex h-10 items-center gap-5 text-sm"><label className="flex items-center gap-2"><input type="radio" checked={!draft.isPublish} onChange={() => setDraft({ ...draft, isPublish: false })} />草稿</label><label className="flex items-center gap-2"><input type="radio" checked={draft.isPublish} onChange={() => setDraft({ ...draft, isPublish: true })} />发布</label></div></BeverageField>
              <BeverageField label="是否推荐"><label className="flex h-10 items-center gap-2 text-sm"><input type="checkbox" checked={draft.isRecommend} onChange={(event) => setDraft({ ...draft, isRecommend: event.target.checked })} />推荐到首页或用途位</label></BeverageField>
              <BeverageField label="酒水简介 / 描述 *" className="md:col-span-2"><textarea value={draft.description ?? ''} onChange={(event) => setDraft({ ...draft, description: event.target.value })} className="min-h-24 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none" placeholder="简要介绍酒水的产地、风味、特色、适用场景等..." /></BeverageField>
            </div>
          </BeverageSection>

          <BeverageSection number={2} title="封面与图文素材">
            <BeverageMediaSection coverUrl={draft.coverImage} images={gallery} video={video} tags={pairings.join('、')} onCoverChange={(coverImage) => setDraft({ ...draft, coverImage })} onImagesChange={setGallery} onVideoChange={setVideo} onTagsChange={(value) => setPairings(value.split(/[、,，]/).filter(Boolean))} />
          </BeverageSection>

          <BeverageSection number={3} title="规格与属性">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <BeverageField label="建议饮用温度"><Input placeholder="如：6-8°C" /></BeverageField>
              <BeverageField label="包装形式"><Input placeholder="如：瓶装" /></BeverageField>
              <BeverageField label="保质期"><Input placeholder="如：24个月" /></BeverageField>
              <BeverageField label="原料 / 配料" className="md:col-span-2"><textarea className="min-h-20 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none" placeholder="如：葡萄、水、酵母..." /></BeverageField>
              <BeverageField label="营养信息（可选）"><textarea className="min-h-20 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none" placeholder="如：每100ml含能量..." /></BeverageField>
              <BeverageField label="推荐搭配（最多5个）" className="md:col-span-3"><Input value={pairings.join('、')} onChange={(event) => setPairings(event.target.value.split(/[、,，]/).filter(Boolean))} placeholder="海鲜、烧烤、火锅、甜点、芝士" /></BeverageField>
            </div>
          </BeverageSection>

          <BeverageSection number={4} title="饮用说明 / 内容详情">
            <div className="space-y-3">
              {notes.map((note, index) => (
                <div key={index} className="grid grid-cols-[40px_1fr_72px_36px] items-center gap-3 rounded-2xl bg-[#f5f1ea] p-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white font-semibold">{index + 1}</span>
                  <Input value={note} onChange={(event) => setNotes(notes.map((item, i) => i === index ? event.target.value : item))} />
                  <SmallImageButton />
                  <button type="button" onClick={() => setNotes(notes.filter((_, i) => i !== index))} className="text-red-500">删</button>
                </div>
              ))}
              <Button type="button" variant="ghost" onClick={() => setNotes([...notes, ''])}>＋ 新增特点</Button>
            </div>
          </BeverageSection>

          <BeverageSection number={5} title="关联信息" className="2xl:col-span-2">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <BeverageField label="关联分类（可多选）"><Input value={pairings.join('、')} onChange={(event) => setPairings(event.target.value.split(/[、,，]/).filter(Boolean))} /></BeverageField>
              <BeverageField label="适用场景（可多选）"><div className="flex h-10 flex-wrap items-center gap-4 text-sm">{['聚会', '露营', '送礼', '佐餐', '独酌'].map((scene) => <label key={scene} className="flex items-center gap-2"><input type="checkbox" defaultChecked={['聚会', '佐餐'].includes(scene)} />{scene}</label>)}</div></BeverageField>
              <BeverageField label="关键词"><Input placeholder="清爽、聚会、冰镇" /></BeverageField>
              <BeverageField label="来源 / 作者"><Input placeholder="品牌官方 / 调酒师 / 自行创作" /></BeverageField>
              <BeverageField label="审核备注" className="md:col-span-2"><Input placeholder="给审核人员的备注信息..." /></BeverageField>
            </div>
          </BeverageSection>
        </div>

        <aside className="space-y-5 xl:sticky xl:top-6 xl:self-start">
          <BeveragePreview draft={draft} gallery={gallery} pairings={pairings} notes={notes} />
          <div className="rounded-3xl border border-[#e9e2d6] bg-[#fffdfc] p-5">
            <h2 className="text-lg font-semibold text-[#2f2f2f]">发布提示</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-[#6f6a61]">
              <li>• 发布后可被首页推荐、专题推荐等引用</li>
              <li>• 请确保封面清晰，图文素材丰富</li>
              <li>• 分类与标签将影响搜索与推荐效果</li>
            </ul>
          </div>
        </aside>
      </div>
    </section>
  );
};

const BeverageSection = ({ number, title, children, className = '' }: { number: number; title: string; children: ReactNode; className?: string }) => (
  <section className={`rounded-3xl border border-[#e9e2d6] bg-[#fffdfc] p-5 shadow-sm ${className}`}>
    <div className="mb-5 flex items-center gap-3">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#6f8b62] text-sm font-semibold text-white">{number}</span>
      <h2 className="text-lg font-semibold text-[#2f2f2f]">{title}</h2>
    </div>
    {children}
  </section>
);

const BeverageField = ({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) => (
  <label className={`block ${className}`}>
    <div className="mb-1.5 text-xs font-medium text-[#6f6a61]">{label}</div>
    {children}
  </label>
);

const BeverageMediaSection = ({
  coverUrl,
  images,
  video,
  tags,
  onCoverChange,
  onImagesChange,
  onVideoChange,
  onTagsChange
}: {
  coverUrl: string | null;
  images: string[];
  video: string | null;
  tags: string;
  onCoverChange: (url: string | null) => void;
  onImagesChange: (urls: string[]) => void;
  onVideoChange: (url: string | null) => void;
  onTagsChange: (value: string) => void;
}) => {
  return (
    <div className="space-y-5">
      <ImageEditorUploader coverUrl={coverUrl} images={images} max={8} onCoverChange={onCoverChange} onImagesChange={onImagesChange} />
      <div>
        <div className="mb-2 text-xs font-medium text-[#6f6a61]">视频链接 / 视频上传（可选）</div>
        <div className="grid grid-cols-[1fr_auto] gap-3">
          <Input value={video ?? ''} onChange={(event) => onVideoChange(event.target.value || null)} placeholder="粘贴视频链接或上传视频文件" />
          <BeverageVideoButton onUploaded={onVideoChange} />
        </div>
      </div>
      <BeverageField label="标签（最多选择5个）"><Input value={tags} onChange={(event) => onTagsChange(event.target.value)} /></BeverageField>
    </div>
  );
};

const BeverageVideoButton = ({ onUploaded }: { onUploaded: (url: string | null) => void }) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await uploadMedia(file);
      if (uploaded.type === 'video') onUploaded(uploaded.url);
    } finally {
      setUploading(false);
    }
  };
  return <><input ref={inputRef} type="file" accept="video/mp4,video/quicktime,video/webm" className="hidden" onChange={(event) => void handleFile(event)} /><Button type="button" variant="ghost" disabled={uploading} onClick={() => inputRef.current?.click()}>{uploading ? '上传中...' : '上传视频'}</Button></>;
};

const SmallImageButton = () => (
  <button type="button" className="flex h-12 w-12 items-center justify-center rounded-xl border border-dashed border-[#d8cebe] bg-white text-lg text-[#6f8b62]">+</button>
);

const BeveragePreview = ({ draft, gallery, pairings, notes }: { draft: Draft; gallery: string[]; pairings: string[]; notes: string[] }) => {
  const cover = resolveAssetUrl(draft.coverImage);
  return (
    <div className="rounded-3xl border border-[#e9e2d6] bg-[#fffdfc] p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold text-[#2f2f2f]">内容预览</h2><button type="button" className="rounded-xl border border-[#e9e2d6] bg-white px-3 py-1.5 text-xs text-[#6f8b62]">刷新预览</button></div>
      <div className="overflow-hidden rounded-[28px] border-[10px] border-[#232323] bg-white">
        <div className="flex items-center justify-between px-4 py-3 text-xs font-semibold"><span>9:41</span><span>•••</span></div>
        <div className="h-40 bg-[#f5f1ea]">{cover ? <img src={cover} alt={draft.name || '酒水封面'} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-sm text-[#8c8c8c]">封面预览</div>}</div>
        <div className="space-y-4 p-4">
          <div className="flex items-start justify-between gap-3"><h3 className="text-xl font-semibold text-[#2f2f2f]">{draft.name || '青柠薄荷气泡酒'}</h3><span className="text-2xl text-[#6f8b62]">☆</span></div>
          <div className="flex flex-wrap gap-2 text-xs">{[draft.beverageType || '微醺', '聚会', '清爽', '经典'].map((tag) => <span key={tag} className="rounded-full bg-[#edf5ea] px-2.5 py-1 text-[#6f8b62]">{tag}</span>)}</div>
          <div className="flex gap-4 text-xs text-[#6f6a61]"><span>{draft.alcoholDegree ?? 4.5}% vol</span><span>330ml</span><span>建议 6-8°C 饮用</span></div>
          <p className="text-sm leading-6 text-[#6f6a61]">{draft.description || '清新青柠与薄荷的碰撞，气泡细腻活泼，清爽解腻，适合聚会与日常小酌。'}</p>
          <div className="grid grid-cols-2 gap-y-2 text-sm text-[#6f6a61]">{['类型', draft.isAlcoholic ? '酒精饮品' : '非酒精饮品', '产地', '中国', '品牌', '微醺工坊', '保质期', '12个月'].map((item, index) => <span key={`${item}-${index}`} className={index % 2 ? 'text-[#2f2f2f]' : ''}>{item}</span>)}</div>
          <div><h4 className="mb-2 text-sm font-semibold text-[#2f2f2f]">推荐搭配</h4><div className="grid grid-cols-4 gap-2">{(gallery.length ? gallery : [null, null, null, null]).slice(0, 4).map((url, index) => { const src = resolveAssetUrl(url); return <div key={index} className="h-12 rounded-lg bg-[#f5f1ea]">{src ? <img src={src} alt="推荐搭配" className="h-full w-full rounded-lg object-cover" /> : null}</div>; })}</div></div>
          <div className="space-y-1 text-xs text-[#6f6a61]">{notes.slice(0, 2).map((note, index) => <div key={index}>• {note}</div>)}</div>
          <button type="button" className="h-11 w-full rounded-xl bg-[#6f8b62] text-sm font-semibold text-white">加入菜篮子</button>
        </div>
      </div>
    </div>
  );
};
