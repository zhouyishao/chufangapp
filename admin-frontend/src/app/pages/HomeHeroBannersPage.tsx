import { useNavigate } from 'react-router-dom';

import { Button } from '../components/Button';

export const HomeHeroBannersPage = () => {
  const navigate = useNavigate();

  return (
    <section className="mx-auto max-w-[1280px] space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-[32px] font-semibold leading-tight tracking-tight text-[#2f2f2f]">旧首页顶部轮播图入口</h1>
          <p className="mt-2 max-w-3xl text-sm text-[#8c8c8c]">
            该页面已废弃。首页轮播图已经迁移到顶部导航内容配置，必须绑定具体导航，不再支持独立的全局轮播图管理页。
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="ghost" className="h-11 rounded-xl border-[#e1d8ca] bg-[#fffdfc]" onClick={() => navigate('/home-ops')}>
            返回顶部导航管理
          </Button>
          <Button className="h-11 rounded-xl bg-[#7a8b6f] hover:bg-[#6f8065]" onClick={() => navigate('/home-ops')}>
            去配置内容
          </Button>
        </div>
      </div>

      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
        <div className="text-base font-semibold">为什么不能继续用这个页面</div>
        <div className="mt-3 space-y-2 text-sm leading-6">
          <p>旧页面缺少 `navId` 上下文，历史兼容实现会把请求错误地发送到 `top-navs/0/hero-banners`。</p>
          <p>当前有效链路是：顶部导航列表 → 进入某个导航 → 配置内容 → 轮播图设置。</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-[#e9e2d6] bg-[#fffdfc] p-6">
          <div className="text-lg font-semibold text-[#2f2f2f]">新入口</div>
          <div className="mt-4 space-y-3 text-sm text-[#5f5f5f]">
            <div className="rounded-2xl bg-[#f5f1ea] px-4 py-3">1. 打开“首页运营”</div>
            <div className="rounded-2xl bg-[#f5f1ea] px-4 py-3">2. 进入具体顶部导航详情</div>
            <div className="rounded-2xl bg-[#f5f1ea] px-4 py-3">3. 点击“配置内容”</div>
            <div className="rounded-2xl bg-[#f5f1ea] px-4 py-3">4. 在轮播图设置中新增、编辑、上下线</div>
          </div>
        </div>

        <div className="rounded-3xl border border-[#e9e2d6] bg-[#fffdfc] p-6">
          <div className="text-lg font-semibold text-[#2f2f2f]">当前处理策略</div>
          <div className="mt-4 space-y-3 text-sm text-[#5f5f5f]">
            <div className="rounded-2xl bg-[#f5f1ea] px-4 py-3">保留页面文件，避免直接删文件带来无关风险。</div>
            <div className="rounded-2xl bg-[#f5f1ea] px-4 py-3">阻断旧兼容 API，避免错误请求继续落到 `navId=0`。</div>
            <div className="rounded-2xl bg-[#f5f1ea] px-4 py-3">后续如果要彻底清理，再连同旧注释路由一起统一收口。</div>
          </div>
        </div>
      </div>
    </section>
  );
};
