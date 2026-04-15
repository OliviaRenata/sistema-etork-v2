// src/components/layout/AppLayout.tsx

import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import NotificationBell from '../ui/NotificationBell';

// Logo correta (PNG)
import logoImg from '../../assets/logoetork.png';

// Ícones SVG inline
const DashboardIcon = ({ width = 16, height = 16 }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7"/>
    <rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/>
  </svg>
);

const OrdersIcon = ({ width = 16, height = 16 }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 3h18v6H3z"/>
    <path d="M3 9l9 6 9-6"/>
    <path d="M12 15v6"/>
  </svg>
);

const FranchiseesIcon = ({ width = 16, height = 16 }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const FinanceIcon = ({ width = 16, height = 16 }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="1" x2="12" y2="23"/>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
);

const PlusIcon = ({ width = 16, height = 16 }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const MoonIcon = ({ width = 16, height = 16 }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);

const SunIcon = ({ width = 16, height = 16 }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/>
    <line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/>
    <line x1="21" y1="12" x2="23" y2="12"/>
  </svg>
);

const DownloadIcon = ({ width = 16, height = 16 }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

export default function AppLayout() {
  const { profile, franchisee, isAdmin, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isDark = theme === 'dark';

  // Cores do tema
  const colors = {
    bg: isDark ? '#0a0a0a' : '#f5f5f5',
    surface: isDark ? '#111111' : '#ffffff',
    border: isDark ? '#222222' : '#e0e0e0',
    text: isDark ? '#e0e0e0' : '#1a1a1a',
    muted: isDark ? '#888888' : '#666666',
    accent: '#e6b800',
  };

  const navItems = isAdmin
    ? [
        { to: '/admin/dashboard', icon: <DashboardIcon width={16} height={16} />, label: 'Dashboard' },
        { to: '/admin/orders', icon: <OrdersIcon width={16} height={16} />, label: 'Pedidos' },
        { to: '/admin/franchisees', icon: <FranchiseesIcon width={16} height={16} />, label: 'Franqueados' },
        { to: '/admin/financial', icon: <FinanceIcon width={16} height={16} />, label: 'Financeiro' },
        { to: '/admin/downloads', icon: <DownloadIcon width={16} height={16} />, label: 'Downloads' },
      ]
    : [
        { to: '/dashboard', icon: <DashboardIcon width={16} height={16} />, label: 'Dashboard' },
        { to: '/orders', icon: <OrdersIcon width={16} height={16} />, label: 'Meus Pedidos' },
        { to: '/orders/new', icon: <PlusIcon width={16} height={16} />, label: 'Novo Pedido' },
        { to: '/financial', icon: <FinanceIcon width={16} height={16} />, label: 'Financeiro' },
        { to: '/downloads', icon: <DownloadIcon width={16} height={16} />, label: 'Downloads' },
      ];

  async function handleSignOut() {
    await signOut();
    navigate('/login');
  }

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: colors.bg,
      color: colors.text,
      fontFamily: '"Inter", "Helvetica Neue", sans-serif',
    }}>
      {/* Sidebar */}
      <aside style={{
        width: 240,
        background: colors.surface,
        borderRight: `1px solid ${colors.border}`,
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0, left: 0, bottom: 0,
        zIndex: 100,
      }}>
        {/* Logo */}
        <div style={{ padding: '24px 20px 20px', borderBottom: `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10 }}>
          <img src={logoImg} alt="ETORK Brasil" style={{ width: 170, height: 'auto', display: 'block' }} />
          <div style={{ fontSize: 11, color: colors.muted, letterSpacing: 1.5 }}>
            REMAP · CHIP · PERFORMANCE
          </div>
        </div>

        {/* User info */}
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${colors.border}` }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: colors.accent, color: '#000',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, marginBottom: 8,
          }}>
            {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div style={{ fontSize: 12, color: colors.text, fontWeight: 600, lineHeight: 1.3 }}>
            {profile?.full_name}
          </div>
          {franchisee && (
            <div style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>
              {franchisee.company_name}
            </div>
          )}
          <div style={{
            display: 'inline-block', marginTop: 6,
            fontSize: 10, fontWeight: 700, letterSpacing: 1,
            color: isAdmin ? colors.accent : '#4ade80',
            background: isAdmin ? '#1a1500' : '#0a1a0a',
            padding: '2px 8px', borderRadius: 4,
            border: `1px solid ${isAdmin ? '#3a3000' : '#1a3a1a'}`,
          }}>
            {isAdmin ? 'ADMIN' : 'FRANQUEADO'}
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 12px' }}>
          {navItems.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 8,
                marginBottom: 2,
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: 500,
                color: isActive ? colors.accent : colors.muted,
                background: isActive ? 'rgba(230, 184, 0, 0.08)' : 'transparent',
                borderLeft: isActive ? `2px solid ${colors.accent}` : '2px solid transparent',
                transition: 'all 0.15s',
              })}
            >
              <span style={{ fontSize: 14, display: 'flex', alignItems: 'center' }}>{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          style={{
            margin: 12, padding: '10px 12px',
            background: 'transparent', border: `1px solid ${colors.border}`,
            borderRadius: 8, color: colors.muted, cursor: 'pointer',
            fontSize: 12, fontWeight: 500,
            display: 'flex', alignItems: 'center', gap: 8,
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#e74c3c'; e.currentTarget.style.borderColor = '#3a1a1a'; }}
          onMouseLeave={e => { e.currentTarget.style.color = colors.muted; e.currentTarget.style.borderColor = colors.border; }}
        >
          <span>⏻</span> Sair
        </button>
      </aside>

      {/* Main */}
      <main style={{ marginLeft: 240, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Topbar */}
        <header style={{
          height: 56, background: colors.surface, borderBottom: `1px solid ${colors.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
          padding: '0 24px', gap: 16, position: 'sticky', top: 0, zIndex: 50,
        }}>
          <NotificationBell />
          <button
            type="button"
            onClick={toggleTheme}
            style={{
              padding: '8px 10px', borderRadius: 8, border: `1px solid ${colors.border}`,
              background: 'transparent', color: colors.text, display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}
          >
            {isDark ? <SunIcon width={16} height={16} /> : <MoonIcon width={16} height={16} />}
            {isDark ? 'Claro' : 'Escuro'}
          </button>
          <div style={{ width: 1, height: 20, background: colors.border }} />
          <div style={{ fontSize: 12, color: colors.muted }}>
            {new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
          </div>
        </header>

        {/* Content */}
        <div style={{ flex: 1, padding: 24, background: colors.bg }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}