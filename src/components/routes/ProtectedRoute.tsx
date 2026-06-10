import { Navigate, Outlet, useLocation } from 'react-router-dom';

/**
 * ProtectedRoute Component
 * 
 * Wraps routes that require authentication.
 * Redirects to login page if user is not authenticated.
 * Preserves the attempted location for redirect after login.
 * 
 * TODO: Connect to actual auth state from Redux store (Day 7)
 */
export const ProtectedRoute = () => {
  const location = useLocation();
  
  // TODO: Replace with actual auth state from Redux store
  // For now, using localStorage as a temporary solution
  const isAuthenticated = !!localStorage.getItem('authToken');
  
  if (!isAuthenticated) {
    // Redirect to login page, preserving the attempted location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  return <Outlet />;
};
