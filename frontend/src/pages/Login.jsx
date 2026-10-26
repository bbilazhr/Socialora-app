import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, KeyRound, Lock, Mail, ShieldCheck } from 'lucide-react';
import { useAuth } from '../AuthContext.jsx';
import { ROLE_ADMIN, ROLE_USER } from '../constants.js';
import { Logo } from '../components/ui.jsx';

export default function Login() {
  const { user, login } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState(ROLE_ADMIN); // tab "Asisten" = Admin, tab "SPV" = User
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      await login({ mode, identifier, password, remember });
      nav('/dashboard');
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
    }
  };

  const switchTab = (m) => { setMode(m); setErr(''); setPassword(''); };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={submit}>
        <div className="login-logo">
          <Logo size={46} />
          <h1 className="sr-only">Socialora</h1>
        </div>
        <p className="muted">Masuk untuk mengakses workspace konten</p>

        <div className="seg">
          <button type="button" className={mode === ROLE_ADMIN ? 'on' : ''} onClick={() => switchTab(ROLE_ADMIN)}><KeyRound size={15} /> Admin</button>
          <button type="button" className={mode === ROLE_USER ? 'on' : ''} onClick={() => switchTab(ROLE_USER)}><ShieldCheck size={15} /> User</button>
        </div>

        {mode === ROLE_ADMIN ? (
          <div className="lock-icon"><Lock size={22} /><p>Masukkan password untuk membuka akses</p></div>
        ) : (
          <label className="field">
            <span>Username atau Email</span>
            <div className="input-icon"><Mail size={16} />
              <input autoFocus value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="Masukkan username atau email" />
            </div>
          </label>
        )}

        <label className="field">
          <span>Password</span>
          <div className="input-icon"><Lock size={16} />
            <input type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Masukkan password" />
            <button type="button" className="eye" onClick={() => setShow(!show)} aria-label="Tampilkan password">{show ? <EyeOff size={16} /> : <Eye size={16} />}</button>
          </div>
        </label>

        {mode === ROLE_USER && (
          <label className="check"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Ingat saya</label>
        )}
        {err && <div className="alert">{err}</div>}
        <button className="btn-login" disabled={busy}>{busy ? 'Memproses…' : mode === ROLE_ADMIN ? 'Buka Akses' : 'Masuk'}</button>

        <div style={{ textAlign: 'center', fontSize: '13px', color: 'var(--muted)', marginTop: '4px' }}>
          Belum punya akun?{' '}
          <Link to="/register" style={{ color: '#fe3f51', fontWeight: 600 }}>
            Daftar sekarang
          </Link>
        </div>
      </form>
      <p className="login-foot">© 2026 Socialora</p>
    </div>
  );
}
