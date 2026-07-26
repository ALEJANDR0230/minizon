import { useEffect, useState } from 'react';
import { apiRequest } from '../../api/client';
import Message from '../ui/Message';

const emptyForm = { current_password: '', password: '', password_confirmation: '' };

export default function PasswordDialog({ open, onClose }) {
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (open) {
      setForm(emptyForm);
      setError('');
      setSuccess('');
    }
  }, [open]);

  if (!open) return null;

  async function submit(event) {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (form.password !== form.password_confirmation) {
      setError('La confirmación no coincide con la nueva contraseña.');
      return;
    }
    setBusy(true);
    try {
      const response = await apiRequest('/auth/change-password', { method: 'POST', body: form });
      setSuccess(response.message);
      setForm(emptyForm);
    } catch (reason) {
      setError(reason.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app-dialog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && !busy && onClose()}>
      <form aria-labelledby="password-title" aria-modal="true" className="app-dialog password-dialog" onSubmit={submit} role="dialog">
        <div className="app-dialog-icon">••</div>
        <h2 id="password-title">Cambiar contraseña</h2>
        <p>Usa por lo menos 10 caracteres. La nueva contraseña no se mostrará ni se guardará en el navegador.</p>
        <Message type="success">{success}</Message>
        <Message type="error">{error}</Message>
        <label>Contraseña actual<input autoComplete="current-password" onChange={(event) => setForm((current) => ({ ...current, current_password: event.target.value }))} required type="password" value={form.current_password} /></label>
        <label>Nueva contraseña<input autoComplete="new-password" minLength="10" onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} required type="password" value={form.password} /></label>
        <label>Confirmar nueva contraseña<input autoComplete="new-password" minLength="10" onChange={(event) => setForm((current) => ({ ...current, password_confirmation: event.target.value }))} required type="password" value={form.password_confirmation} /></label>
        <div className="app-dialog-actions">
          <button className="button button-ghost" disabled={busy} onClick={onClose} type="button">Cerrar</button>
          <button className="button button-primary" disabled={busy} type="submit">{busy ? 'Guardando…' : 'Cambiar contraseña'}</button>
        </div>
      </form>
    </div>
  );
}
