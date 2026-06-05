import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, Hourglass, Link as LinkIcon, Plus, RefreshCw, Search, Send, Users, XCircle } from 'lucide-react';

import {
  createFamily,
  createFamilyInvite,
  getFamilyDetail,
  getFamilyOverview,
  listFamilies,
  listFamilyInvites,
  listFamilyMembers,
  removeFamilyMember,
  updateFamilyStatus,
  type FamilyDetail,
  type FamilyInvite,
  type FamilyInviteMethod,
  type FamilyInviteStatus,
  type FamilyJoinMethod,
  type FamilyMember,
  type FamilyMemberRole,
  type FamilyMemberStatus,
  type FamilyOverview,
  type FamilyStatus,
  type FamilySummary
} from '../api';
import { Button } from '../components/Button';
import { DataTable, type DataTableColumn } from '../components/DataTable';
import { Drawer } from '../components/Drawer';
import { FilterPanel } from '../components/FilterPanel';
import { Input } from '../components/Input';
import { StatusTag } from '../components/StatusTag';

type FamilyPageMode = 'list' | 'members' | 'invites';

type Props = {
  mode?: FamilyPageMode;
};

const statusLabel: Record<FamilyStatus, string> = { ACTIVE: '正常', DISABLED: '已禁用' };
const memberStatusLabel: Record<FamilyMemberStatus, string> = { ACTIVE: '正常', LEFT: '已退出', REMOVED: '已移除' };
const memberRoleLabel: Record<FamilyMemberRole, string> = { CREATOR: '创建人', ADMIN: '管理员', MEMBER: '成员' };
const joinMethodLabel: Record<FamilyJoinMethod, string> = { SCAN_QR: '扫码', MANUAL_INVITE: '手动邀请', INVITE_LINK: '邀请链接', ADMIN_CREATE: '后台创建' };
const inviteMethodLabel: Record<FamilyInviteMethod, string> = { QR_CODE: '二维码', LINK: '链接' };
const inviteStatusLabel: Record<FamilyInviteStatus, string> = { JOINED: '已加入', PENDING: '待加入', EXPIRED: '已失效', REVOKED: '已撤销' };

const statusTone = (status: FamilyStatus | FamilyMemberStatus | FamilyInviteStatus) => {
  if (status === 'ACTIVE' || status === 'JOINED') return 'green';
  if (status === 'PENDING') return 'orange';
  if (status === 'DISABLED' || status === 'REMOVED' || status === 'EXPIRED') return 'red';
  return 'gray';
};

const formatTime = (value?: string | null) => {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';
  const pad = (num: number) => String(num).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const maskPhone = (phone?: string | null) => {
  if (!phone) return '--';
  return phone.replace(/^(\d{3})\d{4}(\d+)/, '$1****$2');
};

const Avatar = ({ name, src }: { name?: string | null; src?: string | null }) => (
  <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#edf5ea] text-sm font-semibold text-[#4f7d43]">
    {src ? <img src={src} alt={name ?? 'avatar'} className="h-full w-full object-cover" /> : (name ?? '家').slice(0, 1)}
  </div>
);

const StatCard = ({ title, value, suffix, delta, icon: Icon, tone }: { title: string; value: string | number; suffix?: string; delta: string; icon: typeof Users; tone: string }) => (
  <div className="rounded-[8px] border border-[#e5e7eb] bg-white p-5 shadow-[0_4px_18px_rgba(15,23,42,0.03)]">
    <div className="flex items-center gap-4">
      <div className={`flex h-12 w-12 items-center justify-center rounded-full ${tone}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <div className="text-sm text-[#4b5563]">{title}</div>
        <div className="mt-1 flex items-baseline gap-1 text-2xl font-semibold text-[#111827]">
          {value}
          {suffix ? <span className="text-sm font-normal text-[#4b5563]">{suffix}</span> : null}
        </div>
        <div className="mt-1 text-xs text-[#6b7280]">较昨日 <span className="font-semibold text-[#2f7d32]">{delta}</span></div>
      </div>
    </div>
  </div>
);

const FamilyIdentity = ({ family }: { family: FamilySummary }) => (
  <button className="flex items-center gap-3 text-left" type="button">
    <Avatar name={family.name} src={family.avatar} />
    <span>
      <span className="block font-medium text-[#202124]">{family.name}</span>
      <span className="block text-xs text-[#6b7280]">ID: {family.legacyId}</span>
    </span>
  </button>
);

const MemberIdentity = ({ member }: { member: FamilyMember }) => (
  <div className="flex items-center gap-3">
    <Avatar name={member.user?.nickname} src={member.user?.avatar} />
    <span>
      <span className="block font-medium text-[#202124]">{member.user?.nickname ?? '未命名用户'}</span>
      <span className="block text-xs text-[#6b7280]">ID: {member.user?.legacyId ?? '--'}</span>
    </span>
  </div>
);

const useFamilyOverview = () => {
  const [overview, setOverview] = useState<FamilyOverview | null>(null);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setOverview(await getFamilyOverview());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { overview, loading, reload };
};

const Pager = ({ page, pageSize, total, onPageChange }: { page: number; pageSize: number; total: number; onPageChange: (page: number) => void }) => {
  const max = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="flex items-center justify-end gap-3 text-sm text-[#4b5563]">
      <span>共 {total} 条</span>
      <Button variant="ghost" className="h-8 px-3" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>上一页</Button>
      <span className="flex h-8 min-w-8 items-center justify-center rounded-[6px] bg-[#2f7d32] px-3 text-white">{page}</span>
      <span>/ {max}</span>
      <Button variant="ghost" className="h-8 px-3" disabled={page >= max} onClick={() => onPageChange(page + 1)}>下一页</Button>
    </div>
  );
};

export const FamiliesPage = ({ mode = 'list' }: Props) => {
  const { overview, reload: reloadOverview } = useFamilyOverview();
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [city, setCity] = useState('');
  const [role, setRole] = useState('');
  const [joinMethod, setJoinMethod] = useState('');
  const [inviteMethod, setInviteMethod] = useState('');
  const [inviteStatus, setInviteStatus] = useState('');
  const [families, setFamilies] = useState<FamilySummary[]>([]);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [invites, setInvites] = useState<FamilyInvite[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFamily, setSelectedFamily] = useState<FamilyDetail | null>(null);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);

  const pageSize = 20;

  useEffect(() => {
    setPage(1);
  }, [mode]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (mode === 'list') {
        const result = await listFamilies({ page, pageSize, q: keyword, status: status as FamilyStatus | undefined, city });
        setFamilies(result.list);
        setTotal(result.total);
      } else if (mode === 'members') {
        const result = await listFamilyMembers({
          page,
          pageSize,
          q: keyword,
          role: role as FamilyMemberRole | undefined,
          joinMethod: joinMethod as FamilyJoinMethod | undefined,
          memberStatus: status as FamilyMemberStatus | undefined,
          city
        });
        setMembers(result.list);
        setTotal(result.total);
      } else {
        const result = await listFamilyInvites({
          page,
          pageSize,
          q: keyword,
          inviteMethod: inviteMethod as FamilyInviteMethod | undefined,
          inviteStatus: inviteStatus as FamilyInviteStatus | undefined
        });
        setInvites(result.list);
        setTotal(result.total);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, [city, inviteMethod, inviteStatus, joinMethod, keyword, mode, page, role, status]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const resetFilters = () => {
    setKeyword('');
    setStatus('');
    setCity('');
    setRole('');
    setJoinMethod('');
    setInviteMethod('');
    setInviteStatus('');
    setPage(1);
  };

  const openFamily = async (family: FamilySummary) => {
    setSelectedFamily(await getFamilyDetail(family.legacyId));
  };

  const handleCreateFamily = async () => {
    const name = window.prompt('请输入家庭名称');
    if (!name?.trim()) return;
    await createFamily({ name: name.trim(), city: '上海市', district: '浦东新区', memberLimit: 8 });
    await Promise.all([loadData(), reloadOverview()]);
  };

  const handleToggleFamilyStatus = async (family: FamilySummary) => {
    await updateFamilyStatus(family.legacyId, family.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE');
    await Promise.all([loadData(), reloadOverview()]);
  };

  const handleGenerateInvite = async () => {
    const familyIdText = window.prompt('请输入家庭数字 ID');
    const familyId = Number(familyIdText);
    if (!Number.isFinite(familyId) || familyId <= 0) return;
    await createFamilyInvite({ familyId, inviteMethod: 'LINK', inviteName: '后台生成邀请链接' });
    await Promise.all([loadData(), reloadOverview()]);
  };

  const handleRemoveMember = async (member: FamilyMember) => {
    if (!window.confirm(`确认移除「${member.user?.nickname ?? '该成员'}」吗？`)) return;
    await removeFamilyMember(member.id);
    setSelectedMember(null);
    await Promise.all([loadData(), reloadOverview()]);
  };

  const familyColumns = useMemo<DataTableColumn<FamilySummary>[]>(
    () => [
      { key: 'family', title: '家庭信息', render: (item) => <button type="button" onClick={() => void openFamily(item)}><FamilyIdentity family={item} /></button> },
      { key: 'owner', title: '创建人', render: (item) => <div>{item.owner?.nickname ?? '--'}<div className="text-xs text-[#6b7280]">{maskPhone(item.owner?.phone)}</div></div> },
      { key: 'members', title: '成员数', render: (item) => `${item.memberCount} 人` },
      { key: 'city', title: '城市', render: (item) => <div>{item.city ?? '--'}<div className="text-xs text-[#6b7280]">{item.district ?? ''}</div></div> },
      { key: 'createdAt', title: '创建时间', render: (item) => formatTime(item.createdAt) },
      { key: 'activeAt', title: '最近活跃时间', render: (item) => formatTime(item.activeAt) },
      { key: 'status', title: '状态', render: (item) => <StatusTag label={statusLabel[item.status]} tone={statusTone(item.status)} /> },
      {
        key: 'actions',
        title: '操作',
        render: (item) => (
          <div className="flex items-center gap-2 text-sm">
            <button className="font-medium text-[#2f7d32]" type="button" onClick={() => void openFamily(item)}>查看</button>
            <button className="font-medium text-[#2f7d32]" type="button" onClick={() => void setSelectedFamily(null)}>成员管理</button>
            <button className="font-medium text-[#2f7d32]" type="button" onClick={() => void handleToggleFamilyStatus(item)}>{item.status === 'ACTIVE' ? '禁用' : '启用'}</button>
          </div>
        )
      }
    ],
    []
  );

  const memberColumns = useMemo<DataTableColumn<FamilyMember>[]>(
    () => [
      { key: 'member', title: '成员信息', render: (item) => <button type="button" onClick={() => setSelectedMember(item)}><MemberIdentity member={item} /></button> },
      { key: 'phone', title: '手机号', render: (item) => maskPhone(item.user?.phone) },
      { key: 'family', title: '所属家庭', render: (item) => item.family.name },
      { key: 'role', title: '角色', render: (item) => <StatusTag label={memberRoleLabel[item.role]} tone={item.role === 'CREATOR' ? 'orange' : item.role === 'ADMIN' ? 'accent' : 'green'} /> },
      { key: 'joinMethod', title: '加入方式', render: (item) => joinMethodLabel[item.joinMethod] },
      { key: 'joinedAt', title: '加入时间', render: (item) => formatTime(item.joinedAt) },
      { key: 'familyCount', title: '当前家庭成员', render: (item) => `${item.family.memberCount} / ${item.family.memberLimit}` },
      { key: 'status', title: '状态', render: (item) => <StatusTag label={memberStatusLabel[item.memberStatus]} tone={statusTone(item.memberStatus)} /> },
      {
        key: 'actions',
        title: '操作',
        render: (item) => (
          <div className="flex items-center gap-2 text-sm">
            <button className="font-medium text-[#2f7d32]" type="button" onClick={() => setSelectedMember(item)}>查看</button>
            <button className="font-medium text-red-600 disabled:text-[#9ca3af]" type="button" disabled={item.memberStatus !== 'ACTIVE'} onClick={() => void handleRemoveMember(item)}>移除</button>
          </div>
        )
      }
    ],
    []
  );

  const inviteColumns = useMemo<DataTableColumn<FamilyInvite>[]>(
    () => [
      { key: 'name', title: '邀请信息', render: (item) => <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-[#f0e8fb] text-[#8a4ac7]">{item.inviteMethod === 'QR_CODE' ? <Send className="h-5 w-5" /> : <LinkIcon className="h-5 w-5" />}</div><div><div className="font-medium">{item.inviteName}</div><div className="text-xs text-[#6b7280]">创建于 {formatTime(item.createdAt)}</div></div></div> },
      { key: 'method', title: '邀请方式', render: (item) => <StatusTag label={inviteMethodLabel[item.inviteMethod]} tone="accent" /> },
      { key: 'url', title: '邀请码 / 链接', render: (item) => item.url ?? item.token ?? '--' },
      { key: 'creator', title: '创建人', render: (item) => <div>{item.inviter?.nickname ?? '--'}<div className="text-xs text-[#6b7280]">{maskPhone(item.inviter?.phone)}</div></div> },
      { key: 'status', title: '状态', render: (item) => <StatusTag label={inviteStatusLabel[item.inviteStatus]} tone={statusTone(item.inviteStatus)} /> },
      { key: 'invitee', title: '受邀人', render: (item) => item.invitee?.nickname ?? '--' },
      { key: 'joinedAt', title: '加入时间', render: (item) => formatTime(item.joinedAt) },
      { key: 'expiresAt', title: '有效期', render: (item) => item.inviteStatus === 'EXPIRED' ? '已过期' : formatTime(item.expiresAt) },
      { key: 'actions', title: '操作', render: () => <button className="font-medium text-[#2f7d32]" type="button">查看详情</button> }
    ],
    []
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="text-sm text-[#6b7280]">家庭管理 / {mode === 'list' ? '家庭列表' : mode === 'members' ? '家庭成员' : '邀请记录'}</div>
          <h1 className="mt-2 text-2xl font-semibold text-[#111827]">{mode === 'list' ? '家庭列表' : mode === 'members' ? '家庭成员' : '邀请记录'}</h1>
          <p className="mt-2 text-sm text-[#6b7280]">
            {mode === 'list' ? '管理所有家庭信息，查看家庭成员、邀请记录和异常家庭。' : mode === 'members' ? '管理所有家庭成员信息，查看所属家庭、角色、加入方式与状态。' : '查看家庭邀请记录，包括二维码和链接邀请的使用情况。'}
          </p>
        </div>
        <div className="flex gap-2">
          {mode === 'invites' ? (
            <>
              <Button variant="ghost" onClick={() => void loadData()}><RefreshCw className="mr-2 h-4 w-4" />刷新</Button>
              <Button onClick={() => void handleGenerateInvite()}><Plus className="mr-2 h-4 w-4" />生成新邀请</Button>
            </>
          ) : mode === 'list' ? (
            <Button onClick={() => void handleCreateFamily()}><Plus className="mr-2 h-4 w-4" />创建家庭（后台）</Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard title="家庭总数" value={overview?.familyTotal ?? '--'} suffix="个" delta="+28" icon={Users} tone="bg-[#edf5ea] text-[#4f7d43]" />
        <StatCard title={mode === 'invites' ? '总邀请次数' : '活跃家庭'} value={mode === 'invites' ? overview?.memberTotal ?? '--' : overview?.activeFamilies ?? '--'} suffix={mode === 'invites' ? '次' : '个'} delta="+32" icon={CheckCircle2} tone="bg-[#eef2ff] text-[#4f64d8]" />
        <StatCard title={mode === 'list' ? '总成员数' : mode === 'members' ? '活跃成员' : '待加入次数'} value={mode === 'list' ? overview?.memberTotal ?? '--' : mode === 'members' ? overview?.memberTotal ?? '--' : 6} suffix={mode === 'list' || mode === 'members' ? '人' : '次'} delta="+86" icon={Users} tone="bg-[#fff4e8] text-[#c47d20]" />
        <StatCard title={mode === 'list' ? '今日新增家庭' : mode === 'members' ? '今日新增成员' : '已失效次数'} value={mode === 'list' ? overview?.todayFamilies ?? '--' : mode === 'members' ? overview?.todayMembers ?? '--' : 4} suffix={mode === 'invites' ? '次' : mode === 'members' ? '人' : '个'} delta="+9" icon={CalendarDays} tone="bg-[#f4e9f8] text-[#9b4db7]" />
        <StatCard title={mode === 'members' ? '异常成员' : mode === 'invites' ? '当前家庭成员' : '今日新增成员'} value={mode === 'members' ? overview?.abnormalMembers ?? '--' : mode === 'invites' ? 5 : overview?.todayMembers ?? '--'} suffix={mode === 'invites' || mode === 'list' ? '人' : '人'} delta="+3" icon={mode === 'members' ? XCircle : Hourglass} tone="bg-[#e8f8f8] text-[#2f9aa2]" />
      </div>

      <FilterPanel>
        <div className="grid flex-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          <label className="space-y-1 text-sm text-[#4b5563]">
            <span>关键词</span>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#9ca3af]" />
              <Input className="pl-9" value={keyword} placeholder={mode === 'list' ? '请输入家庭名称' : mode === 'members' ? '昵称 / 手机号 / 家庭名称' : '邀请码 / 链接名称'} onChange={(event) => setKeyword(event.target.value)} />
            </div>
          </label>
          {mode !== 'invites' ? (
            <label className="space-y-1 text-sm text-[#4b5563]">
              <span>城市</span>
              <select className="h-10 w-full rounded-[6px] border border-[#e5e7eb] bg-white px-3 text-sm" value={city} onChange={(event) => setCity(event.target.value)}>
                <option value="">全部城市</option>
                <option value="上海市">上海市</option>
                <option value="杭州市">杭州市</option>
                <option value="北京市">北京市</option>
                <option value="广州市">广州市</option>
              </select>
            </label>
          ) : null}
          {mode === 'members' ? (
            <>
              <label className="space-y-1 text-sm text-[#4b5563]">
                <span>成员角色</span>
                <select className="h-10 w-full rounded-[6px] border border-[#e5e7eb] bg-white px-3 text-sm" value={role} onChange={(event) => setRole(event.target.value)}>
                  <option value="">全部</option>
                  {Object.entries(memberRoleLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <label className="space-y-1 text-sm text-[#4b5563]">
                <span>加入方式</span>
                <select className="h-10 w-full rounded-[6px] border border-[#e5e7eb] bg-white px-3 text-sm" value={joinMethod} onChange={(event) => setJoinMethod(event.target.value)}>
                  <option value="">全部</option>
                  {Object.entries(joinMethodLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
            </>
          ) : mode === 'invites' ? (
            <>
              <label className="space-y-1 text-sm text-[#4b5563]">
                <span>邀请方式</span>
                <select className="h-10 w-full rounded-[6px] border border-[#e5e7eb] bg-white px-3 text-sm" value={inviteMethod} onChange={(event) => setInviteMethod(event.target.value)}>
                  <option value="">全部方式</option>
                  {Object.entries(inviteMethodLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <label className="space-y-1 text-sm text-[#4b5563]">
                <span>状态</span>
                <select className="h-10 w-full rounded-[6px] border border-[#e5e7eb] bg-white px-3 text-sm" value={inviteStatus} onChange={(event) => setInviteStatus(event.target.value)}>
                  <option value="">全部状态</option>
                  {Object.entries(inviteStatusLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
            </>
          ) : (
            <label className="space-y-1 text-sm text-[#4b5563]">
              <span>状态</span>
              <select className="h-10 w-full rounded-[6px] border border-[#e5e7eb] bg-white px-3 text-sm" value={status} onChange={(event) => setStatus(event.target.value)}>
                <option value="">全部状态</option>
                <option value="ACTIVE">正常</option>
                <option value="DISABLED">已禁用</option>
              </select>
            </label>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={resetFilters}>重置</Button>
          <Button onClick={() => { setPage(1); void loadData(); }}>查询</Button>
        </div>
      </FilterPanel>

      {mode === 'list' ? (
        <DataTable columns={familyColumns} data={families} loading={loading} error={error} rowKey={(item) => item.id} emptyTitle="暂无家庭" />
      ) : mode === 'members' ? (
        <DataTable columns={memberColumns} data={members} loading={loading} error={error} rowKey={(item) => item.id} emptyTitle="暂无成员" />
      ) : (
        <DataTable columns={inviteColumns} data={invites} loading={loading} error={error} rowKey={(item) => item.id} emptyTitle="暂无邀请记录" />
      )}
      <Pager page={page} pageSize={pageSize} total={total} onPageChange={setPage} />

      <Drawer title="家庭详情" open={Boolean(selectedFamily)} onClose={() => setSelectedFamily(null)} widthClassName="max-w-xl">
        {selectedFamily ? (
          <div className="space-y-4">
            <section className="rounded-[8px] border border-[#e5e7eb] p-4">
              <div className="mb-4 text-base font-semibold">基础信息</div>
              <FamilyIdentity family={selectedFamily} />
              <div className="mt-4 grid gap-3 text-sm text-[#4b5563]">
                <div className="flex justify-between"><span>创建人</span><span>{selectedFamily.owner?.nickname ?? '--'}</span></div>
                <div className="flex justify-between"><span>城市</span><span>{selectedFamily.city ?? '--'} {selectedFamily.district ?? ''}</span></div>
                <div className="flex justify-between"><span>创建时间</span><span>{formatTime(selectedFamily.createdAt)}</span></div>
                <div className="flex justify-between"><span>当前状态</span><StatusTag label={statusLabel[selectedFamily.status]} tone={statusTone(selectedFamily.status)} /></div>
              </div>
            </section>
            <section className="rounded-[8px] border border-[#e5e7eb] p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="font-semibold">成员信息</div>
                <div className="text-lg font-semibold">{selectedFamily.memberCount} / {selectedFamily.memberLimit}</div>
              </div>
              <div className="space-y-2">
                {selectedFamily.members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between rounded-[6px] bg-[#f8faf8] px-3 py-2">
                    <MemberIdentity member={member} />
                    <StatusTag label={memberRoleLabel[member.role]} tone={member.role === 'CREATOR' ? 'orange' : 'green'} />
                  </div>
                ))}
              </div>
            </section>
            <section className="rounded-[8px] border border-[#e5e7eb] p-4">
              <div className="mb-3 font-semibold">最近邀请</div>
              <div className="space-y-2 text-sm">
                {selectedFamily.invites.map((invite) => (
                  <div key={invite.id} className="flex items-center justify-between rounded-[6px] bg-[#f8faf8] px-3 py-2">
                    <span>{invite.inviteName}</span>
                    <StatusTag label={inviteStatusLabel[invite.inviteStatus]} tone={statusTone(invite.inviteStatus)} />
                  </div>
                ))}
              </div>
            </section>
          </div>
        ) : null}
      </Drawer>

      <Drawer title="成员详情" open={Boolean(selectedMember)} onClose={() => setSelectedMember(null)} widthClassName="max-w-xl">
        {selectedMember ? (
          <div className="space-y-4">
            <section className="rounded-[8px] border border-[#e5e7eb] p-4">
              <div className="mb-4 text-base font-semibold">基础信息</div>
              <MemberIdentity member={selectedMember} />
              <div className="mt-4 grid gap-3 text-sm text-[#4b5563]">
                <div className="flex justify-between"><span>手机号</span><span>{maskPhone(selectedMember.user?.phone)}</span></div>
                <div className="flex justify-between"><span>所属家庭</span><span>{selectedMember.family.name}</span></div>
                <div className="flex justify-between"><span>角色</span><StatusTag label={memberRoleLabel[selectedMember.role]} tone={selectedMember.role === 'CREATOR' ? 'orange' : 'green'} /></div>
                <div className="flex justify-between"><span>加入方式</span><span>{joinMethodLabel[selectedMember.joinMethod]}</span></div>
                <div className="flex justify-between"><span>加入时间</span><span>{formatTime(selectedMember.joinedAt)}</span></div>
                <div className="flex justify-between"><span>当前状态</span><StatusTag label={memberStatusLabel[selectedMember.memberStatus]} tone={statusTone(selectedMember.memberStatus)} /></div>
              </div>
            </section>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="ghost" onClick={() => setSelectedMember(null)}>关闭</Button>
              <Button variant="danger" disabled={selectedMember.memberStatus !== 'ACTIVE'} onClick={() => void handleRemoveMember(selectedMember)}>移除成员</Button>
            </div>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
};
