import { formatCurrency, formatDate } from '../../utils/format';

export default function OrderReceipt({ order, onClose }) {
  if (!order) return null;
  const receiptNumber = `MZ-R-${String(order.id).padStart(8, '0')}`;

  return (
    <div className="receipt-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section aria-labelledby="receipt-title" aria-modal="true" className="order-receipt" role="dialog">
        <header className="receipt-toolbar print-hidden">
          <div><small>Comprobante de pago</small><strong>{receiptNumber}</strong></div>
          <div><button className="button button-secondary" onClick={() => window.print()} type="button">Imprimir recibo</button><button aria-label="Cerrar recibo" onClick={onClose} type="button">×</button></div>
        </header>
        <div className="receipt-paper">
          <div className="receipt-brand"><div><span>M</span><strong>MINIZON</strong><small>Recibo de compra</small></div><span className="receipt-paid-stamp">✓ PAGADO</span></div>
          <div className="receipt-heading">
            <div><small>RECIBO</small><h2 id="receipt-title">{receiptNumber}</h2></div>
            <div><small>FECHA DE PAGO</small><strong>{formatOptionalDate(order.paid_at)}</strong></div>
          </div>
          <section className="receipt-info">
            <div><small>CLIENTE</small><strong>{order.customer_name}</strong><span>{order.user?.email || 'Cliente de la aplicación'}</span></div>
            <div><small>ENTREGA</small><strong>{order.shipping_address}</strong><span>{order.notes || 'Sin referencias adicionales'}</span></div>
            <div><small>PAGO</small><strong>{order.payment_method === 'card' ? 'Tarjeta' : 'OXXO'}</strong><span>{order.payment_reference || 'Sin referencia'}</span></div>
          </section>
          <table className="receipt-items">
            <thead><tr><th>Producto</th><th>Cantidad</th><th>Precio</th><th>Importe</th></tr></thead>
            <tbody>{order.items.map((item) => <tr key={item.id}><td>{item.product_name}</td><td>{item.quantity}</td><td>{formatCurrency(item.unit_price)}</td><td>{formatCurrency(item.subtotal)}</td></tr>)}</tbody>
          </table>
          <div className="receipt-total"><span>Total pagado</span><strong>{formatCurrency(order.total)}</strong></div>
          <footer><span>Pedido #{order.id}</span><span>Pago confirmado</span><span>Minizon</span></footer>
        </div>
      </section>
    </div>
  );
}

function formatOptionalDate(value) {
  return value ? formatDate(value, { dateStyle: 'long', timeStyle: 'short' }) : 'Confirmado';
}
