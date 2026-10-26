import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import autoTable from 'jspdf-autotable';
import { fmtNum, fmtPct } from './utils.js';

const hex = (h) => {
  const n = parseInt((h || '#2563eb').replace('#', '').padEnd(6, '0').slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

export async function exportReportPDF({ brand, platformLabel, period, kpis, charts, rows, filename }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 210, H = 297, M = 14;
  const rgb = hex(brand.color);

  // Header
  doc.setFillColor(...rgb);
  doc.rect(0, 0, W, 36, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(19);
  doc.text('Laporan Performa Konten', M, 16);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
  doc.text(`${brand.name}  |  ${platformLabel}  |  ${period}`, M, 25);
  doc.text(`Dibuat ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} lewat Socialora`, M, 31);
  if (brand.logo?.startsWith('data:image')) {
    try { doc.setFillColor(255, 255, 255); doc.roundedRect(W - M - 18, 8, 18, 18, 3, 3, 'F'); doc.addImage(brand.logo, 'PNG', W - M - 16.5, 9.5, 15, 15); } catch { /* logo opsional */ }
  }

  // KPI cards
  let y = 46;
  const bw = (W - 2 * M - 9) / 4;
  kpis.forEach((k, i) => {
    const x = M + i * (bw + 3);
    doc.setDrawColor(226, 232, 240); doc.setFillColor(248, 250, 252);
    doc.roundedRect(x, y, bw, 22, 3, 3, 'FD');
    doc.setTextColor(100, 116, 139); doc.setFontSize(7.5); doc.setFont('helvetica', 'normal');
    doc.text(k.label.toUpperCase(), x + 4, y + 7);
    doc.setTextColor(15, 23, 42); doc.setFontSize(14); doc.setFont('helvetica', 'bold');
    doc.text(String(k.value), x + 4, y + 16);
  });
  y += 30;

  // Visualisasi (screenshot grafik di halaman)
  for (const el of charts.filter(Boolean)) {
    const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
    const w = W - 2 * M;
    const h = (canvas.height * w) / canvas.width;
    if (y + h > H - 16) { doc.addPage(); y = M; }
    doc.addImage(canvas.toDataURL('image/png'), 'PNG', M, y, w, h);
    y += h + 6;
  }

  // Tabel data
  if (y > H - 50) { doc.addPage(); y = M; }
  doc.setTextColor(15, 23, 42); doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
  doc.text('Data Detail', M, y + 4);
  autoTable(doc, {
    startY: y + 8,
    margin: { left: M, right: M },
    head: [['Tanggal', 'Judul Konten', 'Jenis', 'Views', 'Likes', 'Komen', 'Shares', 'Saves', 'Repost', 'Foll. Gain', 'ER']],
    body: rows.map((r) => [r.date, r.title, r.content_type || '-', fmtNum(r.views), fmtNum(r.likes), fmtNum(r.comments), fmtNum(r.shares), fmtNum(r.saves), fmtNum(r.reposts), fmtNum(r.followers_gain), fmtPct(r.er)]),
    styles: { fontSize: 7.5, cellPadding: 2, textColor: [30, 41, 59] },
    headStyles: { fillColor: rgb, textColor: 255 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 1: { cellWidth: 44 } },
  });

  const n = doc.getNumberOfPages();
  for (let i = 1; i <= n; i++) {
    doc.setPage(i);
    doc.setFontSize(8); doc.setTextColor(148, 163, 184); doc.setFont('helvetica', 'normal');
    doc.text(`Socialora  ·  ${brand.name}`, M, H - 8);
    doc.text(`Halaman ${i} / ${n}`, W - M, H - 8, { align: 'right' });
  }
  doc.save(filename);
}
