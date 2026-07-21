import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  MagnifyingGlassIcon,
  BanknotesIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter, Badge, LoadingSpinner } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import {
  useInitiatePayment,
  useValidatePayment,
  useSearchRecipients,
  useSavedRecipients,
  usePaymentMethods,
  useAccounts,
  useAccountBalance,
} from '@/hooks';
import type { PaymentMethod, PaymentMethodInfo, InitiatePaymentRequest } from '@/types';
import { cn } from '@/utils';

// ============================================================================
// Validation Schema
// ============================================================================

const paymentSchema = z.object({
  recipientId: z.string().min(1, 'Recipient is required'),
  recipientName: z.string().min(1, 'Recipient name is required'),
  amount: z
    .number({ invalid_type_error: 'Amount is required' })
    .positive('Amount must be greater than 0')
    .max(1_000_000, 'Amount cannot exceed 1,000,000'),
  currency: z.string().min(1, 'Currency is required'),
  method: z.enum(['card', 'bank_transfer', 'wallet', 'upi'] as const, {
    errorMap: () => ({ message: 'Payment method is required' }),
  }),
  accountId: z.string().min(1, 'Source account is required'),
  description: z.string().max(200, 'Description cannot exceed 200 characters').optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

// ============================================================================
// Constants
// ============================================================================

const CURRENCIES = [
  { value: 'INR', label: '₹ INR', symbol: '₹' },
  { value: 'USD', label: '$ USD', symbol: '$' },
  { value: 'EUR', label: '€ EUR', symbol: '€' },
  { value: 'GBP', label: '£ GBP', symbol: '£' },
];

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: string }[] = [
  { value: 'bank_transfer', label: 'Bank Transfer', icon: '🏦' },
  { value: 'upi', label: 'UPI', icon: '📱' },
  { value: 'card', label: 'Debit / Credit Card', icon: '💳' },
  { value: 'wallet', label: 'Wallet', icon: '👛' },
];

// ============================================================================
// Sub-components
// ============================================================================

interface RecipientSearchProps {
  onSelect: (recipient: { id: string; name: string; email?: string; phone?: string; accountNumber?: string }) => void;
  selectedId?: string;
}

function RecipientSearch({ onSelect, selectedId }: RecipientSearchProps) {
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const { data: searchResults, isLoading: isSearching } = useSearchRecipients(query);
  const { data: savedRecipients } = useSavedRecipients();

  const displayResults = query.length >= 2 ? searchResults : savedRecipients;

  const handleSelect = (recipient: { id: string; name: string; email?: string; phone?: string; accountNumber?: string }) => {
    onSelect(recipient);
    setQuery(recipient.name);
    setShowDropdown(false);
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1.5">
        Recipient
      </label>
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          placeholder="Search by name, email, phone, or account number..."
          className={cn(
            'w-full pl-9 pr-4 py-2.5 rounded-lg border text-sm transition-all duration-200 focus:outline-none focus:ring-2',
            selectedId
              ? 'border-success-300 bg-success-50 focus:border-success-500 focus:ring-success-500 dark:bg-success-900/10 dark:border-success-700'
              : 'border-secondary-300 bg-white focus:border-primary-500 focus:ring-primary-500 dark:bg-secondary-900 dark:border-secondary-700 dark:text-secondary-100'
          )}
        />
        {isSearching && (
          <LoadingSpinner size="sm" className="absolute right-3 top-1/2 -translate-y-1/2" />
        )}
      </div>

      {showDropdown && displayResults && displayResults.length > 0 && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-secondary-200 bg-white shadow-lg dark:bg-secondary-800 dark:border-secondary-700 max-h-60 overflow-y-auto">
          {displayResults.map((recipient) => (
            <button
              key={recipient.id}
              type="button"
              onClick={() => handleSelect(recipient)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-secondary-50 dark:hover:bg-secondary-700 transition-colors',
                selectedId === recipient.id && 'bg-primary-50 dark:bg-primary-900/20'
              )}
            >
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-secondary-100 dark:bg-secondary-700 flex items-center justify-center">
                <UserIcon className="h-4 w-4 text-secondary-500 dark:text-secondary-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100 truncate">
                  {recipient.name}
                </p>
                <p className="text-xs text-secondary-500 dark:text-secondary-400 truncate">
                  {recipient.email || recipient.phone || recipient.accountNumber}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {showDropdown && query.length >= 2 && !isSearching && displayResults?.length === 0 && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-secondary-200 bg-white shadow-lg dark:bg-secondary-800 dark:border-secondary-700 p-4 text-center">
          <p className="text-sm text-secondary-500 dark:text-secondary-400">No recipients found</p>
        </div>
      )}

      {/* Click-away handler */}
      {showDropdown && (
        <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
      )}
    </div>
  );
}

interface PaymentMethodSelectorProps {
  value?: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
  savedMethods?: PaymentMethodInfo[];
  error?: string;
}

function PaymentMethodSelector({ value, onChange, savedMethods, error }: PaymentMethodSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
        Payment Method
      </label>
      <div className="grid grid-cols-2 gap-3">
        {PAYMENT_METHODS.map((method) => {
          const savedMethod = savedMethods?.find((m) => m.type === method.value);
          return (
            <button
              key={method.value}
              type="button"
              onClick={() => onChange(method.value)}
              className={cn(
                'relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all duration-200',
                value === method.value
                  ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500 dark:bg-primary-900/20 dark:border-primary-400'
                  : 'border-secondary-200 bg-white hover:border-secondary-300 dark:bg-secondary-800 dark:border-secondary-700 dark:hover:border-secondary-600'
              )}
            >
              <span className="text-2xl">{method.icon}</span>
              <span className="text-xs font-medium text-secondary-700 dark:text-secondary-300">
                {method.label}
              </span>
              {savedMethod && (
                <span className="text-xs text-secondary-500 dark:text-secondary-400">
                  {savedMethod.last4 ? `•••• ${savedMethod.last4}` : savedMethod.bankName || ''}
                </span>
              )}
              {value === method.value && (
                <CheckCircleIcon className="absolute top-2 right-2 h-4 w-4 text-primary-500" />
              )}
            </button>
          );
        })}
      </div>
      {error && <p className="mt-1.5 text-sm text-danger-600 dark:text-danger-400">{error}</p>}
    </div>
  );
}

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  formData: PaymentFormData | null;
  estimatedFee?: number;
}

function ConfirmationModal({ isOpen, onClose, onConfirm, isLoading, formData, estimatedFee }: ConfirmationModalProps) {
  if (!formData || formData.amount == null) return null;

  const currency = CURRENCIES.find((c) => c.value === formData.currency);
  const method = PAYMENT_METHODS.find((m) => m.value === formData.method);
  const totalAmount = (formData.amount || 0) + (estimatedFee || 0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" closeOnOverlayClick={!isLoading}>
      <ModalHeader>Confirm Payment</ModalHeader>
      <ModalBody>
        <div className="space-y-4">
          <div className="rounded-xl bg-secondary-50 dark:bg-secondary-800 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-secondary-500 dark:text-secondary-400">To</span>
              <span className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                {formData.recipientName}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-secondary-500 dark:text-secondary-400">Amount</span>
              <span className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                {currency?.symbol}{formData.amount.toLocaleString()}
              </span>
            </div>
            {estimatedFee !== undefined && estimatedFee > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-secondary-500 dark:text-secondary-400">Fee</span>
                <span className="text-sm text-secondary-600 dark:text-secondary-300">
                  {currency?.symbol}{estimatedFee.toLocaleString()}
                </span>
              </div>
            )}
            <div className="border-t border-secondary-200 dark:border-secondary-700 pt-3 flex items-center justify-between">
              <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300">Total</span>
              <span className="text-lg font-bold text-secondary-900 dark:text-secondary-100">
                {currency?.symbol}{totalAmount.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-secondary-500 dark:text-secondary-400">Method</span>
              <span className="text-sm text-secondary-700 dark:text-secondary-300">
                {method?.icon} {method?.label}
              </span>
            </div>
            {formData.description && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-secondary-500 dark:text-secondary-400">Note</span>
                <span className="text-sm text-secondary-700 dark:text-secondary-300 max-w-[200px] truncate">
                  {formData.description}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-start gap-2 rounded-lg bg-warning-50 dark:bg-warning-900/20 p-3 border border-warning-200 dark:border-warning-800">
            <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0 text-warning-600 dark:text-warning-400" />
            <p className="text-xs text-warning-700 dark:text-warning-300">
              Please review the details carefully. This action cannot be undone once confirmed.
            </p>
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <div className="flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={onConfirm} isLoading={isLoading}>
            Confirm & Pay
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
}

interface PaymentSuccessProps {
  transactionId: string;
  amount: number;
  currency: string;
  recipientName: string;
  onViewDetails: () => void;
  onNewPayment: () => void;
}

function PaymentSuccess({ transactionId, amount, currency, recipientName, onViewDetails, onNewPayment }: PaymentSuccessProps) {
  const curr = CURRENCIES.find((c) => c.value === currency);

  return (
    <div className="mx-auto max-w-lg text-center space-y-6 py-10">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-100 dark:bg-success-900/30">
        <CheckCircleIcon className="h-10 w-10 text-success-600 dark:text-success-400" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-secondary-900 dark:text-white">
          Payment Successful!
        </h2>
        <p className="text-secondary-500 dark:text-secondary-400">
          Your payment of <span className="font-semibold text-secondary-900 dark:text-white">{curr?.symbol}{amount.toLocaleString()}</span>{' '}
          to <span className="font-semibold text-secondary-900 dark:text-white">{recipientName}</span> has been initiated.
        </p>
      </div>
      <div className="rounded-lg bg-secondary-50 dark:bg-secondary-800 p-4 inline-block">
        <p className="text-xs text-secondary-500 dark:text-secondary-400 mb-1">Transaction Reference</p>
        <p className="text-sm font-mono font-medium text-secondary-900 dark:text-secondary-100">
          {transactionId}
        </p>
      </div>
      <div className="flex items-center justify-center gap-3 pt-4">
        <Button variant="outline" onClick={onNewPayment}>
          New Payment
        </Button>
        <Button variant="primary" onClick={onViewDetails}>
          View Details
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// Main PaymentsPage Component
// ============================================================================

export function PaymentsPage() {
  const navigate = useNavigate();
  const { success: toastSuccess, error: toastError } = useToast();

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [estimatedFee, setEstimatedFee] = useState<number | undefined>();
  const [pendingIdempotencyKey, setPendingIdempotencyKey] = useState<string>('');
  const [paymentResult, setPaymentResult] = useState<{
    transactionId: string;
    amount: number;
    currency: string;
    recipientName: string;
  } | null>(null);

  const { data: accountsData, isLoading: isLoadingAccounts } = useAccounts({ status: 'active' });
  const { data: paymentMethodsData } = usePaymentMethods();
  const initiatePayment = useInitiatePayment();
  const validatePayment = useValidatePayment();

  const accounts = accountsData?.items || [];

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isValid },
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    mode: 'onChange',
    defaultValues: {
      currency: 'INR',
      accountId: '',
      recipientId: '',
      recipientName: '',
      method: undefined,
      amount: undefined,
      description: '',
    },
  });

  const watchedAccountId = watch('accountId');
  const watchedAmount = watch('amount');
  const watchedCurrency = watch('currency');

  const { data: balanceData } = useAccountBalance(watchedAccountId);

  const selectedCurrency = useMemo(
    () => CURRENCIES.find((c) => c.value === watchedCurrency),
    [watchedCurrency]
  );

  const insufficientFunds = useMemo(() => {
    if (!balanceData || !watchedAmount) return false;
    return watchedAmount > balanceData.availableBalance;
  }, [balanceData, watchedAmount]);

  const handleRecipientSelect = useCallback(
    (recipient: { id: string; name: string }) => {
      setValue('recipientId', recipient.id, { shouldValidate: true });
      setValue('recipientName', recipient.name, { shouldValidate: true });
    },
    [setValue]
  );

  const onSubmitForm = handleSubmit(async (data) => {
    // Generate idempotency key once, reuse for confirm
    const idempotencyKey = crypto.randomUUID();
    setPendingIdempotencyKey(idempotencyKey);
    const payload: InitiatePaymentRequest = {
      accountId: data.accountId,
      amount: data.amount,
      currency: data.currency,
      method: data.method,
      recipientId: data.recipientId,
      description: data.description || undefined,
      idempotencyKey,
    };

    try {
      const validation = await validatePayment.mutateAsync(payload);
      if (!validation.valid) {
        validation.errors?.forEach((err) => toastError('Validation Error', err));
        return;
      }
      setEstimatedFee(validation.estimatedFee);
      setShowConfirmModal(true);
    } catch {
      // Validation endpoint unavailable, proceed to confirmation anyway
      setShowConfirmModal(true);
    }
  });

  const handleConfirmPayment = async () => {
    const data = watch();
    const payload: InitiatePaymentRequest = {
      accountId: data.accountId,
      amount: data.amount!,
      currency: data.currency,
      method: data.method!,
      recipientId: data.recipientId,
      description: data.description || undefined,
      idempotencyKey: pendingIdempotencyKey,
    };

    try {
      const result = await initiatePayment.mutateAsync(payload);
      setShowConfirmModal(false);
      setPaymentResult({
        transactionId: result.transaction.id,
        amount: data.amount!,
        currency: data.currency,
        recipientName: data.recipientName,
      });
      toastSuccess('Payment Initiated', 'Your payment has been submitted successfully.');
    } catch (err: any) {
      setShowConfirmModal(false);
      toastError(
        'Payment Failed',
        err?.response?.data?.error?.message || 'Something went wrong. Please try again.'
      );
    }
  };

  const handleNewPayment = () => {
    setPaymentResult(null);
    setEstimatedFee(undefined);
    reset();
  };

  const handleViewDetails = () => {
    if (paymentResult) {
      navigate(`/transactions/${paymentResult.transactionId}`);
    }
  };

  // Show success screen
  if (paymentResult) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">
            New Payment
          </h1>
        </div>
        <div className="rounded-xl bg-white dark:bg-secondary-800 shadow-sm ring-1 ring-secondary-100 dark:ring-secondary-700">
          <PaymentSuccess
            transactionId={paymentResult.transactionId}
            amount={paymentResult.amount}
            currency={paymentResult.currency}
            recipientName={paymentResult.recipientName}
            onViewDetails={handleViewDetails}
            onNewPayment={handleNewPayment}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">
          New Payment
        </h1>
        <p className="mt-1 text-sm text-secondary-500 dark:text-secondary-400">
          Initiate a new payment transaction.
        </p>
      </div>

      <form onSubmit={onSubmitForm} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recipient Selection */}
          <div className="rounded-xl bg-white dark:bg-secondary-800 p-6 shadow-sm ring-1 ring-secondary-100 dark:ring-secondary-700 space-y-5">
            <h2 className="text-base font-semibold text-secondary-900 dark:text-white flex items-center gap-2">
              <UserIcon className="h-5 w-5 text-secondary-400" />
              Recipient Details
            </h2>

            <RecipientSearch
              onSelect={handleRecipientSelect}
              selectedId={watch('recipientId')}
            />
            {errors.recipientId && (
              <p className="text-sm text-danger-600 dark:text-danger-400">{errors.recipientId.message}</p>
            )}
          </div>

          {/* Amount & Currency */}
          <div className="rounded-xl bg-white dark:bg-secondary-800 p-6 shadow-sm ring-1 ring-secondary-100 dark:ring-secondary-700 space-y-5">
            <h2 className="text-base font-semibold text-secondary-900 dark:text-white flex items-center gap-2">
              <BanknotesIcon className="h-5 w-5 text-secondary-400" />
              Payment Amount
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1.5">
                  Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-secondary-500">
                    {selectedCurrency?.symbol}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    {...register('amount', { valueAsNumber: true })}
                    placeholder="0.00"
                    className={cn(
                      'w-full pl-8 pr-4 py-2.5 rounded-lg border text-sm transition-all duration-200 focus:outline-none focus:ring-2',
                      errors.amount || insufficientFunds
                        ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500'
                        : 'border-secondary-300 focus:border-primary-500 focus:ring-primary-500 dark:bg-secondary-900 dark:border-secondary-700 dark:text-secondary-100'
                    )}
                  />
                </div>
                {errors.amount && (
                  <p className="mt-1 text-sm text-danger-600 dark:text-danger-400">{errors.amount.message}</p>
                )}
                {insufficientFunds && !errors.amount && (
                  <p className="mt-1 text-sm text-danger-600 dark:text-danger-400">Insufficient balance</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1.5">
                  Currency
                </label>
                <select
                  {...register('currency')}
                  className="w-full px-3 py-2.5 rounded-lg border border-secondary-300 text-sm bg-white focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-500 dark:bg-secondary-900 dark:border-secondary-700 dark:text-secondary-100"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description / Note */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1.5">
                Description (optional)
              </label>
              <textarea
                {...register('description')}
                rows={2}
                maxLength={200}
                placeholder="Add a note for this payment..."
                className="w-full px-4 py-2.5 rounded-lg border border-secondary-300 text-sm resize-none transition-all duration-200 focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-500 dark:bg-secondary-900 dark:border-secondary-700 dark:text-secondary-100 dark:placeholder-secondary-500"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-danger-600 dark:text-danger-400">{errors.description.message}</p>
              )}
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="rounded-xl bg-white dark:bg-secondary-800 p-6 shadow-sm ring-1 ring-secondary-100 dark:ring-secondary-700 space-y-5">
            <Controller
              name="method"
              control={control}
              render={({ field }) => (
                <PaymentMethodSelector
                  value={field.value}
                  onChange={field.onChange}
                  savedMethods={paymentMethodsData}
                  error={errors.method?.message}
                />
              )}
            />
          </div>

          {/* Source Account */}
          <div className="rounded-xl bg-white dark:bg-secondary-800 p-6 shadow-sm ring-1 ring-secondary-100 dark:ring-secondary-700 space-y-5">
            <h2 className="text-base font-semibold text-secondary-900 dark:text-white">
              Source Account
            </h2>

            {isLoadingAccounts ? (
              <div className="flex items-center justify-center py-6">
                <LoadingSpinner size="md" />
              </div>
            ) : accounts.length === 0 ? (
              <p className="text-sm text-secondary-500 dark:text-secondary-400">
                No active accounts found.
              </p>
            ) : (
              <div className="space-y-3">
                {accounts.map((account) => (
                  <label
                    key={account.id}
                    className={cn(
                      'flex items-center gap-4 rounded-xl border-2 p-4 cursor-pointer transition-all duration-200',
                      watchedAccountId === account.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-400'
                        : 'border-secondary-200 hover:border-secondary-300 dark:border-secondary-700 dark:hover:border-secondary-600'
                    )}
                  >
                    <input
                      type="radio"
                      value={account.id}
                      {...register('accountId')}
                      className="sr-only"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100 capitalize">
                          {account.accountType} Account
                        </p>
                        <Badge variant="success" size="sm">{account.status}</Badge>
                      </div>
                      <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-0.5 font-mono">
                        •••• {account.accountNumber.slice(-4)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-secondary-900 dark:text-secondary-100">
                        {account.currency === 'INR' ? '₹' : account.currency === 'USD' ? '$' : account.currency}{' '}
                        {account.availableBalance.toLocaleString()}
                      </p>
                      <p className="text-xs text-secondary-500 dark:text-secondary-400">Available</p>
                    </div>
                    {watchedAccountId === account.id && (
                      <CheckCircleIcon className="h-5 w-5 text-primary-500 flex-shrink-0" />
                    )}
                  </label>
                ))}
              </div>
            )}
            {errors.accountId && (
              <p className="text-sm text-danger-600 dark:text-danger-400">{errors.accountId.message}</p>
            )}
          </div>

          {/* Submit Button (mobile) */}
          <div className="lg:hidden">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={!isValid || insufficientFunds}
              isLoading={validatePayment.isPending}
            >
              Review & Pay
            </Button>
          </div>
        </div>

        {/* Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 space-y-6">
            <div className="rounded-xl bg-white dark:bg-secondary-800 p-6 shadow-sm ring-1 ring-secondary-100 dark:ring-secondary-700 space-y-4">
              <h3 className="text-sm font-semibold text-secondary-900 dark:text-white">
                Payment Summary
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-secondary-500 dark:text-secondary-400">Recipient</span>
                  <span className="text-sm font-medium text-secondary-900 dark:text-secondary-100 max-w-[140px] truncate">
                    {watch('recipientName') || '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-secondary-500 dark:text-secondary-400">Amount</span>
                  <span className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                    {watchedAmount
                      ? `${selectedCurrency?.symbol}${watchedAmount.toLocaleString()}`
                      : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-secondary-500 dark:text-secondary-400">Method</span>
                  <span className="text-sm text-secondary-700 dark:text-secondary-300">
                    {PAYMENT_METHODS.find((m) => m.value === watch('method'))?.label || '—'}
                  </span>
                </div>
                {estimatedFee !== undefined && estimatedFee > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-secondary-500 dark:text-secondary-400">Est. Fee</span>
                    <span className="text-sm text-secondary-600 dark:text-secondary-300">
                      {selectedCurrency?.symbol}{estimatedFee.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              <div className="border-t border-secondary-200 dark:border-secondary-700 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300">Total</span>
                  <span className="text-lg font-bold text-secondary-900 dark:text-white">
                    {watchedAmount
                      ? `${selectedCurrency?.symbol}${(watchedAmount + (estimatedFee || 0)).toLocaleString()}`
                      : '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Balance info */}
            {balanceData && (
              <div className="rounded-xl bg-white dark:bg-secondary-800 p-6 shadow-sm ring-1 ring-secondary-100 dark:ring-secondary-700">
                <h3 className="text-sm font-semibold text-secondary-900 dark:text-white mb-3">
                  Account Balance
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-secondary-500 dark:text-secondary-400">Available</span>
                    <span className={cn(
                      'text-sm font-semibold',
                      insufficientFunds
                        ? 'text-danger-600 dark:text-danger-400'
                        : 'text-success-600 dark:text-success-400'
                    )}>
                      {balanceData.currency === 'INR' ? '₹' : balanceData.currency}{' '}
                      {balanceData.availableBalance.toLocaleString()}
                    </span>
                  </div>
                  {watchedAmount && !insufficientFunds && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-secondary-500 dark:text-secondary-400">After payment</span>
                      <span className="text-sm text-secondary-700 dark:text-secondary-300">
                        {balanceData.currency === 'INR' ? '₹' : balanceData.currency}{' '}
                        {(balanceData.availableBalance - watchedAmount - (estimatedFee || 0)).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Submit button (desktop) */}
            <div className="hidden lg:block">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={!isValid || insufficientFunds}
                isLoading={validatePayment.isPending}
              >
                Review & Pay
              </Button>
            </div>
          </div>
        </div>
      </form>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmPayment}
        isLoading={initiatePayment.isPending}
        formData={watch() as PaymentFormData}
        estimatedFee={estimatedFee}
      />
    </div>
  );
}
