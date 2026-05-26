import type { PropsWithChildren } from 'react';
import { Navigate } from 'react-router-dom';

import { canAccess } from '../permissions';

type Props = PropsWithChildren<{
  permission?: string;
}>;

export const RequirePermission = ({ children, permission }: Props) => {
  if (!canAccess(permission)) return <Navigate to="/403" replace />;
  return <>{children}</>;
};
