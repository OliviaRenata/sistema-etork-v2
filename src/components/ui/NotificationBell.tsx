// src/components/ui/NotificationBell.tsx
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import type { Notification } from '../../types';

export default function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadNotifications();

    const channel = supabase.channel('notif-bell')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, payload => {
        setNotifications(prev => [payload.new as Notification, ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  async function loadNotifications() {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(20);
    setNotifications(data || []);
  }

  async function markAllRead() {
    await supabase.from('notifications')
      .update({ read: true })
      .eq('user_id', user!.id).eq('read', false);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }

  const unread = notifications.filter(n => !n.read).length;

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, position: 'relative' }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={open ? '#e6b800' : '#888'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: 0, right: 0,
            width: 16, height: 16, borderRadius: '50%',
            background: '#e6b800', color: '#fff',
            fontSize: 9, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 199 }} onClick={() => setOpen(false)} />
          <div style={{
            position: 'absolute', right: 0, top: 36,
            width: 320, maxHeight: 400, overflowY: 'auto',
            background: '#111', border: '1px solid #222', borderRadius: 10,
            zIndex: 200, boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #1e1e1e', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>Notificações</span>
              {unread > 0 && (
                <button onClick={markAllRead} style={{ background: 'none', border: 'none', color: '#e6b800', fontSize: 11, cursor: 'pointer' }}>
                  Marcar lidas
                </button>
              )}
            </div>
            {notifications.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: '#555', fontSize: 13 }}>Sem notificações</div>
            ) : (
              notifications.map(n => (
                <div key={n.id} style={{
                  padding: '12px 16px', borderBottom: '1px solid #161616',
                  background: n.read ? 'transparent' : '#0d0d0d',
                }}>
                  <div style={{ fontSize: 12, color: n.read ? '#888' : '#fff', fontWeight: n.read ? 400 : 600 }}>{n.title}</div>
                  <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>{n.body}</div>
                  <div style={{ fontSize: 10, color: '#333', marginTop: 4 }}>
                    {new Date(n.created_at).toLocaleString('pt-BR')}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

// src/components/ui/LoadingScreen.tsx (inline export)
export function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh', background: '#0a0a0a',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: '"Inter", sans-serif',
    }}>
      <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: -1 }}>ETORK</div>
      <div style={{ fontSize: 9, color: '#e6b800', letterSpacing: 4, marginTop: 4 }}>BRASIL</div>
      <div style={{ marginTop: 24, width: 32, height: 32, border: '2px solid #333', borderTop: '2px solid #e6b800', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
