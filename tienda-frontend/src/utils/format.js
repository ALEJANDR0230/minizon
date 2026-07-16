export function formatCurrency(value) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

export function formatDate(value, options = {}) {
  if (!value) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-MX', options).format(new Date(value));
}
