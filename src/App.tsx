import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout, AuthLayout } from '@/components';
import { DashboardPage } from '@/pages/Dashboard';
import { LoginPage } from '@/pages/Login';
import { TransactionsPage } from '@/pages/Transactions';
import { PaymentsPage } from '@/pages/Payments';
import { MonitoringPage } from '@/pages/Monitoring';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>

        {/* Protected routes */}
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/payments/new" element={<PaymentsPage />} />
          <Route path="/monitoring" element={<MonitoringPage />} />
        </Route>

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
