import { Link } from 'react-router-dom';
import EmptyState from '../components/ui/EmptyState';

export default function NotFoundPage() {
  return <div className="page-container"><EmptyState title="Página no encontrada" description="La dirección que abriste no existe o cambió." action={<Link className="button button-primary" to="/admin">Volver al panel</Link>} /></div>;
}
