// Peran ditulis sebagai teks asli ("Admin" / "User") — sama persis dengan yang tersimpan di database.
export const ROLE_ADMIN = 'Admin';
export const ROLE_USER = 'User';

// Edit daftar di bawah ini kalau dropdown di spreadsheet kamu punya pilihan lain.
export const STATUSES = [
  { key: 'On Brief', color: '#f59e0b' },
  { key: 'On Progress', color: '#3b82f6' },
  { key: 'Review', color: '#8b5cf6' },
  { key: 'Scheduled', color: '#06b6d4' },
  { key: 'Published', color: '#10b981' },
];
export const statusColor = (s) => STATUSES.find((x) => x.key === s)?.color || '#94a3b8';

export const PLATFORMS = [
  { key: 'Instagram', short: 'IG', color: '#e1306c' },
  { key: 'Tiktok', short: 'TikTok', color: '#0f172a' },
  { key: 'Youtube', short: 'YT', color: '#ef4444' },
  { key: 'Website', short: 'Web', color: '#0ea5e9' },
];
export const FORMATS = ['Single Post', 'Carousel', 'Video'];
export const PILLARS = ['Interaction', 'Promotion', 'Trend', 'Education', 'UGC'];

export const CONTENT_TYPES = {
  Instagram: ['Feeds', 'Reels', 'Story'],
  Tiktok: ['Video'],
  Youtube: ['Video', 'Shorts'],
  Website: ['Artikel', 'Landing Page'],
};

// Kolom Content Database — sama persis dengan spreadsheet (judul + keterangan baris ke-2)
export const COLUMNS = [
  { key: 'no', label: 'NO', desc: '' },
  { key: 'date', label: 'Date', desc: 'Tanggal Posting Content' },
  { key: 'days', label: 'Days', desc: '' },
  { key: 'holiday', label: 'Holidays', desc: 'Hari Besar/Hari Nasional' },
  { key: 'title', label: 'Post Title', desc: 'Judul Postingan' },
  { key: 'status', label: 'Status', desc: 'Status Content' },
  { key: 'platforms', label: 'Platform', desc: 'Content nya diposting dimana' },
  { key: 'format', label: 'Format', desc: 'Format Content' },
  { key: 'pillar', label: 'Content Pillar', desc: 'Tujuan dan Jenis Content' },
  { key: 'result', label: 'Content', desc: 'Hasil Content' },
  { key: 'file_link', label: 'File Content', desc: '' },
  { key: 'caption', label: 'Caption', desc: 'Caption Content' },
  { key: 'brief', label: 'Brief', desc: 'Panduan yang digunakan untuk membuat kontent' },
  { key: 'reference', label: 'Referensi', desc: 'Link referensi yang akan dibuat' },
  { key: 'link_post', label: 'Link Post', desc: 'Link konten yang sudah dipublish' },
];
