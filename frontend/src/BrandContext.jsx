import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from './api.js';

const Ctx = createContext(null);
export const useBrand = () => useContext(Ctx);

export function BrandProvider({ children }) {
  const [brands, setBrands] = useState([]);
  const [currentId, setCurrentId] = useState(() => Number(localStorage.getItem('socialora_brand')) || null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const list = await api.get('/brands');
      setBrands(list);
      setCurrentId((id) => (list.some((b) => b.id === id) ? id : list[0]?.id ?? null));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh().catch(() => {});
    // Sinkron: tiap kembali ke tab ini, daftar brand (nama, logo, warna, akses) diambil ulang dari server
    const onFocus = () => refresh().catch(() => {});
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [refresh]);

  const brand = brands.find((b) => b.id === currentId) || null;

  useEffect(() => {
    if (brand) localStorage.setItem('socialora_brand', String(brand.id));
    document.documentElement.style.setProperty('--brand', brand?.color || '#2563eb');
  }, [brand]);

  return <Ctx.Provider value={{ brands, brand, setBrandId: setCurrentId, refresh, loading }}>{children}</Ctx.Provider>;
}
