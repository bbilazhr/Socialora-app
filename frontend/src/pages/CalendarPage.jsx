import { useCallback, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { api } from '../api.js';
import { useBrand } from '../BrandContext.jsx';
import ContentModal from '../components/ContentModal.jsx';
import { MonthNav, NeedBrand, PageHeader } from '../components/ui.jsx';
import { DAYS, pad, todayStr } from '../utils.js';

export default function CalendarPage() {
  return <NeedBrand><Inner /></NeedBrand>;
}

function Inner() {
  const { brand, brands } = useBrand();
  const now = new Date();
  const [ym, setYm] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [all, setAll] = useState(false);
  const [items, setItems] = useState([]);
  const [modal, setModal] = useState(null);

  const load = useCallback(async () => {
    const list = all ? brands : [brand];
    const res = await Promise.all(list.map((b) => api.get(`/brands/${b.id}/contents`).then((rows) => rows.map((r) => ({ ...r, _brand: b })))));
    setItems(res.flat());
  }, [all, brand, brands]);
  useEffect(() => { load(); }, [load]);

  // grid 6 minggu, mulai hari Minggu (seperti Google Calendar)
  const first = new Date(ym.y, ym.m, 1);
  const start = new Date(ym.y, ym.m, 1 - first.getDay());
  const cells = Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  const key = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const byDay = {};
  items.forEach((c) => (byDay[c.date] ||= []).push(c));
  const today = todayStr();

  return (
    <>
      <PageHeader title="Calendar" subtitle="Jadwal konten — judul otomatis dari Content Database">
        {brands.length > 1 && (
          <label className="check"><input type="checkbox" checked={all} onChange={(e) => setAll(e.target.checked)} /> Semua brand</label>
        )}
        <button className="btn small" onClick={() => { const d = new Date(); setYm({ y: d.getFullYear(), m: d.getMonth() }); }}>Hari Ini</button>
        <MonthNav y={ym.y} m={ym.m} onChange={(y, m) => setYm({ y, m })} />
        <button className="btn primary" onClick={() => setModal({ date: today })}><Plus size={16} /> Konten Baru</button>
      </PageHeader>

      <div className="card cal">
        <div className="cal-head">{DAYS.map((d) => <div key={d}>{d.slice(0, 3).toUpperCase()}</div>)}</div>
        <div className="cal-grid">
          {cells.map((d) => {
            const k = key(d);
            const list = byDay[k] || [];
            const out = d.getMonth() !== ym.m;
            return (
              <div key={k} className={`cal-cell ${out ? 'out' : ''}`} onClick={() => setModal({ date: k })}>
                <span className={`cal-num ${k === today ? 'today' : ''}`}>{d.getDate()}</span>
                {list.slice(0, 3).map((c) => (
                  <button key={c.id} className="cal-chip" style={{ background: c._brand.color }} title={`${c.title} — ${c.status}`}
                    onClick={(e) => { e.stopPropagation(); setModal({ ...c, _brandId: c._brand.id }); }}>
                    {c.status === 'Published' ? '✓ ' : ''}{c.title}
                  </button>
                ))}
                {list.length > 3 && <small className="more">+{list.length - 3} lainnya</small>}
              </div>
            );
          })}
        </div>
      </div>
      {all && (
        <div className="legend">{brands.map((b) => <span key={b.id}><i style={{ background: b.color }} />{b.name}</span>)}</div>
      )}
      {modal && (
        <ContentModal brandId={modal._brandId || brand.id} initial={modal} onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />
      )}
    </>
  );
}
