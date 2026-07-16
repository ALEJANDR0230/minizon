import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Message from '../../components/ui/Message';

export default function LoginPage() {
  const { login, isAdmin } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  if (isAdmin) return <Navigate to="/admin" replace />;

  async function submit(event) {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      await login(form);
    } catch (reason) {
      setError(reason.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="admin-login-page">
      <section className="admin-login-card">
        <div className="login-brand"><span>mitienda</span><small>centro de administración</small></div>
        <div className="login-copy">
          <span className="eyebrow">Acceso privado</span>
          <h1>Panel administrativo</h1>
          <p>Ingresa con la cuenta del administrador. Los clientes usan exclusivamente la aplicación móvil.</p>
        </div>
        <Message type="error">{error}</Message>
        <form onSubmit={submit}>
          <label>Correo del administrador<input autoComplete="email" required type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} /></label>
          <label>Contraseña<input autoComplete="current-password" required type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} /></label>
          <button className="button button-primary" disabled={saving} type="submit">{saving ? 'Verificando…' : 'Entrar al panel'}</button>
        </form>
        <p className="login-security">La sesión está protegida y las credenciales nunca se muestran en el navegador.</p>
      </section>
    </main>
  );
}
