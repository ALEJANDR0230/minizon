import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import LoadingState from '../ui/LoadingState';

export default function AdminRoute() {
  const { isAdmin, checkingSession } = useAuth();

  if (checkingSession) return <LoadingState label="Verificando permisos…" />;
  if (!isAdmin) return <Navigate to="/iniciar-sesion" replace />;
  return <Outlet />;
}
