import { useEffect, useState } from 'react';
import { ImagePlus, Pencil, Plus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useBrand } from '../BrandContext.jsx';
import { BrandAvatar, Modal, PageHeader } from '../components/ui.jsx';
import { fileToLogo } from '../utils.js';

const PRESETS = ['#2563eb', '#7c3aed', '#db2777', '#ef4444', '#f59e0b', '#10b981', '#0ea5e9', '#0f172a'];

export default function AdminBrands() {
  const { brands, refresh, setBrandId } = useBrand();
  const [modal, setModal] = useState(null);
  const nav = useNavigate();
  useEffect(() => { refresh(); }, [refresh]);

  const open = (b) => { setBrandId(b.id); nav('/dashboard'); };
  const del = async (b) => {
    if (!confirm(`Hapus brand "${b.name}" beserta seluruh kontennya? Tindakan ini tidak bisa dibatalkan.`)) return;
    await api.del(`/brands/${b.id}`);
    refresh();
  };

  return (
    <>
      <PageHeader title="Kelola Brand" subtitle="Perubahan nama, logo, dan warna otomatis tampil di semua user yang punya akses">
        <button className="btn primary" onClick={() => setModal({ name: '', color: PRESETS[0], logo: null })}><Plus size={16} /> Tambah Brand</button>
      </PageHeader>
      <div className="brand-grid">
        {brands.map((b) => (
          <div key={b.id} className="card brand-card" style={{ '--b': b.color }}>
            <div className="brand-top"><BrandAvatar brand={b} size={52} /><div><h3>{b.name}</h3><code>{b.color}</code></div></div>
            <div className="brand-actions">
              <button className="btn small" onClick={() => open(b)}>Buka</button>
              <button className="icon-btn" onClick={() => setModal(b)} aria-label="Edit"><Pencil size={16} /></button>
              <button className="icon-btn danger" onClick={() => del(b)} aria-label="Hapus"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
        {brands.length === 0 && <div className="card empty"><h3>Belum ada brand</h3><p>Klik “Tambah Brand” untuk mulai.</p></div>}
      </div>
      {modal && <BrandModal initial={modal} onClose={() => setModal(null)} onSaved={() => { setModal(null); refresh(); }} />}
    </>
  );
}

function BrandModal({ initial, onClose, onSaved }) {
  const [f, setF] = useState({ name: initial.name, color: initial.color, logo: initial.logo || null });
  const [err, setErr] = useState('');
  const save = async () => {
    if (!f.name.trim()) return setErr('Nama brand wajib diisi');
    try {
      if (initial.id) await api.put(`/brands/${initial.id}`, f); else await api.post('/brands', f);
      onSaved();
    } catch (e) { setErr(e.message); }
  };
  return (
    <Modal title={initial.id ? 'Edit Brand' : 'Tambah Brand'} onClose={onClose}
      footer={<><span style={{ flex: 1 }} /><button className="btn" onClick={onClose}>Batal</button><button className="btn primary" onClick={save}>Simpan</button></>}>
      {err && <div className="alert">{err}</div>}
      <div className="form-grid one">
        <label className="field"><span>Nama Brand</span><input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
        <div className="field"><span>Warna Brand</span>
          <div className="swatches">
            {PRESETS.map((c) => <button key={c} type="button" className={f.color === c ? 'on' : ''} style={{ background: c }} onClick={() => setF({ ...f, color: c })} aria-label={c} />)}
            <input type="color" value={f.color} onChange={(e) => setF({ ...f, color: e.target.value })} />
          </div>
        </div>
        <div className="field"><span>Logo</span>
          <div className="logo-up">
            <BrandAvatar brand={{ name: f.name || 'B', color: f.color, logo: f.logo }} size={56} />
            <label className="btn small"><ImagePlus size={15} /> Pilih gambar
              <input type="file" accept="image/*" hidden onChange={async (e) => e.target.files[0] && setF({ ...f, logo: await fileToLogo(e.target.files[0]) })} /></label>
            {f.logo && <button type="button" className="btn small" onClick={() => setF({ ...f, logo: null })}>Hapus logo</button>}
          </div>
        </div>
      </div>
    </Modal>
  );
}
