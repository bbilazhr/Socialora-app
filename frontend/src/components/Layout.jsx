import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { BarChart3, CalendarDays, ChevronDown, Database, KanbanSquare, LayoutDashboard, LogOut, Menu, Palette, PieChart, Users } from 'lucide-react';
import { useAuth } from '../AuthContext.jsx';
import { useBrand } from '../BrandContext.jsx';
import { ROLE_ADMIN } from '../constants.js';
import { BrandAvatar, Logo } from './ui.jsx';

const MENU = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/content', label: 'Content Database', icon: Database },
  { to: '/progress', label: 'Progress', icon: KanbanSquare },
];
const INSIGHT = [
  { to: '/insight', label: 'Insight', icon: BarChart3 },
  { to: '/analytics', label: 'Analytics', icon: PieChart },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { brands, brand, setBrandId } = useBrand();
  const [open, setOpen] = useState(false);
  const [side, setSide] = useState(false);
  const nav = useNavigate();

  const link = (m) => (
    <NavLink key={m.to} to={m.to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setSide(false)}>
      <m.icon size={18} /> {m.label}
    </NavLink>
  );

  return (
    <div className="app">
      <button className="mobile-toggle" onClick={() => setSide(!side)} aria-label="Menu"><Menu size={20} /></button>
      <aside className={`sidebar ${side ? 'open' : ''}`}>
        <div className="side-top">
          <div className="logo-row"><Logo size={28} /></div>
          <p className="welcome">Welcome, <b>{user.name}</b> · <span className="role-pill">{user.role}</span></p>

          <div className="brand-switch">
            <button className="brand-btn" onClick={() => setOpen(!open)}>
              {brand ? <BrandAvatar brand={brand} size={22} /> : null}
              <span className="brand-btn-name">{brand ? brand.name : 'Belum ada brand'}</span>
              <ChevronDown size={16} />
            </button>
            {open && (
              <div className="brand-menu">
                {brands.map((b) => (
                  <button key={b.id} className={b.id === brand?.id ? 'on' : ''} onClick={() => { setBrandId(b.id); setOpen(false); }}>
                    <BrandAvatar brand={b} size={22} /> {b.name}
                  </button>
                ))}
                {!brands.length && <em>Belum ada brand</em>}
              </div>
            )}
          </div>

          <div className="menu-title">Menu Utama</div>
          {MENU.map(link)}
          <div className="menu-title">Insight</div>
          {INSIGHT.map(link)}
          {user.role === ROLE_ADMIN && (
            <>
              <div className="menu-title">Admin</div>
              {link({ to: '/admin/brands', label: 'Kelola Brand', icon: Palette })}
              {link({ to: '/admin/users', label: 'Kelola User', icon: Users })}
            </>
          )}
        </div>
        <button className="nav-link logout" onClick={() => { logout(); nav('/login'); }}>
          <LogOut size={18} /> Keluar
        </button>
      </aside>
      <main className="main"><Outlet /></main>
    </div>
  );
}
