import { useQuery, useMutation } from '@tanstack/react-query';
import {
  transactionService,
  queryKeys,
  invalidateQueries,
} from '@/services';
import type {
  TransactionListParams,
  InitiateTransactionRequest,
} from '@/types';

// ============================================================================
// Transaction Hooks
// ============================================================================

/**
 * Hook for getting list of transactions
 */
export const useTransactions = (params?: TransactionListParams) => {
  return useQuery({
    queryKey: queryKeys.transactions.list(params),
    queryFn: () => transactionService.getTransactions(params),
  });
};

/**
 * Hook for getting single transaction by ID
 */
export const useTransaction = (transactionId: string) => {
  return useQuery({
    queryKey: queryKeys.transactions.detail(transactionId),
    queryFn: () => transactionService.getTransactionById(transactionId),
    enabled: !!transactionId,
  });
};

/**
 * Hook for getting transaction by reference ID
 */
export const useTransactionByReference = (referenceId: string) => {
  return useQuery({
    queryKey: [...queryKeys.transactions.all, 'reference', referenceId],
    queryFn: () => transactionService.getTransactionByReference(referenceId),
    enabled: !!referenceId,
  });
};

/**
 * Hook for getting transaction status
 */
export const useTransactionStatus = (transactionId: string, options?: {
  refetchInterval?: number;
}) => {
  return useQuery({
    queryKey: queryKeys.transactions.status(transactionId),
    queryFn: () => transactionService.getTransactionStatus(transactionId),
    enabled: !!transactionId,
    refetchInterval: options?.refetchInterval || false,
  });
};

/**
 * Hook for getting transaction timeline
 */
export const useTransactionTimeline = (transactionId: string) => {
  return useQuery({
    queryKey: queryKeys.transactions.timeline(transactionId),
    queryFn: () => transactionService.getTransactionTimeline(transactionId),
    enabled: !!transactionId,
  });
};

/**
 * Hook for getting recent transactions
 */
export const useRecentTransactions = (limit: number = 10) => {
  return useQuery({
    queryKey: queryKeys.transactions.recent(limit),
    queryFn: () => transactionService.getRecentTransactions(limit),
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

/**
 * Hook for getting transaction statistics
 */
export const useTransactionStatistics = (params?: {
  fromDate?: string;
  toDate?: string;
  accountId?: string;
}) => {
  return useQuery({
    queryKey: queryKeys.transactions.statistics(params),
    queryFn: () => transactionService.getStatistics(params),
  });
};

/**
 * Hook for initiating new transaction
 */
export const useInitiateTransaction = () => {
  return useMutation({
    mutationFn: (transactionData: InitiateTransactionRequest) =>
      transactionService.initiateTransaction(transactionData),
    onSuccess: () => {
      // Invalidate transactions list and dashboard
      invalidateQueries.transactions();
      invalidateQueries.dashboard();
    },
  });
};

/**
 * Hook for retrying failed transaction
 */
export const useRetryTransaction = () => {
  return useMutation({
    mutationFn: (transactionId: string) =>
      transactionService.retryTransaction(transactionId),
    onSuccess: (_data, transactionId) => {
      // Invalidate specific transaction and transactions list
      invalidateQueries.transaction(transactionId);
      invalidateQueries.transactions();
    },
  });
};

/**
 * Hook for cancelling pending transaction
 */
export const useCancelTransaction = () => {
  return useMutation({
    mutationFn: ({ transactionId, reason }: { transactionId: string; reason?: string }) =>
      transactionService.cancelTransaction(transactionId, reason),
    onSuccess: (_data, variables) => {
      // Invalidate specific transaction and transactions list
      invalidateQueries.transaction(variables.transactionId);
      invalidateQueries.transactions();
    },
  });
};

/**
 * Hook for reversing completed transaction
 */
export const useReverseTransaction = () => {
  return useMutation({
    mutationFn: ({
      transactionId,
      reason,
      amount,
    }: {
      transactionId: string;
      reason: string;
      amount?: number;
    }) => transactionService.reverseTransaction(transactionId, reason, amount),
    onSuccess: (_data, variables) => {
      // Invalidate specific transaction and transactions list
      invalidateQueries.transaction(variables.transactionId);
      invalidateQueries.transactions();
    },
  });
};

/**
 * Hook for downloading transaction receipt
 */
export const useDownloadReceipt = () => {
  return useMutation({
    mutationFn: (transactionId: string) =>
      transactionService.downloadReceipt(transactionId),
    onSuccess: (blob, transactionId) => {
      // Create download link for PDF
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `transaction-receipt-${transactionId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
  });
};

/**
 * Hook for exporting transactions to CSV
 */
export const useExportTransactions = () => {
  return useMutation({
    mutationFn: (params?: TransactionListParams) =>
      transactionService.exportTransactions(params),
    onSuccess: (blob) => {
      // Create download link for CSV
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `transactions-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
  });
};

/**
 * Hook for searching transactions
 */
export const useSearchTransactions = (
  query: string,
  params?: {
    page?: number;
    pageSize?: number;
  }
) => {
  return useQuery({
    queryKey: [...queryKeys.transactions.all, 'search', query, params],
    queryFn: () => transactionService.searchTransactions(query, params),
    enabled: query.length > 2, // Only search if query is at least 3 characters
  });
};

/**
 * Hook for validating transaction before submission
 */
export const useValidateTransaction = () => {
  return useMutation({
    mutationFn: (transactionData: InitiateTransactionRequest) =>
      transactionService.validateTransaction(transactionData),
  });
};

export default useTransactions;
