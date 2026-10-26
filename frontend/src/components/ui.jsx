import { X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PLATFORMS } from '../constants.js';
import { useBrand } from '../BrandContext.jsx';
import { useAuth } from '../AuthContext.jsx';
import { MONTHS } from '../utils.js';

export function Logo({ size = 36, variant = 'full', className = '', style = {}, ...props }) {
  if (variant === 'mark' || variant === 'icon') {
    return (
      <img
        src="/logo-mark.png"
        alt="Socialora"
        height={size}
        className={`brand-logo-mark ${className}`}
        style={{
          height: `${size}px`,
          width: 'auto',
          objectFit: 'contain',
          display: 'inline-block',
          verticalAlign: 'middle',
          ...style,
        }}
        {...props}
      />
    );
  }
  return (
    <img
      src="/logo.png"
      alt="Socialora"
      height={size}
      className={`brand-logo ${className}`}
      style={{
        height: `${size}px`,
        width: 'auto',
        maxWidth: '100%',
        objectFit: 'contain',
        display: 'inline-block',
        verticalAlign: 'middle',
        ...style,
      }}
      {...props}
    />
  );
}

export function BrandAvatar({ brand, size = 28 }) {
  if (!brand) return null;
  const baseStyle = {
    width: size,
    height: size,
    minWidth: size,
    minHeight: size,
    flexShrink: 0,
    aspectRatio: '1 / 1',
    borderRadius: '50%',
  };
  if (brand.logo) return <img className="avatar" src={brand.logo} alt="" style={baseStyle} />;
  return (
    <span
      className="avatar"
      style={{
        ...baseStyle,
        background: brand.color,
        fontSize: size * 0.45,
      }}
    >
      {brand.name.slice(0, 1).toUpperCase()}
    </span>
  );
}

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="page-head">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <div className="head-actions">{children}</div>
    </div>
  );
}

export function Modal({ title, onClose, children, wide, footer }) {
  return (
    <div className="modal-back" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? 'wide' : ''}`}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Tutup"><X size={18} /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

export function PlatformChips({ list = [] }) {
  return (
    <div className="chips">
      {list.map((p) => {
        const pl = PLATFORMS.find((x) => x.key === p);
        return (
          <span key={p} className="chip" style={{ '--c': pl?.color || '#64748b' }}>
            {pl?.short || p}
          </span>
        );
      })}
    </div>
  );
}

export function PlatformTabs({ value, onChange, withAll }) {
  return (
    <div className="tabs">
      {withAll && <button className={`tab ${value === 'ALL' ? 'active' : ''}`} onClick={() => onChange('ALL')}>Semua</button>}
      {PLATFORMS.map((p) => (
        <button key={p.key} className={`tab ${value === p.key ? 'active' : ''}`} onClick={() => onChange(p.key)}>
          {p.short}
        </button>
      ))}
    </div>
  );
}

export function MonthNav({ y, m, onChange }) {
  const go = (d) => {
    const dt = new Date(y, m + d, 1);
    onChange(dt.getFullYear(), dt.getMonth());
  };
  return (
    <div className="month-nav">
      <button className="icon-btn" onClick={() => go(-1)} aria-label="Bulan sebelumnya">‹</button>
      <strong>{MONTHS[m]} {y}</strong>
      <button className="icon-btn" onClick={() => go(1)} aria-label="Bulan berikutnya">›</button>
    </div>
  );
}

// Dipakai semua halaman yang butuh brand terpilih
export function NeedBrand({ children }) {
  const { brand, loading } = useBrand();
  const { user } = useAuth();
  if (loading) return <div className="empty">Memuat…</div>;
  if (!brand)
    return (
      <div className="empty card">
        <h3>Belum ada brand</h3>
        <p>
          {user?.role === 'Admin'
            ? 'Belum ada brand yang dibuat. Buat brand terlebih dahulu di menu Kelola Brand.'
            : 'Akun kamu belum memiliki brand yang di-ACC. Silakan hubungi Admin untuk memberikan akses ke brand.'}
        </p>
        {user?.role === 'Admin' && <Link className="btn primary" to="/admin/brands">Kelola Brand</Link>}
      </div>
    );
  return children;
}

export function Stat({ icon: Icon, label, value, hint }) {
  return (
    <div className="card stat">
      <div className="stat-icon"><Icon size={18} /></div>
      <span className="stat-label">{label}</span>
      <strong>{value}</strong>
      {hint && <small>{hint}</small>}
    </div>
  );
}
