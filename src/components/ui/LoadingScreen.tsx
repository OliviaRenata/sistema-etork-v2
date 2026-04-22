// src/components/ui/LoadingScreen.tsx
export default function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh', background: '#0a0a0a',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: '"Inter", sans-serif',
    }}>
      <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: -1 }}>ETORK</div>
      <div style={{ fontSize: 9, color: '#c8c8c8', letterSpacing: 4, marginTop: 4 }}>BRASIL</div>
      <div style={{ marginTop: 24, width: 32, height: 32, border: '2px solid #444', borderTop: '2px solid #c8c8c8', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
