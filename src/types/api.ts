// ============================================================================
// API Request & Response Types
// ============================================================================

// Common Types
// ----------------------------------------------------------------------------

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Authentication Types
// ----------------------------------------------------------------------------

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  user: UserProfile;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RegisterRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

export interface RegisterResponse {
  user: UserProfile;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'user' | 'operator';
  avatar?: string;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  updatedAt: string;
}

// Account Types
// ----------------------------------------------------------------------------

export interface Account {
  id: string;
  userId: string;
  accountNumber: string;
  accountType: 'savings' | 'current' | 'wallet';
  currency: string;
  balance: number;
  availableBalance: number;
  status: 'active' | 'frozen' | 'closed';
  createdAt: string;
  updatedAt: string;
  lastActivityAt?: string;
}

export interface CreateAccountRequest {
  accountType: 'savings' | 'current' | 'wallet';
  currency: string;
}

export interface UpdateAccountRequest {
  status?: 'active' | 'frozen' | 'closed';
}

export interface AccountListParams extends PaginationParams {
  status?: 'active' | 'frozen' | 'closed';
  accountType?: 'savings' | 'current' | 'wallet';
}

export interface AccountBalanceHistory {
  date: string;
  balance: number;
  change: number;
}

// Transaction Types
// ----------------------------------------------------------------------------

export type TransactionStatus = 
  | 'pending' 
  | 'processing' 
  | 'completed' 
  | 'failed' 
  | 'reversed' 
  | 'cancelled';

export type TransactionType = 
  | 'credit' 
  | 'debit' 
  | 'transfer' 
  | 'payment' 
  | 'refund' 
  | 'reversal';

export interface Transaction {
  id: string;
  referenceId: string;
  accountId: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  currency: string;
  fee: number;
  netAmount: number;
  description?: string;
  metadata?: Record<string, any>;
  sender?: TransactionParty;
  recipient?: TransactionParty;
  initiatedAt: string;
  processedAt?: string;
  completedAt?: string;
  failedAt?: string;
  failureReason?: string;
  idempotencyKey?: string;
}

export interface TransactionParty {
  id: string;
  name: string;
  accountNumber: string;
  email?: string;
  phone?: string;
}

export interface TransactionListParams extends PaginationParams {
  status?: TransactionStatus | TransactionStatus[];
  type?: TransactionType | TransactionType[];
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
  search?: string;
  accountId?: string;
}

export interface InitiateTransactionRequest {
  accountId: string;
  type: TransactionType;
  amount: number;
  currency: string;
  recipientId?: string;
  recipientAccountNumber?: string;
  description?: string;
  idempotencyKey: string;
  metadata?: Record<string, any>;
}

export interface TransactionTimeline {
  status: TransactionStatus;
  timestamp: string;
  message: string;
  metadata?: Record<string, any>;
}

export interface TransactionDetails extends Transaction {
  timeline: TransactionTimeline[];
  auditLog: AuditLogEntry[];
}

// Payment Types
// ----------------------------------------------------------------------------

export type PaymentMethod = 'card' | 'bank_transfer' | 'wallet' | 'upi';

export type PaymentStatus = 
  | 'pending' 
  | 'authorized' 
  | 'captured' 
  | 'failed' 
  | 'cancelled' 
  | 'refunded';

export interface Payment {
  id: string;
  transactionId: string;
  accountId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  recipientId: string;
  recipientName: string;
  description?: string;
  initiatedAt: string;
  completedAt?: string;
  failedAt?: string;
  failureReason?: string;
  metadata?: Record<string, any>;
}

export interface InitiatePaymentRequest {
  accountId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  recipientId?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  recipientAccountNumber?: string;
  description?: string;
  idempotencyKey: string;
  metadata?: Record<string, any>;
}

export interface InitiatePaymentResponse {
  payment: Payment;
  transaction: Transaction;
  requiresConfirmation: boolean;
  confirmationUrl?: string;
}

export interface RetryPaymentRequest {
  paymentId: string;
  idempotencyKey: string;
}

export interface CancelPaymentRequest {
  paymentId: string;
  reason?: string;
}

export interface PaymentMethodInfo {
  id: string;
  type: PaymentMethod;
  last4?: string;
  expiryMonth?: number;
  expiryYear?: number;
  bankName?: string;
  isDefault: boolean;
  createdAt: string;
}

// Dashboard & Analytics Types
// ----------------------------------------------------------------------------

export interface DashboardStats {
  totalTransactions: {
    today: number;
    week: number;
    month: number;
  };
  totalVolume: {
    today: number;
    week: number;
    month: number;
    currency: string;
  };
  successRate: {
    today: number;
    week: number;
    month: number;
  };
  activeAccounts: number;
}

export interface TransactionVolumeData {
  date: string;
  volume: number;
  count: number;
}

export interface TransactionStatusDistribution {
  status: TransactionStatus;
  count: number;
  percentage: number;
}

export interface RevenueByDay {
  date: string;
  revenue: number;
  currency: string;
}

export interface DashboardChartData {
  volumeData: TransactionVolumeData[];
  statusDistribution: TransactionStatusDistribution[];
  revenueData: RevenueByDay[];
}

// Settings Types
// ----------------------------------------------------------------------------

export interface UpdateProfileRequest {
  name?: string;
  phone?: string;
  avatar?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface NotificationPreferences {
  email: {
    transactionAlerts: boolean;
    paymentReminders: boolean;
    securityAlerts: boolean;
    newsletter: boolean;
  };
  push: {
    transactionAlerts: boolean;
    paymentReminders: boolean;
    securityAlerts: boolean;
  };
  sms: {
    transactionAlerts: boolean;
    securityAlerts: boolean;
  };
}

export interface UpdateNotificationPreferencesRequest {
  preferences: NotificationPreferences;
}

// Audit & Monitoring Types
// ----------------------------------------------------------------------------

export interface AuditLogEntry {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  resourceId: string;
  changes?: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}

export interface AuditLogParams extends PaginationParams {
  userId?: string;
  action?: string;
  resource?: string;
  dateFrom?: string;
  dateTo?: string;
}

// WebSocket Types
// ----------------------------------------------------------------------------

export interface WebSocketMessage<T = any> {
  type: string;
  payload: T;
  timestamp: string;
}

export interface TransactionUpdateMessage {
  transactionId: string;
  status: TransactionStatus;
  message: string;
  timestamp: string;
}

export interface SystemNotificationMessage {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  timestamp: string;
}
