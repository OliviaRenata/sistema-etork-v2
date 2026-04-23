// src/App.tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useEffect, useState } from 'react';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import FranchiseDashboard from './pages/franchise/Dashboard';
import FranchiseOrders from './pages/franchise/Orders';
import FranchiseNewOrder from './pages/franchise/NewOrder';
import FranchiseFinancial from './pages/franchise/Financial';
import DownloadsPage from './pages/DownloadsPage';
import AdminDashboard from './pages/admin/Dashboard';
import AdminOrders from './pages/admin/Orders';
import AdminFranchisees from './pages/admin/Franchisees';
import AdminFinancial from './pages/admin/Financial';
import AdminDownloads from './pages/admin/Downloads';
import AdminOrderDetail from './pages/admin/OrderDetail';

// Layout
import AppLayout from './components/layout/AppLayout';
import LoadingScreen from './components/ui/LoadingScreen';

export default function App() {
  const { user, profile, franchisee, loading: authLoading, signOut } = useAuth();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    console.log("DIAGNÓSTICO:", { 
      user: user?.email, 
      role: profile?.role, 
      loading: authLoading 
    });

    const timer = setTimeout(() => {
      if (authLoading) setTimedOut(true);
    }, 6000);

    return () => clearTimeout(timer);
  }, [user, profile, authLoading]);

  // Tela de loading
  if (authLoading && !timedOut) {
    return <LoadingScreen />;
  }
  
  // Se NÃO está logado, mostra apenas rotas públicas
  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Se está logado, define se é admin ou franqueado
  const isAdmin = profile?.role === 'admin' || user?.email === 'joao@etorkbrasil.com.br';
  const isFranchiseeBlocked = !isAdmin && !!franchisee && franchisee.active === false;
  const isFranchiseePending = !isAdmin && !!franchisee && franchisee.approved === false;
  console.log('📌 Usuário logado:', user.email, 'isAdmin:', isAdmin);

  // Franqueado aguardando aprovação — mostra tela de espera
  if (isFranchiseePending) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0a0a',
        fontFamily: '"Inter", "Helvetica Neue", sans-serif',
        padding: 24,
      }}>
        <div style={{ textAlign: 'center', maxWidth: 480 }}>
          <div style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: '#1e1e1e',
            border: '2px solid #c8c8c8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 28px',
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#c8c8c8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <h2 style={{ color: '#c8c8c8', fontSize: 22, fontWeight: 800, margin: '0 0 12px' }}>
            Cadastro em análise
          </h2>
          <p style={{ color: '#aaa', fontSize: 14, lineHeight: 1.8, margin: '0 0 32px' }}>
            Seu cadastro foi recebido com sucesso!<br />
            Aguarde a aprovação do administrador para acessar o portal.<br />
            Você será notificado por e-mail assim que for aprovado.
          </p>
          <div style={{
            background: '#111',
            border: '1px solid #222',
            borderRadius: 10,
            padding: '14px 20px',
            marginBottom: 28,
          }}>
            <div style={{ fontSize: 11, color: '#555', letterSpacing: 1, marginBottom: 4 }}>EMPRESA CADASTRADA</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{franchisee.company_name}</div>
          </div>
          <button
            onClick={() => signOut()}
            style={{
              background: 'none',
              border: '1px solid #444',
              color: '#666',
              borderRadius: 8,
              padding: '10px 24px',
              fontSize: 12,
              cursor: 'pointer',
              letterSpacing: 1,
            }}
          >
            SAIR
          </button>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/" element={<AppLayout />}>
        {/* Rotas COMUNS - ambos acessam */}
        <Route
          path="downloads"
          element={
            isFranchiseeBlocked
              ? <Navigate to="/dashboard" replace />
              : <DownloadsPage />
          }
        />
        
        {/* Rotas do FRANQUEADO - admin também pode acessar */}
        <Route path="dashboard" element={<FranchiseDashboard />} />
        <Route
          path="orders"
          element={
            isFranchiseeBlocked
              ? <Navigate to="/dashboard" replace />
              : <FranchiseOrders />
          }
        />
        <Route
          path="orders/new"
          element={
            isFranchiseeBlocked
              ? <Navigate to="/dashboard" replace />
              : <FranchiseNewOrder />
          }
        />
        <Route path="financial" element={<FranchiseFinancial />} />
        
        {/* Rotas do ADMIN - apenas admin acessa */}
        {isAdmin && (
          <>
            <Route path="admin/dashboard" element={<AdminDashboard />} />
            <Route path="admin/orders" element={<AdminOrders />} />
            <Route path="admin/orders/:id" element={<AdminOrderDetail />} />
            <Route path="admin/franchisees" element={<AdminFranchisees />} />
            <Route path="admin/financial" element={<AdminFinancial />} />
            <Route path="admin/downloads" element={<AdminDownloads />} />
          </>
        )}
        
        {/* Rota padrão após login - redireciona conforme o tipo */}
        <Route index element={
          isAdmin ? <Navigate to="/admin/dashboard" replace /> : <Navigate to="/dashboard" replace />
        } />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}