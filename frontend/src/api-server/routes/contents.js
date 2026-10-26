import { Router } from 'express';
import { q, insertRow, updateRow } from '../db.js';
import { ah, auth, brandAccess, canAccess, pick } from '../middleware.js';

const r = Router();
r.use(auth);

const FIELDS = ['date', 'holiday', 'title', 'status', 'platforms', 'format', 'pillar', 'result', 'file_link', 'caption', 'brief', 'reference', 'link_post'];

r.get('/brands/:brandId/contents', brandAccess, ah(async (req, res) => {
  const p = [req.brandId];
  let sql = 'SELECT * FROM contents WHERE brand_id=$1';
  if (req.query.month) { sql += " AND to_char(date,'YYYY-MM')=$2"; p.push(req.query.month); }
  res.json((await q(sql + ' ORDER BY date, id', p)).rows);
}));

r.post('/brands/:brandId/contents', brandAccess, ah(async (req, res) => {
  const data = pick(req.body, FIELDS);
  if (!data.date || !data.title) return res.status(400).json({ error: 'Tanggal dan judul postingan wajib diisi' });
  if (!Array.isArray(data.platforms)) data.platforms = [];
  res.status(201).json(await insertRow('contents', { ...data, brand_id: req.brandId }));
}));

async function guard(req, res) {
  const row = (await q('SELECT brand_id FROM contents WHERE id=$1', [Number(req.params.id)])).rows[0];
  if (!row) { res.status(404).json({ error: 'Konten tidak ditemukan' }); return false; }
  if (!(await canAccess(req.user, row.brand_id))) { res.status(403).json({ error: 'Tidak punya akses' }); return false; }
  return true;
}

r.put('/contents/:id', ah(async (req, res) => {
  if (!(await guard(req, res))) return;
  const data = pick(req.body, FIELDS);
  if (data.platforms && !Array.isArray(data.platforms)) data.platforms = [];
  res.json(await updateRow('contents', Number(req.params.id), data));
}));

r.delete('/contents/:id', ah(async (req, res) => {
  if (!(await guard(req, res))) return;
  await q('DELETE FROM contents WHERE id=$1', [Number(req.params.id)]);
  res.json({ ok: true });
}));

export default r;
