import { useEffect, useState } from 'react';
import { apiRequest } from '../../api/client';
import Message from '../../components/ui/Message';
import PageHeader from '../../components/ui/PageHeader';
import StatusBadge from '../../components/ui/StatusBadge';

const statuses = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];
const labels = { pending: 'Pendiente', paid: 'Pagado', shipped: 'Enviado', delivered: 'Entregado', cancelled: 'Cancelado' };

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  useEffect(() => { load(); }, []);
  async function load() { try { setOrders(await apiRequest('/admin/orders')); } catch (reason) { setError(reason.message); } }
  async function changeStatus(order, status) { setError(''); try { await apiRequest(`/admin/orders/${order.id}/status`, { method: 'PUT', body: { status } }); setMessage(`Pedido #${order.id} actualizado.`); await load(); } catch (reason) { setError(reason.message); } }

  return (
    <>
      <PageHeader eyebrow="Operación" title="Pedidos" description="Consulta el detalle y actualiza el avance de cada entrega." />
      <Message type="success">{message}</Message><Message type="error">{error}</Message>
      <section className="admin-panel table-panel"><div className="table-wrap"><table><thead><tr><th>Pedido</th><th>Cliente</th><th>Productos</th><th>Total</th><th>Estado</th></tr></thead><tbody>{orders.map((order) => <tr key={order.id}><td><strong>#{order.id}</strong><small>{new Date(order.created_at).toLocaleDateString('es-MX')}</small></td><td><strong>{order.user?.name}</strong><small>{order.user?.email}</small></td><td><div className="item-summary">{order.items.map((item) => <span key={item.id}>{item.quantity} × {item.product_name}</span>)}</div></td><td><strong>${Number(order.total).toFixed(2)}</strong></td><td><StatusBadge status={order.status} /><select aria-label={`Estado del pedido ${order.id}`} value={order.status} onChange={(event) => changeStatus(order, event.target.value)}>{statuses.map((status) => <option key={status} value={status}>{labels[status]}</option>)}</select></td></tr>)}</tbody></table>{!orders.length && <p className="table-empty">Todavía no hay pedidos.</p>}</div></section>
    </>
  );
}
