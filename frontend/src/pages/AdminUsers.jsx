import { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { api } from '../api.js';
import { useBrand } from '../BrandContext.jsx';
import { BrandAvatar, Modal, PageHeader } from '../components/ui.jsx';

export default function AdminUsers() {
  const { brands } = useBrand();
  const [users, setUsers] = useState([]);
  const [modal, setModal] = useState(null);
  const load = useCallback(() => api.get('/users').then(setUsers), []);
  useEffect(() => { load(); }, [load]);

  const del = async (u) => { if (confirm(`Hapus user "${u.name}"?`)) { await api.del(`/users/${u.id}`); load(); } };

  return (
    <>
      <PageHeader title="Kelola User" subtitle="User hanya bisa mengisi data pada brand yang kamu ACC di sini">
        <button className="btn primary" onClick={() => setModal({ name: '', username: '', email: '', password: '', brand_ids: [] })}><Plus size={16} /> Tambah User</button>
      </PageHeader>
      <div className="card table-card">
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Nama</th><th>Username</th><th>Email</th><th>Role</th><th>Brand yang di-ACC</th><th></th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="strong">{u.name}</td><td>{u.username}</td><td>{u.email}</td>
                  <td><span className="pill" style={{ '--c': '#6366f1' }}>{u.role}</span></td>
                  <td><div className="chips">{u.brand_ids.map((id) => { const b = brands.find((x) => x.id === id); return b ? <span key={id} className="chip" style={{ '--c': b.color }}>{b.name}</span> : null; })}{!u.brand_ids.length && <span className="muted">Belum ada</span>}</div></td>
                  <td className="nowrap">
                    <button className="icon-btn" onClick={() => setModal(u)} aria-label="Edit"><Pencil size={15} /></button>
                    <button className="icon-btn danger" onClick={() => del(u)} aria-label="Hapus"><Trash2 size={15} /></button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && <tr><td colSpan={6} className="empty-row">Belum ada user.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      {modal && <UserModal initial={modal} brands={brands} onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />}
    </>
  );
}

function UserModal({ initial, brands, onClose, onSaved }) {
  const editing = !!initial.id;
  const [f, setF] = useState({ name: initial.name, username: initial.username, email: initial.email, password: '', brandIds: initial.brand_ids });
  const [err, setErr] = useState('');
  const toggle = (id) => setF((p) => ({ ...p, brandIds: p.brandIds.includes(id) ? p.brandIds.filter((x) => x !== id) : [...p.brandIds, id] }));
  const save = async () => {
    if (!editing && !f.password) return setErr('Password wajib diisi untuk user baru');
    try {
      if (editing) await api.put(`/users/${initial.id}`, f); else await api.post('/users', f);
      onSaved();
    } catch (e) { setErr(e.message); }
  };
  return (
    <Modal title={editing ? 'Edit User' : 'Tambah User'} onClose={onClose}
      footer={<><span style={{ flex: 1 }} /><button className="btn" onClick={onClose}>Batal</button><button className="btn primary" onClick={save}>Simpan</button></>}>
      {err && <div className="alert">{err}</div>}
      <div className="form-grid">
        <label className="field"><span>Nama</span><input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
        <label className="field"><span>Username</span><input className="input" value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} /></label>
        <label className="field"><span>Email</span><input type="email" className="input" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
        <label className="field"><span>Password {editing && <small>kosongkan jika tidak diganti</small>}</span><input type="password" className="input" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></label>
        <div className="field full"><span>Akses Brand (ACC)</span>
          <div className="access">
            {brands.map((b) => (
              <label key={b.id} className={`access-item ${f.brandIds.includes(b.id) ? 'on' : ''}`}>
                <input type="checkbox" checked={f.brandIds.includes(b.id)} onChange={() => toggle(b.id)} />
                <BrandAvatar brand={b} size={22} /> {b.name}
              </label>
            ))}
            {!brands.length && <span className="muted">Buat brand dulu di Kelola Brand.</span>}
          </div>
        </div>
      </div>
    </Modal>
  );
}
