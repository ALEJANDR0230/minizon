import { useEffect, useState } from 'react';
import { apiRequest, apiUpload } from '../../api/client';
import ActionDialog from '../../components/ui/ActionDialog';
import Message from '../../components/ui/Message';
import PageHeader from '../../components/ui/PageHeader';

const emptyForm = { category_id: '', name: '', sku: '', price: '', stock: '', description: '', image_url: '', is_active: true };

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [visibilityFilter, setVisibilityFilter] = useState('all');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const [nextProducts, nextCategories] = await Promise.all([
        apiRequest('/admin/products'),
        apiRequest('/admin/categories'),
      ]);
      setProducts(nextProducts);
      setCategories(nextCategories);
    } catch (reason) {
      setError(reason.message);
    }
  }

  function releasePreview() {
    if (imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
  }

  function reset() {
    releasePreview();
    setEditingId(null);
    setForm(emptyForm);
    setImageFile(null);
    setImagePreview('');
  }

  function edit(product) {
    releasePreview();
    setEditingId(product.id);
    setForm({
      category_id: String(product.category_id || ''),
      name: product.name,
      sku: product.sku || '',
      price: String(product.price),
      stock: String(product.stock),
      description: product.description || '',
      image_url: product.image_url || '',
      is_active: product.is_active,
    });
    setImageFile(null);
    setImagePreview(product.image_url || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function chooseImage(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Selecciona una imagen JPG, PNG o WebP.');
      event.target.value = '';
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('La imagen no puede pesar más de 2 MB.');
      event.target.value = '';
      return;
    }
    releasePreview();
    setError('');
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    setSaving(true);
    try {
      let imageUrl = form.image_url || null;
      if (imageFile) {
        const upload = await apiUpload('/admin/products/upload-image', imageFile);
        imageUrl = upload.image_url;
      }
      const body = {
        ...form,
        category_id: Number(form.category_id),
        price: Number(form.price),
        stock: Number(form.stock),
        image_url: imageUrl,
      };
      await apiRequest(editingId ? `/admin/products/${editingId}` : '/admin/products', {
        method: editingId ? 'PUT' : 'POST',
        body,
      });
      setMessage(editingId ? 'Producto actualizado.' : 'Producto creado.');
      reset();
      await load();
    } catch (reason) {
      setError(reason.message);
    } finally {
      setSaving(false);
    }
  }

  function remove(product) {
    setDeleteTarget(product);
  }

  async function confirmRemove(product) {
    setDeleting(true);
    try {
      await apiRequest(`/admin/products/${product.id}`, { method: 'DELETE' });
      setMessage('Producto eliminado.');
      setDeleteTarget(null);
      await load();
    } catch (reason) {
      setError(reason.message);
    } finally {
      setDeleting(false);
    }
  }

  const query = search.trim().toLocaleLowerCase('es');
  const filteredProducts = products.filter((product) => {
    const matchesSearch = `${product.name} ${product.sku || ''}`.toLocaleLowerCase('es').includes(query);
    const matchesCategory = categoryFilter === 'all' || String(product.category_id) === categoryFilter;
    const matchesStock = stockFilter === 'all'
      || (stockFilter === 'out' && product.stock === 0)
      || (stockFilter === 'low' && product.stock > 0 && product.stock <= 5)
      || (stockFilter === 'available' && product.stock > 5);
    const matchesVisibility = visibilityFilter === 'all'
      || (visibilityFilter === 'visible' && product.is_active)
      || (visibilityFilter === 'hidden' && !product.is_active);
    return matchesSearch && matchesCategory && matchesStock && matchesVisibility;
  });

  return (
    <>
      <PageHeader eyebrow="Administración" title="Productos" description="Administra imágenes, inventario, precios y disponibilidad." actions={<button className="button button-secondary" onClick={reset} type="button">Nuevo producto</button>} />
      <Message type="success">{message}</Message><Message type="error">{error}</Message>
      <div className="admin-editor-layout wide-list">
        <section className="admin-panel table-panel">
          <div className="panel-heading"><h2>Inventario</h2><span>{filteredProducts.length} de {products.length}</span></div>
          <div className="admin-filter-bar products-filter-bar">
            <label className="filter-search"><span>Buscar</span><input onChange={(event) => setSearch(event.target.value)} placeholder="Producto o SKU" type="search" value={search} /></label>
            <label><span>Categoría</span><select onChange={(event) => setCategoryFilter(event.target.value)} value={categoryFilter}><option value="all">Todas</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
            <label><span>Inventario</span><select onChange={(event) => setStockFilter(event.target.value)} value={stockFilter}><option value="all">Todo</option><option value="out">Agotado</option><option value="low">Stock bajo</option><option value="available">Disponible</option></select></label>
            <label><span>Estado</span><select onChange={(event) => setVisibilityFilter(event.target.value)} value={visibilityFilter}><option value="all">Todos</option><option value="visible">Visible</option><option value="hidden">Oculto</option></select></label>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Producto</th><th>Categoría</th><th>Precio</th><th>Stock</th><th>Estado</th><th /></tr></thead>
              <tbody>{filteredProducts.map((product) => (
                <tr key={product.id}>
                  <td><div className="product-table-name">{product.image_url ? <img alt="" src={product.image_url} /> : <span>□</span>}<span><strong>{product.name}</strong><small>{product.sku}</small></span></div></td>
                  <td>{product.category?.name || 'Sin categoría'}</td>
                  <td>${Number(product.price).toFixed(2)}</td>
                  <td><span className={product.stock <= 5 ? 'stock-low' : ''}>{product.stock}</span></td>
                  <td><span className={`status ${product.is_active ? 'status-delivered' : 'status-cancelled'}`}>{product.is_active ? 'Visible' : 'Oculto'}</span></td>
                  <td className="table-actions"><button onClick={() => edit(product)} type="button">Editar</button><button className="danger" onClick={() => remove(product)} type="button">Eliminar</button></td>
                </tr>
              ))}</tbody>
            </table>
            {!filteredProducts.length && <p className="table-empty">No hay productos con estos filtros.</p>}
          </div>
        </section>

        <form className="admin-panel editor-form" onSubmit={submit}>
          <div><h2>{editingId ? 'Editar producto' : 'Nuevo producto'}</h2><p>La imagen se guardará directamente en el servidor.</p></div>
          <label className="image-upload-field">
            <span>Imagen del producto</span>
            <input accept="image/jpeg,image/png,image/webp" onChange={chooseImage} type="file" />
            <span className={`image-upload-preview ${imagePreview ? 'has-image' : ''}`}>
              {imagePreview ? <img alt="Vista previa del producto" src={imagePreview} /> : <><b>Subir imagen</b><small>JPG, PNG o WebP · máximo 2 MB</small></>}
            </span>
          </label>
          <label>Nombre<input required value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} /></label>
          <div className="form-grid"><label>SKU<input required value={form.sku} onChange={(event) => setForm((current) => ({ ...current, sku: event.target.value }))} /></label><label>Categoría<select required value={form.category_id} onChange={(event) => setForm((current) => ({ ...current, category_id: event.target.value }))}><option value="">Seleccionar</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label></div>
          <div className="form-grid"><label>Precio<input required min="0" step="0.01" type="number" value={form.price} onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))} /></label><label>Stock<input required min="0" type="number" value={form.stock} onChange={(event) => setForm((current) => ({ ...current, stock: event.target.value }))} /></label></div>
          <label>Descripción<textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} /></label>
          <label className="check-field"><input checked={form.is_active} onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))} type="checkbox" /> Visible en el catálogo</label>
          <div className="form-actions"><button className="button button-primary" disabled={saving} type="submit">{saving ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Crear producto'}</button>{editingId && <button className="button button-ghost" onClick={reset} type="button">Cancelar</button>}</div>
        </form>
      </div>
      <ActionDialog
        busy={deleting}
        confirmLabel="Eliminar producto"
        danger
        description={deleteTarget ? `Se eliminará “${deleteTarget.name}” y su imagen subida. Esta acción no se puede deshacer.` : ''}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => confirmRemove(deleteTarget)}
        open={Boolean(deleteTarget)}
        title="¿Eliminar producto?"
      />
    </>
  );
}
