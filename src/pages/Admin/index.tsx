import { Breadcrumbs } from '@/components';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';

/**
 * AdminDashboardPage Component
 * 
 * Admin-only dashboard with system-wide controls and metrics.
 * Accessible only by users with 'admin' role.
 * 
 * Features to implement:
 * - System-wide transaction metrics
 * - User management
 * - System configuration
 * - Audit logs
 * - Permission management
 */
export const AdminDashboardPage = () => {
  return (
    <div className="p-6">
      <Breadcrumbs />
      
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <ShieldCheckIcon className="h-8 w-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          </div>
          <p className="text-gray-600">
            System administration and management
          </p>
        </div>

        {/* Placeholder Content */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-12">
            <ShieldCheckIcon className="h-16 w-16 text-indigo-200 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Admin Dashboard
            </h3>
            <p className="text-gray-500">
              Admin functionality will be implemented in later phases
            </p>
            <div className="mt-6 text-sm text-gray-400">
              <p>Planned features:</p>
              <ul className="mt-2 space-y-1">
                <li>• System-wide Metrics</li>
                <li>• User Management</li>
                <li>• System Configuration</li>
                <li>• Audit Logs</li>
                <li>• Permission Management</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
