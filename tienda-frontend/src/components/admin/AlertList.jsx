import { Link } from 'react-router-dom';

const labels = { critical: 'Crítica', warning: 'Atención', info: 'Información' };

export default function AlertList({ alerts = [], compact = false }) {
  return (
    <div className={`alert-list ${compact ? 'compact' : ''}`}>
      {alerts.map((alert, index) => (
        <Link className={`admin-alert alert-${alert.severity}`} key={`${alert.title}-${index}`} to={alert.path || '/admin'}>
          <span className="alert-dot" />
          <span><small>{labels[alert.severity] || 'Aviso'}</small><strong>{alert.title}</strong><p>{alert.message}</p></span>
          <b>Ver</b>
        </Link>
      ))}
    </div>
  );
}
