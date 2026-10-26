import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { init, q } from './db.js';
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

// Health check (always available)
app.get('/health', (_req, res) => res.json({ ok: true, app: 'Socialora', vercel: !!process.env.VERCEL }));
app.get('/api/health', (_req, res) => res.json({ ok: true, app: 'Socialora', vercel: !!process.env.VERCEL }));

// Diagnostic / Test endpoint to verify environment variables and database status
const testHandler = async (_req, res) => {
  const env = {
    DATABASE_URL: !!process.env.DATABASE_URL,
    JWT_SECRET: !!process.env.JWT_SECRET,
    ADMIN_PASSWORD: !!process.env.ADMIN_PASSWORD,
    VERCEL: !!process.env.VERCEL,
  };
  let db = 'unknown';
  let dbError = null;
  try {
    const r = await q('SELECT count(*) FROM users');
    db = `connected (users count: ${r.rows[0].count})`;
  } catch (err) {
    db = 'failed';
    dbError = err.message;
  }
  res.json({
    ok: db !== 'failed' && env.DATABASE_URL && env.JWT_SECRET && env.ADMIN_PASSWORD,
    time: new Date().toISOString(),
    env,
    database: db,
    dbError,
  });
};
app.get('/test', testHandler);
app.get('/api/test', testHandler);

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
  console.error('API Error:', err);
  const msg = err && (err.message || (typeof err === 'string' ? err : 'Terjadi kesalahan di server'));
  res.status(500).json({ error: msg || 'Terjadi kesalahan di server' });
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
