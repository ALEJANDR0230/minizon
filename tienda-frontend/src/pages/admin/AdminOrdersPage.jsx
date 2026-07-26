import { useEffect, useState } from 'react';
import { apiDownload, apiRequest } from '../../api/client';
import ActionDialog from '../../components/ui/ActionDialog';
import ShippingDialog from '../../components/admin/ShippingDialog';
import Message from '../../components/ui/Message';
import PageHeader from '../../components/ui/PageHeader';
import StatusBadge from '../../components/ui/StatusBadge';
import { formatCurrency, formatDate } from '../../utils/format';

const statuses = ['pending', 'paid', 'preparing', 'shipped', 'delivered', 'cancelled'];
const labels = { pending: 'Pendiente de pago', paid: 'Pagado · por preparar', preparing: 'Preparando paquete', shipped: 'Enviado', delivered: 'Entregado', cancelled: 'Cancelado' };

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);
  const [copyLabel, setCopyLabel] = useState('Copiar dirección');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [pendingChange, setPendingChange] = useState(null);

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

  function changeStatus(order, status) {
    if (status === order.status) return;
    setPendingChange({ order, status });
  }

  async function applyStatus(note = '', shipping = {}) {
    const { order, status } = pendingChange;
    setUpdatingId(order.id);
    setError('');
    setMessage('');
    try {
      const updated = await apiRequest(`/admin/orders/${order.id}/status`, {
        method: 'PUT',
        body: { status, note: note.trim() || null, ...shipping },
      });
      setOrders((current) => current.map((item) => item.id === order.id ? updated : item));
      setSelectedOrder((current) => current?.id === order.id ? updated : current);
      setMessage(`Pedido #${order.id}: ${labels[status]}.`);
      setPendingChange(null);
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
    const searchable = `${order.id} ${order.user?.name || ''} ${order.user?.email || ''} ${products} ${order.shipping_address || ''} ${order.payment_reference || ''} ${order.shipping_carrier || ''} ${order.tracking_number || ''}`.toLocaleLowerCase('es');
    return searchable.includes(query) && (statusFilter === 'all' || order.status === statusFilter);
  });
  const reportedOxxo = orders.filter((order) => order.status === 'pending' && order.payment_method === 'oxxo' && order.payment_reported_at).length;
  const readyToShip = orders.filter((order) => order.status === 'paid').length;
  const preparing = orders.filter((order) => order.status === 'preparing').length;

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
        <article><small>OXXO por verificar</small><strong>{reportedOxxo}</strong><span>Revisar comprobante y aprobar</span></article>
        <article className="is-paid"><small>Pagados por preparar</small><strong>{readyToShip}</strong><span>Inventario descontado</span></article>
        <article className="is-preparing"><small>Paquetes preparando</small><strong>{preparing}</strong><span>Siguiente paso: registrar envío</span></article>
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
                <td><StatusBadge status={order.status} /><small>{paymentLabel(order)}</small><small>{order.payment_reference || 'Sin referencia'}</small></td>
                <td><strong>{formatCurrency(order.total)}</strong></td>
                <td><OrderActions busy={updatingId === order.id} onChange={(status) => changeStatus(order, status)} order={order} /></td>
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
            <ShippingProgress order={selectedOrder} />

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
                  <div><dt>Preparación iniciada</dt><dd>{formatOptionalDate(selectedOrder.preparing_at)}</dd></div>
                  <div><dt>Paquetería</dt><dd>{selectedOrder.shipping_carrier || 'Pendiente'}</dd></div>
                  <div><dt>Número de rastreo</dt><dd>{selectedOrder.tracking_number || 'Pendiente'}</dd></div>
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
      <ActionDialog
        busy={updatingId === pendingChange?.order?.id}
        confirmLabel={pendingChange?.status === 'paid' ? 'Aprobar pago' : 'Actualizar pedido'}
        danger={pendingChange?.status === 'cancelled'}
        description={pendingChange ? statusChangeDescription(pendingChange.order, pendingChange.status) : ''}
        noteLabel="Referencia para el historial (opcional)"
        notePlaceholder="Ejemplo: comprobante revisado, pago correcto"
        onCancel={() => setPendingChange(null)}
        onConfirm={applyStatus}
        open={Boolean(pendingChange) && pendingChange?.status !== 'shipped'}
        title={pendingChange?.status === 'paid' ? 'Validar pago OXXO' : `Actualizar pedido #${pendingChange?.order?.id || ''}`}
      />
      <ShippingDialog
        busy={updatingId === pendingChange?.order?.id}
        onCancel={() => setPendingChange(null)}
        onConfirm={(shipping) => applyStatus(shipping.note, {
          shipping_carrier: shipping.shipping_carrier,
          tracking_number: shipping.tracking_number,
        })}
        open={pendingChange?.status === 'shipped'}
        order={pendingChange?.order}
      />
    </>
  );
}

function formatOptionalDate(value) {
  return value ? formatDate(value, { dateStyle: 'medium', timeStyle: 'short' }) : '—';
}

function paymentLabel(order) {
  if (order.payment_method === 'card') return order.status === 'pending' ? 'Tarjeta pendiente' : 'Tarjeta autorizada';
  if (order.payment_reported_at && order.status === 'pending') return 'OXXO reportado · requiere aprobación';
  return order.status === 'pending' ? 'OXXO · esperando pago' : 'OXXO validado';
}

function statusChangeDescription(order, status) {
  if (status === 'paid') return `Confirma que revisaste el pago OXXO del pedido #${order.id}. Al aprobarlo se descontará el inventario.`;
  if (status === 'cancelled') return `Se cancelará el pedido #${order.id}. Si estaba pagado, el inventario se devolverá.`;
  if (status === 'preparing') return `Confirma que el pedido #${order.id} ya se está empacando y revisando antes del envío.`;
  if (status === 'delivered') return `Confirma que la paquetería entregó correctamente el pedido #${order.id}.`;
  return `El pedido #${order.id} cambiará a “${labels[status]}”.`;
}

function OrderActions({ order, busy, onChange }) {
  const primary = {
    pending: order.payment_reported_at ? ['paid', 'Aprobar pago OXXO'] : null,
    paid: ['preparing', 'Preparar paquete'],
    preparing: ['shipped', 'Registrar envío'],
    shipped: ['delivered', 'Marcar entregado'],
  }[order.status];
  const canCancel = ['pending', 'paid', 'preparing'].includes(order.status);

  return (
    <div className="order-flow-actions">
      {primary && <button disabled={busy} onClick={() => onChange(primary[0])} type="button">{primary[1]}</button>}
      {canCancel && <button className="danger-text" disabled={busy} onClick={() => onChange('cancelled')} type="button">Cancelar</button>}
      {!primary && !canCancel && <span>Proceso terminado</span>}
    </div>
  );
}

function ShippingProgress({ order }) {
  const steps = [
    ['paid', 'Pago aprobado'],
    ['preparing', 'Preparando'],
    ['shipped', 'En camino'],
    ['delivered', 'Entregado'],
  ];
  const position = steps.findIndex(([status]) => status === order.status);

  if (order.status === 'pending' || order.status === 'cancelled') return null;

  return (
    <section className="shipping-progress" aria-label="Progreso del envío">
      {steps.map(([status, label], index) => (
        <div className={index <= position ? 'is-complete' : ''} key={status}>
          <i>{index < position ? '✓' : index + 1}</i><span>{label}</span>
        </div>
      ))}
    </section>
  );
}
