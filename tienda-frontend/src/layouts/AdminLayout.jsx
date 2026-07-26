import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { apiRequest } from '../api/client';
import PasswordDialog from '../components/admin/PasswordDialog';
import { useAuth } from '../hooks/useAuth';

const links = [
  ['Resumen', '/admin', '⌂'],
  ['Productos', '/admin/productos', '□'],
  ['Categorías', '/admin/categorias', '◇'],
  ['Pedidos', '/admin/pedidos', '▤'],
  ['Envíos', '/admin/envios', '➜'],
  ['Clientes móviles', '/admin/clientes-moviles', '○'],
  ['Reseñas', '/admin/resenas', '☆'],
  ['Informes', '/admin/reportes', '▥'],
  ['Asistente de tienda', '/admin/asesor-ia', '✦'],
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [readyToShip, setReadyToShip] = useState(0);
  const [paymentReview, setPaymentReview] = useState(0);
  const [passwordOpen, setPasswordOpen] = useState(false);

  useEffect(() => {
    let active = true;
    const refresh = () => apiRequest('/admin/dashboard', { timeoutMs: 7000 })
      .then((data) => {
        if (!active) return;
        setReadyToShip(Number(data?.metrics?.ready_to_ship_orders || 0) + Number(data?.metrics?.preparing_orders || 0));
        setPaymentReview(Number(data?.metrics?.oxxo_review_orders || 0));
      })
      .catch(() => {});
    refresh();
    const timer = window.setInterval(refresh, 30000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  async function closeSession() {
    await logout();
    navigate('/iniciar-sesion', { replace: true });
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <NavLink className="admin-brand" to="/admin">mitienda <span>administración</span></NavLink>
        <nav aria-label="Secciones administrativas">
          {links.map(([label, path, icon]) => (
            <NavLink key={path} to={path} end={path === '/admin'}><i aria-hidden="true">{icon}</i>{label}</NavLink>
          ))}
        </nav>
        <div className="sidebar-footer"><small>Cuenta administrativa</small><button onClick={() => setPasswordOpen(true)} type="button">Cambiar contraseña</button><button onClick={closeSession} type="button">Cerrar sesión</button></div>
      </aside>
      <div className="admin-content">
        <header className="admin-topbar">
          <div className="admin-identity">
            <span className="admin-avatar" aria-hidden="true">{(user?.name || 'A').charAt(0).toUpperCase()}</span>
            <div className="admin-identity-copy"><small>Panel privado</small><strong>{user?.name || 'Administrador'}</strong></div>
          </div>
          <div className="topbar-actions">
            {paymentReview > 0 && <Link className="payment-alert-badge is-review" to="/admin/pedidos"><i /><span><small>Requiere revisión</small><b>{paymentReview} OXXO por validar</b></span></Link>}
            {readyToShip > 0 && <Link className="payment-alert-badge is-ready" to="/admin/envios"><i /><span><small>Listo para envío</small><b>{readyToShip} pago{readyToShip === 1 ? '' : 's'} por preparar</b></span></Link>}
            <span className="role-badge">Administrador</span>
          </div>
        </header>
        <main className="admin-main"><Outlet /></main>
      </div>
      <PasswordDialog onClose={() => setPasswordOpen(false)} open={passwordOpen} />
    </div>
  );
}
