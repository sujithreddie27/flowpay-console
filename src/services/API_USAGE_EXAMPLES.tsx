/**
 * API Layer Usage Examples
 * =========================
 * 
 * This file demonstrates how to use the FlowPay API layer in your React components.
 * The API layer consists of:
 * - Service modules (authService, accountService, transactionService, paymentService)
 * - React Query hooks (useAuth, useAccounts, useTransactions, etc.)
 * - TypeScript types for type safety
 */

import { useEffect } from 'react';
import {
  // Services (direct API calls)
  authService,
  accountService,
  transactionService,
  paymentService,
  dashboardService,
  settingsService,
  
  // React Query utilities
  queryKeys,
  invalidateQueries,
  
  // Token management
  tokenManager,
  isAuthenticated,
  logout,
} from '@/services';

import {
  // React Query hooks
  useAuth,
  useLogin,
  useLogout,
  useAccounts,
  useAccount,
  useAccountBalance,
  useCreateAccount,
  useUpdateAccount,
  useTransactions,
  useTransaction,
  useTransactionStatus,
  useInitiateTransaction,
} from '@/hooks';

// ============================================================================
// Example 1: Authentication
// ============================================================================

export const LoginExample = () => {
  const login = useLogin();

  const handleLogin = async () => {
    try {
      await login.mutateAsync({
        email: 'user@example.com',
        password: 'password123',
        rememberMe: true,
      });
      // User is automatically redirected to /dashboard on success
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <button onClick={handleLogin} disabled={login.isPending}>
      {login.isPending ? 'Logging in...' : 'Login'}
    </button>
  );
};

// ============================================================================
// Example 2: Getting Current User
// ============================================================================

export const UserProfileExample = () => {
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <div>Not authenticated</div>;
  }

  return (
    <div>
      <h1>Welcome, {user?.name}</h1>
      <p>Email: {user?.email}</p>
      <p>Role: {user?.role}</p>
      <button onClick={() => logout()}>Logout</button>
    </div>
  );
};

// ============================================================================
// Example 3: Fetching Accounts List
// ============================================================================

export const AccountsListExample = () => {
  const { data, isLoading, error } = useAccounts({
    page: 1,
    pageSize: 10,
    status: 'active',
  });

  if (isLoading) {
    return <div>Loading accounts...</div>;
  }

  if (error) {
    return <div>Error loading accounts: {error.message}</div>;
  }

  return (
    <div>
      <h2>My Accounts ({data?.total})</h2>
      {data?.items.map((account) => (
        <div key={account.id}>
          <h3>{account.accountType}</h3>
          <p>Balance: {account.balance} {account.currency}</p>
          <p>Status: {account.status}</p>
        </div>
      ))}
    </div>
  );
};

// ============================================================================
// Example 4: Creating New Account
// ============================================================================

export const CreateAccountExample = () => {
  const createAccount = useCreateAccount();

  const handleCreate = async () => {
    try {
      const newAccount = await createAccount.mutateAsync({
        accountType: 'savings',
        currency: 'USD',
      });
      console.log('Account created:', newAccount);
      // Accounts list is automatically refetched
    } catch (error) {
      console.error('Failed to create account:', error);
    }
  };

  return (
    <button onClick={handleCreate} disabled={createAccount.isPending}>
      {createAccount.isPending ? 'Creating...' : 'Create Savings Account'}
    </button>
  );
};

// ============================================================================
// Example 5: Fetching Single Account with Balance
// ============================================================================

export const AccountDetailExample = ({ accountId }: { accountId: string }) => {
  const { data: account, isLoading: accountLoading } = useAccount(accountId);
  const { data: balance, isLoading: balanceLoading } = useAccountBalance(accountId);

  if (accountLoading || balanceLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h2>Account {account?.accountNumber}</h2>
      <p>Type: {account?.accountType}</p>
      <p>Balance: {balance?.balance} {balance?.currency}</p>
      <p>Available: {balance?.availableBalance} {balance?.currency}</p>
    </div>
  );
};

// ============================================================================
// Example 6: Fetching Transactions with Filters
// ============================================================================

export const TransactionsListExample = () => {
  const { data, isLoading, error } = useTransactions({
    page: 1,
    pageSize: 20,
    status: ['completed', 'pending'],
    dateFrom: '2026-01-01',
    dateTo: '2026-12-31',
    sortBy: 'initiatedAt',
    sortOrder: 'desc',
  });

  if (isLoading) {
    return <div>Loading transactions...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div>
      <h2>Transactions ({data?.total})</h2>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Amount</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {data?.items.map((transaction) => (
            <tr key={transaction.id}>
              <td>{new Date(transaction.initiatedAt).toLocaleDateString()}</td>
              <td>{transaction.type}</td>
              <td>{transaction.amount} {transaction.currency}</td>
              <td>{transaction.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ============================================================================
// Example 7: Initiating New Transaction
// ============================================================================

export const InitiateTransactionExample = () => {
  const initiateTransaction = useInitiateTransaction();

  const handleTransfer = async () => {
    try {
      const transaction = await initiateTransaction.mutateAsync({
        accountId: 'acc_123',
        type: 'transfer',
        amount: 100.00,
        currency: 'USD',
        recipientAccountNumber: '1234567890',
        description: 'Payment for services',
        idempotencyKey: `txn_${Date.now()}_${Math.random()}`,
        metadata: {
          invoiceId: 'INV-001',
        },
      });
      console.log('Transaction initiated:', transaction);
    } catch (error) {
      console.error('Transaction failed:', error);
    }
  };

  return (
    <button onClick={handleTransfer} disabled={initiateTransaction.isPending}>
      {initiateTransaction.isPending ? 'Processing...' : 'Transfer $100'}
    </button>
  );
};

// ============================================================================
// Example 8: Real-time Transaction Updates (Polling)
// ============================================================================

export const TransactionStatusMonitorExample = ({ transactionId }: { transactionId: string }) => {
  const { data: transaction } = useTransaction(transactionId);
  
  // Poll transaction status every 5 seconds if pending
  const { data: status } = useTransactionStatus(transactionId, {
    refetchInterval: transaction?.status === 'pending' ? 5000 : false,
  });

  return (
    <div>
      <h3>Transaction Status</h3>
      <p>Current Status: {status?.status}</p>
      <p>Last Updated: {status?.updatedAt}</p>
      {status?.message && <p>Message: {status.message}</p>}
    </div>
  );
};

// ============================================================================
// Example 9: Direct Service Usage (Without React Query)
// ============================================================================

export const DirectApiCallExample = () => {
  const fetchData = async () => {
    try {
      // Direct API call without React Query
      const accounts = await accountService.getAccounts({
        page: 1,
        pageSize: 10,
      });
      console.log('Accounts:', accounts);

      // Another direct call
      const transactions = await transactionService.getTransactions({
        status: 'completed',
      });
      console.log('Transactions:', transactions);
    } catch (error) {
      console.error('API error:', error);
    }
  };

  return (
    <button onClick={fetchData}>Fetch Data Directly</button>
  );
};

// ============================================================================
// Example 10: Manual Cache Invalidation
// ============================================================================

export const ManualCacheInvalidationExample = () => {
  const handleRefreshAccounts = () => {
    // Manually invalidate accounts cache to force refetch
    invalidateQueries.accounts();
  };

  const handleRefreshTransactions = () => {
    // Manually invalidate transactions cache
    invalidateQueries.transactions();
  };

  const handleRefreshAll = () => {
    // Refresh all cached data (use sparingly)
    invalidateQueries.all();
  };

  return (
    <div>
      <button onClick={handleRefreshAccounts}>Refresh Accounts</button>
      <button onClick={handleRefreshTransactions}>Refresh Transactions</button>
      <button onClick={handleRefreshAll}>Refresh All Data</button>
    </div>
  );
};

// ============================================================================
// Example 11: Token Management
// ============================================================================

export const TokenManagementExample = () => {
  useEffect(() => {
    // Check if user is authenticated
    const authenticated = isAuthenticated();
    console.log('Is authenticated:', authenticated);

    // Get current access token
    const accessToken = tokenManager.getAccessToken();
    console.log('Access token:', accessToken);

    // Get refresh token
    const refreshToken = tokenManager.getRefreshToken();
    console.log('Refresh token:', refreshToken);

    // Manual logout (clears tokens and triggers event)
    // logout();
  }, []);

  return null;
};

// ============================================================================
// Example 12: Error Handling
// ============================================================================

export const ErrorHandlingExample = () => {
  const { data, isLoading, error, isError } = useAccounts();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isError) {
    // error is typed as ApiError
    return (
      <div>
        <h3>Error</h3>
        <p>Code: {error.error.code}</p>
        <p>Message: {error.error.message}</p>
        {error.error.details && (
          <pre>{JSON.stringify(error.error.details, null, 2)}</pre>
        )}
      </div>
    );
  }

  return <div>Data loaded successfully</div>;
};

// ============================================================================
// Example 13: Optimistic Updates
// ============================================================================

import { useQueryClient } from '@tanstack/react-query';

export const OptimisticUpdateExample = ({ accountId }: { accountId: string }) => {
  const queryClient = useQueryClient();
  const updateAccount = useUpdateAccount(accountId);

  const handleFreeze = async () => {
    // Optimistically update the UI before API call completes
    queryClient.setQueryData(
      queryKeys.accounts.detail(accountId),
      (old: any) => ({
        ...old,
        status: 'frozen',
      })
    );

    try {
      await updateAccount.mutateAsync({ status: 'frozen' });
    } catch (error) {
      // Revert on error
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.detail(accountId) });
    }
  };

  return (
    <button onClick={handleFreeze}>Freeze Account</button>
  );
};

// ============================================================================
// Example 14: Pagination
// ============================================================================

import { useState } from 'react';

export const PaginationExample = () => {
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data, isLoading } = useTransactions({
    page,
    pageSize,
  });

  return (
    <div>
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <>
          <div>
            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, data?.total || 0)} of {data?.total} transactions
          </div>
          <div>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </button>
            <span>Page {page} of {data?.totalPages}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= (data?.totalPages || 1)}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};

/**
 * Best Practices:
 * ===============
 * 
 * 1. Use React Query hooks (useAccounts, useTransactions, etc.) in components
 * 2. Use services directly only when needed (outside React components, utility functions)
 * 3. Always handle loading and error states
 * 4. Use TypeScript types for type safety
 * 5. Leverage automatic cache invalidation after mutations
 * 6. Use query keys for manual cache management
 * 7. Add idempotency keys for transactions and payments
 * 8. Handle 401 errors - automatic token refresh is built-in
 * 9. Use refetchInterval for real-time updates when needed
 * 10. Leverage optimistic updates for better UX
 */
