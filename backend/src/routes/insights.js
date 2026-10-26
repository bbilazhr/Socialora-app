import { Router } from 'express';
import { q, insertRow, updateRow } from '../db.js';
import { ah, auth, brandAccess, canAccess, pick } from '../middleware.js';

const r = Router();
r.use(auth);

const FIELDS = ['platform', 'date', 'title', 'content_type', 'likes', 'comments', 'shares', 'views', 'reposts', 'saves', 'followers_gain', 'link'];
const NUMS = ['likes', 'comments', 'shares', 'views', 'reposts', 'saves', 'followers_gain'];
const PLATFORMS = ['Instagram', 'Tiktok', 'Youtube', 'Website'];

function clean(body) {
  const d = pick(body, FIELDS);
  for (const n of NUMS) if (n in d) d[n] = Math.round(Number(d[n]) || 0);
  return d;
}

r.get('/brands/:brandId/insights', brandAccess, ah(async (req, res) => {
  const p = [req.brandId];
  let sql = 'SELECT * FROM insights WHERE brand_id=$1';
  if (req.query.platform) { p.push(req.query.platform); sql += ` AND platform=$${p.length}`; }
  res.json((await q(sql + ' ORDER BY date, id', p)).rows);
}));

r.post('/brands/:brandId/insights', brandAccess, ah(async (req, res) => {
  const d = clean(req.body);
  if (!PLATFORMS.includes(d.platform) || !d.date || !d.title) return res.status(400).json({ error: 'Platform, tanggal, dan judul konten wajib diisi' });
  res.status(201).json(await insertRow('insights', { ...d, brand_id: req.brandId }));
}));

async function guard(req, res) {
  const row = (await q('SELECT brand_id FROM insights WHERE id=$1', [Number(req.params.id)])).rows[0];
  if (!row) { res.status(404).json({ error: 'Data tidak ditemukan' }); return false; }
  if (!(await canAccess(req.user, row.brand_id))) { res.status(403).json({ error: 'Tidak punya akses' }); return false; }
  return true;
}

r.put('/insights/:id', ah(async (req, res) => {
  if (!(await guard(req, res))) return;
  res.json(await updateRow('insights', Number(req.params.id), clean(req.body)));
}));

r.delete('/insights/:id', ah(async (req, res) => {
  if (!(await guard(req, res))) return;
  await q('DELETE FROM insights WHERE id=$1', [Number(req.params.id)]);
  res.json({ ok: true });
}));

export default r;
