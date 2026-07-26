import { useEffect, useState } from 'react';
import { apiRequest } from '../../api/client';
import ActionDialog from '../../components/ui/ActionDialog';
import Message from '../../components/ui/Message';
import PageHeader from '../../components/ui/PageHeader';

const emptyForm = { name: '', slug: '', description: '', is_active: true };

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { load(); }, []);
  async function load() { try { setCategories(await apiRequest('/admin/categories')); } catch (reason) { setError(reason.message); } }
  function edit(item) { setEditingId(item.id); setForm({ name: item.name, slug: item.slug, description: item.description || '', is_active: item.is_active }); }
  function reset() { setEditingId(null); setForm(emptyForm); }

  async function submit(event) {
    event.preventDefault(); setError(''); setMessage('');
    try {
      await apiRequest(editingId ? `/admin/categories/${editingId}` : '/admin/categories', { method: editingId ? 'PUT' : 'POST', body: form });
      setMessage(editingId ? 'Categoría actualizada.' : 'Categoría creada.'); reset(); await load();
    } catch (reason) { setError(reason.message); }
  }

  function remove(item) {
    setDeleteTarget(item);
  }

  async function confirmRemove(item) {
    setDeleting(true);
    try { await apiRequest(`/admin/categories/${item.id}`, { method: 'DELETE' }); setMessage('Categoría eliminada.'); setDeleteTarget(null); await load(); } catch (reason) { setError(reason.message); } finally { setDeleting(false); }
  }

  const query = search.trim().toLocaleLowerCase('es');
  const filteredCategories = categories.filter((item) => {
    const matchesSearch = `${item.name} ${item.slug || ''}`.toLocaleLowerCase('es').includes(query);
    const matchesStatus = statusFilter === 'all'
      || (statusFilter === 'active' && item.is_active)
      || (statusFilter === 'hidden' && !item.is_active);
    return matchesSearch && matchesStatus;
  });

  return (
    <>
      <PageHeader eyebrow="Administración" title="Categorías" description="Organiza el catálogo por categorías." actions={<button className="button button-secondary" onClick={reset} type="button">Nueva categoría</button>} />
      <Message type="success">{message}</Message><Message type="error">{error}</Message>
      <div className="admin-editor-layout">
        <section className="admin-panel table-panel">
          <div className="panel-heading"><h2>Categorías registradas</h2><span>{filteredCategories.length} de {categories.length}</span></div>
          <div className="admin-filter-bar compact-filter-bar">
            <label className="filter-search"><span>Buscar</span><input onChange={(event) => setSearch(event.target.value)} placeholder="Nombre o slug" type="search" value={search} /></label>
            <label><span>Estado</span><select onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}><option value="all">Todas</option><option value="active">Activas</option><option value="hidden">Ocultas</option></select></label>
          </div>
          <div className="table-wrap"><table><thead><tr><th>Nombre</th><th>Productos</th><th>Estado</th><th /></tr></thead><tbody>{filteredCategories.map((item) => <tr key={item.id}><td><strong>{item.name}</strong><small>/{item.slug}</small></td><td>{item.products_count}</td><td><span className={`status ${item.is_active ? 'status-delivered' : 'status-cancelled'}`}>{item.is_active ? 'Activa' : 'Oculta'}</span></td><td className="table-actions"><button onClick={() => edit(item)} type="button">Editar</button><button className="danger" onClick={() => remove(item)} type="button">Eliminar</button></td></tr>)}</tbody></table>{!filteredCategories.length && <p className="table-empty">No hay categorías con estos filtros.</p>}</div>
        </section>
        <form className="admin-panel editor-form" onSubmit={submit}><div><h2>{editingId ? 'Editar categoría' : 'Nueva categoría'}</h2></div><label>Nombre<input required value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} /></label><label>Slug <small>(opcional)</small><input value={form.slug} onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))} placeholder="se-genera-automaticamente" /></label><label>Descripción<textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} /></label><label className="check-field"><input checked={form.is_active} onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))} type="checkbox" /> Visible en la tienda</label><div className="form-actions"><button className="button button-primary" type="submit">{editingId ? 'Guardar cambios' : 'Crear categoría'}</button>{editingId && <button className="button button-ghost" onClick={reset} type="button">Cancelar</button>}</div></form>
      </div>
      <ActionDialog
        busy={deleting}
        confirmLabel="Eliminar categoría"
        danger
        description={deleteTarget ? `Se eliminará “${deleteTarget.name}”. Esta acción no se puede deshacer.` : ''}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => confirmRemove(deleteTarget)}
        open={Boolean(deleteTarget)}
        title="¿Eliminar categoría?"
      />
    </>
  );
}
