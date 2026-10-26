import { useCallback, useEffect, useMemo, useState } from 'react';
import { ExternalLink, Pencil, Plus } from 'lucide-react';
import { api } from '../api.js';
import { useBrand } from '../BrandContext.jsx';
import { CONTENT_TYPES, PLATFORMS } from '../constants.js';
import { Modal, NeedBrand, PageHeader, PlatformTabs } from '../components/ui.jsx';
import { fmtNum, isUrl, todayStr } from '../utils.js';

export default function Insight() {
  return <NeedBrand><Inner /></NeedBrand>;
}

const NUM = [['likes', 'Likes'], ['comments', 'Komen'], ['shares', 'Shares'], ['views', 'Views'], ['reposts', 'Repost'], ['saves', 'Saves'], ['followers_gain', 'Followers Gain (Gt Gt)']];

function Inner() {
  const { brand } = useBrand();
  const [platform, setPlatform] = useState('Instagram');
  const [rows, setRows] = useState([]);
  const [contents, setContents] = useState([]);
  const [modal, setModal] = useState(null);

  const load = useCallback(() => {
    api.get(`/brands/${brand.id}/insights?platform=${platform}`).then(setRows);
    api.get(`/brands/${brand.id}/contents`).then(setContents);
  }, [brand.id, platform]);
  useEffect(load, [load]);

  const short = PLATFORMS.find((p) => p.key === platform).short;

  return (
    <>
      <PageHeader title="Insight" subtitle="Input data report per postingan — dipakai otomatis oleh halaman Analytics">
        <PlatformTabs value={platform} onChange={setPlatform} />
        <button className="btn primary" onClick={() => setModal({ platform, date: todayStr() })}><Plus size={16} /> Tambah Data</button>
      </PageHeader>

      <div className="card table-card">
        <div className="sheet-tab">Report {short}</div>
        <div className="table-wrap">
          <table className="table sheet">
            <thead>
              <tr><th>Tanggal</th><th>Judul Konten</th><th>Jenis Konten</th>{NUM.map(([, l]) => <th key={l}>{l}</th>)}<th>Link Postingan</th><th></th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="nowrap">{r.date}</td>
                  <td className="strong title-col">{r.title}</td>
                  <td>{r.content_type || '-'}</td>
                  {NUM.map(([k]) => <td key={k} className="num">{fmtNum(r[k])}</td>)}
                  <td>{r.link ? (isUrl(r.link) ? <a className="link" href={r.link} target="_blank" rel="noreferrer">Buka <ExternalLink size={12} /></a> : r.link) : '-'}</td>
                  <td><button className="icon-btn" onClick={() => setModal(r)} aria-label="Edit"><Pencil size={15} /></button></td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={12} className="empty-row">Belum ada data {platform}. Klik “Tambah Data”.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      {modal && <InsightModal brandId={brand.id} initial={modal} contents={contents} onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />}
    </>
  );
}

function InsightModal({ brandId, initial, contents, onClose, onSaved }) {
  const editing = !!initial.id;
  const [f, setF] = useState({ title: '', content_type: '', link: '', likes: 0, comments: 0, shares: 0, views: 0, reposts: 0, saves: 0, followers_gain: 0, ...Object.fromEntries(Object.entries(initial).map(([k, v]) => [k, v ?? ''])) });
  const [err, setErr] = useState('');
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const types = CONTENT_TYPES[f.platform] || [];
  const titles = useMemo(() => contents.filter((c) => c.platforms.includes(f.platform)), [contents, f.platform]);

  // pilih judul dari Content Database -> tanggal & link post ikut terisi
  const pickTitle = (v) => {
    set('title', v);
    const c = titles.find((x) => x.title === v);
    if (c) setF((p) => ({ ...p, title: v, date: c.date, link: p.link || c.link_post || '' }));
  };

  const save = async () => {
    if (!f.title.trim() || !f.date) return setErr('Tanggal dan Judul Konten wajib diisi');
    try {
      const body = { ...f }; delete body.id; delete body.brand_id; delete body.created_at;
      if (editing) await api.put(`/insights/${initial.id}`, body);
      else await api.post(`/brands/${brandId}/insights`, body);
      onSaved();
    } catch (e) { setErr(e.message); }
  };
  const del = async () => { if (confirm('Hapus data ini?')) { await api.del(`/insights/${initial.id}`); onSaved(); } };

  return (
    <Modal wide title={`${editing ? 'Edit' : 'Tambah'} Data Report ${f.platform}`} onClose={onClose}
      footer={<>{editing && <button className="btn danger" onClick={del}>Hapus</button>}<span style={{ flex: 1 }} /><button className="btn" onClick={onClose}>Batal</button><button className="btn primary" onClick={save}>Simpan</button></>}>
      {err && <div className="alert">{err}</div>}
      <div className="form-grid">
        <label className="field"><span>Tanggal</span><input type="date" className="input" value={f.date} onChange={(e) => set('date', e.target.value)} /></label>
        <label className="field"><span>Jenis Konten</span>
          <select className="input" value={f.content_type} onChange={(e) => set('content_type', e.target.value)}><option value="">-</option>{types.map((t) => <option key={t}>{t}</option>)}</select></label>
        <label className="field full"><span>Judul Konten <small>ketik bebas, atau pilih dari Content Database</small></span>
          <input className="input" list="titles" value={f.title} onChange={(e) => pickTitle(e.target.value)} />
          <datalist id="titles">{titles.map((c) => <option key={c.id} value={c.title} />)}</datalist></label>
        {NUM.map(([k, l]) => (
          <label key={k} className="field"><span>{l}</span><input type="number" min="0" className="input" value={f[k]} onChange={(e) => set(k, e.target.value)} /></label>
        ))}
        <label className="field full"><span>Link Postingan</span><input className="input" placeholder="https://…" value={f.link} onChange={(e) => set('link', e.target.value)} /></label>
      </div>
    </Modal>
  );
}
