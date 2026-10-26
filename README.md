# Socialora

Web fullstack untuk social media specialist / digital marketing.
**Frontend:** React + Vite (JavaScript, tanpa TypeScript) · **Backend:** Node.js + Express · **Database:** PostgreSQL.

```
socialora/
├── backend/    API (Express + PostgreSQL)
└── frontend/   Web (React + Vite)
```

## 1. Database (rekomendasi: Supabase)
Buat project gratis di https://supabase.com → Project Settings → Database → salin **Connection string (URI)**.
(Alternatif: Neon https://neon.tech). Tabel dibuat otomatis saat backend pertama kali jalan — tidak perlu import SQL.

## 2. Jalankan backend
```
cd backend
cp .env.example .env     # isi DATABASE_URL, JWT_SECRET, ADMIN_PASSWORD
npm install
npm run dev              # http://localhost:4000
```

## 3. Jalankan frontend
```
cd frontend
cp .env.example .env     # VITE_API_URL=http://localhost:4000/api
npm install
npm run dev              # http://localhost:5173
```

## Login & Sign Up
- Tab **Asisten** → role `Admin`, cukup password (= `ADMIN_PASSWORD` di backend/.env).
- Tab **SPV** → role `User`, username/email + password.
- **Sign Up / Daftar Akun**: User baru bisa mendaftar mandiri via menu/halaman `/register` (atau dibuatkan langsung oleh Admin di menu Kelola User).

Alur: User mendaftar akun → Admin membuat brand dan mencentang brand yang di-ACC untuk user tersebut di menu Kelola User.
User hanya melihat/mengisi brand yang di-ACC, dan bisa pindah brand lewat dropdown di sidebar.

## Deploy
- Frontend → Vercel (root `frontend`, env `VITE_API_URL=https://<url-backend>/api`)
- Backend → Render / Railway (root `backend`, start `npm start`, isi env seperti .env.example,
  `CLIENT_ORIGIN` = URL frontend)

## Mengubah isi dropdown
Status, Platform, Format, dan Content Pillar ada di `frontend/src/constants.js`.
