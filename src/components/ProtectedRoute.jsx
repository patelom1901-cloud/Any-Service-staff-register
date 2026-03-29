import { Navigate } from 'react-router-dom';
import { getCurrentUser } from '../utils/auth';

export function AdminRoute({ children }) {
  const user = getCurrentUser();
  if (!user || user.role !== 'admin') return <Navigate to="/login" replace />;
  return children;
}

export function WorkerRoute({ children }) {
  const user = getCurrentUser();
  if (!user || user.role !== 'worker') return <Navigate to="/login" replace />;
  return children;
}
