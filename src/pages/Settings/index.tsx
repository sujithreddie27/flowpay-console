import { Breadcrumbs } from '@/components';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';

/**
 * SettingsPage Component
 * 
 * User settings and preferences page.
 * 
 * Sections to implement (Day 15):
 * - Profile settings (name, email, phone)
 * - Security settings (password, 2FA)
 * - Notification preferences
 * - Payment methods
 */
export const SettingsPage = () => {
  return (
    <div className="p-6">
      <Breadcrumbs />
      
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <Cog6ToothIcon className="h-8 w-8 text-gray-400" />
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          </div>
          <p className="text-gray-600">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Placeholder Content */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-12">
            <Cog6ToothIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Settings Page
            </h3>
            <p className="text-gray-500">
              Settings functionality will be implemented in Day 15
            </p>
            <div className="mt-6 text-sm text-gray-400">
              <p>Planned sections:</p>
              <ul className="mt-2 space-y-1">
                <li>• Profile Settings</li>
                <li>• Security & Password</li>
                <li>• Notification Preferences</li>
                <li>• Payment Methods</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
