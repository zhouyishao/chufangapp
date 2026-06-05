import { Download, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { ApiError, listUsers, setUserStatus } from '../api';
import { Button } from '../components/Button';
import { Drawer } from '../components/Drawer';
import { ImagePreview } from '../components/ImagePreview';
import { StatusTag } from '../components/StatusTag';
import type { AdminUserListItem, PageResult } from '../types';

const initialPage: PageResult<AdminUserListItem> = {
  list: [],
  page: 1,
  pageSize: 20,
  total: 0
};

const registrationLabel: Record<AdminUserListItem['registerSource'], string> = {
  WECHAT: '微信',
  PHONE: '手机号'
};

const statusLabel: Record<AdminUserListItem['status'], string> = {
  ACTIVE: '正常',
  DISABLED: '禁用'
};

const formatDateTime = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('zh-CN', { hour12: false });
};

const formatPhone = (value?: string | null) => {
  if (!value) return '—';
  if (value.length < 7) return value;
  return `${value.slice(0, 3)}****${value.slice(-4)}`;
};

const normalizeErrorMessage = (error: unknown) => {
  if (error instanceof ApiError) return error.message;
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return '后端服务未连接，请确认 3002 服务已启动。';
  }
  return error instanceof Error ? error.message : '用户列表加载失败';
};

export const UsersPage = () => {
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<'all' | AdminUserListItem['status']>('all');
  const [registerSource, setRegisterSource] = useState<'all' | AdminUserListItem['registerSource']>('all');
  const [familyCount, setFamilyCount] = useState<'all' | 'NONE' | 'ONE' | 'MULTIPLE'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [data, setData] = useState(initialPage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<AdminUserListItem | null>(null);
  const [familyDrawerUser, setFamilyDrawerUser] = useState<AdminUserListItem | null>(null);

  const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize));

  const stats = useMemo(() => {
    const active = data.list.filter((item) => item.status === 'ACTIVE').length;
    const disabled = data.list.filter((item) => item.status === 'DISABLED').length;
    const activeUsers = data.list.filter((item) => item.recentViewCount > 0 || item.favoriteCount > 0).length;
    return [
      { label: '用户总数', value: data.total, tone: 'green' },
      { label: '今日新增', value: data.list.filter((item) => new Date(item.createdAt).toDateString() === new Date().toDateString()).length, tone: 'orange' },
      { label: '正常用户', value: active, tone: 'green' },
      { label: '已禁用', value: disabled, tone: 'red' },
      { label: '活跃用户', value: activeUsers, tone: 'green' }
    ];
  }, [data.list, data.total]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await listUsers({
        page,
        pageSize,
        q: keyword,
        status: status === 'all' ? undefined : status,
        registerSource: registerSource === 'all' ? undefined : registerSource,
        familyCount: familyCount === 'all' ? undefined : familyCount,
        startDate: startDate || undefined,
        endDate: endDate || undefined
      });
      setData(result);
    } catch (err) {
      setData({ ...initialPage, page, pageSize });
      setError(normalizeErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize]);

  const handleSearch = () => {
    setPage(1);
    void loadData();
  };

  const handleReset = () => {
    setKeyword('');
    setStatus('all');
    setRegisterSource('all');
    setFamilyCount('all');
    setStartDate('');
    setEndDate('');
    setPage(1);
    setTimeout(() => void loadData(), 0);
  };

  const handleToggleStatus = async (item: AdminUserListItem) => {
    const nextStatus = item.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    const action = nextStatus === 'DISABLED' ? '禁用' : '启用';
    if (!window.confirm(`确认${action}用户「${item.nickname ?? item.code}」？`)) return;
    setError('');
    try {
      await setUserStatus(item.legacyId, nextStatus);
      await loadData();
    } catch (err) {
      setError(normalizeErrorMessage(err));
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#2f2f2f]">用户列表</h1>
          <p className="mt-2 text-sm text-[#8c8c8c]">管理 C 端 App 用户，支持搜索、筛选、状态管理及详情查看。</p>
        </div>
      </div>

      {error ? <div className="rounded-2xl bg-red-50 px-5 py-4 text-sm text-red-700">{error}</div> : null}

      <div className="rounded-3xl border border-[#e9e2d6] bg-[#fffdfc] p-5 shadow-[0_18px_50px_rgba(72,58,42,0.05)]">
        <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr_1fr_1fr_1.4fr_auto_auto]">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-[#4d463f]">关键词</span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a79d91]" />
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                className="h-12 w-full rounded-xl border border-[#e6ded2] bg-white pl-11 pr-4 text-sm outline-none focus:border-[#7a8b6f] focus:ring-2 focus:ring-[#7a8b6f]/10"
                placeholder="请输入昵称 / 手机号 / 用户ID"
              />
            </div>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-[#4d463f]">注册方式</span>
            <select value={registerSource} onChange={(event) => setRegisterSource(event.target.value as typeof registerSource)} className="h-12 w-full rounded-xl border border-[#e6ded2] bg-white px-4 text-sm outline-none">
              <option value="all">全部</option>
              <option value="WECHAT">微信</option>
              <option value="PHONE">手机号</option>
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-[#4d463f]">账号状态</span>
            <select value={status} onChange={(event) => setStatus(event.target.value as typeof status)} className="h-12 w-full rounded-xl border border-[#e6ded2] bg-white px-4 text-sm outline-none">
              <option value="all">全部</option>
              <option value="ACTIVE">正常</option>
              <option value="DISABLED">禁用</option>
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-[#4d463f]">家庭数量</span>
            <select value={familyCount} onChange={(event) => setFamilyCount(event.target.value as typeof familyCount)} className="h-12 w-full rounded-xl border border-[#e6ded2] bg-white px-4 text-sm outline-none">
              <option value="all">全部</option>
              <option value="NONE">无家庭</option>
              <option value="ONE">已加入家庭</option>
              <option value="MULTIPLE">已创建家庭</option>
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-[#4d463f]">时间范围</span>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="h-12 rounded-xl border border-[#e6ded2] bg-white px-3 text-sm outline-none" />
              <span className="text-[#a79d91]">~</span>
              <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="h-12 rounded-xl border border-[#e6ded2] bg-white px-3 text-sm outline-none" />
            </div>
          </label>
          <div className="flex items-end">
            <Button onClick={handleSearch} className="h-12 min-w-24 bg-[#2f6f36] hover:bg-[#245a2a]">查询</Button>
          </div>
          <div className="flex items-end gap-3">
            <Button variant="ghost" onClick={handleReset} className="h-12 min-w-24">重置</Button>
            <Button variant="ghost" className="h-12 whitespace-nowrap">
              <Download className="mr-2 h-4 w-4" />
              导出用户
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {stats.map((item) => (
          <div key={item.label} className="rounded-3xl border border-[#e9e2d6] bg-[#fffdfc] p-5 shadow-[0_18px_50px_rgba(72,58,42,0.04)]">
            <div className="flex items-center gap-4">
              <span className={['flex h-14 w-14 items-center justify-center rounded-2xl text-2xl', item.tone === 'red' ? 'bg-red-50 text-red-600' : item.tone === 'orange' ? 'bg-[#fff4df] text-[#c27b48]' : 'bg-[#edf5ea] text-[#5f8a56]'].join(' ')}>
                {item.tone === 'red' ? '×' : item.tone === 'orange' ? '+' : '✓'}
              </span>
              <div>
                <div className="text-sm text-[#8c8c8c]">{item.label}</div>
                <div className="mt-1 text-2xl font-semibold text-[#2f2f2f]">{item.value.toLocaleString('zh-CN')}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-3xl border border-[#e9e2d6] bg-[#fffdfc] shadow-[0_18px_50px_rgba(72,58,42,0.04)]">
        <div className="overflow-x-auto">
          <table className="min-w-[1350px] w-full border-separate border-spacing-0 text-left text-sm">
            <thead className="bg-[#fffaf3] text-xs text-[#8c8c8c]">
              <tr>
                {['用户ID', '头像', '昵称', '手机号', '注册方式', '已加入家庭数', '创建家庭数', '收藏菜谱数', '价格记录数', '最近活跃时间', '注册时间', '账号状态', '操作'].map((item) => (
                  <th key={item} className="whitespace-nowrap border-b border-[#eadfce] px-4 py-4 font-semibold">{item}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={13} className="px-4 py-16 text-center text-[#8c8c8c]">加载中...</td>
                </tr>
              ) : data.list.length === 0 ? (
                <tr>
                  <td colSpan={13} className="px-4 py-16 text-center text-[#8c8c8c]">暂无用户数据</td>
                </tr>
              ) : (
                data.list.map((item) => (
                  <tr key={item.id} className="transition hover:bg-[#faf7f1]">
                    <td className="whitespace-nowrap border-b border-[#f0e8dc] px-4 py-3 font-medium text-[#4d463f]">{item.code}</td>
                    <td className="border-b border-[#f0e8dc] px-4 py-3">
                      <ImagePreview src={item.avatar} alt={item.nickname ?? item.code} className="h-10 w-10 rounded-full" emptyText="—" />
                    </td>
                    <td className="whitespace-nowrap border-b border-[#f0e8dc] px-4 py-3">
                      <button type="button" onClick={() => setSelected(item)} className="font-semibold text-[#2f2f2f] hover:text-[#7a8b6f]">{item.nickname ?? '未设置昵称'}</button>
                    </td>
                    <td className="whitespace-nowrap border-b border-[#f0e8dc] px-4 py-3 text-[#5d554d]">{formatPhone(item.phone)}</td>
                    <td className="whitespace-nowrap border-b border-[#f0e8dc] px-4 py-3 text-[#5d554d]">{registrationLabel[item.registerSource]}</td>
                    <td className="whitespace-nowrap border-b border-[#f0e8dc] px-4 py-3">{item.joinedFamilyCount} / 8</td>
                    <td className="whitespace-nowrap border-b border-[#f0e8dc] px-4 py-3">{item.createdFamilyCount}</td>
                    <td className="whitespace-nowrap border-b border-[#f0e8dc] px-4 py-3">{item.favoriteCount}</td>
                    <td className="whitespace-nowrap border-b border-[#f0e8dc] px-4 py-3">{item.priceRecordCount}</td>
                    <td className="whitespace-nowrap border-b border-[#f0e8dc] px-4 py-3">{formatDateTime(item.lastActiveAt)}</td>
                    <td className="whitespace-nowrap border-b border-[#f0e8dc] px-4 py-3">{formatDateTime(item.createdAt)}</td>
                    <td className="whitespace-nowrap border-b border-[#f0e8dc] px-4 py-3">
                      <StatusTag label={statusLabel[item.status]} tone={item.status === 'ACTIVE' ? 'green' : 'red'} />
                    </td>
                    <td className="sticky right-0 whitespace-nowrap border-b border-[#f0e8dc] bg-[#fffdfc] px-4 py-3 shadow-[-12px_0_18px_rgba(247,243,235,0.8)]">
                      <div className="flex items-center gap-3">
                        <button type="button" className="font-semibold text-[#5f8a56] hover:text-[#3f6d38]" onClick={() => setSelected(item)}>查看</button>
                        <button type="button" className={item.status === 'ACTIVE' ? 'font-semibold text-red-600 hover:text-red-500' : 'font-semibold text-[#5f8a56] hover:text-[#3f6d38]'} onClick={() => void handleToggleStatus(item)}>
                          {item.status === 'ACTIVE' ? '禁用' : '启用'}
                        </button>
                        <button type="button" className="font-semibold text-[#5f8a56] hover:text-[#3f6d38]" onClick={() => setFamilyDrawerUser(item)}>查看家庭</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#f0e8dc] px-4 py-4 text-sm text-[#6f675f]">
          <span>共 {data.total.toLocaleString('zh-CN')} 条</span>
          <div className="flex items-center gap-2">
            <select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }} className="h-10 rounded-xl border border-[#e6ded2] bg-white px-3">
              <option value={10}>10 条/页</option>
              <option value={20}>20 条/页</option>
              <option value={50}>50 条/页</option>
            </select>
            <Button variant="ghost" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>上一页</Button>
            <span>第 {data.page} / {totalPages} 页</span>
            <Button variant="ghost" disabled={page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>下一页</Button>
          </div>
        </div>
      </div>

      <Drawer title="用户详情" open={Boolean(selected)} onClose={() => setSelected(null)} widthClassName="max-w-lg">
        {selected ? (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <ImagePreview src={selected.avatar} alt={selected.nickname ?? selected.code} className="h-16 w-16 rounded-full" />
              <div>
                <div className="text-xl font-semibold">{selected.nickname ?? '未设置昵称'}</div>
                <div className="text-sm text-[#8c8c8c]">{selected.code}</div>
              </div>
            </div>
            {[
              ['手机号', formatPhone(selected.phone)],
              ['注册方式', registrationLabel[selected.registerSource]],
              ['家庭数', `${selected.familyCount} 个`],
              ['收藏菜谱数', `${selected.favoriteCount}`],
              ['最近浏览数', `${selected.recentViewCount}`],
              ['最近活跃时间', formatDateTime(selected.lastActiveAt)],
              ['注册时间', formatDateTime(selected.createdAt)]
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between border-b border-[#f0e8dc] py-3 text-sm">
                <span className="text-[#8c8c8c]">{label}</span>
                <span className="font-medium text-[#2f2f2f]">{value}</span>
              </div>
            ))}
          </div>
        ) : null}
      </Drawer>

      <Drawer title="家庭关系" open={Boolean(familyDrawerUser)} onClose={() => setFamilyDrawerUser(null)} widthClassName="max-w-lg">
        {familyDrawerUser ? (
          <div className="space-y-4">
            <p className="text-sm text-[#8c8c8c]">当前用户：{familyDrawerUser.nickname ?? familyDrawerUser.code}</p>
            <div className="rounded-2xl border border-[#e9e2d6] bg-[#f8f4ed] p-4">
              <div className="text-sm text-[#8c8c8c]">已加入家庭数</div>
              <div className="mt-2 text-2xl font-semibold">{familyDrawerUser.joinedFamilyCount}</div>
            </div>
            <div className="rounded-2xl border border-[#e9e2d6] bg-[#f8f4ed] p-4">
              <div className="text-sm text-[#8c8c8c]">创建家庭数</div>
              <div className="mt-2 text-2xl font-semibold">{familyDrawerUser.createdFamilyCount}</div>
            </div>
          </div>
        ) : null}
      </Drawer>
    </section>
  );
};
