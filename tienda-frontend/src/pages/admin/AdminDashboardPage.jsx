import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../api/client';
import AlertList from '../../components/admin/AlertList';
import { DonutChart, HorizontalBars, SalesBarChart } from '../../components/admin/Charts';
import LoadingState from '../../components/ui/LoadingState';
import Message from '../../components/ui/Message';
import PageHeader from '../../components/ui/PageHeader';
import StatusBadge from '../../components/ui/StatusBadge';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency } from '../../utils/format';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    apiRequest('/admin/dashboard', { timeoutMs: 7000 }).then(setData).catch((reason) => setError(reason.message));
  }, []);

  if (!data && !error) return <LoadingState label="Preparando el dashboard…" />;

  const metrics = data?.metrics || {};
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';
  const firstName = user?.name?.split(' ')[0] || 'Administrador';
  const cards = [
    ['Ventas este mes', formatCurrency(metrics.revenue_month), '/admin/reportes', 'Ingresos confirmados'],
    ['Pedidos por atender', metrics.pending_orders ?? 0, '/admin/pedidos', 'Pendientes de revisión'],
    ['Clientes móviles', metrics.mobile_customers ?? 0, '/admin/clientes-moviles', 'Cuentas de la app'],
    ['Unidades en inventario', metrics.inventory_units ?? 0, '/admin/productos', 'Productos activos'],
    ['Reseñas', metrics.reviews ?? 0, '/admin/resenas', 'Opiniones recibidas'],
    ['Alertas críticas', metrics.critical_alerts ?? 0, '/admin/asesor-ia', 'Requieren prioridad'],
  ];

  return (
    <>
      <PageHeader
        eyebrow="Centro de control"
        title={`${greeting}, ${firstName}`}
        description="Aquí tienes lo más importante de tu tienda para que puedas decidir con calma qué atender primero."
        actions={<Link className="button button-primary" to="/admin/asesor-ia">Hablar con el asistente</Link>}
      />
      <Message type="error">{error}</Message>

      <section className="metric-grid dashboard-metrics">
        {cards.map(([label, value, path, detail]) => (
          <Link className="metric-card" key={label} to={path}>
            <small>{label}</small><strong>{value}</strong><span>{detail}</span>
          </Link>
        ))}
      </section>

      <section className="quick-actions">
        <div><h2>¿Qué quieres hacer ahora?</h2><p>Atajos para las tareas más comunes.</p></div>
        <nav aria-label="Acciones rápidas">
          <Link to="/admin/productos"><span>＋</span><b>Agregar o editar productos</b><small>Mantén precios y existencias al día.</small></Link>
          <Link to="/admin/pedidos"><span>✓</span><b>Revisar pedidos</b><small>Consulta lo que falta por atender.</small></Link>
          <Link to="/admin/reportes"><span>▥</span><b>Consultar informes</b><small>Entiende ventas e inventario.</small></Link>
          <Link to="/admin/asesor-ia"><span>✦</span><b>Hablar sobre la tienda</b><small>Pregunta sobre ventas, stock u ofertas.</small></Link>
        </nav>
      </section>

      <section className="dashboard-grid chart-row">
        <article className="admin-panel dashboard-wide">
          <div className="panel-heading"><div><h2>Así se han movido tus ventas</h2><p>Ingresos diarios de los últimos 14 días.</p></div><Link to="/admin/reportes">Ver informes</Link></div>
          <SalesBarChart data={data?.sales_trend || []} />
        </article>
        <article className="admin-panel">
          <div className="panel-heading"><div><h2>Estado de pedidos</h2><p>Distribución actual.</p></div></div>
          <DonutChart data={data?.order_status || []} />
        </article>
      </section>

      <section className="admin-panel alerts-panel">
        <div className="panel-heading"><div><h2>Alertas operativas</h2><p>Se calculan directamente con la información de MySQL.</p></div><Link to="/admin/asesor-ia">Revisar pendientes</Link></div>
        <AlertList alerts={data?.alerts || []} compact />
      </section>

      <section className="dashboard-grid">
        <article className="admin-panel">
          <div className="panel-heading"><div><h2>Inventario por categoría</h2><p>Unidades disponibles.</p></div><Link to="/admin/productos">Gestionar</Link></div>
          <HorizontalBars data={data?.inventory_by_category || []} valueKey="stock" labelKey="name" tone="inventory" valueFormatter={(value) => `${value} u.`} />
        </article>
        <article className="admin-panel">
          <div className="panel-heading"><div><h2>Productos más vendidos</h2><p>Unidades acumuladas.</p></div></div>
          {data?.top_products?.length ? (
            <div className="compact-list">{data.top_products.map((product) => <div key={`${product.id}-${product.name}`}><span><strong>{product.name}</strong><small>{formatCurrency(product.revenue)} vendidos</small></span><b>{product.units} u.</b></div>)}</div>
          ) : <p className="muted panel-empty">Aún no hay ventas para comparar productos.</p>}
        </article>
      </section>

      <section className="dashboard-grid">
        <article className="admin-panel">
          <div className="panel-heading"><div><h2>Pedidos recientes</h2><p>Últimos movimientos registrados.</p></div><Link to="/admin/pedidos">Ver todos</Link></div>
          {data?.recent_orders?.length ? <div className="compact-list">{data.recent_orders.map((order) => <div key={order.id}><span><strong>Pedido #{order.id}</strong><small>{order.user?.name || 'Cliente móvil'}</small></span><span><strong>{formatCurrency(order.total)}</strong><StatusBadge status={order.status} /></span></div>)}</div> : <p className="muted panel-empty">Todavía no hay pedidos.</p>}
        </article>
        <article className="admin-panel">
          <div className="panel-heading"><div><h2>Stock bajo</h2><p>Cinco unidades o menos.</p></div><Link to="/admin/productos">Reabastecer</Link></div>
          {data?.low_stock_products?.length ? <div className="compact-list">{data.low_stock_products.map((product) => <div key={product.id}><span><strong>{product.name}</strong><small>{product.sku || 'Sin SKU'}</small></span><b className={product.stock === 0 ? 'stock-low' : ''}>{product.stock}</b></div>)}</div> : <p className="muted panel-empty">El inventario está en buen estado.</p>}
        </article>
      </section>
    </>
  );
}
