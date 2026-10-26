import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { init } from './db.js';
import authRoutes from './routes/auth.js';
import brandRoutes from './routes/brands.js';
import userRoutes from './routes/users.js';
import contentRoutes from './routes/contents.js';
import insightRoutes from './routes/insights.js';

for (const k of ['DATABASE_URL', 'JWT_SECRET', 'ADMIN_PASSWORD']) {
  if (!process.env[k]) { console.error(`Environment variable ${k} belum diisi (lihat .env.example)`); process.exit(1); }
}

const app = express();
const configuredOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (configuredOrigins.includes(origin) || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    callback(new Error('Akses diblokir oleh CORS: ' + origin));
  },
  credentials: true,
}));
app.use(express.json({ limit: '5mb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true, app: 'Socialora' }));
app.use('/api/auth', authRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/users', userRoutes);
app.use('/api', contentRoutes);
app.use('/api', insightRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Terjadi kesalahan di server' });
});

const port = process.env.PORT || 4000;
init()
  .then(() => app.listen(port, () => console.log(`Socialora API berjalan di port ${port}`)))
  .catch((e) => { console.error('Gagal terhubung/inisialisasi database:', e.message); process.exit(1); });
