export default function LoadingState({ label = 'Cargando…' }) {
  return <div className="state-card loading-state"><span className="spinner" />{label}</div>;
}
