import { useEffect, useState } from 'react';
import { apiRequest } from '../../api/client';
import Message from '../../components/ui/Message';
import PageHeader from '../../components/ui/PageHeader';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      setUsers(await apiRequest('/admin/users'));
    } catch (reason) {
      setError(reason.message);
    } finally {
      setLoading(false);
    }
  }

  async function toggleBlocked(user) {
    setUpdatingId(user.id);
    setError('');
    setMessage('');
    try {
      const data = await apiRequest(`/admin/users/${user.id}/block`, {
        method: 'PATCH',
        body: { is_blocked: !user.is_blocked },
      });
      setUsers((current) => current.map((item) => (item.id === user.id ? data.user : item)));
      setMessage(data.message);
    } catch (reason) {
      setError(reason.message);
    } finally {
      setUpdatingId(null);
    }
  }

  const query = search.trim().toLocaleLowerCase('es');
  const visibleUsers = users.filter((user) => {
    const matchesSearch = `${user.name} ${user.email}`.toLocaleLowerCase('es').includes(query);
    const matchesStatus = statusFilter === 'all'
      || (statusFilter === 'active' && !user.is_blocked)
      || (statusFilter === 'blocked' && user.is_blocked);
    return matchesSearch && matchesStatus;
  });
  const blockedCount = users.filter((user) => user.is_blocked).length;
  const activeCount = users.length - blockedCount;

  return (
    <>
      <PageHeader eyebrow="Administración" title="Control de usuarios" description="Bloquea o reactiva cuentas de la aplicación móvil." />
      <Message type="success">{message}</Message>
      <Message type="error">{error}</Message>

      <section className="user-access-summary">
        <article><small>Total</small><strong>{users.length}</strong></article>
        <article><small>Activos</small><strong>{activeCount}</strong></article>
        <article><small>Bloqueados</small><strong>{blockedCount}</strong></article>
      </section>

      <section className="admin-panel table-panel user-access-panel">
        <div className="user-access-toolbar">
          <div><h2>Acceso de clientes</h2><span>{visibleUsers.length} cuentas</span></div>
          <div className="user-access-filters">
            <label><span>Buscar</span><input onChange={(event) => setSearch(event.target.value)} placeholder="Nombre o correo" type="search" value={search} /></label>
            <label><span>Estado</span><select onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}><option value="all">Todos</option><option value="active">Activos</option><option value="blocked">Bloqueados</option></select></label>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Cliente</th><th>Pedidos</th><th>Estado</th><th>Acceso</th></tr></thead>
            <tbody>
              {visibleUsers.map((user) => (
                <tr key={user.id}>
                  <td><strong>{user.name}</strong><small>{user.email}</small></td>
                  <td>{user.orders_count ?? 0}</td>
                  <td><span className={`status ${user.is_blocked ? 'status-cancelled' : 'status-delivered'}`}>{user.is_blocked ? 'Bloqueado' : 'Activo'}</span></td>
                  <td>
                    <button
                      aria-checked={!user.is_blocked}
                      className={`access-switch ${user.is_blocked ? 'is-blocked' : ''}`}
                      disabled={updatingId === user.id}
                      onClick={() => toggleBlocked(user)}
                      role="switch"
                      type="button"
                    >
                      <span><i /></span>
                      <b>{updatingId === user.id ? 'Guardando…' : user.is_blocked ? 'Reactivar' : 'Bloquear'}</b>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && visibleUsers.length === 0 && <p className="table-empty">No hay usuarios para mostrar.</p>}
          {loading && <p className="table-empty">Cargando usuarios…</p>}
        </div>
      </section>
    </>
  );
}
