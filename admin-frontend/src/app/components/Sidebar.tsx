import { useEffect, useMemo, useState } from 'react';
import { Sprout } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';

import { adminNavigation, findNavigationTrail } from '../navigation';

export const Sidebar = () => {
  const location = useLocation();
  const activeTrail = useMemo(() => findNavigationTrail(location.pathname), [location.pathname]);
  const activeGroup = activeTrail[0] ?? null;
  const activeItem = activeTrail[activeTrail.length - 1] ?? null;
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(activeGroup ? [activeGroup.path] : []));

  useEffect(() => {
    if (!activeGroup?.children) return;
    setExpanded((prev) => {
      const next = new Set(prev);
      next.add(activeGroup.path);
      return next;
    });
  }, [activeGroup?.path, activeGroup?.children]);

  const toggleGroup = (path: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  return (
    <aside className="sticky top-0 z-10 flex h-screen w-[286px] shrink-0 flex-col border-r border-[#e7dfd1] bg-[#fffdf8]">
      <div className="border-b border-[#eee7dc] px-6 py-6">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eef3ea] text-[#6f8663] shadow-[inset_0_0_0_1px_rgba(122,139,111,0.16)]">
            <Sprout className="h-5 w-5" />
          </span>
          <div className="min-w-0 whitespace-nowrap text-xl font-semibold leading-none tracking-tight text-[#2f2f2f]">家庭食谱 App 后台</div>
        </div>
      </div>

      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-4 pb-4">
        {adminNavigation.map((group) => {
          const isGroupActive = activeGroup?.label === group.label;
          const isExpanded = expanded.has(group.path);
          if (group.children?.length) {
            return (
              <div key={group.path} className="space-y-1">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.path)}
                  className={[
                    'flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition',
                    isGroupActive
                      ? 'border border-[#e9e2d6] bg-[#f5f1ea] font-medium text-[#2f2f2f]'
                      : 'text-[#8c8c8c] hover:bg-[#f5f1ea] hover:text-[#2f2f2f]'
                  ].join(' ')}
                >
                  <span className="flex items-center gap-3">
                    <span className={['h-1.5 w-1.5 rounded-full', isGroupActive ? 'bg-[#7a8b6f]' : 'bg-[#e4ddcf]'].join(' ')} />
                    {group.label}
                  </span>
                  <span className="text-xs text-[#8c8c8c] transition-transform">{isExpanded ? '⌄' : '›'}</span>
                </button>

                {isExpanded ? (
                  <div className="ml-5 space-y-1 border-l border-[#e9e2d6] pl-3">
                    {group.children.map((child) => {
                      const isChildActive = activeItem?.label === child.label && activeItem.path === child.path;
                      return (
                        <NavLink
                          key={`${group.path}-${child.path}-${child.label}`}
                          to={child.path}
                          end={child.path === group.path}
                          className={[
                            'block rounded-lg px-3 py-1.5 text-xs transition',
                            isChildActive ? 'bg-[#e9e2d6] font-medium text-[#2f2f2f]' : 'text-[#8c8c8c] hover:bg-[#f5f1ea] hover:text-[#2f2f2f]'
                          ].join(' ')}
                        >
                          {child.label}
                        </NavLink>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          }

          return (
            <div key={group.path} className="space-y-1">
              <NavLink
                to={group.path}
                end
                className={({ isActive }) =>
                  [
                    'flex items-center justify-between rounded-xl px-3 py-2 text-sm transition',
                    isActive
                      ? 'border border-[#e9e2d6] bg-[#f5f1ea] font-medium text-[#2f2f2f]'
                      : 'text-[#8c8c8c] hover:bg-[#f5f1ea] hover:text-[#2f2f2f]'
                  ].join(' ')
                }
              >
                <span className="flex items-center gap-3">
                  <span className={['h-1.5 w-1.5 rounded-full', isGroupActive ? 'bg-[#7a8b6f]' : 'bg-[#e4ddcf]'].join(' ')} />
                  {group.label}
                </span>
                <span className="text-xs text-[#8c8c8c]">›</span>
              </NavLink>
            </div>
          );
        })}
      </nav>

      <div className="px-5 pb-5 pt-4">
        <div className="relative h-[176px] overflow-hidden rounded-[4px] border border-[#eee7dc] bg-[#f7f0e4]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,253,248,0.9),rgba(247,240,228,0.18)_56%,rgba(235,226,211,0.55))]" />
          <div className="absolute bottom-5 left-1/2 h-7 w-28 -translate-x-1/2 rounded-[50%] bg-[#a59780]/35 blur-[1px]" />
          <div className="absolute bottom-7 left-[92px] h-11 w-16 rounded-b-[28px] rounded-t-[8px] border border-[#cfc1ac] bg-[#b9aa92]/55" />
          <div className="absolute bottom-[72px] left-[123px] h-[72px] w-px -rotate-[10deg] bg-[#9aa17e]" />
          <div className="absolute bottom-[94px] left-[104px] h-[54px] w-px rotate-[24deg] bg-[#9aa17e]" />
          <div className="absolute bottom-[86px] left-[142px] h-[62px] w-px -rotate-[32deg] bg-[#9aa17e]" />
          <span className="absolute bottom-[132px] left-[98px] h-6 w-3 rotate-[-42deg] rounded-full bg-[#8f9b78]/80" />
          <span className="absolute bottom-[112px] left-[112px] h-7 w-4 rotate-[36deg] rounded-full bg-[#a2ad88]/80" />
          <span className="absolute bottom-[139px] left-[132px] h-6 w-3 rotate-[42deg] rounded-full bg-[#8f9b78]/85" />
          <span className="absolute bottom-[103px] left-[146px] h-7 w-4 rotate-[-28deg] rounded-full bg-[#a2ad88]/75" />
          <span className="absolute bottom-[82px] left-[130px] h-5 w-3 rotate-[28deg] rounded-full bg-[#9aa17e]/70" />
        </div>
      </div>
    </aside>
  );
};
