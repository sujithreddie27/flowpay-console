import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/store';

/**
 * ProtectedRoute Component
 * 
 * Wraps routes that require authentication.
 * Redirects to login page if user is not authenticated.
 * Preserves the attempted location for redirect after login.
 */
export const ProtectedRoute = () => {
  const location = useLocation();
  const { isAuthenticated, loading } = useAppSelector((state) => state.auth);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};
