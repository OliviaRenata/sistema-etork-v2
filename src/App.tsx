// src/App.tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useEffect, useState } from 'react';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
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

// Layout
import AppLayout from './components/layout/AppLayout';
import LoadingScreen from './components/ui/LoadingScreen';

export default function App() {
  const { user, profile, loading: authLoading } = useAuth();
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
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Se está logado, define se é admin ou franqueado
  const isAdmin = profile?.role === 'admin' || user?.email === 'joao@etorkbrasil.com.br';
  console.log('📌 Usuário logado:', user.email, 'isAdmin:', isAdmin);

  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        {/* Rotas COMUNS - ambos acessam */}
        <Route path="downloads" element={<DownloadsPage />} />
        
        {/* Rotas do FRANQUEADO - admin também pode acessar */}
        <Route path="dashboard" element={<FranchiseDashboard />} />
        <Route path="orders" element={<FranchiseOrders />} />
        <Route path="orders/new" element={<FranchiseNewOrder />} />
        <Route path="financial" element={<FranchiseFinancial />} />
        
        {/* Rotas do ADMIN - apenas admin acessa */}
        {isAdmin && (
          <>
            <Route path="admin/dashboard" element={<AdminDashboard />} />
            <Route path="admin/orders" element={<AdminOrders />} />
            <Route path="admin/orders/:id" element={<AdminOrders />} />
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