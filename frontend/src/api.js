const BASE = import.meta.env.VITE_API_URL || '/api';
const KEY = 'socialora_token';

export const getToken = () => localStorage.getItem(KEY) || sessionStorage.getItem(KEY);
export const setToken = (t, remember) => {
  localStorage.removeItem(KEY);
  sessionStorage.removeItem(KEY);
  (remember ? localStorage : sessionStorage).setItem(KEY, t);
};
export const clearToken = () => {
  localStorage.removeItem(KEY);
  sessionStorage.removeItem(KEY);
};

async function req(path, { method = 'GET', body } = {}) {
  const token = getToken();
  let res;
  try {
    res = await fetch(BASE + path, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Tidak bisa terhubung ke server. Pastikan backend sudah berjalan.');
  }

  // Parse response
  let data = {};
  const text = await res.text();
  try {
    data = JSON.parse(text);
  } catch {
    // If response is HTML or plain text, extract readable text
    const clean = text
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    data = { error: clean ? clean.slice(0, 200) : `Error server (${res.status})` };
  }

  if (res.status === 401 && token) {
    clearToken();
    window.location.href = '/login';
  }

  if (!res.ok) {
    throw new Error(data.error || data.message || `Terjadi kesalahan (${res.status})`);
  }

  return data;
}

export const api = {
  get: (p) => req(p),
  post: (p, b) => req(p, { method: 'POST', body: b }),
  put: (p, b) => req(p, { method: 'PUT', body: b }),
  del: (p) => req(p, { method: 'DELETE' }),
};
