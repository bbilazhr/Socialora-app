import { useState } from 'react';
import { api } from '../api.js';
import { FORMATS, PILLARS, PLATFORMS, STATUSES } from '../constants.js';
import { dayName, todayStr } from '../utils.js';
import { Modal } from './ui.jsx';

const EMPTY = { date: todayStr(), holiday: '', title: '', status: 'On Brief', platforms: ['Instagram'], format: '', pillar: '', result: '', file_link: '', caption: '', brief: '', reference: '', link_post: '' };

export default function ContentModal({ brandId, initial, onClose, onSaved }) {
  const editing = !!initial?.id;
  const [f, setF] = useState({ ...EMPTY, ...Object.fromEntries(Object.entries(initial || {}).map(([k, v]) => [k, v ?? ''])) });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const togglePlat = (p) => set('platforms', f.platforms.includes(p) ? f.platforms.filter((x) => x !== p) : [...f.platforms, p]);

  const save = async () => {
    if (!f.title.trim() || !f.date) return setErr('Tanggal dan Post Title wajib diisi');
    setBusy(true);
    try {
      const body = { ...f };
      delete body.id; delete body.brand_id; delete body.created_at;
      if (editing) await api.put(`/contents/${initial.id}`, body);
      else await api.post(`/brands/${brandId}/contents`, body);
      onSaved();
    } catch (e) { setErr(e.message); setBusy(false); }
  };
  const del = async () => {
    if (!confirm('Hapus konten ini?')) return;
    await api.del(`/contents/${initial.id}`);
    onSaved();
  };

  return (
    <Modal
      wide
      title={editing ? 'Edit Konten' : 'Tambah Konten'}
      onClose={onClose}
      footer={
        <>
          {editing && <button className="btn danger" onClick={del}>Hapus</button>}
          <span style={{ flex: 1 }} />
          <button className="btn" onClick={onClose}>Batal</button>
          <button className="btn primary" disabled={busy} onClick={save}>{busy ? 'Menyimpan…' : 'Simpan'}</button>
        </>
      }
    >
      {err && <div className="alert">{err}</div>}
      <div className="form-grid">
        <label className="field"><span>Date <small>Tanggal Posting Content</small></span>
          <input type="date" className="input" value={f.date} onChange={(e) => set('date', e.target.value)} />
          <small>Days: {dayName(f.date) || '-'}</small>
        </label>
        <label className="field"><span>Holidays <small>Hari Besar/Hari Nasional</small></span>
          <input className="input" value={f.holiday} onChange={(e) => set('holiday', e.target.value)} />
        </label>
        <label className="field full"><span>Post Title <small>Judul Postingan</small></span>
          <input className="input" value={f.title} onChange={(e) => set('title', e.target.value)} />
        </label>
        <label className="field"><span>Status <small>Status Content</small></span>
          <select className="input" value={f.status} onChange={(e) => set('status', e.target.value)}>
            {STATUSES.map((s) => <option key={s.key}>{s.key}</option>)}
          </select>
        </label>
        <label className="field"><span>Format <small>Format Content</small></span>
          <select className="input" value={f.format} onChange={(e) => set('format', e.target.value)}>
            <option value="">-</option>{FORMATS.map((s) => <option key={s}>{s}</option>)}
          </select>
        </label>
        <div className="field full"><span>Platform <small>Content nya diposting dimana</small></span>
          <div className="chips big">
            {PLATFORMS.map((p) => (
              <button type="button" key={p.key} className={`chip pick ${f.platforms.includes(p.key) ? 'on' : ''}`} style={{ '--c': p.color }} onClick={() => togglePlat(p.key)}>{p.key}</button>
            ))}
          </div>
        </div>
        <label className="field"><span>Content Pillar <small>Tujuan dan Jenis Content</small></span>
          <select className="input" value={f.pillar} onChange={(e) => set('pillar', e.target.value)}>
            <option value="">-</option>{PILLARS.map((s) => <option key={s}>{s}</option>)}
          </select>
        </label>
        <label className="field"><span>Content <small>Hasil Content</small></span>
          <input className="input" value={f.result} onChange={(e) => set('result', e.target.value)} />
        </label>
        <label className="field"><span>File Content</span>
          <input className="input" placeholder="https://…" value={f.file_link} onChange={(e) => set('file_link', e.target.value)} />
        </label>
        <label className="field"><span>Referensi <small>Link referensi yang akan dibuat</small></span>
          <input className="input" placeholder="https://…" value={f.reference} onChange={(e) => set('reference', e.target.value)} />
        </label>
        <label className="field full"><span>Caption <small>Caption Content</small></span>
          <textarea className="input" rows={3} value={f.caption} onChange={(e) => set('caption', e.target.value)} />
        </label>
        <label className="field full"><span>Brief <small>Panduan yang digunakan untuk membuat kontent</small></span>
          <textarea className="input" rows={2} value={f.brief} onChange={(e) => set('brief', e.target.value)} />
        </label>
        <label className="field full"><span>Link Post <small>Link konten yang sudah dipublish</small></span>
          <input className="input" placeholder="https://…" value={f.link_post} onChange={(e) => set('link_post', e.target.value)} />
        </label>
      </div>
    </Modal>
  );
}
