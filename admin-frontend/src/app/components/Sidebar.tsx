import { useEffect, useMemo, useState } from 'react';
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
    <aside className="sticky top-0 z-10 flex h-screen w-72 shrink-0 flex-col border-r border-[#e9e2d6] bg-[#fffdfc]">
      <div className="px-6 pb-4 pt-6">
        <div className="text-lg font-bold leading-6 text-[#2f2f2f]">家里有菜 Admin</div>
        <div className="mt-1 text-xs text-[#8c8c8c]">运营型生活方式 CMS</div>
        <div className="mt-5 flex items-center justify-between rounded-2xl border border-[#e9e2d6] bg-[#f5f1ea] px-4 py-2 text-sm text-[#8c8c8c]">
          <span>搜索 / Command K</span>
          <span className="font-medium text-[#7a8b6f]">⌘ K</span>
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

      <div className="border-t border-[#e9e2d6] px-6 py-4 text-xs text-[#8c8c8c]">
        <div className="font-medium text-[#7a8b6f]">核心目录 · 子页不进左栏</div>
        <div className="mt-1">详情/新增/编辑/弹窗/预览走操作列</div>
      </div>
    </aside>
  );
};
