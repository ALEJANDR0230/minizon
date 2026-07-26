import { useEffect, useState } from 'react';

const carriers = ['Estafeta', 'DHL', 'FedEx', 'Redpack', 'Paquetexpress', 'Entrega local'];

export default function ShippingDialog({ open, order, busy, onCancel, onConfirm }) {
  const [form, setForm] = useState({ shipping_carrier: 'Estafeta', tracking_number: '', note: '' });

  useEffect(() => {
    if (open) setForm({ shipping_carrier: 'Estafeta', tracking_number: '', note: '' });
  }, [open]);

  if (!open || !order) return null;

  function submit(event) {
    event.preventDefault();
    onConfirm(form);
  }

  return (
    <div className="app-dialog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && !busy && onCancel()}>
      <form aria-labelledby="shipping-dialog-title" aria-modal="true" className="app-dialog shipping-dialog" onSubmit={submit} role="dialog">
        <div className="app-dialog-icon">↗</div>
        <h2 id="shipping-dialog-title">Registrar envío</h2>
        <p>Pedido #{order.id}. Agrega los datos que el cliente utilizará para seguir su paquete.</p>
        <div className="shipping-form-grid">
          <label>Paquetería
            <select onChange={(event) => setForm((current) => ({ ...current, shipping_carrier: event.target.value }))} value={form.shipping_carrier}>
              {carriers.map((carrier) => <option key={carrier}>{carrier}</option>)}
            </select>
          </label>
          <label>Número de rastreo
            <input autoFocus maxLength="120" onChange={(event) => setForm((current) => ({ ...current, tracking_number: event.target.value }))} placeholder="Ejemplo: MZ-123456789" required value={form.tracking_number} />
          </label>
        </div>
        <label>Información para el historial <small>(opcional)</small>
          <textarea onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))} placeholder="Ejemplo: paquete entregado a la paquetería" value={form.note} />
        </label>
        <div className="app-dialog-actions">
          <button className="button button-ghost" disabled={busy} onClick={onCancel} type="button">Cancelar</button>
          <button className="button button-primary" disabled={busy} type="submit">{busy ? 'Registrando…' : 'Confirmar envío'}</button>
        </div>
      </form>
    </div>
  );
}
