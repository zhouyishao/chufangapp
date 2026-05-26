import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { login } from '../api';
import { saveAdminUser, saveToken } from '../storage';
import { Button } from '../components/Button';
import { Input } from '../components/Input';

export const LoginPage = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => username.trim().length >= 3 && password.trim().length >= 6, [
    username,
    password
  ]);

  const handleSubmit = async () => {
    if (!canSubmit || loading) return;
    setLoading(true);
    setError(null);
    try {
      const result = await login(username.trim(), password.trim());
      saveToken(result.token);
      saveAdminUser(result.admin);
      navigate('/', { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : '登录失败';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6">
        <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-sm">
          <div className="text-lg font-semibold tracking-tight">后台登录</div>
          <div className="mt-1 text-sm text-zinc-500">使用管理员账号登录。</div>

          <div className="mt-6 space-y-3">
            <div>
              <div className="mb-1 text-xs text-zinc-600">用户名</div>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
            <div>
              <div className="mb-1 text-xs text-zinc-600">密码</div>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error ? <div className="mt-3 text-sm text-red-600">{error}</div> : null}

          <Button
            className="mt-6 w-full"
            disabled={!canSubmit || loading}
            onClick={handleSubmit}
          >
            {loading ? '登录中...' : '登录'}
          </Button>

          <div className="mt-3 text-xs text-zinc-500">
            默认账号：admin / admin123（见后端 `sql/schema.sql`）。
          </div>
        </div>
      </div>
    </div>
  );
};

