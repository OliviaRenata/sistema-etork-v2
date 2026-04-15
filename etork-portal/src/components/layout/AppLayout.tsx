// src/components/layout/AppLayout.tsx
import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import NotificationBell from '../ui/NotificationBell';
import { DashboardIcon, OrdersIcon, FranchiseesIcon, FinanceIcon, PlusIcon, MoonIcon, SunIcon } from '../ui/Icons';

export default function AppLayout() {
  const { profile, franchisee, isAdmin, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = isAdmin
    ? [
        { to: '/admin',              icon: <DashboardIcon width={16} height={16} />, label: 'Dashboard' },
        { to: '/admin/orders',       icon: <OrdersIcon width={16} height={16} />, label: 'Pedidos' },
        { to: '/admin/franchisees',  icon: <FranchiseesIcon width={16} height={16} />, label: 'Franqueados' },
        { to: '/admin/financial',    icon: <FinanceIcon width={16} height={16} />, label: 'Financeiro' },
      ]
    : [
        { to: '/dashboard',  icon: <DashboardIcon width={16} height={16} />, label: 'Dashboard' },
        { to: '/orders',     icon: <OrdersIcon width={16} height={16} />, label: 'Meus Pedidos' },
        { to: '/orders/new', icon: <PlusIcon width={16} height={16} />, label: 'Novo Pedido' },
        { to: '/financial',  icon: <FinanceIcon width={16} height={16} />, label: 'Financeiro' },
      ];

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: 'var(--bg)',
      color: 'var(--text)',
      fontFamily: '"Inter", "Helvetica Neue", sans-serif',
    }}>
      {/* Sidebar */}
      <aside style={{
        width: 240,
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0, left: 0, bottom: 0,
        zIndex: 100,
        transform: sidebarOpen ? 'translateX(0)' : undefined,
      }}>
        {/* Logo */}
        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid #222' }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px', lineHeight: 1.1 }}>
            ETORK
          </div>
          <div style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 700, letterSpacing: 3, marginTop: 2 }}>
            BRASIL
          </div>
          <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 6, letterSpacing: 1.5 }}>
            REMAP · CHIP · PERFORMANCE
          </div>
        </div>

        {/* User info */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #1a1a1a' }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: '#e6b800', color: '#000',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, marginBottom: 8,
          }}>
            {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div style={{ fontSize: 12, color: '#fff', fontWeight: 600, lineHeight: 1.3 }}>
            {profile?.full_name}
          </div>
          {franchisee && (
            <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
              {franchisee.company_name}
            </div>
          )}
          <div style={{
            display: 'inline-block', marginTop: 6,
            fontSize: 10, fontWeight: 700, letterSpacing: 1,
            color: isAdmin ? 'var(--accent)' : '#4ade80',
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
              end={to === '/admin' || to === '/dashboard'}
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
                color: isActive ? 'var(--accent)' : 'var(--muted)',
                background: isActive ? 'rgba(230, 214, 0, 0.08)' : 'transparent',
                borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                transition: 'all 0.15s',
              })}
            >
              <span style={{ fontSize: 14 }}>{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          style={{
            margin: 12, padding: '10px 12px',
            background: 'transparent', border: '1px solid var(--border)',
            borderRadius: 8, color: 'var(--muted)', cursor: 'pointer',
            fontSize: 12, fontWeight: 500,
            display: 'flex', alignItems: 'center', gap: 8,
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { (e.target as HTMLElement).style.color = '#e74c3c'; (e.target as HTMLElement).style.borderColor = '#3a1a1a'; }}
          onMouseLeave={e => { (e.target as HTMLElement).style.color = 'var(--muted)'; (e.target as HTMLElement).style.borderColor = 'var(--border)'; }}
        >
          <span>⏻</span> Sair
        </button>
      </aside>

      {/* Main */}
      <main style={{ marginLeft: 240, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Topbar */}
        <header style={{
          height: 56, background: 'var(--surface)', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
          padding: '0 24px', gap: 16, position: 'sticky', top: 0, zIndex: 50,
        }}>
            <NotificationBell />
          <button
            type="button"
            onClick={toggleTheme}
            style={{
              padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)',
              background: 'transparent', color: 'var(--text)', display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: 12, fontWeight: 600,
            }}
          >
            {theme === 'dark' ? <SunIcon width={16} height={16} /> : <MoonIcon width={16} height={16} />}
            {theme === 'dark' ? 'Claro' : 'Escuro'}
          </button>
          <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>
            {new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
          </div>
        </header>

        {/* Content */}
        <div style={{ flex: 1, padding: 24, color: 'var(--text)' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
