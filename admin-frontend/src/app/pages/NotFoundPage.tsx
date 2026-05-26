import { Link } from 'react-router-dom';

import { Button } from '../components/Button';

export const NotFoundPage = () => (
  <section className="flex min-h-[60vh] items-center justify-center">
    <div className="w-full max-w-xl rounded-3xl border border-[#e9e2d6] bg-[#fffdfc] p-10 text-center">
      <div className="text-5xl font-semibold text-[#2f2f2f]">404</div>
      <div className="mt-4 text-xl font-semibold text-[#2f2f2f]">页面不存在</div>
      <div className="mt-2 text-sm text-[#8c8c8c]">当前路由未配置，请从左侧核心菜单进入后台模块。</div>
      <Link to="/dashboard">
        <Button className="mt-6">返回工作台</Button>
      </Link>
    </div>
  </section>
);
