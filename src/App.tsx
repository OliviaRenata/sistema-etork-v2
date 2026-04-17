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

  // LOG DE DIAGNÓSTICO: Verifique isso no F12 do navegador
  useEffect(() => {
    console.log("DIAGNÓSTICO ETORK:", { 
      user: !!user, 
      role: profile?.role, 
      loading: authLoading,
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL ? "Configurada" : "ERRO: Faltando no Netlify"
    });

    // Se em 6 segundos não carregar, libera para a tela de login (evita tela preta infinita)
    const timer = setTimeout(() => {
      if (authLoading) setTimedOut(true);
    }, 6000);

    return () => clearTimeout(timer);
  }, [user, profile, authLoading]);

  // Se estiver carregando e NÃO deu timeout, mostra o spinner
  if (authLoading && !timedOut) {
    return <LoadingScreen />;
  }
  
  // Se não houver usuário logado (ou se deu timeout na autenticação)
  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  const isAdmin = profile?.role === 'admin';

  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route path="downloads" element={<DownloadsPage />} />
        
        {isAdmin ? (
          <>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="admin/dashboard" element={<AdminDashboard />} />
            <Route path="admin/orders" element={<AdminOrders />} />
            <Route path="admin/orders/:id" element={<AdminOrders />} />
            <Route path="admin/franchisees" element={<AdminFranchisees />} />
            <Route path="admin/financial" element={<AdminFinancial />} />
            <Route path="admin/downloads" element={<AdminDownloads />} />
          </>
        ) : (
          <>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<FranchiseDashboard />} />
            <Route path="orders" element={<FranchiseOrders />} />
            <Route path="orders/new" element={<FranchiseNewOrder />} />
            <Route path="financial" element={<FranchiseFinancial />} />
          </>
        )}
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}