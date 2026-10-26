import { Router } from 'express';
import { q, insertRow, updateRow } from '../db.js';
import { ah, auth, adminOnly, pick } from '../middleware.js';

const r = Router();
r.use(auth);

r.get('/', ah(async (req, res) => {
  const rows = req.user.role === 'Admin'
    ? (await q('SELECT * FROM brands ORDER BY name')).rows
    : (await q('SELECT b.* FROM brands b JOIN user_brands ub ON ub.brand_id=b.id WHERE ub.user_id=$1 ORDER BY b.name', [req.user.id])).rows;
  res.json(rows);
}));

r.post('/', adminOnly, ah(async (req, res) => {
  const data = pick(req.body, ['name', 'color', 'logo']);
  if (!data.name) return res.status(400).json({ error: 'Nama brand wajib diisi' });
  res.status(201).json(await insertRow('brands', data));
}));

r.put('/:id', adminOnly, ah(async (req, res) => {
  const row = await updateRow('brands', Number(req.params.id), pick(req.body, ['name', 'color', 'logo']));
  if (!row) return res.status(404).json({ error: 'Brand tidak ditemukan' });
  res.json(row);
}));

r.delete('/:id', adminOnly, ah(async (req, res) => {
  await q('DELETE FROM brands WHERE id=$1', [Number(req.params.id)]);
  res.json({ ok: true });
}));

export default r;
