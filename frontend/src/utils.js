export const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
export const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
export const pad = (n) => String(n).padStart(2, '0');
export const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayStr = () => ymd(new Date());
export const parseDate = (s) => {
  const [y, m, d] = String(s).slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
};
export const dayName = (s) => (s ? DAYS[parseDate(s).getDay()] : '');
export const fmtDate = (s) => (s ? String(s).slice(0, 10).split('-').reverse().join('/') : '');
export const fmtShort = (s) => {
  const d = parseDate(s);
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
};
export const fmtNum = (n) => new Intl.NumberFormat('id-ID').format(Math.round(n || 0));
export const fmtPct = (n) => `${(n || 0).toLocaleString('id-ID', { maximumFractionDigits: 1 })}%`;
export const monthKey = (y, m) => `${y}-${pad(m + 1)}`;
export const engagement = (r) => (r.likes || 0) + (r.comments || 0) + (r.shares || 0) + (r.saves || 0) + (r.reposts || 0);
export const erate = (r) => (r.views ? (engagement(r) / r.views) * 100 : 0);
export const isUrl = (s) => /^https?:\/\//i.test(s || '');

export function fileToLogo(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const r = Math.min(256 / img.width, 256 / img.height, 1);
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * r);
      c.height = Math.round(img.height * r);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = url;
  });
}
