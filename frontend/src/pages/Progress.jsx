import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import { useBrand } from '../BrandContext.jsx';
import { STATUSES } from '../constants.js';
import ContentModal from '../components/ContentModal.jsx';
import { MonthNav, NeedBrand, PageHeader, PlatformChips } from '../components/ui.jsx';
import { fmtShort, monthKey } from '../utils.js';

export default function Progress() {
  return <NeedBrand><Inner /></NeedBrand>;
}

function Inner() {
  const { brand } = useBrand();
  const now = new Date();
  const [ym, setYm] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [allMonths, setAllMonths] = useState(false);
  const [rows, setRows] = useState([]);
  const [modal, setModal] = useState(null);
  const [over, setOver] = useState(null);

  const load = useCallback(() => {
    api.get(`/brands/${brand.id}/contents${allMonths ? '' : `?month=${monthKey(ym.y, ym.m)}`}`).then(setRows);
  }, [brand.id, ym, allMonths]);
  useEffect(load, [load]);

  const drop = async (status, e) => {
    e.preventDefault();
    setOver(null);
    const id = Number(e.dataTransfer.getData('text/plain'));
    const row = rows.find((r) => r.id === id);
    if (!row || row.status === status) return;
    setRows((p) => p.map((r) => (r.id === id ? { ...r, status } : r)));
    await api.put(`/contents/${id}`, { status });
  };

  return (
    <>
      <PageHeader title="Progress" subtitle="Seret kartu antar kolom untuk mengubah status — otomatis tersimpan di Content Database">
        <label className="check"><input type="checkbox" checked={allMonths} onChange={(e) => setAllMonths(e.target.checked)} /> Semua bulan</label>
        {!allMonths && <MonthNav y={ym.y} m={ym.m} onChange={(y, m) => setYm({ y, m })} />}
      </PageHeader>
      <div className="board">
        {STATUSES.map((s) => {
          const list = rows.filter((r) => r.status === s.key);
          return (
            <div key={s.key} className={`col ${over === s.key ? 'over' : ''}`} onDragOver={(e) => { e.preventDefault(); setOver(s.key); }} onDragLeave={() => setOver(null)} onDrop={(e) => drop(s.key, e)}>
              <div className="col-head" style={{ '--c': s.color }}><i />{s.key}<b>{list.length}</b></div>
              {list.map((r) => (
                <div key={r.id} className="kcard" draggable onDragStart={(e) => e.dataTransfer.setData('text/plain', String(r.id))} onClick={() => setModal(r)}>
                  <strong>{r.title}</strong>
                  <PlatformChips list={r.platforms} />
                  <div className="meta">
                    {r.pillar && <span className="pill" style={{ '--c': '#6366f1' }}>{r.pillar}</span>}
                    {r.format && <span className="muted">{r.format}</span>}
                    <time>{fmtShort(r.date)}</time>
                  </div>
                </div>
              ))}
              {list.length === 0 && <div className="drop-hint">Tarik kartu ke sini</div>}
            </div>
          );
        })}
      </div>
      {modal && <ContentModal brandId={brand.id} initial={modal} onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />}
    </>
  );
}
