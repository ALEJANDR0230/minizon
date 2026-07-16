import { formatCurrency } from '../../utils/format';

const orderColors = {
  pending: '#d59a38',
  paid: '#2b8b85',
  shipped: '#6474b9',
  delivered: '#46a06f',
  cancelled: '#c75b5b',
};

export function SalesBarChart({ data = [] }) {
  const values = data.map((item) => Number(item.revenue || 0));
  const maximum = Math.max(...values, 1);
  const total = values.reduce((sum, value) => sum + value, 0);
  const daysWithSales = values.filter((value) => value > 0).length;
  const bestDay = data.reduce((best, item) => Number(item.revenue) > Number(best?.revenue || 0) ? item : best, null);

  return (
    <div className="sales-chart" role="img" aria-label="Gráfica de ventas de los últimos catorce días">
      <div className="chart-summary">
        <span><small>Total del periodo</small><strong>{formatCurrency(total)}</strong></span>
        <span><small>Días con ventas</small><strong>{daysWithSales}</strong></span>
        <span><small>Mejor día</small><strong>{bestDay && Number(bestDay.revenue) > 0 ? bestDay.label : '—'}</strong></span>
      </div>
      <div className="sales-chart-bars">
        {data.map((item) => {
          const value = Number(item.revenue || 0);
          const height = Math.max((value / maximum) * 100, value > 0 ? 6 : 1);
          return (
            <div className="sales-bar-column" key={item.date} title={`${item.label}: ${formatCurrency(value)}`}>
              <span className="sales-bar-value">{value > 0 ? formatCurrency(value) : ''}</span>
              <span className="sales-bar-track"><i style={{ height: `${height}%` }}><b /></i></span>
              <small>{item.label}</small>
            </div>
          );
        })}
      </div>
      {data.length > 0 && total === 0 && <p className="chart-empty">La gráfica se llenará cuando se registren las primeras ventas.</p>}
    </div>
  );
}

export function DonutChart({ data = [] }) {
  const total = data.reduce((sum, item) => sum + Number(item.value || 0), 0);
  let offset = 0;

  return (
    <div className="donut-layout" role="img" aria-label="Gráfica circular del estado de los pedidos">
      <div className="donut-chart">
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <circle className="donut-background" cx="50" cy="50" r="38" pathLength="100" />
          {total > 0 && data.map((item) => {
            const percentage = (Number(item.value || 0) / total) * 100;
            const currentOffset = offset;
            offset += percentage;
            return (
              <circle
                className="donut-segment"
                cx="50"
                cy="50"
                key={item.status}
                pathLength="100"
                r="38"
                style={{ stroke: orderColors[item.status] || '#4d8d88' }}
                strokeDasharray={`${percentage} ${100 - percentage}`}
                strokeDashoffset={-currentOffset}
              />
            );
          })}
        </svg>
        <span><strong>{total}</strong><small>pedidos</small></span>
      </div>
      <div className="donut-legend">
        {data.map((item) => (
          <div key={item.status}><i style={{ background: orderColors[item.status] || '#4d8d88' }} /><span>{item.label}</span><strong>{item.value}</strong></div>
        ))}
      </div>
    </div>
  );
}

export function HorizontalBars({ data = [], valueKey = 'value', labelKey = 'label', valueFormatter = (value) => value, tone = 'default' }) {
  const maximum = Math.max(...data.map((item) => Number(item[valueKey])), 1);
  const palette = tone === 'inventory' ? ['#287f7a', '#559b75', '#82a960', '#c49443', '#7181b0'] : ['#4d8d88'];

  return (
    <div className={`horizontal-bars horizontal-bars-${tone}`}>
      {data.map((item, index) => {
        const value = Number(item[valueKey] || 0);
        return (
          <div className="horizontal-bar" key={item.status || item.name || item[labelKey]}>
            <div><span>{item[labelKey]}</span><strong>{valueFormatter(value)}</strong></div>
            <span className="horizontal-bar-track"><i style={{ width: `${(value / maximum) * 100}%`, background: palette[index % palette.length] }} /></span>
          </div>
        );
      })}
    </div>
  );
}
