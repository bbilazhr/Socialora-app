import { useCallback, useEffect, useMemo, useState } from 'react';
import { ExternalLink, Pencil, Plus, Search } from 'lucide-react';
import { api } from '../api.js';
import { useBrand } from '../BrandContext.jsx';
import { COLUMNS, PLATFORMS, STATUSES, statusColor } from '../constants.js';
import ContentModal from '../components/ContentModal.jsx';
import { MonthNav, NeedBrand, PageHeader, PlatformChips } from '../components/ui.jsx';
import { MONTHS, dayName, fmtDate, isUrl, monthKey } from '../utils.js';

export default function ContentDatabase() {
  return <NeedBrand><Inner /></NeedBrand>;
}

function Cell({ v }) {
  if (!v) return <span className="muted">-</span>;
  if (isUrl(v)) return <a href={v} target="_blank" rel="noreferrer" className="link" title={v}>{v.replace(/^https?:\/\/(www\.)?/, '').slice(0, 26)}… <ExternalLink size={12} /></a>;
  return <span className="clip" title={v}>{v}</span>;
}

function Inner() {
  const { brand } = useBrand();
  const now = new Date();
  const [ym, setYm] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState('');
  const [fs, setFs] = useState('');
  const [fp, setFp] = useState('');
  const [modal, setModal] = useState(null);

  const load = useCallback(() => {
    api.get(`/brands/${brand.id}/contents?month=${monthKey(ym.y, ym.m)}`).then(setRows);
  }, [brand.id, ym]);
  useEffect(load, [load]);

  const view = useMemo(() => rows.filter((r) =>
    (!q || `${r.title} ${r.caption || ''} ${r.brief || ''}`.toLowerCase().includes(q.toLowerCase())) &&
    (!fs || r.status === fs) && (!fp || r.platforms.includes(fp))
  ), [rows, q, fs, fp]);

  const setStatus = async (r, status) => {
    setRows((p) => p.map((x) => (x.id === r.id ? { ...x, status } : x)));
    await api.put(`/contents/${r.id}`, { status });
  };

  return (
    <>
      <PageHeader title="Content Database" subtitle={`CONTENT PLAN ${brand.name.toUpperCase()} | ${MONTHS[ym.m].toUpperCase()} ${ym.y}`}>
        <MonthNav y={ym.y} m={ym.m} onChange={(y, m) => setYm({ y, m })} />
        <button className="btn primary" onClick={() => setModal({ date: `${monthKey(ym.y, ym.m)}-01` })}><Plus size={16} /> Tambah Konten</button>
      </PageHeader>

      <div className="toolbar">
        <div className="search"><Search size={16} /><input placeholder="Cari judul, caption, atau brief…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <select className="input select" value={fs} onChange={(e) => setFs(e.target.value)}>
          <option value="">Semua Status</option>{STATUSES.map((s) => <option key={s.key}>{s.key}</option>)}
        </select>
        <select className="input select" value={fp} onChange={(e) => setFp(e.target.value)}>
          <option value="">Semua Platform</option>{PLATFORMS.map((s) => <option key={s.key}>{s.key}</option>)}
        </select>
        <span className="muted">{view.length} konten</span>
      </div>

      <div className="card table-card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                {COLUMNS.map((c) => <th key={c.key}>{c.label}{c.desc && <small>{c.desc}</small>}</th>)}
                <th></th>
              </tr>
            </thead>
            <tbody>
              {view.map((r, i) => (
                <tr key={r.id}>
                  <td>{i + 1}</td>
                  <td className="nowrap">{fmtDate(r.date)}</td>
                  <td>{dayName(r.date)}</td>
                  <td><Cell v={r.holiday} /></td>
                  <td className="strong title-col">{r.title}</td>
                  <td>
                    <select className="status-select" style={{ '--c': statusColor(r.status) }} value={r.status} onChange={(e) => setStatus(r, e.target.value)}>
                      {STATUSES.map((s) => <option key={s.key}>{s.key}</option>)}
                    </select>
                  </td>
                  <td><PlatformChips list={r.platforms} /></td>
                  <td>{r.format || <span className="muted">-</span>}</td>
                  <td>{r.pillar ? <span className="pill" style={{ '--c': '#6366f1' }}>{r.pillar}</span> : <span className="muted">-</span>}</td>
                  <td><Cell v={r.result} /></td>
                  <td><Cell v={r.file_link} /></td>
                  <td className="wide-col"><Cell v={r.caption} /></td>
                  <td className="wide-col"><Cell v={r.brief} /></td>
                  <td><Cell v={r.reference} /></td>
                  <td><Cell v={r.link_post} /></td>
                  <td><button className="icon-btn" onClick={() => setModal(r)} aria-label="Edit"><Pencil size={15} /></button></td>
                </tr>
              ))}
              {view.length === 0 && <tr><td colSpan={COLUMNS.length + 1} className="empty-row">Belum ada konten di bulan ini. Klik “Tambah Konten”.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      {modal && <ContentModal brandId={brand.id} initial={modal} onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />}
    </>
  );
}
