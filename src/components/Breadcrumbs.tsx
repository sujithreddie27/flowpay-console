import { Link, useLocation } from 'react-router-dom';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';
import { cn } from '@/utils';

/**
 * Breadcrumb Item Interface
 */
interface BreadcrumbItem {
  label: string;
  path: string;
}

/**
 * Breadcrumbs Component
 * 
 * Automatically generates breadcrumb navigation based on the current route.
 * Shows hierarchical path from home to current page.
 * 
 * Route to Label Mapping:
 * - Converts URL segments to readable labels
 * - Handles dynamic segments (IDs)
 * - Supports nested routes
 */

// Route label mapping for better readability
const routeLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  transactions: 'Transactions',
  payments: 'Payments',
  accounts: 'Accounts',
  settings: 'Settings',
  monitoring: 'Monitoring',
  admin: 'Admin',
  new: 'New',
  edit: 'Edit',
  profile: 'Profile',
  security: 'Security',
  notifications: 'Notifications',
};

export const Breadcrumbs = () => {
  const location = useLocation();
  
  // Parse pathname into breadcrumb items
  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const paths = location.pathname.split('/').filter(Boolean);
    
    if (paths.length === 0) {
      return [];
    }
    
    const breadcrumbs: BreadcrumbItem[] = [];
    let currentPath = '';
    
    paths.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      // Check if segment is a UUID or numeric ID (likely a dynamic route)
      const isId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment) 
                  || /^\d+$/.test(segment);
      
      let label = segment;
      
      if (isId) {
        // For IDs, use the previous segment's name + "Detail"
        const previousSegment = paths[index - 1];
        label = previousSegment 
          ? `${routeLabels[previousSegment] || previousSegment} Detail`
          : 'Detail';
      } else {
        // Use mapped label or capitalize the segment
        label = routeLabels[segment] || segment
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      }
      
      breadcrumbs.push({
        label,
        path: currentPath,
      });
    });
    
    return breadcrumbs;
  };
  
  const breadcrumbs = getBreadcrumbs();
  
  // Don't show breadcrumbs on login or root pages
  if (breadcrumbs.length === 0 || location.pathname === '/login') {
    return null;
  }
  
  return (
    <nav className="flex items-center space-x-2 text-sm text-secondary-500 dark:text-secondary-400 mb-4" aria-label="Breadcrumb">
      {/* Home Link */}
      <Link
        to="/"
        className="hover:text-secondary-700 dark:hover:text-secondary-200 transition-colors"
        aria-label="Home"
      >
        <HomeIcon className="h-5 w-5" />
      </Link>
      
      {/* Breadcrumb Items */}
      {breadcrumbs.map((breadcrumb, index) => {
        const isLast = index === breadcrumbs.length - 1;
        
        return (
          <div key={breadcrumb.path} className="flex items-center space-x-2">
            <ChevronRightIcon className="h-4 w-4 text-secondary-400 dark:text-secondary-500" />
            
            {isLast ? (
              <span className="font-medium text-secondary-900 dark:text-white" aria-current="page">
                {breadcrumb.label}
              </span>
            ) : (
              <Link
                to={breadcrumb.path}
                className={cn(
                  'hover:text-secondary-700 dark:hover:text-secondary-200 transition-colors',
                  'truncate max-w-[200px]'
                )}
              >
                {breadcrumb.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
};
