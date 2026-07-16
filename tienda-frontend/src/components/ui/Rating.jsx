function clampRating(value) {
  const rating = Number(value);
  if (!Number.isFinite(rating)) return 0;
  return Math.min(5, Math.max(0, Math.round(rating)));
}

export default function Rating({ value, count, compact = false }) {
  const rating = clampRating(value);
  return (
    <span className={`rating ${compact ? 'rating-compact' : ''}`} aria-label={`${Number(value || 0).toFixed(1)} de 5 estrellas`}>
      <span aria-hidden="true">{'★'.repeat(rating)}{'☆'.repeat(5 - rating)}</span>
      {count !== undefined && <small>{count} {count === 1 ? 'reseña' : 'reseñas'}</small>}
    </span>
  );
}
