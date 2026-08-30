import { useCallback, useEffect, useState, type PropsWithChildren } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { ApiError, getAdminProfile } from '../api';
import { clearAdminUser, clearToken, loadToken, saveAdminUser } from '../storage';

type AuthStatus = 'checking' | 'ready' | 'signed-out' | 'error';

export const RequireAuth = ({ children }: PropsWithChildren) => {
  const location = useLocation();
  const [status, setStatus] = useState<AuthStatus>(() => (loadToken() ? 'checking' : 'signed-out'));
  const [message, setMessage] = useState('');
  const [canRecoverDashboard, setCanRecoverDashboard] = useState(false);

  const verifySession = useCallback(async () => {
    if (!loadToken()) {
      setStatus('signed-out');
      return;
    }

    setStatus('checking');
    setMessage('');
    try {
      const profile = await getAdminProfile();
      saveAdminUser({
        ...profile.admin,
        role: profile.role,
        permissions: profile.permissions
      });
      setCanRecoverDashboard(profile.permissions.includes('*') || profile.permissions.includes('dashboard:view'));
      setStatus('ready');
    } catch (error) {
      if (error instanceof ApiError && (error.code === 401 || error.code === 403)) {
        clearToken();
        clearAdminUser();
        setStatus('signed-out');
        return;
      }
      setMessage(error instanceof Error ? error.message : '请检查网络与后端服务后重试');
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    void verifySession();
  }, [verifySession]);

  if (status === 'signed-out') return <Navigate to="/login" replace />;

  if (status === 'checking') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f3eb] px-6 text-[#2f2f2f]">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-[#d8d0c2] border-t-[#7a8b6f]" aria-hidden="true" />
          <p className="mt-4 text-sm text-[#746e65]">正在验证登录状态…</p>
        </div>
      </main>
    );
  }

  if (status === 'error') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f3eb] px-6 text-[#2f2f2f]">
        <section className="w-full max-w-md rounded-3xl border border-[#e7dfd1] bg-[#fffdf8] p-8 text-center shadow-[0_18px_60px_rgba(72,58,42,0.08)]">
          <h1 className="text-xl font-semibold">登录状态验证失败</h1>
          <p className="mt-3 text-sm leading-6 text-[#827a70]">{message}</p>
          <button
            type="button"
            onClick={() => void verifySession()}
            className="mt-6 h-11 rounded-xl bg-[#2f2f2f] px-6 text-sm font-semibold text-white transition hover:bg-[#45413c]"
          >
            重新验证
          </button>
        </section>
      </main>
    );
  }

  if (location.pathname === '/403' && canRecoverDashboard) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
