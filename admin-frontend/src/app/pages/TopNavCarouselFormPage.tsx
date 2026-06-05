import { ArrowLeft, RefreshCw, Upload } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { getHomeTopNav, type HomeTopNav } from '../api';
import { Button } from '../components/Button';
import { DateRangePicker } from '../components/DateRangePicker';
import { loadTopNavContentConfig, saveCarouselItem, type CarouselItem } from './topNavContentStore';

const fieldInput = 'h-10 w-full rounded-lg border border-[#d9d2c6] bg-[#fffdfc] px-3 text-sm text-[#2f2f2f] outline-none transition focus:border-[#7a8b6f]';
const fieldLabel = 'text-sm font-medium text-[#4f4f4f]';

export const TopNavCarouselFormPage = () => {
  const { carouselId, id } = useParams();
  const navigate = useNavigate();
  const [nav, setNav] = useState<HomeTopNav | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const isEdit = Boolean(carouselId);
  const [title, setTitle] = useState(isEdit ? '今日家常好菜' : '');
  const [subtitle, setSubtitle] = useState(isEdit ? '番茄牛腩' : '');
  const [sortOrder, setSortOrder] = useState(isEdit ? 1 : 1);
  const [isEnabled, setIsEnabled] = useState(true);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [jumpType, setJumpType] = useState('菜谱详情');
  const [relation, setRelation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (!id) return;
    void getHomeTopNav(id)
      .then((item) => {
        setNav(item);
        const existing = carouselId ? loadTopNavContentConfig(id, item).carouselItems.find((row) => row.id === carouselId) : null;
        if (existing) {
          setTitle(existing.title);
          setSubtitle(existing.relation);
          setSortOrder(existing.sort);
          setIsEnabled(existing.status === 'online');
          setJumpType(existing.jumpType);
          setRelation(existing.relation);
        }
      })
      .catch(() => setNav(null));
  }, [carouselId, id]);

  const backToConfig = () => {
    if (!id) return navigate('/home-ops');
    navigate(`/home-ops/top-nav/${id}/content`);
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImagePreview(URL.createObjectURL(file));
  };

  const save = (enabled: boolean) => {
    if (!id || !nav) {
      setNotice('导航信息尚未加载完成');
      return;
    }
    if (!title.trim()) {
      setNotice('请先填写轮播图标题');
      return;
    }
    const current = loadTopNavContentConfig(id, nav);
    const nextItem: CarouselItem = {
      id: carouselId ?? `carousel_${Date.now()}`,
      title: title.trim(),
      jumpType,
      relation: relation.trim() || subtitle.trim() || '未配置',
      sort: Number.isFinite(sortOrder) && sortOrder > 0 ? sortOrder : current.carouselItems.length + 1,
      status: enabled ? 'online' : 'draft'
    };
    saveCarouselItem(id, nav, nextItem);
    setIsEnabled(enabled);
    setNotice(enabled ? '轮播图已保存并启用' : '轮播图草稿已保存');
    window.setTimeout(backToConfig, 500);
  };

  const navName = nav?.name ?? '当前导航';

  return (
    <section className="mx-auto max-w-[1540px] space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <button className="mb-4 inline-flex items-center text-sm text-[#5f5f5f] hover:text-[#2f2f2f]" onClick={backToConfig}>
            <ArrowLeft className="mr-2 h-4 w-4" /> 返回内容配置
          </button>
          <h1 className="text-[30px] font-semibold leading-tight tracking-tight text-[#2f2f2f]">{isEdit ? '编辑轮播图' : '新增轮播图'}</h1>
          <p className="mt-2 text-sm text-[#8c8c8c]">为「{navName}」顶部导航{isEdit ? '维护' : '新增'}轮播内容，配置展示图、跳转规则与启用状态。</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="ghost" className="h-11 min-w-[120px] rounded-lg border-[#d9d2c6] bg-[#fffdfc]" onClick={backToConfig}>取消</Button>
          <Button variant="ghost" className="h-11 min-w-[130px] rounded-lg border-[#d9d2c6] bg-[#fffdfc]" onClick={() => save(false)}>保存草稿</Button>
          <Button className="h-11 min-w-[140px] rounded-lg bg-[#5f7f56] hover:bg-[#526f4b]" onClick={() => save(true)}>保存并启用</Button>
        </div>
      </div>

      {notice ? <div className="rounded-2xl bg-[#eef3ea] px-5 py-4 text-sm text-[#5f7f56]">{notice}</div> : null}

      <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          <div className="rounded-2xl border border-[#e4ddd1] bg-[#fffdfc] p-5">
            <h2 className="mb-5 flex items-center gap-3 text-xl font-semibold text-[#2f2f2f]">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#7a8b6f] text-sm text-white">1</span>
              基础信息
            </h2>
            <div className="grid gap-4 lg:grid-cols-3">
              <label className={fieldLabel}>轮播图标题 <span className="text-red-500">*</span>
                <input className={`${fieldInput} mt-2`} value={title} maxLength={12} placeholder="请输入轮播图标题，建议 12 字以内" onChange={(event) => setTitle(event.target.value)} />
              </label>
              <label className={fieldLabel}>副标题
                <input className={`${fieldInput} mt-2`} value={subtitle} maxLength={20} placeholder="请输入副标题，建议 20 字以内" onChange={(event) => setSubtitle(event.target.value)} />
              </label>
              <label className={fieldLabel}>推荐时间段
                <DateRangePicker startDate={startDate} endDate={endDate} onStartChange={setStartDate} onEndChange={setEndDate} className="mt-2" />
              </label>
              <label className={fieldLabel}>所属导航 <span className="text-red-500">*</span>
                <input className={`${fieldInput} mt-2`} value={navName} readOnly />
              </label>
              <label className={fieldLabel}>展示位置 <span className="text-red-500">*</span>
                <select className={`${fieldInput} mt-2`} defaultValue="top_carousel"><option value="top_carousel">顶部轮播</option></select>
              </label>
              <label className={fieldLabel}>排序值 <span className="text-red-500">*</span>
                <input className={`${fieldInput} mt-2`} type="number" min={1} value={sortOrder} onChange={(event) => setSortOrder(Number(event.target.value))} />
              </label>
              <label className={`${fieldLabel} flex items-end gap-3`}>
                <span className="mb-2">启用状态</span>
                <button type="button" className={['mb-1 h-7 w-12 rounded-full p-1 transition', isEnabled ? 'bg-[#7a8b6f]' : 'bg-[#d9d2c6]'].join(' ')} onClick={() => setIsEnabled((value) => !value)}>
                  <span className={['block h-5 w-5 rounded-full bg-white transition', isEnabled ? 'ml-5' : 'ml-0'].join(' ')} />
                </button>
                <span className="mb-2 text-sm text-[#8c8c8c]">{isEnabled ? '已启用' : '已停用'}</span>
              </label>
            </div>
          </div>

          <div className="rounded-2xl border border-[#e4ddd1] bg-[#fffdfc] p-5">
            <h2 className="mb-5 flex items-center gap-3 text-xl font-semibold text-[#2f2f2f]">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#7a8b6f] text-sm text-white">2</span>
              图片与跳转
            </h2>
            <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
              <div>
                <div className={fieldLabel}>封面图 <span className="text-red-500">*</span></div>
                <label className="mt-2 flex h-40 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-[#d9d2c6] bg-[#f5f1ea] text-sm text-[#8c8c8c]">
                  {imagePreview ? <img src={imagePreview} alt="轮播图预览" className="h-full w-full object-cover" /> : <span className="inline-flex items-center gap-2"><Upload className="h-4 w-4" /> 上传封面图</span>}
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageChange} />
                </label>
                <p className="mt-2 text-xs text-[#8c8c8c]">建议尺寸 1200 × 600 px，格式 JPG / PNG / WEBP。</p>
              </div>
              <div className="grid gap-4">
                <label className={fieldLabel}>跳转类型 <span className="text-red-500">*</span>
                  <select className={`${fieldInput} mt-2`} value={jumpType} onChange={(event) => setJumpType(event.target.value)}>
                    <option value="菜谱详情">菜谱详情</option>
                    <option value="专题页">专题页</option>
                    <option value="分类页">分类页</option>
                    <option value="不跳转">不跳转</option>
                  </select>
                </label>
                <label className={fieldLabel}>关联内容 <span className="text-red-500">*</span>
                  <input className={`${fieldInput} mt-2`} value={relation} placeholder="请选择菜谱 / 专题 / 分类" onChange={(event) => setRelation(event.target.value)} />
                </label>
                <label className={fieldLabel}>说明文案 / 备注
                  <textarea className="mt-2 min-h-[82px] w-full rounded-lg border border-[#d9d2c6] bg-[#fffdfc] p-3 text-sm outline-none transition focus:border-[#7a8b6f]" placeholder="可填写该轮播图用途、活动说明、备注等信息" maxLength={200} />
                </label>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#d6decd] bg-[#eef3ea] px-5 py-4 text-sm text-[#5f7f56]">
            ⓘ 本页只配置轮播图基础信息、图片和跳转；展示样式沿用顶部导航统一样式。
          </div>
        </div>

        <div className="rounded-2xl border border-[#e4ddd1] bg-[#fffdfc] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#2f2f2f]">首页预览（实时效果）</h2>
            <button className="flex items-center gap-1 text-xs text-[#6f8663]" onClick={() => setNotice('首页预览已刷新')}><RefreshCw className="h-3 w-3" /> 刷新预览</button>
          </div>
          <div className="mx-auto w-full max-w-[330px] rounded-[2.4rem] border-[9px] border-[#1f1f1f] bg-[#fffdfc] p-4">
            <div className="flex items-center justify-between text-xs font-semibold"><span>9:41</span><span>▮▮▮ ))) ▰</span></div>
            <div className="mt-4 rounded-2xl bg-[#f5f1ea] px-4 py-3 text-sm text-[#8c8c8c]">⌕ 搜索菜谱、食材、做法 <span className="float-right">＋</span></div>
            <div className="mt-4 flex gap-7 overflow-hidden whitespace-nowrap text-sm">
              <span>推荐</span><span className="font-semibold text-[#6f8663] underline decoration-2 underline-offset-8">{navName}</span><span>快手菜</span><span>时令食材</span>
            </div>
            <div className="mt-5 overflow-hidden rounded-2xl bg-[#8c6a45] text-white">
              {imagePreview ? <img src={imagePreview} alt="轮播图预览" className="h-36 w-full object-cover opacity-90" /> : <div className="h-36 bg-[#8c6a45]" />}
              <div className="-mt-20 min-h-20 p-4">
                <div className="text-lg font-semibold">{title || `${navName}红烧排骨`}</div>
                <div className="mt-2 text-sm">{subtitle || '软嫩入味，百吃不厌的下饭菜。'}</div>
              </div>
              <div className="pb-3 text-center text-xs">● ● ●</div>
            </div>
            <div className="mt-5">
              <div className="flex items-center justify-between"><span className="font-semibold">为你推荐</span><span className="text-xs text-[#7a8b6f]">查看更多 ›</span></div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {['番茄炒蛋', '蒜蓉西兰花', '红烧茄子'].map((name, index) => <div key={name} className="overflow-hidden rounded-xl bg-[#f5f1ea]"><div className={['h-16', index === 0 ? 'bg-[#c27b48]' : index === 1 ? 'bg-[#a8b48a]' : 'bg-[#b7aea1]'].join(' ')} /><div className="truncate p-2 text-xs">{name}</div></div>)}
              </div>
            </div>
            <div className="mt-5 flex items-center justify-around border-t border-[#e9e2d6] pt-3 text-xs text-[#5f5f5f]">
              <span className="text-[#6f8663]">首页</span><span>食材</span><span>菜篮子</span><span>我的</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
