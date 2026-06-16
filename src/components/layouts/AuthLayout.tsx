import { Navigate, Outlet } from 'react-router-dom';
import { BanknotesIcon } from '@heroicons/react/24/outline';
import { useAppSelector } from '@/store';

export function AuthLayout() {
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  // Redirect authenticated users to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-secondary-950 dark:via-secondary-900 dark:to-secondary-950">
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="mb-8 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-600/20">
            <BanknotesIcon className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">
            FlowPay
          </h1>
        </div>

        {/* Card Container */}
        <div className="w-full max-w-md">
          <div className="rounded-2xl bg-white dark:bg-secondary-800 shadow-xl shadow-secondary-200/50 dark:shadow-secondary-900/50 ring-1 ring-secondary-100 dark:ring-secondary-700 p-8">
            <Outlet />
          </div>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-sm text-secondary-500 dark:text-secondary-400">
          &copy; {new Date().getFullYear()} FlowPay. All rights reserved.
        </p>
      </div>
    </div>
  );
}
