export default function EmptyState({ title, description, action }) {
  return (
    <div className="state-card empty-state">
      <span aria-hidden="true">◇</span>
      <h2>{title}</h2>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}
