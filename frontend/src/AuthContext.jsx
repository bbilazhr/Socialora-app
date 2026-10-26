import { createContext, useContext, useEffect, useState } from 'react';
import { api, getToken, setToken, clearToken } from './api.js';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!getToken());

  useEffect(() => {
    if (!getToken()) return;
    api.get('/auth/me').then((r) => setUser(r.user)).catch(() => clearToken()).finally(() => setLoading(false));
  }, []);

  const login = async ({ mode, identifier, password, remember }) => {
    const r = await api.post('/auth/login', { mode, identifier, password, remember });
    setToken(r.token, remember);
    setUser(r.user);
  };
  const register = async ({ name, username, email, password }) => {
    const r = await api.post('/auth/register', { name, username, email, password });
    if (r.token) setToken(r.token, false);
    if (r.user) setUser(r.user);
    return r;
  };
  const logout = () => {
    clearToken();
    localStorage.removeItem('socialora_brand');
    setUser(null);
  };

  return <Ctx.Provider value={{ user, loading, login, register, logout }}>{children}</Ctx.Provider>;
}
