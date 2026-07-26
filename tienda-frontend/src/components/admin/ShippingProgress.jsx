const steps = [
  ['paid', 'Pago aprobado'],
  ['preparing', 'Preparando'],
  ['shipped', 'En camino'],
  ['delivered', 'Entregado'],
];

export default function ShippingProgress({ order }) {
  const position = steps.findIndex(([status]) => status === order.status);

  if (position < 0) return null;

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
