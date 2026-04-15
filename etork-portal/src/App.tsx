// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import LoginPage from './pages/LoginPage';
import FranchiseDashboard from './pages/franchise/Dashboard';
import FranchiseOrders from './pages/franchise/Orders';
import FranchiseNewOrder from './pages/franchise/NewOrder';
import FranchiseFinancial from './pages/franchise/Financial';
import AdminDashboard from './pages/admin/Dashboard';
import AdminOrders from './pages/admin/Orders';
import AdminOrderDetail from './pages/admin/OrderDetail';
import AdminFranchisees from './pages/admin/Franchisees';
import AdminFinancial from './pages/admin/Financial';

// Layout
import AppLayout from './components/layout/AppLayout';
import LoadingScreen from './components/ui/LoadingScreen';

function Router() {
  const { user, profile, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <Routes><Route path="*" element={<LoginPage />} /></Routes>;

  const isAdmin = profile?.role === 'admin';

  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        {isAdmin ? (
          <>
            <Route index element={<Navigate to="/admin" replace />} />
            <Route path="admin" element={<AdminDashboard />} />
            <Route path="admin/orders" element={<AdminOrders />} />
            <Route path="admin/orders/:id" element={<AdminOrderDetail />} />
            <Route path="admin/franchisees" element={<AdminFranchisees />} />
            <Route path="admin/financial" element={<AdminFinancial />} />
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

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Router />
      </BrowserRouter>
    </AuthProvider>
  );
}
