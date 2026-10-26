import { useEffect, useMemo, useRef, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Download, Eye, Heart, TrendingUp, UserPlus } from 'lucide-react';
import { api } from '../api.js';
import { useBrand } from '../BrandContext.jsx';
import { PLATFORMS } from '../constants.js';
import { NeedBrand, PageHeader, PlatformTabs, Stat } from '../components/ui.jsx';
import { exportReportPDF } from '../pdf.js';
import { engagement, erate, fmtNum, fmtPct, fmtShort } from '../utils.js';

export default function Analytics() {
  return <NeedBrand><Inner /></NeedBrand>;
}

const METRICS = [['views', 'Views'], ['likes', 'Likes'], ['comments', 'Komen'], ['shares', 'Shares'], ['saves', 'Saves'], ['reposts', 'Repost'], ['followers_gain', 'Followers Gain'], ['rate', 'Engagement Rate (%)']];

function Inner() {
  const { brand } = useBrand();
  const [platform, setPlatform] = useState('Instagram');
  const [rows, setRows] = useState([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [metric, setMetric] = useState('views');
  const [busy, setBusy] = useState(false);
  const refs = [useRef(), useRef(), useRef(), useRef()];

  useEffect(() => { api.get(`/brands/${brand.id}/insights?platform=${platform}`).then(setRows); }, [brand.id, platform]);

  const data = useMemo(() => rows.filter((r) => (!from || r.date >= from) && (!to || r.date <= to)), [rows, from, to]);
  const tot = (k) => data.reduce((a, r) => a + (r[k] || 0), 0);
  const views = tot('views');
  const eng = data.reduce((a, r) => a + engagement(r), 0);
  const followers = tot('followers_gain');
  const rate = views ? (eng / views) * 100 : 0;

  const trend = useMemo(() => {
    const m = {};
    data.forEach((r) => {
      const d = (m[r.date] ||= { date: r.date, views: 0, likes: 0, comments: 0, shares: 0, saves: 0, reposts: 0, followers_gain: 0, eng: 0 });
      ['views', 'likes', 'comments', 'shares', 'saves', 'reposts', 'followers_gain'].forEach((k) => (d[k] += r[k]));
      d.eng += engagement(r);
    });
    return Object.values(m).sort((a, b) => a.date.localeCompare(b.date)).map((d) => ({ ...d, label: fmtShort(d.date), rate: d.views ? +((d.eng / d.views) * 100).toFixed(2) : 0 }));
  }, [data]);

  const byType = useMemo(() => {
    const m = {};
    data.forEach((r) => { const t = r.content_type || 'Lainnya'; const d = (m[t] ||= { type: t, views: 0, engagement: 0 }); d.views += r.views; d.engagement += engagement(r); });
    return Object.values(m);
  }, [data]);

  const top = [...data].sort((a, b) => b.views - a.views).slice(0, 5);
  const metricLabel = METRICS.find((m) => m[0] === metric)[1];
  const platLabel = PLATFORMS.find((p) => p.key === platform).key;
  const period = from || to ? `${from || 'awal'} s/d ${to || 'akhir'}` : data.length ? `${data[0].date} s/d ${data[data.length - 1].date}` : 'Semua periode';

  const download = async () => {
    setBusy(true);
    try {
      await exportReportPDF({
        brand, platformLabel: platLabel, period,
        kpis: [{ label: 'Total Tayangan', value: fmtNum(views) }, { label: 'Total Suka', value: fmtNum(tot('likes')) }, { label: 'Rata-rata Engagement', value: fmtPct(rate) }, { label: 'Followers Gain', value: fmtNum(followers) }],
        charts: refs.map((r) => r.current),
        rows: data.map((r) => ({ ...r, er: erate(r) })),
        filename: `Laporan-${brand.name.replace(/\s+/g, '-')}-${platLabel}.pdf`,
      });
    } finally { setBusy(false); }
  };

  const cvr1 = views ? (eng / views) * 100 : 0;
  const cvr2 = eng ? (followers / eng) * 100 : 0;

  return (
    <>
      <PageHeader title="Analytics" subtitle="Performa konten berdasarkan data di menu Insight">
        <div className="range">
          <input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} />
          <span>–</span>
          <input type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <button className="btn primary" disabled={busy || !data.length} onClick={download}><Download size={16} /> {busy ? 'Membuat PDF…' : 'Download PDF'}</button>
      </PageHeader>
      <PlatformTabs value={platform} onChange={setPlatform} />

      <div className="stat-grid" style={{ marginTop: 16 }}>
        <Stat icon={Eye} label="Total Tayangan" value={fmtNum(views)} />
        <Stat icon={Heart} label="Total Suka" value={fmtNum(tot('likes'))} />
        <Stat icon={TrendingUp} label="Rata-rata Engagement" value={fmtPct(rate)} />
        <Stat icon={UserPlus} label="Followers Gain" value={fmtNum(followers)} />
      </div>

      {data.length === 0 ? <div className="card empty"><h3>Belum ada data</h3><p>Isi tabel di menu Insight untuk {platform} agar visualisasi muncul.</p></div> : (
        <>
          <div className="grid-2">
            <div className="card" ref={refs[0]}>
              <div className="card-head"><div><h3>Performa Trend</h3><p className="muted">{metricLabel} per tanggal</p></div>
                <select className="input select" value={metric} onChange={(e) => setMetric(e.target.value)} data-html2canvas-ignore>{METRICS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
              <div style={{ height: 270 }}>
                <ResponsiveContainer><LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e9f2" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} />
                  <Tooltip /><Line type="monotone" dataKey={metric} name={metricLabel} stroke={brand.color} strokeWidth={2.5} dot={{ r: 3 }} isAnimationActive={false} />
                </LineChart></ResponsiveContainer>
              </div>
            </div>

            <div className="card" ref={refs[1]}>
              <h3>Funnel Flow</h3><p className="muted">Awareness → Consideration → Conversion</p>
              <div className="funnel">
                <div className="f-step f1"><small>TAYANGAN</small><b>Awareness</b><span>{fmtNum(views)} views</span></div>
                <div className="cvr">CVR {fmtPct(cvr1)}</div>
                <div className="f-step f2"><small>TOTAL ENGAGEMENT</small><b>Consideration</b><span>{fmtNum(eng)} interaksi</span></div>
                <div className="cvr">CVR {fmtPct(cvr2)}</div>
                <div className="f-step f3"><small>FOLLOWERS GAIN</small><b>Conversion</b><span>{fmtNum(followers)} followers</span></div>
              </div>
            </div>
          </div>

          <div className="grid-2">
            <div className="card" ref={refs[2]}>
              <h3>Performa per Jenis Konten</h3><p className="muted">Views dan total engagement</p>
              <div style={{ height: 250 }}>
                <ResponsiveContainer><BarChart data={byType}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e9f2" />
                  <XAxis dataKey="type" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} /><Tooltip /><Legend />
                  <Bar dataKey="views" name="Views" fill={brand.color} radius={[6, 6, 0, 0]} isAnimationActive={false} />
                  <Bar dataKey="engagement" name="Engagement" fill="#94a3b8" radius={[6, 6, 0, 0]} isAnimationActive={false} />
                </BarChart></ResponsiveContainer>
              </div>
            </div>
            <div className="card" ref={refs[3]}>
              <h3>Top 5 Konten</h3><p className="muted">Berdasarkan views</p>
              <table className="table mini"><thead><tr><th>Judul</th><th>Views</th><th>ER</th></tr></thead>
                <tbody>{top.map((r) => <tr key={r.id}><td className="strong">{r.title}</td><td>{fmtNum(r.views)}</td><td>{fmtPct(erate(r))}</td></tr>)}</tbody></table>
            </div>
          </div>
        </>
      )}
    </>
  );
}
