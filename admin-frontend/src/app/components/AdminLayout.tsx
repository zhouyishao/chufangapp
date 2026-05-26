import { Outlet, useLocation, useNavigate } from 'react-router-dom';

import { findNavigationTrail } from '../navigation';
import { clearAdminUser, clearToken, loadAdminUser } from '../storage';
import { Sidebar } from './Sidebar';
import { Button } from './Button';

export const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const admin = loadAdminUser();
  const trail = findNavigationTrail(location.pathname);
  const current = trail[trail.length - 1];
  const breadcrumb = ['家里有菜 Admin', ...trail.map((item) => item.label)].join(' / ');

  const handleLogout = () => {
    clearToken();
    clearAdminUser();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#f5f1ea] text-[#2f2f2f]">
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-[#e9e2d6] bg-[#f5f1ea]/95 px-8 py-4 backdrop-blur">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="text-xs text-[#8c8c8c]">{breadcrumb || '家里有菜 Admin / 工作台'}</div>
                <div className="mt-1 text-lg font-semibold">{current?.label ?? '工作台'}</div>
              </div>
              <div className="flex min-w-0 flex-1 justify-center">
                <div className="hidden w-full max-w-xl rounded-2xl border border-[#e9e2d6] bg-[#fffdfc] px-4 py-2 text-sm text-[#8c8c8c] shadow-sm md:block">
                  搜索内容、状态、标签... Command K
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden text-right text-xs text-[#8c8c8c] sm:block">
                  <div className="font-medium text-[#2f2f2f]">{admin?.nickname ?? admin?.username ?? 'Admin'}</div>
                  <div>权限占位：超级管理员</div>
                </div>
                <Button variant="ghost" onClick={handleLogout}>
                  退出
                </Button>
              </div>
            </div>
          </header>
          <main className="min-w-0 flex-1 overflow-y-auto px-8 py-8">
            <div className="mx-auto w-full max-w-7xl">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};
