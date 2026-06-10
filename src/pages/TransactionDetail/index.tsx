import { useParams, Link } from 'react-router-dom';
import { Breadcrumbs } from '@/components';
import { 
  ArrowLeftIcon, 
  DocumentTextIcon,
  ArrowPathIcon 
} from '@heroicons/react/24/outline';

/**
 * TransactionDetailPage Component
 * 
 * Detailed view of a single transaction.
 * 
 * Features to implement (Day 12):
 * - Transaction status timeline/stepper
 * - Sender & receiver details
 * - Amount, currency, fees breakdown
 * - Timestamps (initiated, processed, completed)
 * - Reference ID and idempotency key
 * - Retry button for failed transactions
 * - Download receipt button
 * - Audit log entries
 */
export const TransactionDetailPage = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="p-6">
      <Breadcrumbs />
      
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Link
          to="/transactions"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Transactions
        </Link>

        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <DocumentTextIcon className="h-8 w-8 text-gray-400" />
              <h1 className="text-3xl font-bold text-gray-900">
                Transaction Details
              </h1>
            </div>
            <p className="text-gray-600">
              Transaction ID: {id}
            </p>
          </div>
          <div className="flex space-x-3">
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              <ArrowPathIcon className="h-5 w-5 mr-2" />
              Retry
            </button>
            <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
              Download Receipt
            </button>
          </div>
        </div>

        {/* Placeholder Content */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-12">
            <DocumentTextIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Transaction Detail Page
            </h3>
            <p className="text-gray-500">
              Transaction detail functionality will be implemented in Day 12
            </p>
            <div className="mt-6 text-sm text-gray-400">
              <p>Planned features:</p>
              <ul className="mt-2 space-y-1">
                <li>• Transaction Status Timeline</li>
                <li>• Sender & Receiver Details</li>
                <li>• Amount, Currency, Fees Breakdown</li>
                <li>• Timestamps & Reference IDs</li>
                <li>• Audit Log Entries</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
