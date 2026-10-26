import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { AtSign, Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import { useAuth } from '../AuthContext.jsx';
import { Logo } from '../components/ui.jsx';

export default function Register() {
  const { user, register } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setErr('');

    if (!name.trim()) return setErr('Nama lengkap wajib diisi');
    if (!username.trim()) return setErr('Username wajib diisi');
    if (!email.trim()) return setErr('Email wajib diisi');
    if (password.length < 6) return setErr('Password minimal 6 karakter');
    if (password !== confirmPassword) return setErr('Konfirmasi password tidak sesuai');

    setBusy(true);
    try {
      await register({
        name: name.trim(),
        username: username.trim(),
        email: email.trim(),
        password,
      });
      nav('/dashboard');
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={submit}>
        <div className="login-logo"><Logo size={56} /></div>
        <h1>Daftar Akun</h1>
        <p className="muted">Buat akun Socialora baru untuk mulai mengelola konten</p>

        <label className="field">
          <span>Nama Lengkap</span>
          <div className="input-icon">
            <User size={16} />
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Sarah Salsabila"
              required
            />
          </div>
        </label>

        <label className="field">
          <span>Username</span>
          <div className="input-icon">
            <AtSign size={16} />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
              placeholder="Contoh: sarahsalsabila"
              autoCapitalize="none"
              required
            />
          </div>
          <small className="muted" style={{ fontSize: '11px', marginTop: '-2px' }}>
            Hanya huruf, angka, titik, atau garis bawah
          </small>
        </label>

        <label className="field">
          <span>Email</span>
          <div className="input-icon">
            <Mail size={16} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              required
            />
          </div>
        </label>

        <label className="field">
          <span>Password</span>
          <div className="input-icon">
            <Lock size={16} />
            <input
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              required
            />
            <button
              type="button"
              className="eye"
              onClick={() => setShowPass(!showPass)}
              aria-label="Tampilkan password"
            >
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </label>

        <label className="field">
          <span>Konfirmasi Password</span>
          <div className="input-icon">
            <Lock size={16} />
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ulangi password di atas"
              required
            />
            <button
              type="button"
              className="eye"
              onClick={() => setShowConfirm(!showConfirm)}
              aria-label="Tampilkan konfirmasi password"
            >
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </label>

        {err && <div className="alert">{err}</div>}

        <button className="btn-login" disabled={busy}>
          {busy ? 'Mendaftarkan…' : 'Daftar Sekarang'}
        </button>

        <div style={{ textAlign: 'center', fontSize: '13px', color: 'var(--muted)', marginTop: '4px' }}>
          Sudah punya akun?{' '}
          <Link to="/login" style={{ color: '#7c1fe0', fontWeight: 600 }}>
            Masuk di sini
          </Link>
        </div>
      </form>
      <p className="login-foot">© 2026 Socialora</p>
    </div>
  );
}
