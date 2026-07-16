import { useEffect, useState } from 'react';
import { apiRequest } from '../../api/client';
import Message from '../../components/ui/Message';
import PageHeader from '../../components/ui/PageHeader';
import Rating from '../../components/ui/Rating';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  useEffect(() => { load(); }, []);
  async function load() { try { setReviews(await apiRequest('/admin/reviews')); } catch (reason) { setError(reason.message); } }
  async function remove(review) { if (!window.confirm('¿Eliminar esta reseña?')) return; try { await apiRequest(`/admin/reviews/${review.id}`, { method: 'DELETE' }); setMessage('Reseña eliminada.'); await load(); } catch (reason) { setError(reason.message); } }

  const query = search.trim().toLocaleLowerCase('es');
  const filteredReviews = reviews.filter((review) => {
    const searchable = `${review.user?.name || ''} ${review.user?.email || ''} ${review.product?.name || ''} ${review.comment || ''}`.toLocaleLowerCase('es');
    return searchable.includes(query) && (ratingFilter === 'all' || Number(review.rating) === Number(ratingFilter));
  });

  return (
    <>
      <PageHeader eyebrow="Administración" title="Reseñas" description="Modera las reseñas de productos." />
      <Message type="success">{message}</Message><Message type="error">{error}</Message>
      <section className="admin-panel reviews-admin-list">
        <div className="admin-filter-bar compact-filter-bar reviews-filter-bar">
          <label className="filter-search"><span>Buscar</span><input onChange={(event) => setSearch(event.target.value)} placeholder="Cliente, producto o comentario" type="search" value={search} /></label>
          <label><span>Calificación</span><select onChange={(event) => setRatingFilter(event.target.value)} value={ratingFilter}><option value="all">Todas</option>{[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} estrellas</option>)}</select></label>
        </div>
        {filteredReviews.length ? filteredReviews.map((review) => <article key={review.id}><div className="review-admin-meta"><span><strong>{review.user?.name}</strong><small>{review.user?.email}</small></span><span><strong>{review.product?.name}</strong><Rating value={review.rating} compact /></span></div><p>{review.comment}</p><footer><small>{new Date(review.created_at).toLocaleDateString('es-MX')}</small><button className="danger-text" onClick={() => remove(review)} type="button">Eliminar reseña</button></footer></article>) : <p className="table-empty">No hay reseñas con estos filtros.</p>}
      </section>
    </>
  );
}
