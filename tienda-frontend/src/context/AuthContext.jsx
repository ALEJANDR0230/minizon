import { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../api/client';
import { AuthContext } from './auth-context';

function readStoredUser() {
  try {
    const user = JSON.parse(localStorage.getItem('store_user')) || null;
    return user?.role === 'admin' ? user : null;
  } catch {
    return null;
  }
}

function normalizeUser(user) {
  if (!user) return null;
  return { ...user, role: user.role === 'buyer' ? 'user' : user.role };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  const [checkingSession, setCheckingSession] = useState(Boolean(localStorage.getItem('store_token')));

  useEffect(() => {
    const token = localStorage.getItem('store_token');
    if (!token) {
      setCheckingSession(false);
      return;
    }

    apiRequest('/auth/me', { timeoutMs: 4000 })
      .then((currentUser) => {
        if (currentUser?.role !== 'admin') {
          clearSession();
          return;
        }
        persistSession(token, currentUser);
      })
      .catch((error) => {
        if (error.status === 401 || error.status === 403) clearSession();
      })
      .finally(() => setCheckingSession(false));
  }, []);

  function persistSession(token, nextUser) {
    const normalized = normalizeUser(nextUser);
    localStorage.setItem('store_token', token);
    localStorage.setItem('store_user', JSON.stringify(normalized));
    setUser(normalized);
  }

  function clearSession() {
    localStorage.removeItem('store_token');
    localStorage.removeItem('store_user');
    setUser(null);
  }

  async function login(credentials) {
    const data = await apiRequest('/auth/admin/login', { method: 'POST', body: credentials });
    if ((data.user?.role || data.role) !== 'admin') {
      clearSession();
      throw new Error('Acceso exclusivo para el administrador.');
    }
    persistSession(data.token, data.user || { email: credentials.email, role: data.role });
    return normalizeUser(data.user || { email: credentials.email, role: data.role });
  }

  async function logout() {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } finally {
      clearSession();
    }
  }

  const value = useMemo(() => ({
    user,
    checkingSession,
    isAuthenticated: Boolean(user),
    isAdmin: user?.role === 'admin',
    login,
    logout,
  }), [user, checkingSession]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
