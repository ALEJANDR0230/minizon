import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const links = [
  ['Resumen', '/admin', '⌂'],
  ['Productos', '/admin/productos', '□'],
  ['Categorías', '/admin/categorias', '◇'],
  ['Pedidos', '/admin/pedidos', '▤'],
  ['Clientes móviles', '/admin/clientes-moviles', '○'],
  ['Reseñas', '/admin/resenas', '☆'],
  ['Informes', '/admin/reportes', '▥'],
  ['Asistente de tienda', '/admin/asesor-ia', '✦'],
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
        <div className="sidebar-footer"><small>Solo administrador</small><button onClick={closeSession} type="button">Cerrar sesión</button></div>
      </aside>
      <div className="admin-content">
        <header className="admin-topbar">
          <div><small>Panel privado</small><strong>{user?.name || 'Administrador'}</strong></div>
          <span className="role-badge">Administrador</span>
        </header>
        <main className="admin-main"><Outlet /></main>
      </div>
    </div>
  );
}
