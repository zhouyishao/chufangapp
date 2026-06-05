import { Box, CheckCircle2, ClipboardList, PlusCircle, Scale, Search } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '../components/Button';
import { Drawer } from '../components/Drawer';

type UnitType = '重量' | '容量' | '数量' | '包装' | '口语';
type UnitStatus = '启用' | '禁用';

type UnitRow = {
  id: string;
  name: string;
  code: string;
  type: UnitType;
  baseUnit: string;
  ratio: string;
  target: string;
  isDefault: boolean;
  status: UnitStatus;
  updatedAt: string;
  selected?: boolean;
};

const units: UnitRow[] = [
  { id: '1', name: '克（g）', code: 'g', type: '重量', baseUnit: '克（g）', ratio: '1', target: '食材、菜谱、采购', isDefault: true, status: '启用', updatedAt: '2025-05-24 14:31:22', selected: true },
  { id: '2', name: '千克（kg）', code: 'kg', type: '重量', baseUnit: '克（g）', ratio: '1000', target: '食材、菜谱、采购', isDefault: false, status: '启用', updatedAt: '2025-05-24 14:30:11' },
  { id: '3', name: '斤（jin）', code: 'jin', type: '重量', baseUnit: '克（g）', ratio: '500', target: '食材、菜谱、采购', isDefault: false, status: '启用', updatedAt: '2025-05-24 14:29:45' },
  { id: '4', name: '毫升（ml）', code: 'ml', type: '容量', baseUnit: '毫升（ml）', ratio: '1', target: '食材、菜谱、采购', isDefault: true, status: '启用', updatedAt: '2025-05-24 14:28:59' },
  { id: '5', name: '升（L）', code: 'L', type: '容量', baseUnit: '毫升（ml）', ratio: '1000', target: '食材、菜谱、采购', isDefault: false, status: '启用', updatedAt: '2025-05-24 14:27:33' },
  { id: '6', name: '个', code: 'ge', type: '数量', baseUnit: '个', ratio: '1', target: '食材、菜谱、采购', isDefault: true, status: '启用', updatedAt: '2025-05-24 14:26:18' },
  { id: '7', name: '颗', code: 'ke', type: '数量', baseUnit: '个', ratio: '1', target: '食材、菜谱、采购', isDefault: false, status: '启用', updatedAt: '2025-05-24 14:25:02' },
  { id: '8', name: '根', code: 'gen', type: '数量', baseUnit: '个', ratio: '1', target: '食材、菜谱、采购', isDefault: false, status: '启用', updatedAt: '2025-05-24 14:24:11' },
  { id: '9', name: '瓶', code: 'ping', type: '包装', baseUnit: '个', ratio: '1', target: '食材、菜谱、采购', isDefault: false, status: '启用', updatedAt: '2025-05-24 14:23:30' },
  { id: '10', name: '袋', code: 'dai', type: '包装', baseUnit: '个', ratio: '1', target: '食材、菜谱、采购', isDefault: false, status: '启用', updatedAt: '2025-05-24 14:22:52' },
  { id: '11', name: '勺', code: 'shao', type: '口语', baseUnit: '毫升（ml）', ratio: '15', target: '菜谱', isDefault: false, status: '启用', updatedAt: '2025-05-24 14:22:10' },
  { id: '12', name: '适量', code: 'shiliang', type: '口语', baseUnit: '-', ratio: '-', target: '菜谱', isDefault: false, status: '启用', updatedAt: '2025-05-24 14:21:05' }
];

const typeTone: Record<UnitType, string> = {
  重量: 'border-emerald-100 bg-emerald-50 text-emerald-700',
  容量: 'border-sky-100 bg-sky-50 text-sky-700',
  数量: 'border-orange-100 bg-orange-50 text-orange-700',
  包装: 'border-violet-100 bg-violet-50 text-violet-700',
  口语: 'border-slate-100 bg-slate-50 text-slate-700'
};

export const UnitsPage = () => {
  const [selected, setSelected] = useState<UnitRow | null>(null);
  const navigate = useNavigate();

  return (
    <section className="space-y-6">
      <PageTitle
        title="单位管理"
        description="统一管理食材、菜谱、价格与采购清单使用的单位，支持单位类型、换算关系、适用对象和状态设置。"
        action="新增单位"
        onAction={() => navigate('/taxonomies/units/create')}
      />

      <div className="space-y-5">
          <FilterBar
            fields={[
              { label: '单位类型', value: '全部' },
              { label: '适用对象', value: '全部' },
              { label: '状态', value: '全部' }
            ]}
            placeholder="请输入单位名称、编码或关键词"
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <Metric icon={<Scale className="h-6 w-6" />} title="单位总数" value="18" help="个" tone="green" />
            <Metric icon={<Scale className="h-6 w-6" />} title="重量单位" value="3" help="个" tone="green" />
            <Metric icon={<ClipboardList className="h-6 w-6" />} title="容量单位" value="2" help="个" tone="blue" />
            <Metric icon={<Box className="h-6 w-6" />} title="数量单位" value="6" help="个" tone="orange" />
            <Metric icon={<CheckCircle2 className="h-6 w-6" />} title="启用中" value="16" help="个" tone="green" />
          </div>

          <div className="overflow-hidden rounded-[8px] border border-[#e5e7eb] bg-white shadow-[0_4px_18px_rgba(15,23,42,0.03)]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1080px] table-fixed text-left text-sm">
            <thead className="bg-[#fbfcfb] text-xs font-semibold text-[#374151]">
              <tr>
                <Th className="w-[52px]"><input type="checkbox" className="h-4 w-4 rounded border-[#d1d5db]" /></Th>
                <Th>单位名称</Th>
                <Th>单位编码</Th>
                <Th>单位类型</Th>
                <Th>基础单位</Th>
                <Th>换算比例</Th>
                <Th>适用对象</Th>
                <Th>是否默认</Th>
                <Th>状态</Th>
                <Th>更新时间</Th>
                <Th className="sticky right-0 z-20 bg-[#fbfcfb] text-right shadow-[-12px_0_18px_-18px_rgba(47,47,47,0.35)]">操作</Th>
              </tr>
            </thead>
            <tbody>
              {units.map((item) => (
                <tr key={item.id} className={['border-t border-[#eef0ee] hover:bg-[#f7faf7]', selected?.id === item.id ? 'bg-[#f7fbf6]' : ''].join(' ')}>
                  <Td><input type="checkbox" className="h-4 w-4 rounded border-[#d1d5db] accent-[#2f7d32]" checked={selected?.id === item.id} onChange={() => setSelected(item)} /></Td>
                  <Td>
                    <button type="button" onClick={() => setSelected(item)} className="font-medium text-[#202124] hover:text-[#2f7d32]">
                      {item.name}
                    </button>
                  </Td>
                  <Td>{item.code}</Td>
                  <Td><Badge className={typeTone[item.type]}>{item.type}</Badge></Td>
                  <Td>{item.baseUnit}</Td>
                  <Td>{item.ratio}</Td>
                  <Td>{item.target}</Td>
                  <Td>{item.isDefault ? <Badge className="border-emerald-100 bg-emerald-50 text-emerald-700">默认</Badge> : '-'}</Td>
                  <Td><StatusBadge status={item.status} /></Td>
                  <Td>{item.updatedAt}</Td>
                  <Td className="sticky right-0 z-10 bg-white shadow-[-12px_0_18px_-18px_rgba(47,47,47,0.35)]">
                    <div className="flex justify-end gap-4 text-xs font-semibold">
                      <Action onClick={() => setSelected(item)}>查看</Action>
                      <Action onClick={() => navigate(`/taxonomies/units/${item.id}/edit`)}>编辑</Action>
                      <Action className="text-blue-600">禁用</Action>
                      <Action>更多⌄</Action>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
              </table>
            </div>
          </div>

          <Pagination total="18" />
      </div>
      <Drawer title={selected ? `${selected.name} 详情` : '单位详情'} open={Boolean(selected)} onClose={() => setSelected(null)} widthClassName="max-w-lg">
        {selected ? <DetailPanel item={selected} /> : null}
      </Drawer>
    </section>
  );
};

const DetailPanel = ({ item }: { item: UnitRow }) => (
  <div className="rounded-[8px] border border-[#e5e7eb] bg-white">
    <div className="flex items-center justify-between border-b border-[#e5e7eb] px-5 py-4">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold text-[#111827]">{item.name}</h2>
        <StatusBadge status={item.status} />
      </div>
    </div>
    <div className="flex border-b border-[#e5e7eb] px-5 text-sm font-semibold">
      {['详情', '换算关系', '适用对象', '使用说明'].map((tab, index) => (
        <button key={tab} className={['mr-7 border-b-2 py-3', index === 0 ? 'border-[#2f7d32] text-[#2f7d32]' : 'border-transparent text-[#6b7280]'].join(' ')}>{tab}</button>
      ))}
    </div>
    <div className="space-y-6 px-5 py-5">
      <PanelSection title="基础信息">
        <Info label="单位名称" value={item.name} />
        <Info label="单位编码" value={item.code} />
        <Info label="单位类型" value={<Badge className={typeTone[item.type]}>{item.type}</Badge>} />
        <Info label="基础单位" value={item.baseUnit} />
        <Info label="换算比例" value={item.ratio} />
        <Info label="是否默认" value={item.isDefault ? <Badge className="border-emerald-100 bg-emerald-50 text-emerald-700">默认</Badge> : '-'} />
        <Info label="状态" value={<StatusBadge status={item.status} />} />
        <Info label="创建时间" value="2025-05-20 10:12:33" />
        <Info label="更新时间" value={item.updatedAt} />
        <Info label="创建人" value="管理员" />
      </PanelSection>

      <PanelSection title="适用对象">
        <div className="flex flex-wrap gap-2">
          <Badge className="border-emerald-100 bg-emerald-50 text-emerald-700">食材</Badge>
          <Badge className="border-orange-100 bg-orange-50 text-orange-700">菜谱</Badge>
          <Badge className="border-blue-100 bg-blue-50 text-blue-700">采购清单</Badge>
        </div>
      </PanelSection>

      <PanelSection title="使用说明">
        <p className="text-sm leading-6 text-[#4b5563]">标准重量计量单位，用于大多数食材的重量标注与换算。</p>
      </PanelSection>

      <PanelSection title="备注">
        <p className="text-sm leading-6 text-[#4b5563]">系统内置单位，不可删除。</p>
      </PanelSection>
    </div>
  </div>
);

const PageTitle = ({ title, description, action, onAction }: { title: string; description: string; action: string; onAction: () => void }) => (
  <div className="flex items-start justify-between gap-4">
    <div>
      <h1 className="text-[28px] font-semibold leading-9 text-[#111827]">{title}</h1>
      <p className="mt-2 text-sm text-[#4b5563]">{description}</p>
    </div>
    <Button className="gap-2" onClick={onAction}><PlusCircle className="h-4 w-4" />{action}</Button>
  </div>
);

const FilterBar = ({ fields, placeholder }: { fields: { label: string; value: string }[]; placeholder: string }) => (
  <div className="rounded-[8px] border border-[#e5e7eb] bg-white p-4">
    <div className="flex flex-wrap items-center gap-5">
      {fields.map((field) => (
        <label key={field.label} className="flex items-center gap-3 text-sm font-semibold text-[#202124]">
          {field.label}
          <select className="h-10 w-[128px] rounded-[6px] border border-[#e5e7eb] bg-white px-3 text-sm font-normal text-[#202124]">
            <option>{field.value}</option>
          </select>
        </label>
      ))}
      <span className="relative ml-auto min-w-[280px] flex-1">
        <input className="h-10 w-full rounded-[6px] border border-[#e5e7eb] px-3 pr-10 text-sm outline-none focus:border-[#2f7d32] focus:ring-2 focus:ring-[#2f7d32]/10" placeholder={placeholder} />
        <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]" />
      </span>
      <Button>查询</Button>
      <Button variant="ghost">重置</Button>
    </div>
  </div>
);

const Metric = ({ icon, title, value, help, tone }: { icon: ReactNode; title: string; value: string; help: string; tone: 'green' | 'blue' | 'orange' }) => {
  const toneClass = {
    green: 'bg-[#edf7ed] text-[#2f7d32]',
    blue: 'bg-[#eaf4ff] text-[#1677ff]',
    orange: 'bg-[#fff7ed] text-[#f97316]'
  }[tone];
  return (
    <div className="flex items-center gap-5 rounded-[8px] border border-[#e5e7eb] bg-white px-5 py-5">
      <span className={['flex h-12 w-12 items-center justify-center rounded-full', toneClass].join(' ')}>{icon}</span>
      <div>
        <div className="text-sm text-[#4b5563]">{title}</div>
        <div className="mt-1 flex items-end gap-2 text-[25px] font-semibold leading-8 text-[#111827]">
          {value}<span className="pb-1 text-sm font-normal text-[#4b5563]">{help}</span>
        </div>
      </div>
    </div>
  );
};

const Th = ({ children, className = '' }: { children: ReactNode; className?: string }) => <th className={`px-4 py-3 ${className}`}>{children}</th>;
const Td = ({ children, className = '' }: { children: ReactNode; className?: string }) => <td className={`px-4 py-3 text-[#202124] ${className}`}>{children}</td>;
const Badge = ({ children, className }: { children: ReactNode; className: string }) => <span className={`inline-flex rounded-[5px] border px-2 py-0.5 text-xs font-semibold ${className}`}>{children}</span>;
const StatusBadge = ({ status }: { status: UnitStatus }) => <Badge className={status === '启用' ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : 'border-rose-100 bg-rose-50 text-rose-700'}>{status}</Badge>;
const Action = ({ children, className = 'text-[#2f7d32]', onClick }: { children: ReactNode; className?: string; onClick?: () => void }) => <button type="button" onClick={onClick} className={`${className} hover:opacity-80`}>{children}</button>;

const PanelSection = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="border-b border-[#eef0ee] pb-5 last:border-b-0">
    <h3 className="mb-4 text-base font-semibold text-[#111827]">{title}</h3>
    <div className="space-y-3">{children}</div>
  </section>
);

const Info = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="grid grid-cols-[92px_1fr] gap-3 text-sm">
    <span className="text-[#6b7280]">{label}</span>
    <span className="text-[#202124]">{value}</span>
  </div>
);

const Pagination = ({ total }: { total: string }) => (
  <div className="flex items-center justify-between text-sm text-[#4b5563]">
    <div>共 {total} 条</div>
    <div className="flex items-center gap-2">
      <select className="h-9 rounded-[6px] border border-[#e5e7eb] bg-white px-3"><option>10 条/页</option></select>
      <button className="h-9 w-9 rounded-[6px] border border-[#e5e7eb] bg-white">‹</button>
      <button className="h-9 w-9 rounded-[6px] bg-[#2f7d32] text-white">1</button>
      <button className="h-9 w-9 rounded-[6px] border border-[#e5e7eb] bg-white">2</button>
      <button className="h-9 w-9 rounded-[6px] border border-[#e5e7eb] bg-white">›</button>
      <span className="ml-4">跳至</span>
      <input className="h-9 w-16 rounded-[6px] border border-[#e5e7eb] bg-white px-2 text-center" defaultValue="1" />
      <span>页</span>
    </div>
  </div>
);
