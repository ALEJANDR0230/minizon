import { useEffect, useState } from 'react';

export default function ActionDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  danger = false,
  noteLabel = '',
  notePlaceholder = '',
  busy = false,
  onCancel,
  onConfirm,
}) {
  const [note, setNote] = useState('');

  useEffect(() => {
    if (open) setNote('');
  }, [open]);

  if (!open) return null;

  return (
    <div className="app-dialog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && !busy && onCancel()}>
      <section aria-labelledby="app-dialog-title" aria-modal="true" className="app-dialog" role="dialog">
        <div className={`app-dialog-icon ${danger ? 'is-danger' : ''}`}>{danger ? '!' : '✓'}</div>
        <h2 id="app-dialog-title">{title}</h2>
        {description && <p>{description}</p>}
        {noteLabel && (
          <label>
            {noteLabel}
            <textarea
              autoFocus
              onChange={(event) => setNote(event.target.value)}
              placeholder={notePlaceholder}
              value={note}
            />
          </label>
        )}
        <div className="app-dialog-actions">
          <button className="button button-ghost" disabled={busy} onClick={onCancel} type="button">{cancelLabel}</button>
          <button className={`button ${danger ? 'button-danger' : 'button-primary'}`} disabled={busy} onClick={() => onConfirm(note.trim())} type="button">
            {busy ? 'Procesando…' : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
