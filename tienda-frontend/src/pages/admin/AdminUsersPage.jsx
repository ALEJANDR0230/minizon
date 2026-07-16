import { useEffect, useState } from 'react';
import { apiRequest } from '../../api/client';
import Message from '../../components/ui/Message';
import PageHeader from '../../components/ui/PageHeader';

const emptyForm = { name: '', email: '', password: '' };

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      setUsers(await apiRequest('/admin/users'));
    } catch (reason) {
      setError(reason.message);
    }
  }

  function reset() {
    setEditingId(null);
    setForm(emptyForm);
  }

  function edit(user) {
    setEditingId(user.id);
    setForm({ name: user.name, email: user.email, password: '' });
  }

  async function submit(event) {
    event.preventDefault(); setError(''); setMessage('');
    const body = { ...form };
    if (editingId && !body.password) delete body.password;
    try {
      await apiRequest(editingId ? `/admin/users/${editingId}` : '/admin/users', { method: editingId ? 'PUT' : 'POST', body });
      setMessage(editingId ? 'Cliente actualizado.' : 'Cliente móvil creado.');
      reset();
      await load();
    } catch (reason) {
      setError(reason.message);
    }
  }

  async function remove(user) {
    if (!window.confirm(`¿Eliminar la cuenta móvil de ${user.name}?`)) return;
    try {
      await apiRequest(`/admin/users/${user.id}`, { method: 'DELETE' });
      setMessage('Cuenta móvil eliminada.');
      await load();
    } catch (reason) {
      setError(reason.message);
    }
  }

  return (
    <>
      <PageHeader eyebrow="Aplicación móvil" title="Clientes móviles" description="Estas cuentas pertenecen a la app. En el navegador solo puede iniciar sesión el administrador." actions={<button className="button button-secondary" onClick={reset} type="button">Nuevo cliente</button>} />
      <Message type="success">{message}</Message><Message type="error">{error}</Message>
      <div className="admin-editor-layout">
        <section className="admin-panel table-panel">
          <div className="panel-heading"><div><h2>Cuentas de clientes</h2><p>Usuarios que compran desde la aplicación móvil.</p></div><span>{users.length}</span></div>
          <div className="table-wrap"><table><thead><tr><th>Cliente</th><th>Canal</th><th>Pedidos</th><th /></tr></thead><tbody>{users.map((user) => <tr key={user.id}><td><strong>{user.name}</strong><small>{user.email}</small></td><td><span className="role-badge">App móvil</span></td><td>{user.orders_count ?? 0}</td><td className="table-actions"><button onClick={() => edit(user)} type="button">Editar</button><button className="danger" onClick={() => remove(user)} type="button">Eliminar</button></td></tr>)}</tbody></table>{users.length === 0 && <p className="table-empty">Todavía no hay clientes móviles.</p>}</div>
        </section>
        <form className="admin-panel editor-form" onSubmit={submit}>
          <div><h2>{editingId ? 'Editar cliente' : 'Nuevo cliente móvil'}</h2><p>{editingId ? 'Deja la contraseña vacía para conservarla.' : 'La contraseña debe tener al menos 8 caracteres.'}</p></div>
          <label>Nombre<input required value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} /></label>
          <label>Correo<input required type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} /></label>
          <label>Contraseña<input required={!editingId} minLength="8" type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} /></label>
          <div className="form-actions"><button className="button button-primary" type="submit">{editingId ? 'Guardar cambios' : 'Crear cliente'}</button>{editingId && <button className="button button-ghost" onClick={reset} type="button">Cancelar</button>}</div>
        </form>
      </div>
    </>
  );
}
