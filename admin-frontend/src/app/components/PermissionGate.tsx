import { cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react';

import { canAccess } from '../permissions';

type Props = {
  permission: string;
  mode?: 'hide' | 'disable';
  children: ReactNode;
};

export const PermissionGate = ({ permission, mode = 'hide', children }: Props) => {
  if (canAccess(permission)) return <>{children}</>;
  if (mode === 'hide') return null;
  if (isValidElement(children)) {
    return cloneElement(children as ReactElement<{ disabled?: boolean; title?: string }>, {
      disabled: true,
      title: '无权限执行此操作'
    });
  }
  return <span aria-disabled="true" title="无权限执行此操作">{children}</span>;
};
