// src/App.tsx (simplificado, sem providers duplicados)

import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

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
import AdminOrderDetail from './pages/admin/OrderDetail';
import AdminFranchisees from './pages/admin/Franchisees';
import AdminFinancial from './pages/admin/Financial';

// Layout
import AppLayout from './components/layout/AppLayout';
import LoadingScreen from './components/ui/LoadingScreen';

export default function App() {
  const { user, profile, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  
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
        {isAdmin ? (
          <>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="admin/dashboard" element={<AdminDashboard />} />
            <Route path="admin/orders" element={<AdminOrders />} />
            <Route path="admin/orders/:id" element={<AdminOrderDetail />} />
            <Route path="admin/franchisees" element={<AdminFranchisees />} />
            <Route path="admin/financial" element={<AdminFinancial />} />
            <Route path="admin/downloads" element={<DownloadsPage />} />
          </>
        ) : (
          <>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<FranchiseDashboard />} />
            <Route path="orders" element={<FranchiseOrders />} />
            <Route path="orders/new" element={<FranchiseNewOrder />} />
            <Route path="financial" element={<FranchiseFinancial />} />
            <Route path="downloads" element={<DownloadsPage />} />
          </>
        )}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}