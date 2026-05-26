import type { PropsWithChildren } from 'react';
import { Navigate } from 'react-router-dom';

import { loadToken } from '../storage';

export const RequireAuth = ({ children }: PropsWithChildren) => {
  const token = loadToken();
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

