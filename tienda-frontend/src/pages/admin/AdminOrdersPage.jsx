import { useEffect, useState } from 'react';
import { apiDownload, apiRequest } from '../../api/client';
import Message from '../../components/ui/Message';
import PageHeader from '../../components/ui/PageHeader';
import StatusBadge from '../../components/ui/StatusBadge';
import { formatCurrency, formatDate } from '../../utils/format';

const statuses = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];
const labels = { pending: 'Pendiente de pago', paid: 'Pagado · por preparar', shipped: 'Enviado', delivered: 'Entregado', cancelled: 'Cancelado' };
const nextStatuses = {
  pending: ['paid', 'cancelled'],
  paid: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);
  const [copyLabel, setCopyLabel] = useState('Copiar dirección');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const data = await apiRequest('/admin/orders');
      setOrders(data);
      setSelectedOrder((current) => current ? data.find((item) => item.id === current.id) || null : null);
    } catch (reason) {
      setError(reason.message);
    }
  }

  async function changeStatus(order, status) {
    if (status === order.status) return;
    if (status === 'cancelled' && !window.confirm(`¿Cancelar el pedido #${order.id}? Si ya fue pagado, el inventario se devolverá.`)) return;
    const note = window.prompt('Nota para el historial (opcional):', '') ?? null;
    if (note === null) return;
    setUpdatingId(order.id);
    setError('');
    setMessage('');
    try {
      const updated = await apiRequest(`/admin/orders/${order.id}/status`, {
        method: 'PUT',
        body: { status, note: note.trim() || null },
      });
      setOrders((current) => current.map((item) => item.id === order.id ? updated : item));
      setSelectedOrder((current) => current?.id === order.id ? updated : current);
      setMessage(`Pedido #${order.id}: ${labels[status]}.`);
    } catch (reason) {
      setError(reason.message);
    } finally {
      setUpdatingId(null);
    }
  }

  async function copyAddress(order) {
    try {
      await navigator.clipboard.writeText(`${order.customer_name}\n${order.shipping_address}${order.notes ? `\nReferencias: ${order.notes}` : ''}`);
      setCopyLabel('Dirección copiada');
      setTimeout(() => setCopyLabel('Copiar dirección'), 1800);
    } catch {
      setError('No se pudo copiar la dirección. Selecciónala manualmente.');
    }
  }

  const query = search.trim().toLocaleLowerCase('es');
  const filteredOrders = orders.filter((order) => {
    const products = order.items.map((item) => item.product_name).join(' ');
    const searchable = `${order.id} ${order.user?.name || ''} ${order.user?.email || ''} ${products} ${order.shipping_address || ''} ${order.payment_reference || ''}`.toLocaleLowerCase('es');
    return searchable.includes(query) && (statusFilter === 'all' || order.status === statusFilter);
  });
  const pendingPayment = orders.filter((order) => order.status === 'pending').length;
  const readyToShip = orders.filter((order) => order.status === 'paid').length;
  const newPayments = orders.filter((order) => order.paid_at && Date.now() - new Date(order.paid_at).getTime() < 86400000).length;

  return (
    <>
      <PageHeader
        eyebrow="Administración"
        title="Pedidos y pagos"
        description="Confirma pagos, prepara entregas y consulta cada movimiento."
        actions={<button className="button button-secondary" onClick={() => apiDownload('/admin/reports/export?type=sales', 'pedidos.csv')} type="button">Exportar pedidos</button>}
      />
      <Message type="success">{message}</Message><Message type="error">{error}</Message>

      <section className="order-summary-grid">
        <article><small>Pendientes de pago</small><strong>{pendingPayment}</strong><span>No preparar todavía</span></article>
        <article className="is-paid"><small>Pagados por preparar</small><strong>{readyToShip}</strong><span>Inventario descontado</span></article>
        <article><small>Pagos últimas 24 h</small><strong>{newPayments}</strong><span>Nuevas confirmaciones</span></article>
      </section>

      <section className="admin-panel table-panel">
        <div className="panel-heading"><h2>Pedidos</h2><span>{filteredOrders.length} de {orders.length}</span></div>
        <div className="admin-filter-bar compact-filter-bar">
          <label className="filter-search"><span>Buscar</span><input onChange={(event) => setSearch(event.target.value)} placeholder="Pedido, cliente, referencia o dirección" type="search" value={search} /></label>
          <label><span>Estado</span><select onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}><option value="all">Todos</option>{statuses.map((status) => <option key={status} value={status}>{labels[status]}</option>)}</select></label>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Pedido</th><th>Cliente</th><th>Productos</th><th>Pago</th><th>Total</th><th>Operación</th><th /></tr></thead>
            <tbody>{filteredOrders.map((order) => (
              <tr className={order.status === 'paid' ? 'order-ready-row' : ''} key={order.id}>
                <td><strong>#{order.id}</strong><small>{formatDate(order.created_at)}</small></td>
                <td><strong>{order.user?.name || order.customer_name}</strong><small>{order.user?.email}</small></td>
                <td><div className="item-summary">{order.items.map((item) => <span key={item.id}>{item.quantity} × {item.product_name}</span>)}</div></td>
                <td><StatusBadge status={order.status} /><small>{order.payment_reference || 'Sin referencia'}</small></td>
                <td><strong>{formatCurrency(order.total)}</strong></td>
                <td>
                  <select
                    aria-label={`Estado del pedido ${order.id}`}
                    disabled={updatingId === order.id || nextStatuses[order.status].length === 0}
                    onChange={(event) => changeStatus(order, event.target.value)}
                    value={order.status}
                  >
                    <option value={order.status}>{labels[order.status]}</option>
                    {nextStatuses[order.status].map((status) => <option key={status} value={status}>{labels[status]}</option>)}
                  </select>
                </td>
                <td className="table-actions"><button onClick={() => setSelectedOrder(order)} type="button">Ver detalle</button></td>
              </tr>
            ))}</tbody>
          </table>
          {!filteredOrders.length && <p className="table-empty">No hay pedidos con estos filtros.</p>}
        </div>
      </section>

      {selectedOrder && (
        <div className="order-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setSelectedOrder(null)}>
          <section aria-labelledby="order-detail-title" aria-modal="true" className="order-detail-modal" role="dialog">
            <header>
              <div><small>Detalle operativo</small><h2 id="order-detail-title">Pedido #{selectedOrder.id}</h2></div>
              <button aria-label="Cerrar detalle" onClick={() => setSelectedOrder(null)} type="button">×</button>
            </header>
            <div className="order-detail-status"><StatusBadge status={selectedOrder.status} /><strong>{labels[selectedOrder.status]}</strong><span>{formatCurrency(selectedOrder.total)}</span></div>

            <div className="order-detail-grid">
              <article>
                <h3>Entrega</h3>
                <strong>{selectedOrder.customer_name}</strong>
                <p>{selectedOrder.shipping_address}</p>
                <small>Referencias o información extra</small>
                <p>{selectedOrder.notes || 'Sin referencias adicionales.'}</p>
                <button className="button button-secondary" onClick={() => copyAddress(selectedOrder)} type="button">{copyLabel}</button>
              </article>
              <article>
                <h3>Pago</h3>
                <dl>
                  <div><dt>Método</dt><dd>{selectedOrder.payment_method?.toUpperCase() || 'No indicado'}</dd></div>
                  <div><dt>Referencia</dt><dd>{selectedOrder.payment_reference || 'Pendiente'}</dd></div>
                  <div><dt>Pedido creado</dt><dd>{formatDate(selectedOrder.created_at, { dateStyle: 'medium', timeStyle: 'short' })}</dd></div>
                  <div><dt>Pago confirmado</dt><dd>{formatOptionalDate(selectedOrder.paid_at)}</dd></div>
                  <div><dt>Enviado</dt><dd>{formatOptionalDate(selectedOrder.shipped_at)}</dd></div>
                  <div><dt>Entregado</dt><dd>{formatOptionalDate(selectedOrder.delivered_at)}</dd></div>
                  <div><dt>Cancelado</dt><dd>{formatOptionalDate(selectedOrder.cancelled_at)}</dd></div>
                </dl>
              </article>
            </div>

            <section className="order-detail-items">
              <h3>Productos</h3>
              {selectedOrder.items.map((item) => <div key={item.id}><span><strong>{item.product_name}</strong><small>{item.quantity} × {formatCurrency(item.unit_price)}</small></span><b>{formatCurrency(item.subtotal)}</b></div>)}
            </section>

            <section className="order-history">
              <h3>Historial del pedido</h3>
              {selectedOrder.history?.length ? selectedOrder.history.map((entry) => (
                <article key={entry.id}>
                  <i /><span><strong>{labels[entry.to_status] || entry.to_status}</strong><small>{entry.actor?.name || 'Sistema'} · {formatDate(entry.created_at, { dateStyle: 'medium', timeStyle: 'short' })}</small>{entry.note && <p>{entry.note}</p>}</span>
                </article>
              )) : <p className="muted">El historial aparecerá después de la actualización del servidor.</p>}
            </section>
          </section>
        </div>
      )}
    </>
  );
}

function formatOptionalDate(value) {
  return value ? formatDate(value, { dateStyle: 'medium', timeStyle: 'short' }) : '—';
}
