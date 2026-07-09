import { Link } from 'react-router-dom';
import { ShieldExclamationIcon, HomeIcon } from '@heroicons/react/24/outline';

/**
 * UnauthorizedPage Component
 * 
 * Displays when user tries to access a route they don't have permission for.
 * Shows when role-based access control denies access.
 */
export const UnauthorizedPage = () => {
  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-950 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        {/* Unauthorized Icon */}
        <div className="mb-8 flex justify-center">
          <ShieldExclamationIcon className="h-24 w-24 text-red-400" />
        </div>
        
        {/* Error Message */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-secondary-900 dark:text-white mb-2">
            Access Denied
          </h2>
          <p className="text-secondary-600 dark:text-secondary-400">
            You don't have permission to access this page. 
            Please contact your administrator if you believe this is an error.
          </p>
        </div>
        
        {/* Navigation Actions */}
        <div className="flex justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
          >
            <HomeIcon className="h-5 w-5 mr-2" />
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};
