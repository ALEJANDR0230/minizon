import { useEffect, useState } from 'react';
import { apiRequest } from '../../api/client';
import Message from '../../components/ui/Message';
import PageHeader from '../../components/ui/PageHeader';
import StatusBadge from '../../components/ui/StatusBadge';

const statuses = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];
const labels = { pending: 'Pendiente', paid: 'Pagado', shipped: 'Enviado', delivered: 'Entregado', cancelled: 'Cancelado' };

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  useEffect(() => { load(); }, []);
  async function load() { try { setOrders(await apiRequest('/admin/orders')); } catch (reason) { setError(reason.message); } }
  async function changeStatus(order, status) { setError(''); try { await apiRequest(`/admin/orders/${order.id}/status`, { method: 'PUT', body: { status } }); setMessage(`Pedido #${order.id} actualizado.`); await load(); } catch (reason) { setError(reason.message); } }

  const query = search.trim().toLocaleLowerCase('es');
  const filteredOrders = orders.filter((order) => {
    const products = order.items.map((item) => item.product_name).join(' ');
    const searchable = `${order.id} ${order.user?.name || ''} ${order.user?.email || ''} ${products}`.toLocaleLowerCase('es');
    return searchable.includes(query) && (statusFilter === 'all' || order.status === statusFilter);
  });

  return (
    <>
      <PageHeader eyebrow="Administración" title="Pedidos" description="Consulta pedidos y actualiza su estado." />
      <Message type="success">{message}</Message><Message type="error">{error}</Message>
      <section className="admin-panel table-panel">
        <div className="panel-heading"><h2>Pedidos</h2><span>{filteredOrders.length} de {orders.length}</span></div>
        <div className="admin-filter-bar compact-filter-bar">
          <label className="filter-search"><span>Buscar</span><input onChange={(event) => setSearch(event.target.value)} placeholder="Pedido, cliente o producto" type="search" value={search} /></label>
          <label><span>Estado</span><select onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}><option value="all">Todos</option>{statuses.map((status) => <option key={status} value={status}>{labels[status]}</option>)}</select></label>
        </div>
        <div className="table-wrap"><table><thead><tr><th>Pedido</th><th>Cliente</th><th>Productos</th><th>Total</th><th>Estado</th></tr></thead><tbody>{filteredOrders.map((order) => <tr key={order.id}><td><strong>#{order.id}</strong><small>{new Date(order.created_at).toLocaleDateString('es-MX')}</small></td><td><strong>{order.user?.name}</strong><small>{order.user?.email}</small></td><td><div className="item-summary">{order.items.map((item) => <span key={item.id}>{item.quantity} × {item.product_name}</span>)}</div></td><td><strong>${Number(order.total).toFixed(2)}</strong></td><td><StatusBadge status={order.status} /><select aria-label={`Estado del pedido ${order.id}`} value={order.status} onChange={(event) => changeStatus(order, event.target.value)}>{statuses.map((status) => <option key={status} value={status}>{labels[status]}</option>)}</select></td></tr>)}</tbody></table>{!filteredOrders.length && <p className="table-empty">No hay pedidos con estos filtros.</p>}</div>
      </section>
    </>
  );
}
