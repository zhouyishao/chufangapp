import { Bell, ChevronDown, Search } from 'lucide-react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

import { findNavigationTrail } from '../navigation';
import { clearAdminUser, clearToken, loadAdminUser } from '../storage';
import { Sidebar } from './Sidebar';

export const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const admin = loadAdminUser();
  const trail = findNavigationTrail(location.pathname);
  const breadcrumb = [{ label: '首页', path: '/dashboard' }, ...trail.map((item) => ({ label: item.label, path: item.path }))];
  const lastIndex = breadcrumb.length - 1;

  const handleLogout = () => {
    clearToken();
    clearAdminUser();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#f7f3eb] text-[#2f2f2f]">
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-[#e7dfd1] bg-[#fffdf8]/92 px-6 py-3 backdrop-blur lg:px-8">
            <div className="flex h-12 items-center justify-between gap-5">
              <nav className="hidden min-w-0 items-center gap-3 text-sm text-[#9a9287] lg:flex" aria-label="面包屑">
                {breadcrumb.map((item, index) => (
                  <span key={`${item.label}-${index}`} className="flex items-center gap-3 whitespace-nowrap">
                    {index < lastIndex ? (
                      <button type="button" onClick={() => navigate(item.path)} className="hover:text-[#2f2f2f] hover:underline transition">{item.label}</button>
                    ) : (
                      <span className="font-semibold text-[#2f2f2f]">{item.label}</span>
                    )}
                    {index < lastIndex ? <span className="text-[#c8beae]">/</span> : null}
                  </span>
                ))}
              </nav>

              <div className="ml-auto flex min-w-0 items-center gap-4">
                <label className="relative hidden w-[380px] max-w-[34vw] lg:block">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#a79d91]" />
                  <input
                    className="h-12 w-full rounded-xl border border-[#e7dfd1] bg-[#fffdf8] pl-12 pr-4 text-sm text-[#2f2f2f] shadow-[0_10px_28px_rgba(72,58,42,0.06)] outline-none transition placeholder:text-[#a79d91] focus:border-[#7a8b6f] focus:ring-2 focus:ring-[#7a8b6f]/12"
                    placeholder="搜索菜谱、专题、用户..."
                    type="search"
                  />
                </label>

                <button
                  type="button"
                  className="relative hidden h-11 w-11 items-center justify-center rounded-full text-[#716a60] transition hover:bg-[#f3eee6] md:inline-flex"
                  aria-label="通知"
                >
                  <Bell className="h-5 w-5" />
                  <span className="absolute right-2 top-1 rounded-full bg-[#f06b3d] px-1.5 text-[10px] font-semibold leading-4 text-white">12</span>
                </button>

                <button
                  type="button"
                  className="flex h-12 items-center gap-3 rounded-full px-2.5 py-1.5 transition hover:bg-[#f3eee6]"
                  onClick={handleLogout}
                  title="退出登录"
                >
                  <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-[#e7dfd1] bg-[#eef3ea]">
                    <span className="h-7 w-7 rounded-full bg-[#5f7f56] shadow-[inset_0_-10px_0_#f1d5b1]" />
                  </span>
                  <span className="hidden items-center gap-2 text-sm font-semibold text-[#4d463f] sm:flex">
                    {admin?.nickname ?? admin?.username ?? '管理员'}
                    <ChevronDown className="h-4 w-4 text-[#9a9287]" />
                  </span>
                </button>
              </div>
            </div>
          </header>
          <main className="min-w-0 flex-1 overflow-y-auto px-6 py-6 lg:px-8">
            <div className="mx-auto w-full max-w-[1500px]">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};
