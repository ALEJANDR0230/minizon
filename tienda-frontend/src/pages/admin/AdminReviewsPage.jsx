import { useEffect, useState } from 'react';
import { apiRequest } from '../../api/client';
import Message from '../../components/ui/Message';
import PageHeader from '../../components/ui/PageHeader';
import Rating from '../../components/ui/Rating';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  useEffect(() => { load(); }, []);
  async function load() { try { setReviews(await apiRequest('/admin/reviews')); } catch (reason) { setError(reason.message); } }
  async function remove(review) { if (!window.confirm('¿Eliminar esta reseña?')) return; try { await apiRequest(`/admin/reviews/${review.id}`, { method: 'DELETE' }); setMessage('Reseña eliminada.'); await load(); } catch (reason) { setError(reason.message); } }

  return (
    <>
      <PageHeader eyebrow="Moderación" title="Reseñas" description="Consulta comentarios y elimina únicamente contenido que incumpla las reglas." />
      <Message type="success">{message}</Message><Message type="error">{error}</Message>
      <section className="admin-panel reviews-admin-list">{reviews.length ? reviews.map((review) => <article key={review.id}><div className="review-admin-meta"><span><strong>{review.user?.name}</strong><small>{review.user?.email}</small></span><span><strong>{review.product?.name}</strong><Rating value={review.rating} compact /></span></div><p>{review.comment}</p><footer><small>{new Date(review.created_at).toLocaleDateString('es-MX')}</small><button className="danger-text" onClick={() => remove(review)} type="button">Eliminar reseña</button></footer></article>) : <p className="table-empty">No hay reseñas para moderar.</p>}</section>
    </>
  );
}
