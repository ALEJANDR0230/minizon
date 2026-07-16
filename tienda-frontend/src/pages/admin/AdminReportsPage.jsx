import { useEffect, useState } from 'react';
import { apiDownload, apiRequest } from '../../api/client';
import LoadingState from '../../components/ui/LoadingState';
import Message from '../../components/ui/Message';
import PageHeader from '../../components/ui/PageHeader';
import { formatCurrency } from '../../utils/format';

function dateInputValue(date) {
  return date.toISOString().slice(0, 10);
}

const defaultFilters = (() => {
  const today = new Date();
  const monthAgo = new Date();
  monthAgo.setDate(today.getDate() - 29);
  return { from: dateInputValue(monthAgo), to: dateInputValue(today) };
})();

export default function AdminReportsPage() {
  const [filters, setFilters] = useState(defaultFilters);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState('');
  const [error, setError] = useState('');

  async function load(nextFilters = filters) {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams(nextFilters);
      setData(await apiRequest(`/admin/reports/summary?${params}`));
    } catch (reason) {
      setError(reason.message);
    } finally {
      setLoading(false);
    }
  }

  function selectPeriod(kind) {
    const end = new Date();
    const start = new Date();

    if (kind === 'week') start.setDate(end.getDate() - 6);
    if (kind === 'month') start.setDate(end.getDate() - 29);
    if (kind === 'current-month') start.setDate(1);
    if (kind === 'year') {
      start.setMonth(0);
      start.setDate(1);
    }

    const next = { from: dateInputValue(start), to: dateInputValue(end) };
    setFilters(next);
    load(next);
  }

  useEffect(() => {
    const params = new URLSearchParams(defaultFilters);
    apiRequest(`/admin/reports/summary?${params}`)
      .then(setData)
      .catch((reason) => setError(reason.message))
      .finally(() => setLoading(false));
  }, []);

  async function download(type) {
    setDownloading(type); setError('');
    try {
      const params = new URLSearchParams({ ...filters, type });
      await apiDownload(`/admin/reports/export?${params}`, `reporte-${type}.csv`);
    } catch (reason) {
      setError(reason.message);
    } finally {
      setDownloading('');
    }
  }

  const summary = data?.summary || {};

  return (
    <>
      <PageHeader eyebrow="Administración" title="Reportes" description="Ventas, inventario y reseñas por periodo." actions={<button className="button button-secondary print-hidden" onClick={() => window.print()} type="button">Guardar o imprimir</button>} />
      <Message type="error">{error}</Message>
      <section className="admin-panel report-filters print-hidden">
        <div className="period-presets"><small>Elige rápidamente</small><div><button onClick={() => selectPeriod('week')} type="button">Últimos 7 días</button><button onClick={() => selectPeriod('month')} type="button">Últimos 30 días</button><button onClick={() => selectPeriod('current-month')} type="button">Este mes</button><button onClick={() => selectPeriod('year')} type="button">Este año</button></div></div>
        <label>Desde<input type="date" value={filters.from} onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))} /></label>
        <label>Hasta<input type="date" value={filters.to} onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))} /></label>
        <button className="button button-primary" disabled={loading} onClick={() => load()} type="button">{loading ? 'Preparando…' : 'Ver este periodo'}</button>
      </section>

      {loading && !data ? <LoadingState label="Generando resumen…" /> : (
        <div className="report-sheet">
          <header><div><small>Informe de tu tienda</small><h2>{data?.period?.from} — {data?.period?.to}</h2></div><strong>mitienda</strong></header>
          <section className="report-summary-grid">
            <article><small>Ventas</small><strong>{formatCurrency(summary.revenue)}</strong></article>
            <article><small>Pedidos</small><strong>{summary.orders ?? 0}</strong></article>
            <article><small>Ticket promedio</small><strong>{formatCurrency(summary.average_order)}</strong></article>
            <article><small>Unidades vendidas</small><strong>{summary.units_sold ?? 0}</strong></article>
            <article><small>Clientes nuevos</small><strong>{summary.new_mobile_customers ?? 0}</strong></article>
            <article><small>Reseñas</small><strong>{summary.reviews ?? 0}</strong></article>
          </section>
          <section className="report-columns">
            <article><h3>Productos destacados</h3>{data?.top_products?.length ? <div className="compact-list">{data.top_products.map((product) => <div key={product.name}><span><strong>{product.name}</strong><small>{formatCurrency(product.revenue)}</small></span><b>{product.units} u.</b></div>)}</div> : <p className="muted">Sin ventas en el periodo.</p>}</article>
            <article><h3>Inventario que requiere atención</h3>{data?.low_stock?.length ? <div className="compact-list">{data.low_stock.map((product) => <div key={product.id}><span><strong>{product.name}</strong><small>{product.category?.name || 'Sin categoría'}</small></span><b>{product.stock} u.</b></div>)}</div> : <p className="muted">No hay productos con stock bajo.</p>}</article>
          </section>
        </div>
      )}

      <section className="export-grid print-hidden">
        <article className="admin-panel"><span className="export-icon">$</span><h3>Ventas y pedidos</h3><p>Fechas, clientes móviles, estados, totales y artículos.</p><button className="button button-secondary" disabled={Boolean(downloading)} onClick={() => download('sales')} type="button">{downloading === 'sales' ? 'Preparando…' : 'Descargar CSV'}</button></article>
        <article className="admin-panel"><span className="export-icon">▦</span><h3>Inventario</h3><p>Productos, categorías, precios, stock y calificaciones.</p><button className="button button-secondary" disabled={Boolean(downloading)} onClick={() => download('inventory')} type="button">{downloading === 'inventory' ? 'Preparando…' : 'Descargar CSV'}</button></article>
        <article className="admin-panel"><span className="export-icon">☆</span><h3>Reseñas</h3><p>Comentarios, estrellas, productos y cuentas móviles.</p><button className="button button-secondary" disabled={Boolean(downloading)} onClick={() => download('reviews')} type="button">{downloading === 'reviews' ? 'Preparando…' : 'Descargar CSV'}</button></article>
      </section>
    </>
  );
}
