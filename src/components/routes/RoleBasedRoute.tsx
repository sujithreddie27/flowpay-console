import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '@/store';
import type { UserProfile } from '@/types';

/**
 * RoleBasedRoute Component
 * 
 * Wraps routes that require specific user roles.
 * Redirects to unauthorized page if user doesn't have required role.
 * 
 * @param allowedRoles - Array of roles that can access this route
 */

interface RoleBasedRouteProps {
  allowedRoles: UserProfile['role'][];
}

export const RoleBasedRoute = ({ allowedRoles }: RoleBasedRouteProps) => {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};
