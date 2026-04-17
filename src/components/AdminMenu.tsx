// src/components/AdminMenu.tsx
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function AdminMenu() {
  const { isAdmin } = useAuth();
  const location = useLocation();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  if (!isAdmin) return null;

  const colors = {
    background: isDark ? '#141414' : '#ffffff',
    text: isDark ? '#e5e5e5' : '#1a1a1a',
    textSecondary: isDark ? '#888888' : '#6b7280',
    border: isDark ? '#222222' : '#e5e7eb',
    accent: '#e6b800',
  };

  const menuItems = [
    { path: '/admin', label: 'Dashboard', icon: '📊' },
    { path: '/admin/orders', label: 'Pedidos', icon: '📦' },
    { path: '/admin/franchisees', label: 'Franqueados', icon: '👥' },
    { path: '/admin/downloads', label: 'Downloads', icon: '📁' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div style={{ 
      background: colors.background, 
      borderBottom: `1px solid ${colors.border}`,
      padding: '0 24px',
      marginBottom: 24
    }}>
      <div style={{ display: 'flex', gap: 32, overflowX: 'auto' }}>
        {menuItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 0',
              color: isActive(item.path) ? colors.accent : colors.textSecondary,
              textDecoration: 'none',
              fontSize: 13,
              fontWeight: 600,
              borderBottom: isActive(item.path) ? `2px solid ${colors.accent}` : 'none',
              transition: 'all 0.2s'
            }}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}