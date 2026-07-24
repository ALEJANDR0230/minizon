const API_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

function expireSession() {
  localStorage.removeItem('store_token');
  localStorage.removeItem('store_user');
  window.dispatchEvent(new Event('store:unauthenticated'));
}

export class ApiError extends Error {
  constructor(message, status, errors = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

export async function apiRequest(path, options = {}) {
  const { timeoutMs, ...requestOptions } = options;
  const token = localStorage.getItem('store_token');
  const headers = {
    Accept: 'application/json',
    ...(requestOptions.body ? { 'Content-Type': 'application/json' } : {}),
    ...(requestOptions.headers || {}),
  };

  if (token) headers.Authorization = `Bearer ${token}`;

  const controller = timeoutMs ? new AbortController() : null;
  const timeout = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
  let response;
  try {
    response = await fetch(`${API_URL}${path.startsWith('/') ? path : `/${path}`}`, {
      ...requestOptions,
      headers,
      signal: controller?.signal || requestOptions.signal,
      body: requestOptions.body && typeof requestOptions.body !== 'string' ? JSON.stringify(requestOptions.body) : requestOptions.body,
    });
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new ApiError('La respuesta tard\u00f3 demasiado. Intenta nuevamente.', 408);
    }
    throw new ApiError(`No se pudo conectar con el servidor (${API_URL}).`, 0);
  } finally {
    if (timeout) clearTimeout(timeout);
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401 && token) expireSession();
    const validationMessage = data.errors ? Object.values(data.errors).flat().join(' ') : '';
    const message = data.message === 'Unauthenticated.'
      ? 'Tu sesión venció. Inicia sesión nuevamente.'
      : data.message || validationMessage || 'Ocurrió un error en el servidor.';
    throw new ApiError(message, response.status, data.errors);
  }

  return data;
}

export async function apiDownload(path, fallbackFilename = 'reporte.csv') {
  const token = localStorage.getItem('store_token');
  let response;

  try {
    response = await fetch(`${API_URL}${path.startsWith('/') ? path : `/${path}`}`, {
      headers: {
        Accept: 'text/csv, application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  } catch {
    throw new ApiError(`No se pudo conectar con el servidor (${API_URL}).`, 0);
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    if (response.status === 401 && token) expireSession();
    const message = data.message === 'Unauthenticated.'
      ? 'Tu sesión venció. Inicia sesión nuevamente.'
      : data.message || 'No se pudo generar el reporte.';
    throw new ApiError(message, response.status, data.errors);
  }

  const disposition = response.headers.get('content-disposition') || '';
  const match = disposition.match(/filename="?([^";]+)"?/i);
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = match?.[1] || fallbackFilename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export async function apiUpload(path, file) {
  const token = localStorage.getItem('store_token');
  const form = new FormData();
  form.append('image', file);

  let response;
  try {
    response = await fetch(`${API_URL}${path.startsWith('/') ? path : `/${path}`}`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: form,
    });
  } catch {
    throw new ApiError(`No se pudo conectar con el servidor (${API_URL}).`, 0);
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 && token) expireSession();
    const validationMessage = data.errors ? Object.values(data.errors).flat().join(' ') : '';
    throw new ApiError(data.message || validationMessage || 'No se pudo subir la imagen.', response.status, data.errors);
  }
  return data;
}

export { API_URL };
