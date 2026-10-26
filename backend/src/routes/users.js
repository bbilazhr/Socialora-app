import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { q, pool } from '../db.js';
import { ah, auth, adminOnly } from '../middleware.js';

const r = Router();
r.use(auth, adminOnly);

const LIST = `
  SELECT u.id, u.name, u.username, u.email, u.role,
    COALESCE(array_agg(ub.brand_id) FILTER (WHERE ub.brand_id IS NOT NULL), '{}') AS brand_ids
  FROM users u LEFT JOIN user_brands ub ON ub.user_id = u.id
`;

r.get('/', ah(async (_req, res) => {
  res.json((await q(`${LIST} GROUP BY u.id ORDER BY u.id`)).rows);
}));

async function setBrands(client, userId, brandIds = []) {
  await client.query('DELETE FROM user_brands WHERE user_id=$1', [userId]);
  for (const b of brandIds) await client.query('INSERT INTO user_brands(user_id, brand_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [userId, Number(b)]);
}

r.post('/', ah(async (req, res) => {
  const { name, username, email, password, brandIds } = req.body;
  if (!name || !username || !email || !password) return res.status(400).json({ error: 'Nama, username, email, dan password wajib diisi' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const hash = await bcrypt.hash(password, 10);
    const u = (await client.query(
      "INSERT INTO users(name, username, email, password_hash, role) VALUES ($1,$2,$3,$4,'User') RETURNING id",
      [name, username.trim(), email.trim(), hash]
    )).rows[0];
    await setBrands(client, u.id, brandIds);
    await client.query('COMMIT');
    res.status(201).json({ id: u.id });
  } catch (e) {
    await client.query('ROLLBACK');
    if (e.code === '23505') return res.status(409).json({ error: 'Username atau email sudah dipakai' });
    throw e;
  } finally { client.release(); }
}));

r.put('/:id', ah(async (req, res) => {
  const id = Number(req.params.id);
  const { name, username, email, password, brandIds } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('UPDATE users SET name=COALESCE($1,name), username=COALESCE($2,username), email=COALESCE($3,email) WHERE id=$4', [name || null, username || null, email || null, id]);
    if (password) await client.query('UPDATE users SET password_hash=$1 WHERE id=$2', [await bcrypt.hash(password, 10), id]);
    if (Array.isArray(brandIds)) await setBrands(client, id, brandIds);
    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (e) {
    await client.query('ROLLBACK');
    if (e.code === '23505') return res.status(409).json({ error: 'Username atau email sudah dipakai' });
    throw e;
  } finally { client.release(); }
}));

r.delete('/:id', ah(async (req, res) => {
  await q('DELETE FROM users WHERE id=$1', [Number(req.params.id)]);
  res.json({ ok: true });
}));

export default r;
