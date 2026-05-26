import { Link } from 'react-router-dom';

import { Button } from '../components/Button';

export const ForbiddenPage = () => (
  <section className="flex min-h-[60vh] items-center justify-center">
    <div className="w-full max-w-xl rounded-3xl border border-[#e9e2d6] bg-[#fffdfc] p-10 text-center">
      <div className="text-5xl font-semibold text-[#2f2f2f]">403</div>
      <div className="mt-4 text-xl font-semibold text-[#2f2f2f]">暂无访问权限</div>
      <div className="mt-2 text-sm text-[#8c8c8c]">权限占位已接入，后续按角色权限表控制菜单、按钮和接口访问。</div>
      <Link to="/dashboard">
        <Button className="mt-6">返回工作台</Button>
      </Link>
    </div>
  </section>
);
