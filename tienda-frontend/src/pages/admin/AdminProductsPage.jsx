import { useEffect, useState } from 'react';
import { apiRequest } from '../../api/client';
import Message from '../../components/ui/Message';
import PageHeader from '../../components/ui/PageHeader';

const emptyForm = { category_id: '', name: '', sku: '', price: '', stock: '', description: '', image_url: '', is_active: true };

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { load(); }, []);
  async function load() { try { const [nextProducts, nextCategories] = await Promise.all([apiRequest('/admin/products'), apiRequest('/admin/categories')]); setProducts(nextProducts); setCategories(nextCategories); } catch (reason) { setError(reason.message); } }
  function reset() { setEditingId(null); setForm(emptyForm); }
  function edit(product) { setEditingId(product.id); setForm({ category_id: String(product.category_id || ''), name: product.name, sku: product.sku || '', price: String(product.price), stock: String(product.stock), description: product.description || '', image_url: product.image_url || '', is_active: product.is_active }); }

  async function submit(event) {
    event.preventDefault(); setError(''); setMessage('');
    const body = { ...form, category_id: Number(form.category_id), price: Number(form.price), stock: Number(form.stock), image_url: form.image_url || null };
    try { await apiRequest(editingId ? `/admin/products/${editingId}` : '/admin/products', { method: editingId ? 'PUT' : 'POST', body }); setMessage(editingId ? 'Producto actualizado.' : 'Producto creado.'); reset(); await load(); } catch (reason) { setError(reason.message); }
  }

  async function remove(product) {
    if (!window.confirm(`¿Eliminar “${product.name}”?`)) return;
    try { await apiRequest(`/admin/products/${product.id}`, { method: 'DELETE' }); setMessage('Producto eliminado.'); await load(); } catch (reason) { setError(reason.message); }
  }

  return (
    <>
      <PageHeader eyebrow="Catálogo" title="Productos" description="Inventario, precios y visibilidad del catálogo." actions={<button className="button button-secondary" onClick={reset} type="button">Nuevo producto</button>} />
      <Message type="success">{message}</Message><Message type="error">{error}</Message>
      <div className="admin-editor-layout wide-list">
        <section className="admin-panel table-panel"><div className="panel-heading"><h2>Inventario</h2><span>{products.length}</span></div><div className="table-wrap"><table><thead><tr><th>Producto</th><th>Categoría</th><th>Precio</th><th>Stock</th><th>Estado</th><th /></tr></thead><tbody>{products.map((product) => <tr key={product.id}><td><strong>{product.name}</strong><small>{product.sku}</small></td><td>{product.category?.name || 'Sin categoría'}</td><td>${Number(product.price).toFixed(2)}</td><td><span className={product.stock <= 5 ? 'stock-low' : ''}>{product.stock}</span></td><td><span className={`status ${product.is_active ? 'status-delivered' : 'status-cancelled'}`}>{product.is_active ? 'Visible' : 'Oculto'}</span></td><td className="table-actions"><button onClick={() => edit(product)} type="button">Editar</button><button className="danger" onClick={() => remove(product)} type="button">Eliminar</button></td></tr>)}</tbody></table></div></section>
        <form className="admin-panel editor-form" onSubmit={submit}><div><h2>{editingId ? 'Editar producto' : 'Nuevo producto'}</h2><p>Los campos se reflejan directamente en el catálogo.</p></div><label>Nombre<input required value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} /></label><div className="form-grid"><label>SKU<input required value={form.sku} onChange={(event) => setForm((current) => ({ ...current, sku: event.target.value }))} /></label><label>Categoría<select required value={form.category_id} onChange={(event) => setForm((current) => ({ ...current, category_id: event.target.value }))}><option value="">Seleccionar</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label></div><div className="form-grid"><label>Precio<input required min="0" step="0.01" type="number" value={form.price} onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))} /></label><label>Stock<input required min="0" type="number" value={form.stock} onChange={(event) => setForm((current) => ({ ...current, stock: event.target.value }))} /></label></div><label>Descripción<textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} /></label><label>URL de imagen <small>(opcional)</small><input type="url" value={form.image_url} onChange={(event) => setForm((current) => ({ ...current, image_url: event.target.value }))} /></label><label className="check-field"><input checked={form.is_active} onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))} type="checkbox" /> Visible en el catálogo</label><div className="form-actions"><button className="button button-primary" type="submit">{editingId ? 'Guardar cambios' : 'Crear producto'}</button>{editingId && <button className="button button-ghost" onClick={reset} type="button">Cancelar</button>}</div></form>
      </div>
    </>
  );
}
