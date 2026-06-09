export function TransactionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">
          Transactions
        </h1>
        <p className="mt-1 text-sm text-secondary-500 dark:text-secondary-400">
          View and manage all payment transactions.
        </p>
      </div>

      <div className="rounded-xl bg-white dark:bg-secondary-800 p-6 shadow-sm ring-1 ring-secondary-100 dark:ring-secondary-700">
        <p className="text-sm text-secondary-500 dark:text-secondary-400">
          Transaction list with filtering, sorting, and pagination will be implemented in Week 3.
        </p>
      </div>
    </div>
  );
}
