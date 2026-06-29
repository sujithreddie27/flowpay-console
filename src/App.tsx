import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout, AuthLayout, ProtectedRoute, RoleBasedRoute } from '@/components';

// Loading component for lazy-loaded pages
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
  </div>
);

// Lazy-loaded page components for code splitting
// Auth Pages (Public)
const LoginPage = lazy(() => import('@/pages/Login').then(module => ({ default: module.LoginPage })));
const RegisterPage = lazy(() => import('@/pages/Register').then(module => ({ default: module.RegisterPage })));

// Protected Pages (Authenticated Users)
const DashboardPage = lazy(() => import('@/pages/Dashboard').then(module => ({ default: module.DashboardPage })));
const TransactionsPage = lazy(() => import('@/pages/Transactions').then(module => ({ default: module.TransactionsPage })));
const TransactionDetailPage = lazy(() => import('@/pages/TransactionDetail').then(module => ({ default: module.TransactionDetailPage })));
const PaymentsPage = lazy(() => import('@/pages/Payments').then(module => ({ default: module.PaymentsPage })));
const MonitoringPage = lazy(() => import('@/pages/Monitoring').then(module => ({ default: module.MonitoringPage })));
const AccountsPage = lazy(() => import('@/pages/Accounts').then(module => ({ default: module.AccountsPage })));
const SettingsPage = lazy(() => import('@/pages/Settings').then(module => ({ default: module.SettingsPage })));

// Admin Pages (Admin Role Only)
const AdminDashboardPage = lazy(() => import('@/pages/Admin').then(module => ({ default: module.AdminDashboardPage })));

// Error Pages
const NotFoundPage = lazy(() => import('@/pages/NotFound').then(module => ({ default: module.NotFoundPage })));
const UnauthorizedPage = lazy(() => import('@/pages/Unauthorized').then(module => ({ default: module.UnauthorizedPage })));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Public Routes - Auth Layout */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          {/* Protected Routes - Main Layout (Authenticated Users) */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/transactions" element={<TransactionsPage />} />
              <Route path="/transactions/:id" element={<TransactionDetailPage />} />
              <Route path="/payments/new" element={<PaymentsPage />} />
              <Route path="/monitoring" element={<MonitoringPage />} />
              <Route path="/accounts" element={<AccountsPage />} />
              <Route path="/accounts/:id" element={<AccountsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>

          {/* Admin Routes - Role-Based (Admin Only) */}
          <Route element={<ProtectedRoute />}>
            <Route element={<RoleBasedRoute allowedRoles={['admin']} />}>
              <Route element={<MainLayout />}>
                <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
                <Route path="/admin/*" element={<AdminDashboardPage />} />
              </Route>
            </Route>
          </Route>

          {/* Error Routes */}
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="/404" element={<NotFoundPage />} />

          {/* Default Redirects */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
