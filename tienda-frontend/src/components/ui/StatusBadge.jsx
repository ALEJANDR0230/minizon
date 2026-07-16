const labels = {
  pending: 'Pendiente',
  paid: 'Pagado',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

export default function StatusBadge({ status }) {
  return <span className={`status status-${status}`}>{labels[status] || status}</span>;
}
