import { Breadcrumbs } from '@/components';
import { CreditCardIcon, PlusIcon } from '@heroicons/react/24/outline';

/**
 * AccountsPage Component
 * 
 * User accounts list and management page.
 * 
 * Features to implement (Day 14):
 * - Display account cards (type, balance, status)
 * - Account detail view with transaction history
 * - Create new account flow
 * - Account switching functionality
 */
export const AccountsPage = () => {
  return (
    <div className="p-6">
      <Breadcrumbs />
      
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <CreditCardIcon className="h-8 w-8 text-gray-400" />
              <h1 className="text-3xl font-bold text-gray-900">Accounts</h1>
            </div>
            <p className="text-gray-600">
              Manage your payment accounts and balances
            </p>
          </div>
          <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
            <PlusIcon className="h-5 w-5 mr-2" />
            New Account
          </button>
        </div>

        {/* Placeholder Content */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-12">
            <CreditCardIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Accounts Page
            </h3>
            <p className="text-gray-500">
              Accounts functionality will be implemented in Day 14
            </p>
            <div className="mt-6 text-sm text-gray-400">
              <p>Planned features:</p>
              <ul className="mt-2 space-y-1">
                <li>• Account Cards (Type, Balance, Status)</li>
                <li>• Account Detail View</li>
                <li>• Balance History Chart</li>
                <li>• Create New Account</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
