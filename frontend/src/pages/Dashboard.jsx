import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CalendarClock, CheckCircle2, FileText, Plus, TrendingUp } from 'lucide-react';
import { api } from '../api.js';
import { useBrand } from '../BrandContext.jsx';
import { PLATFORMS, STATUSES, statusColor } from '../constants.js';
import ContentModal from '../components/ContentModal.jsx';
import { NeedBrand, PageHeader, PlatformChips, PlatformTabs, Stat } from '../components/ui.jsx';
import { engagement, fmtPct, fmtShort, todayStr } from '../utils.js';

export default function Dashboard() {
  return <NeedBrand><Inner /></NeedBrand>;
}

function Inner() {
  const { brand } = useBrand();
  const nav = useNavigate();
  const [contents, setContents] = useState([]);
  const [insights, setInsights] = useState([]);
  const [platform, setPlatform] = useState('ALL');
  const [modal, setModal] = useState(null);

  const load = useCallback(() => {
    Promise.all([api.get(`/brands/${brand.id}/contents`), api.get(`/brands/${brand.id}/insights`)])
      .then(([c, i]) => { setContents(c); setInsights(i); });
  }, [brand.id]);
  useEffect(load, [load]);

  const cs = platform === 'ALL' ? contents : contents.filter((c) => c.platforms.includes(platform));
  const is = platform === 'ALL' ? insights : insights.filter((i) => i.platform === platform);
  const views = is.reduce((a, r) => a + r.views, 0);
  const eng = is.reduce((a, r) => a + engagement(r), 0);
  const rate = views ? (eng / views) * 100 : 0;

  const byDate = {};
  is.forEach((r) => {
    const d = (byDate[r.date] ||= { date: r.date, views: 0, eng: 0 });
    d.views += r.views; d.eng += engagement(r);
  });
  const trend = Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date)).map((d) => ({ label: fmtShort(d.date), rate: d.views ? +(d.eng / d.views * 100).toFixed(2) : 0 }));

  const upcoming = cs.filter((c) => c.date >= todayStr() && c.status !== 'Published').slice(0, 6);

  return (
    <>
      <PageHeader title={`Halo, ${brand.name}`} subtitle="Ringkasan konten dan performa brand ini">
        <PlatformTabs withAll value={platform} onChange={setPlatform} />
        <button className="btn primary" onClick={() => setModal({})}><Plus size={16} /> Konten Baru</button>
      </PageHeader>

      <div className="stat-grid">
        <Stat icon={FileText} label="Total Konten" value={cs.length} />
        <Stat icon={CheckCircle2} label="Dipublikasikan" value={cs.filter((c) => c.status === 'Published').length} />
        <Stat icon={CalendarClock} label="Terjadwal" value={cs.filter((c) => c.status === 'Scheduled').length} />
        <Stat icon={TrendingUp} label="Rata-rata Engagement" value={fmtPct(rate)} hint="dari data Insight" />
      </div>

      <div className="grid-2">
        <div className="card">
          <h3>Status Konten</h3>
          <p className="muted">Sinkron dengan kolom Status di Content Database</p>
          <div className="bars">
            {STATUSES.map((s) => {
              const n = cs.filter((c) => c.status === s.key).length;
              return (
                <div key={s.key} className="bar-row">
                  <span>{s.key}</span>
                  <div className="bar"><i style={{ width: `${cs.length ? (n / cs.length) * 100 : 0}%`, background: s.color }} /></div>
                  <b>{n}</b>
                </div>
              );
            })}
          </div>
          <h3 style={{ marginTop: 22 }}>Konten per Platform</h3>
          <div className="bars">
            {PLATFORMS.map((p) => {
              const n = contents.filter((c) => c.platforms.includes(p.key)).length;
              return (
                <div key={p.key} className="bar-row">
                  <span>{p.key}</span>
                  <div className="bar"><i style={{ width: `${contents.length ? (n / contents.length) * 100 : 0}%`, background: p.color }} /></div>
                  <b>{n}</b>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <div className="card-head"><div><h3>Akan Datang</h3><p className="muted">Konten berikutnya yang belum publish</p></div>
            <button className="btn small" onClick={() => nav('/calendar')}>Calendar</button></div>
          {upcoming.length === 0 && <p className="muted pad">Tidak ada konten mendatang.</p>}
          <ul className="upcoming">
            {upcoming.map((c) => (
              <li key={c.id} onClick={() => setModal(c)}>
                <PlatformChips list={c.platforms.slice(0, 1)} />
                <div><b>{c.title}</b><span className="pill" style={{ '--c': statusColor(c.status) }}>{c.status}</span></div>
                <time>{fmtShort(c.date)}</time>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="card">
        <h3>Engagement Rate Tren</h3>
        <p className="muted">Dihitung dari (likes + komen + shares + saves + repost) ÷ views, berdasarkan data Insight</p>
        {trend.length === 0 ? <p className="muted pad">Belum ada data. Isi tabel di menu Insight.</p> : (
          <div style={{ height: 280 }}>
            <ResponsiveContainer>
              <AreaChart data={trend}>
                <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={brand.color} stopOpacity=".3" /><stop offset="1" stopColor={brand.color} stopOpacity="0" /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e9f2" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} unit="%" />
                <Tooltip formatter={(v) => `${v}%`} />
                <Area type="monotone" dataKey="rate" name="Engagement" stroke={brand.color} strokeWidth={2.5} fill="url(#g)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
      {modal && <ContentModal brandId={brand.id} initial={modal} onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />}
    </>
  );
}
