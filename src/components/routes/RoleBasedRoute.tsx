import { Navigate, Outlet } from 'react-router-dom';
import type { User } from '@/types';

/**
 * RoleBasedRoute Component
 * 
 * Wraps routes that require specific user roles.
 * Redirects to unauthorized page if user doesn't have required role.
 * 
 * @param allowedRoles - Array of roles that can access this route
 * 
 * TODO: Connect to actual auth state from Redux store (Day 7)
 */

interface RoleBasedRouteProps {
  allowedRoles: User['role'][];
}

export const RoleBasedRoute = ({ allowedRoles }: RoleBasedRouteProps) => {
  // TODO: Replace with actual user from Redux store
  // For now, using a mock user role from localStorage
  const getUserRole = (): User['role'] | null => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    
    try {
      const user = JSON.parse(userStr) as User;
      return user.role;
    } catch {
      return null;
    }
  };
  
  const userRole = getUserRole();
  
  if (!userRole) {
    // User not found, redirect to login
    return <Navigate to="/login" replace />;
  }
  
  if (!allowedRoles.includes(userRole)) {
    // User doesn't have required role, redirect to unauthorized page
    return <Navigate to="/unauthorized" replace />;
  }
  
  return <Outlet />;
};
