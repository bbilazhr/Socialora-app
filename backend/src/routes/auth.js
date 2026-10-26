import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { q } from '../db.js';
import { ah, auth } from '../middleware.js';

const r = Router();

function safeEq(a = '', b = '') {
  const x = crypto.createHash('sha256').update(String(a)).digest();
  const y = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(x, y);
}

// mode: 'Admin' (tab Asisten, hanya password) | 'User' (tab SPV, username/email + password)
r.post('/login', ah(async (req, res) => {
  const { mode, identifier, password, remember } = req.body || {};
  let user;
  if (mode === 'Admin') {
    if (!process.env.ADMIN_PASSWORD || !safeEq(password, process.env.ADMIN_PASSWORD))
      return res.status(401).json({ error: 'Password salah' });
    user = { id: 0, name: 'Admin', role: 'Admin' };
  } else if (mode === 'User') {
    const u = (await q('SELECT * FROM users WHERE lower(username)=lower($1) OR lower(email)=lower($1)', [identifier || ''])).rows[0];
    if (!u || !(await bcrypt.compare(password || '', u.password_hash)))
      return res.status(401).json({ error: 'Username/email atau password salah' });
    user = { id: u.id, name: u.name, role: u.role };
  } else return res.status(400).json({ error: 'Mode login tidak valid' });

  const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: remember ? '30d' : '1d' });
  res.json({ token, user });
}));

// Pendaftaran akun User baru (Sign Up)
r.post('/register', ah(async (req, res) => {
  let { name, username, email, password } = req.body || {};
  name = (name || '').trim();
  username = (username || '').trim().toLowerCase();
  email = (email || '').trim().toLowerCase();
  password = (password || '');

  if (!name || !username || !email || !password) {
    return res.status(400).json({ error: 'Nama, username, email, dan password wajib diisi' });
  }

  if (name.length < 2) {
    return res.status(400).json({ error: 'Nama lengkap minimal 2 karakter' });
  }

  const usernameRegex = /^[a-z0-9_.-]{3,30}$/;
  if (!usernameRegex.test(username)) {
    return res.status(400).json({ error: 'Username harus 3-30 karakter (hanya huruf, angka, titik, atau garis bawah)' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Format email tidak valid' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password minimal 6 karakter' });
  }

  // Cek apakah username atau email sudah terdaftar
  const existing = await q(
    'SELECT username, email FROM users WHERE lower(username) = lower($1) OR lower(email) = lower($2)',
    [username, email]
  );
  if (existing.rowCount > 0) {
    const row = existing.rows[0];
    if (row.username.toLowerCase() === username) {
      return res.status(409).json({ error: 'Username sudah digunakan, silakan pilih username lain' });
    }
    return res.status(409).json({ error: 'Email sudah terdaftar, silakan gunakan email lain atau langsung login' });
  }

  const hash = await bcrypt.hash(password, 10);
  const insertResult = await q(
    "INSERT INTO users (name, username, email, password_hash, role) VALUES ($1, $2, $3, $4, 'User') RETURNING id, name, username, email, role",
    [name, username, email, hash]
  );
  const newUser = insertResult.rows[0];

  const user = { id: newUser.id, name: newUser.name, role: newUser.role };
  const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '1d' });

  res.status(201).json({
    message: 'Pendaftaran akun berhasil',
    token,
    user
  });
}));

// Alias untuk /signup
r.post('/signup', (req, res, next) => {
  req.url = '/register';
  r.handle(req, res, next);
});

r.get('/me', auth, (req, res) => {
  const { id, name, role } = req.user;
  res.json({ user: { id, name, role } });
});

export default r;
