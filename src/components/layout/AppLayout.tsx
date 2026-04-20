// src/components/layout/AppLayout.tsx

import { useState, useEffect } from 'react';
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

const ExternalLinkIcon = ({ width = 14, height = 14 }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 3h7v7"/>
    <path d="M10 14L21 3"/>
    <path d="M21 14v7H3V3h7"/>
  </svg>
);

const WhatsAppIcon = ({ width = 14, height = 14 }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 11.5A8.5 8.5 0 0 1 7.5 19L3 20l1.1-4.1A8.5 8.5 0 1 1 20 11.5Z"/>
    <path d="M9.7 8.9c-.2-.4-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.4-.2.3-.9.9-.9 2.2s.9 2.5 1 2.7c.1.2 1.8 2.9 4.4 3.9 2.2.8 2.6.6 3.1.6.5-.1 1.6-.7 1.8-1.3.2-.6.2-1.1.1-1.2-.1-.1-.4-.2-.9-.4-.5-.2-1.2-.6-1.4-.6-.2-.1-.4-.1-.6.2-.2.3-.7.8-.8.9-.2.2-.3.2-.6.1-.4-.2-1.5-.6-2.8-1.9-1.1-1-1.8-2.2-2-2.6-.2-.4 0-.5.1-.7.1-.1.2-.3.3-.4.1-.1.2-.3.2-.5.1-.2 0-.3 0-.4 0-.1-.5-1.2-.7-1.7Z"/>
  </svg>
);

export default function AppLayout() {
  const { profile, franchisee, isAdmin, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [isMobile, setIsMobile] = useState(false);

  // Atualizar data/hora a cada segundo
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < 960;
      setIsMobile(mobile);
      if (!mobile) {
        setSidebarOpen(false);
      }
    };

    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const isDark = theme === 'dark';
  const isFranchiseeBlocked = !isAdmin && !!franchisee && franchisee.active === false;

  // Cores do tema
  const colors = {
    bg: isDark ? '#0a0a0a' : '#f5f5f5',
    surface: isDark ? '#111111' : '#ffffff',
    sidebar: isDark ? '#111111' : 'rgb(245, 245, 245)',
    topbar: isDark ? '#111111' : 'rgb(245, 245, 245)',
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
    : isFranchiseeBlocked
      ? [
          { to: '/dashboard', icon: <DashboardIcon width={16} height={16} />, label: 'Dashboard' },
          { to: '/financial', icon: <FinanceIcon width={16} height={16} />, label: 'Financeiro / Extratos' },
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
        background: colors.sidebar,
        borderRight: `1px solid ${colors.border}`,
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0, left: 0, bottom: 0,
        zIndex: 120,
        transform: isMobile ? (sidebarOpen ? 'translateX(0)' : 'translateX(-102%)') : 'translateX(0)',
        transition: 'transform 0.2s ease',
        boxShadow: isMobile ? '0 10px 40px rgba(0,0,0,0.35)' : 'none',
      }}>
        {/* Logo */}
        <div style={{ padding: '24px 20px 20px', borderBottom: `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ background: '#000', padding: '12px', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 170, height: 'auto' }}>
            <img src={logoImg} alt="ETORK Brasil" style={{ width: 150, height: 'auto', display: 'block' }} />
          </div>
          <div style={{ fontSize: 9, color: '#c0c0c0', letterSpacing: 1.2 }}>
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
            color: isAdmin ? colors.accent : '#e6b800',
            background: isAdmin ? '#1a1500' : (isDark ? '#1a1500' : '#ffffff'),
            padding: '2px 8px', borderRadius: 4,
            border: `1px solid ${isAdmin ? '#3a3000' : (isDark ? '#1a3a1a' : '#dddddd')}`,
          }}>
            {isAdmin ? 'ADMIN' : 'FRANQUEADO'}
          </div>
          {!isAdmin && isFranchiseeBlocked && (
            <div style={{ marginTop: 8, fontSize: 11, color: '#e6b800', fontWeight: 600 }}>
              Acesso bloqueado para pedidos
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 12px' }}>
          {navItems.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => {
                if (isMobile) setSidebarOpen(false);
              }}
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

          <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${colors.border}` }}>
            <a
              href="https://www.etorkbrasil.com.br/"
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 8,
                marginBottom: 6,
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: 500,
                color: colors.muted,
                border: `1px solid ${colors.border}`,
                background: 'transparent',
              }}
            >
              <ExternalLinkIcon width={14} height={14} />
              Ir para o site
            </a>

            <a
              href="https://wa.me/5567998711313"
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 8,
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: 600,
                color: '#e6b800',
                border: `1px solid ${isDark ? '#3a3000' : '#d4c176'}`,
                background: isDark ? '#1a1500' : '#fff8d6',
              }}
            >
              <WhatsAppIcon width={14} height={14} />
              Suporte
            </a>
          </div>
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
          onMouseEnter={e => { e.currentTarget.style.color = '#e6b800'; e.currentTarget.style.borderColor = '#3a1a1a'; }}
          onMouseLeave={e => { e.currentTarget.style.color = colors.muted; e.currentTarget.style.borderColor = colors.border; }}
        >
          <span>⏻</span> Sair
        </button>
      </aside>

      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.45)',
            zIndex: 110,
          }}
        />
      )}

      {/* Main */}
      <main style={{ marginLeft: isMobile ? 0 : 240, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Topbar */}
        <header style={{
          height: 56, background: colors.topbar, borderBottom: `1px solid ${colors.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: isMobile ? '0 12px' : '0 24px', gap: 12, position: 'sticky', top: 0, zIndex: 50,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isMobile && (
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  border: `1px solid ${colors.border}`,
                  background: 'transparent',
                  color: colors.text,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
                aria-label="Abrir menu"
              >
                ☰
              </button>
            )}
            {isMobile && (
              <div style={{ fontSize: 12, color: colors.muted, fontWeight: 600 }}>
                {currentDateTime.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
              {!isMobile && (isDark ? 'Claro' : 'Escuro')}
            </button>
            {!isMobile && <div style={{ width: 1, height: 20, background: colors.border }} />}
            {!isMobile && (
              <div style={{ fontSize: 12, color: colors.muted, display: 'flex', alignItems: 'center', gap: 12 }}>
                <span>
                  {currentDateTime.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
                </span>
                <span>
                  {currentDateTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            )}
          </div>
        </header>

        {/* Content */}
        <div style={{ flex: 1, padding: isMobile ? 14 : 24, background: colors.bg }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}