export function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-secondary-500 dark:text-secondary-400">
          Overview of your payment processing activity.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Transactions', value: '12,847', change: '+12.5%' },
          { label: 'Volume Processed', value: '₹4.2Cr', change: '+8.2%' },
          { label: 'Success Rate', value: '98.6%', change: '+0.3%' },
          { label: 'Active Accounts', value: '1,284', change: '+4.1%' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl bg-white dark:bg-secondary-800 p-6 shadow-sm ring-1 ring-secondary-100 dark:ring-secondary-700"
          >
            <p className="text-sm font-medium text-secondary-500 dark:text-secondary-400">
              {stat.label}
            </p>
            <p className="mt-2 text-3xl font-bold text-secondary-900 dark:text-white">
              {stat.value}
            </p>
            <p className="mt-1 text-sm text-success-600 dark:text-success-400">
              {stat.change} from last month
            </p>
          </div>
        ))}
      </div>

      {/* Placeholder content */}
      <div className="rounded-xl bg-white dark:bg-secondary-800 p-6 shadow-sm ring-1 ring-secondary-100 dark:ring-secondary-700">
        <h2 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4">
          Recent Transactions
        </h2>
        <div className="text-sm text-secondary-500 dark:text-secondary-400">
          Transaction data will appear here once the API layer is connected.
        </div>
      </div>
    </div>
  );
}
