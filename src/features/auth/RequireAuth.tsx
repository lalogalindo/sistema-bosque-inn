import { Navigate, useLocation } from 'react-router-dom';
import { getSession } from './auth.store';

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const session = getSession();
  const location = useLocation();

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
