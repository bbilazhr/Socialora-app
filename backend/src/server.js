import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { init } from './db.js';
import authRoutes from './routes/auth.js';
import brandRoutes from './routes/brands.js';
import userRoutes from './routes/users.js';
import contentRoutes from './routes/contents.js';
import insightRoutes from './routes/insights.js';

const app = express();

const configuredOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      configuredOrigins.includes(origin) ||
      /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ||
      origin.endsWith('.vercel.app')
    ) {
      return callback(null, true);
    }
    callback(null, true);
  },
  credentials: true,
}));

app.use(express.json({ limit: '5mb' }));

// Lazy DB initialization helper
let initPromise = null;
export function ensureInit() {
  if (!initPromise) {
    initPromise = init().catch((e) => {
      console.error('Gagal inisialisasi database:', e.message);
      initPromise = null;
      throw e;
    });
  }
  return initPromise;
}

// Health check (always available)
app.get('/health', (_req, res) => res.json({ ok: true, app: 'Socialora', vercel: !!process.env.VERCEL }));
app.get('/api/health', (_req, res) => res.json({ ok: true, app: 'Socialora', vercel: !!process.env.VERCEL }));

// Middleware to check required env variables and ensure DB is ready
app.use(async (_req, res, next) => {
  for (const k of ['DATABASE_URL', 'JWT_SECRET', 'ADMIN_PASSWORD']) {
    if (!process.env[k]) {
      return res.status(500).json({
        error: `Environment variable ${k} belum diatur di Vercel (buka Settings > Environment Variables di Vercel).`,
      });
    }
  }
  try {
    await ensureInit();
    next();
  } catch (err) {
    return res.status(500).json({ error: 'Gagal terhubung ke database: ' + err.message });
  }
});

// Routes (support both with /api and without /api)
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);

app.use('/api/brands', brandRoutes);
app.use('/brands', brandRoutes);

app.use('/api/users', userRoutes);
app.use('/users', userRoutes);

app.use('/api', contentRoutes);
app.use('/', contentRoutes);

app.use('/api', insightRoutes);
app.use('/', insightRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Terjadi kesalahan di server' });
});

// Run standalone server when not in Vercel Serverless
if (!process.env.VERCEL) {
  const port = process.env.PORT || 4000;
  ensureInit()
    .then(() => app.listen(port, () => console.log(`Socialora API berjalan di port ${port}`)))
    .catch((e) => {
      console.error('Gagal terhubung/inisialisasi database:', e.message);
      process.exit(1);
    });
}

export default app;
