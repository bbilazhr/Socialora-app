import jwt from 'jsonwebtoken';
import { q } from './db.js';

export const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export function auth(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Sesi berakhir, silakan login ulang' });
  }
}

export function adminOnly(req, res, next) {
  if (req.user.role === 'Admin') return next();
  res.status(403).json({ error: 'Hanya Admin yang boleh melakukan ini' });
}

// Admin: semua brand. User: hanya brand yang sudah di-ACC Admin.
export async function canAccess(user, brandId) {
  if (user.role === 'Admin') return true;
  const r = await q('SELECT 1 FROM user_brands WHERE user_id=$1 AND brand_id=$2', [user.id, brandId]);
  return r.rowCount > 0;
}

export const brandAccess = ah(async (req, res, next) => {
  const brandId = Number(req.params.brandId);
  if (!brandId || !(await canAccess(req.user, brandId)))
    return res.status(403).json({ error: 'Kamu tidak punya akses ke brand ini' });
  req.brandId = brandId;
  next();
});

export function pick(body, fields) {
  const o = {};
  for (const f of fields) if (body[f] !== undefined) o[f] = body[f] === '' ? null : body[f];
  return o;
}
