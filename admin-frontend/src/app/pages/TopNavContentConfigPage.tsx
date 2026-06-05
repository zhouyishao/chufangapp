import { ArrowLeft, Eye, Plus, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  getHomeTopNav,
  updateHomeTopNav,
  type HomeTopNav,
  type HomeTopNavPayload
} from '../api';
import { Button } from '../components/Button';
import { StatusTag } from '../components/StatusTag';
import { loadTopNavContentConfig, saveTopNavContentConfig, type CarouselItem, type ConfigStatus, type ModuleItem } from './topNavContentStore';

const statusLabelMap = {
  online: '已启用',
  draft: '草稿',
  offline: '已停用'
} as const;

const toPayload = (item: HomeTopNav): HomeTopNavPayload => ({
  name: item.name,
  alias: item.alias ?? '',
  navType: item.navType,
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
  contentRule: item.contentRule ?? {
    sourceType: 'category',
    difficultyFilter: 'all',
    durationFilter: 'all',
    cookingMethodFilter: 'all',
    displayCount: 6,
    sortRule: 'comprehensive',
    moreButtonText: '查看更多',
    jumpRule: 'nav_content_list'
  },
  style: item.style ?? {
    navStyle: 'text_tab',
    activeStyle: 'underline',
    layoutMode: 'fixed',
    textColor: '#666666',
    activeTextColor: '#7A8B6F',
    showDivider: true,
    tabGap: 'medium',
    reserveSpace: false
  }
});

const reorderById = <T extends { id: string; sort: number }>(rows: T[], activeId: string, targetId: string) => {
  const activeIndex = rows.findIndex((row) => row.id === activeId);
  const targetIndex = rows.findIndex((row) => row.id === targetId);
  if (activeIndex < 0 || targetIndex < 0 || activeIndex === targetIndex) return rows;
  const next = [...rows];
  const [active] = next.splice(activeIndex, 1);
  next.splice(targetIndex, 0, active);
  return next.map((row, index) => ({ ...row, sort: index + 1 }));
};

export const TopNavContentConfigPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [nav, setNav] = useState<HomeTopNav | null>(null);
  const [draft, setDraft] = useState<HomeTopNavPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [carouselItems, setCarouselItems] = useState<CarouselItem[]>([]);
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [dragging, setDragging] = useState<{ type: 'carousel' | 'module'; id: string } | null>(null);
  const [dragOver, setDragOver] = useState<{ type: 'carousel' | 'module'; id: string } | null>(null);

  const selectedRelation = draft?.relations[0] ?? null;

  const load = async () => {
    if (!id) return;
    setError(null);
    const item = await getHomeTopNav(id);
    setNav(item);
    setDraft(toPayload(item));
  };

  useEffect(() => {
    void load().catch((err) => setError(err instanceof Error ? err.message : '加载失败'));
  }, [id]);

  useEffect(() => {
    if (!nav) return;
    const contentConfig = loadTopNavContentConfig(nav.id, nav);
    setCarouselItems(contentConfig.carouselItems);
    setModules(contentConfig.modules);
    setActiveModuleId(contentConfig.modules[0]?.id ?? null);
  }, [nav]);

  const persistContentRows = (nextCarouselItems: CarouselItem[], nextModules: ModuleItem[]) => {
    if (!id) return;
    saveTopNavContentConfig(id, { carouselItems: nextCarouselItems, modules: nextModules });
  };

  const save = async () => {
    if (!id || !draft) return;
    if (!draft.relations.length) return setError('请先选择关联内容');
    setSaving(true);
    setError(null);
    try {
      await updateHomeTopNav(id, draft);
      setNotice('内容配置已保存');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const addCarousel = () => {
    if (!id) return;
    navigate(`/home-ops/top-nav/${id}/content/carousels/new`);
  };

  const addModule = () => {
    if (!id) return;
    navigate(`/home-ops/top-nav/${id}/content/modules/new`);
  };

  const toggleCarouselStatus = (item: CarouselItem) => {
    setCarouselItems((rows) => {
      const nextRows = rows.map((row) => {
        const nextStatus: ConfigStatus = row.status === 'online' ? 'offline' : 'online';
        return row.id === item.id ? { ...row, status: nextStatus } : row;
      });
      persistContentRows(nextRows, modules);
      return nextRows;
    });
    setNotice(item.status === 'online' ? `「${item.title}」已停用` : `「${item.title}」已启用`);
  };

  const toggleModuleStatus = (item: ModuleItem) => {
    setModules((rows) => {
      const nextRows = rows.map((row) => {
        const nextStatus: ConfigStatus = row.status === 'online' ? 'offline' : 'online';
        return row.id === item.id ? { ...row, status: nextStatus } : row;
      });
      persistContentRows(carouselItems, nextRows);
      return nextRows;
    });
    setNotice(item.status === 'online' ? `「${item.name}」已停用` : `「${item.name}」已启用`);
  };

  const deleteCarousel = (item: CarouselItem) => {
    if (item.status === 'online') return;
    if (!window.confirm(`确认删除「${item.title}」？`)) return;
    setCarouselItems((rows) => {
      const nextRows = rows.filter((row) => row.id !== item.id).map((row, index) => ({ ...row, sort: index + 1 }));
      persistContentRows(nextRows, modules);
      return nextRows;
    });
    setNotice('轮播图已删除');
  };

  const deleteModule = (item: ModuleItem) => {
    if (item.status === 'online') return;
    if (!window.confirm(`确认删除「${item.name}」？`)) return;
    setModules((rows) => {
      const nextRows = rows.filter((row) => row.id !== item.id).map((row, index) => ({ ...row, sort: index + 1 }));
      persistContentRows(carouselItems, nextRows);
      return nextRows;
    });
    setNotice('内容模块已删除');
  };

  const handleDrop = (type: 'carousel' | 'module', targetId: string) => {
    if (!dragging || dragging.type !== type) return;
    if (type === 'carousel') {
      setCarouselItems((rows) => {
        const nextRows = reorderById(rows, dragging.id, targetId);
        persistContentRows(nextRows, modules);
        return nextRows;
      });
      setNotice('轮播图排序已更新');
    } else {
      setModules((rows) => {
        const nextRows = reorderById(rows, dragging.id, targetId);
        persistContentRows(carouselItems, nextRows);
        return nextRows;
      });
      setNotice('内容模块排序已更新');
    }
    setDragging(null);
    setDragOver(null);
  };

  if (!draft || !nav) {
    return (
      <section className="rounded-3xl border border-[#e9e2d6] bg-[#fffdfc] p-8 text-sm text-[#8c8c8c]">
        {error ?? '加载中...'}
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-[1540px] space-y-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-[30px] font-semibold leading-tight tracking-tight text-[#2f2f2f]">{nav.name}内容配置</h1>
          <div className="mt-4 grid gap-3 rounded-2xl border border-[#e4ddd1] bg-[#fffdfc] px-5 py-4 text-sm text-[#5f5f5f] md:grid-cols-5">
            <span>导航名称：<b className="text-[#6f8663]">{nav.name}</b></span>
            <span>导航类型：{nav.navTypeText ?? nav.navType}</span>
            <span>关联内容：{selectedRelation?.relationName ?? '-'}</span>
            <span>状态：<b className="text-[#6f8663]">{statusLabelMap[nav.status]}</b></span>
            <span>排序：{nav.sortOrder}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="ghost" className="h-11 rounded-lg border-[#d9d2c6] bg-[#fffdfc]" onClick={() => navigate('/home-ops')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> 返回导航管理
          </Button>
          <Button variant="ghost" className="h-11 rounded-lg border-[#d9d2c6] bg-[#fffdfc]" onClick={() => setNotice('已刷新首页预览')}>
            <Eye className="mr-2 h-4 w-4" /> 预览首页
          </Button>
          <Button className="h-11 min-w-[160px] rounded-lg bg-[#5f7f56] hover:bg-[#526f4b]" disabled={saving} onClick={() => void save()}>
            保存配置
          </Button>
        </div>
      </div>

      {notice ? <div className="rounded-2xl bg-[#eef3ea] px-5 py-4 text-sm text-[#5f7f56]">{notice}</div> : null}
      {error ? <div className="rounded-2xl bg-red-50 px-5 py-4 text-sm text-red-700">{error}</div> : null}

      <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          <div className="rounded-2xl border border-[#e4ddd1] bg-[#fffdfc] p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[#2f2f2f]">轮播图设置</h2>
              <div className="flex items-center gap-3 text-sm text-[#5f5f5f]">
                是否启用轮播图
                <span className="h-6 w-11 rounded-full bg-[#7a8b6f] p-1"><span className="ml-auto block h-4 w-4 rounded-full bg-white" /></span>
                <Button className="h-9 rounded-lg bg-[#6f8663]" onClick={addCarousel}><Plus className="mr-1 h-4 w-4" /> 新增轮播图</Button>
              </div>
            </div>
            <table className="w-full min-w-[760px] border-separate border-spacing-0 text-sm">
              <thead className="text-[#5f5f5f]">
                <tr>{['标题', '跳转类型', '关联内容', '排序', '状态', '操作'].map((title) => (
                  <th
                    key={title}
                    className={[
                      'border-b border-[#e9e2d6] px-4 py-3 text-left',
                      title === '操作' ? 'sticky right-0 z-20 bg-[#fffdfc] shadow-[-12px_0_18px_-18px_rgba(47,47,47,0.45)]' : ''
                    ].join(' ')}
                  >
                    {title}
                  </th>
                ))}</tr>
              </thead>
              <tbody>
                {carouselItems.map((item) => (
                  <tr
                    key={item.id}
                    onDragOver={(event) => {
                      event.preventDefault();
                      setDragOver({ type: 'carousel', id: item.id });
                    }}
                    onDragEnd={() => {
                      setDragging(null);
                      setDragOver(null);
                    }}
                    onDrop={() => handleDrop('carousel', item.id)}
                    className={[
                      'transition hover:bg-[#f5f1ea]/50',
                      dragOver?.type === 'carousel' && dragOver.id === item.id ? 'bg-[#eef3ea] outline outline-2 outline-[#7a8b6f]/40' : ''
                    ].join(' ')}
                  >
                    <td className="border-b border-[#f0eadf] px-4 py-3"><span className="mr-2 cursor-grab select-none text-[#8c8c8c] active:cursor-grabbing" title="拖拽排序" draggable onDragStart={() => setDragging({ type: 'carousel', id: item.id })}>☷</span>{item.title}</td>
                    <td className="border-b border-[#f0eadf] px-4 py-3">{item.jumpType}</td>
                    <td className="border-b border-[#f0eadf] px-4 py-3">{item.relation}</td>
                    <td className="border-b border-[#f0eadf] px-4 py-3">{item.sort}</td>
                    <td className="border-b border-[#f0eadf] px-4 py-3"><StatusTag label={item.status === 'online' ? '已启用' : item.status === 'draft' ? '草稿' : '已停用'} tone={item.status === 'online' ? 'green' : item.status === 'draft' ? 'orange' : 'gray'} /></td>
                    <td className="sticky right-0 z-10 border-b border-[#f0eadf] bg-[#fffdfc] px-4 py-3 text-xs text-[#6f8663] shadow-[-12px_0_18px_-18px_rgba(47,47,47,0.45)]">
                      <button className="hover:text-[#2f2f2f]" onClick={() => navigate(`/home-ops/top-nav/${id}/content/carousels/${item.id}/edit`)}>编辑</button>
                      <button className="ml-3 hover:text-[#2f2f2f]" onClick={() => setNotice(`已刷新「${item.title}」预览`)}>预览</button>
                      <button className="ml-3 hover:text-[#2f2f2f]" onClick={() => toggleCarouselStatus(item)}>{item.status === 'online' ? '停用' : '启用'}</button>
                      {item.status !== 'online' ? <button className="ml-3 text-red-500 hover:text-red-700" onClick={() => deleteCarousel(item)}>删除</button> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-2xl border border-[#e4ddd1] bg-[#fffdfc] p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[#2f2f2f]">内容模块管理</h2>
              <Button className="h-9 rounded-lg bg-[#6f8663]" onClick={addModule}><Plus className="mr-1 h-4 w-4" /> 新增模块</Button>
            </div>
            <table className="w-full min-w-[840px] border-separate border-spacing-0 text-sm">
              <thead className="text-[#5f5f5f]">
                <tr>{['模块名称', '模块类型', '内容来源', '展示数量', '排序', '状态', '操作'].map((title) => (
                  <th
                    key={title}
                    className={[
                      'border-b border-[#e9e2d6] px-4 py-3 text-left',
                      title === '操作' ? 'sticky right-0 z-20 bg-[#fffdfc] shadow-[-12px_0_18px_-18px_rgba(47,47,47,0.45)]' : ''
                    ].join(' ')}
                  >
                    {title}
                  </th>
                ))}</tr>
              </thead>
              <tbody>
                {modules.map((module) => (
                  <tr
                    key={module.id}
                    onDragOver={(event) => {
                      event.preventDefault();
                      setDragOver({ type: 'module', id: module.id });
                    }}
                    onDragEnd={() => {
                      setDragging(null);
                      setDragOver(null);
                    }}
                    onDrop={() => handleDrop('module', module.id)}
                    className={[
                      'transition hover:bg-[#f5f1ea]/50',
                      activeModuleId === module.id ? 'bg-[#f5f1ea]/40' : '',
                      dragOver?.type === 'module' && dragOver.id === module.id ? 'bg-[#eef3ea] outline outline-2 outline-[#7a8b6f]/40' : ''
                    ].join(' ')}
                  >
                    <td className="border-b border-[#f0eadf] px-4 py-3"><span className="mr-2 cursor-grab select-none text-[#8c8c8c] active:cursor-grabbing" title="拖拽排序" draggable onDragStart={() => setDragging({ type: 'module', id: module.id })}>☷</span>{module.name}</td>
                    <td className="border-b border-[#f0eadf] px-4 py-3">{module.type}</td>
                    <td className="border-b border-[#f0eadf] px-4 py-3">{module.source}</td>
                    <td className="border-b border-[#f0eadf] px-4 py-3">{module.count}</td>
                    <td className="border-b border-[#f0eadf] px-4 py-3">{module.sort}</td>
                    <td className="border-b border-[#f0eadf] px-4 py-3"><StatusTag label={module.status === 'online' ? '已启用' : module.status === 'draft' ? '草稿' : '已停用'} tone={module.status === 'online' ? 'green' : module.status === 'draft' ? 'orange' : 'gray'} /></td>
                    <td className="sticky right-0 z-10 border-b border-[#f0eadf] bg-[#fffdfc] px-4 py-3 text-xs text-[#6f8663] shadow-[-12px_0_18px_-18px_rgba(47,47,47,0.45)]">
                      <button className="hover:text-[#2f2f2f]" onClick={() => navigate(`/home-ops/top-nav/${id}/content/modules/${module.id}/edit`)}>编辑</button>
                      <button className="ml-3 hover:text-[#2f2f2f]" onClick={() => setNotice(`已刷新「${module.name}」预览`)}>预览</button>
                      <button className="ml-3 hover:text-[#2f2f2f]" onClick={() => toggleModuleStatus(module)}>{module.status === 'online' ? '停用' : '启用'}</button>
                      {module.status !== 'online' ? <button className="ml-3 text-red-500 hover:text-red-700" onClick={() => deleteModule(module)}>删除</button> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-xl border border-[#d6decd] bg-[#eef3ea] px-5 py-4 text-sm text-[#5f7f56]">
            ⓘ 排序优先级：顶部导航 ＞ 轮播图 ＞ 内容模块。保存配置后将同步至 App，建议发布后在手机端查看效果。
          </div>
        </div>

        <div className="rounded-2xl border border-[#e4ddd1] bg-[#fffdfc] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#2f2f2f]">首页预览（{nav.name} Tab）</h2>
            <button className="flex items-center gap-1 text-xs text-[#6f8663]" onClick={() => setNotice('首页预览已刷新')}><RefreshCw className="h-3 w-3" /> 刷新预览</button>
          </div>
          <div className="mx-auto w-full max-w-[330px] rounded-[2.4rem] border-[9px] border-[#1f1f1f] bg-[#fffdfc] p-4">
            <div className="flex items-center justify-between text-xs font-semibold"><span>9:41</span><span>▮▮▮ ))) ▰</span></div>
            <div className="mt-4 rounded-2xl bg-[#f5f1ea] px-4 py-3 text-sm text-[#8c8c8c]">⌕ 搜索菜谱、食材、做法 <span className="float-right">＋</span></div>
            <div className="mt-4 flex gap-7 overflow-hidden whitespace-nowrap text-sm">
              <span>推荐</span>
              <span className="font-semibold text-[#6f8663] underline decoration-2 underline-offset-8">{nav.name}</span>
              <span>快手菜</span>
            </div>
            <div className="mt-5 overflow-hidden rounded-2xl bg-[#8c6a45] p-4 text-white">
              <div className="text-lg font-semibold">今日{nav.name}好菜</div>
              <div className="mt-2 text-sm">番茄牛腩</div>
              <div className="mt-8 flex justify-center gap-1">{Array.from({ length: 6 }).map((_, index) => <span key={index} className="h-1 w-1 rounded-full bg-white/70" />)}</div>
            </div>
            <div className="mt-5">
              <div className="flex items-center justify-between"><span className="font-semibold">{nav.name}菜单</span><span className="text-xs text-[#7a8b6f]">{draft.contentRule.moreButtonText} ›</span></div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {['红烧肉', '清蒸鲈鱼', '地三鲜'].map((name, index) => <div key={name} className="overflow-hidden rounded-xl bg-[#f5f1ea]"><div className={['h-16', index === 0 ? 'bg-[#c27b48]' : index === 1 ? 'bg-[#a8b48a]' : 'bg-[#b7aea1]'].join(' ')} /><div className="truncate p-2 text-xs">{name}</div></div>)}
              </div>
            </div>
            <div className="mt-5">
              <div className="flex items-center justify-between"><span className="font-semibold">时令食材</span><span className="text-xs text-[#7a8b6f]">查看更多 ›</span></div>
              <div className="mt-3 flex justify-between text-center text-xs">
                {['番茄', '黄瓜', '茄子', '南瓜', '冬瓜'].map((name) => <div key={name}><div className="mx-auto mb-1 h-9 w-9 rounded-full bg-[#a8b48a]" />{name}</div>)}
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
