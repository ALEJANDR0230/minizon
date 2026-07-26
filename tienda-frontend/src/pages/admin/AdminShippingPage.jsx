import { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../../api/client';
import ActionDialog from '../../components/ui/ActionDialog';
import Message from '../../components/ui/Message';
import PageHeader from '../../components/ui/PageHeader';
import StatusBadge from '../../components/ui/StatusBadge';
import OrderReceipt from '../../components/admin/OrderReceipt';
import ShippingDialog from '../../components/admin/ShippingDialog';
import ShippingProgress from '../../components/admin/ShippingProgress';
import { formatCurrency, formatDate } from '../../utils/format';

const labels = { paid: 'Pagado · listo para preparar', preparing: 'Preparando paquete', shipped: 'En camino', delivered: 'Entregado' };

export default function AdminShippingPage() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('active');
  const [search, setSearch] = useState('');
  const [pendingChange, setPendingChange] = useState(null);
  const [receiptOrder, setReceiptOrder] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const data = await apiRequest('/admin/orders');
      setOrders(data.filter((order) => ['paid', 'preparing', 'shipped', 'delivered'].includes(order.status)));
    } catch (reason) {
      setError(reason.message);
    }
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
      setMessage(`Pedido #${order.id}: ${labels[status]}.`);
      setPendingChange(null);
    } catch (reason) {
      setError(reason.message);
    } finally {
      setUpdatingId(null);
    }
  }

  const counts = useMemo(() => ({
    paid: orders.filter((order) => order.status === 'paid').length,
    preparing: orders.filter((order) => order.status === 'preparing').length,
    shipped: orders.filter((order) => order.status === 'shipped').length,
    delivered: orders.filter((order) => order.status === 'delivered').length,
  }), [orders]);

  const query = search.trim().toLocaleLowerCase('es');
  const visibleOrders = orders.filter((order) => {
    const searchable = `${order.id} ${order.customer_name} ${order.user?.email || ''} ${order.shipping_address} ${order.shipping_carrier || ''} ${order.tracking_number || ''}`.toLocaleLowerCase('es');
    const matchesFilter = filter === 'all'
      || (filter === 'active' && order.status !== 'delivered')
      || order.status === filter;
    return matchesFilter && searchable.includes(query);
  });

  return (
    <>
      <PageHeader eyebrow="Logística" title="Envíos" description="Controla únicamente pedidos pagados, preparación, guías y entregas." />
      <Message type="success">{message}</Message><Message type="error">{error}</Message>
      <section className="shipping-summary">
        <button className={filter === 'paid' ? 'active' : ''} onClick={() => setFilter('paid')} type="button"><small>Por preparar</small><strong>{counts.paid}</strong></button>
        <button className={filter === 'preparing' ? 'active' : ''} onClick={() => setFilter('preparing')} type="button"><small>Preparando</small><strong>{counts.preparing}</strong></button>
        <button className={filter === 'shipped' ? 'active' : ''} onClick={() => setFilter('shipped')} type="button"><small>En camino</small><strong>{counts.shipped}</strong></button>
        <button className={filter === 'delivered' ? 'active' : ''} onClick={() => setFilter('delivered')} type="button"><small>Entregados</small><strong>{counts.delivered}</strong></button>
      </section>
      <section className="admin-panel shipping-control-panel">
        <div className="panel-heading"><div><h2>Control de paquetes</h2><p>Tarjeta entra automáticamente; OXXO aparece después de aprobar el pago.</p></div><button className="button button-ghost" onClick={() => setFilter(filter === 'all' ? 'active' : 'all')} type="button">{filter === 'all' ? 'Solo activos' : 'Ver todos'}</button></div>
        <label className="shipping-search"><span>Buscar envío</span><input onChange={(event) => setSearch(event.target.value)} placeholder="Pedido, cliente, dirección, paquetería o guía" type="search" value={search} /></label>
        <div className="shipping-card-list">
          {visibleOrders.map((order) => (
            <article className={`shipping-card shipping-${order.status}`} key={order.id}>
              <header><div><small>Pedido #{order.id}</small><strong>{order.customer_name}</strong><span>{formatDate(order.paid_at || order.created_at)}</span></div><div><StatusBadge status={order.status} /><b>{formatCurrency(order.total)}</b></div></header>
              <ShippingProgress order={order} />
              <div className="shipping-card-body">
                <div><small>ENTREGA</small><strong>{order.shipping_address}</strong><span>{order.items.map((item) => `${item.quantity} × ${item.product_name}`).join(' · ')}</span></div>
                <div><small>RASTREO</small><strong>{order.shipping_carrier || 'Aún sin paquetería'}</strong><span>{order.tracking_number || 'La guía se agrega al registrar el envío'}</span></div>
              </div>
              <footer>
                <button className="button button-secondary" onClick={() => setReceiptOrder(order)} type="button">Ver recibo</button>
                {order.status === 'paid' && <button className="button button-primary" onClick={() => setPendingChange({ order, status: 'preparing' })} type="button">Preparar paquete</button>}
                {order.status === 'preparing' && <button className="button button-primary" onClick={() => setPendingChange({ order, status: 'shipped' })} type="button">Registrar envío</button>}
                {order.status === 'shipped' && <button className="button button-primary" onClick={() => setPendingChange({ order, status: 'delivered' })} type="button">Marcar entregado</button>}
                {order.status === 'delivered' && <span className="shipping-complete">✓ Proceso terminado</span>}
              </footer>
            </article>
          ))}
          {!visibleOrders.length && <p className="table-empty">No hay envíos con estos filtros.</p>}
        </div>
      </section>
      <ActionDialog
        busy={updatingId === pendingChange?.order?.id}
        confirmLabel={pendingChange?.status === 'delivered' ? 'Confirmar entrega' : 'Iniciar preparación'}
        description={pendingChange?.status === 'delivered' ? `Confirma que el pedido #${pendingChange.order.id} fue entregado.` : `El pedido #${pendingChange?.order?.id || ''} pasará a preparación.`}
        noteLabel="Referencia para el historial (opcional)"
        onCancel={() => setPendingChange(null)}
        onConfirm={applyStatus}
        open={Boolean(pendingChange) && pendingChange?.status !== 'shipped'}
        title={pendingChange?.status === 'delivered' ? 'Marcar pedido entregado' : 'Preparar paquete'}
      />
      <ShippingDialog
        busy={updatingId === pendingChange?.order?.id}
        onCancel={() => setPendingChange(null)}
        onConfirm={(shipping) => applyStatus(shipping.note, { shipping_carrier: shipping.shipping_carrier, tracking_number: shipping.tracking_number })}
        open={pendingChange?.status === 'shipped'}
        order={pendingChange?.order}
      />
      <OrderReceipt onClose={() => setReceiptOrder(null)} order={receiptOrder} />
    </>
  );
}
