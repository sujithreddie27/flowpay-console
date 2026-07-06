import { http, HttpResponse } from 'msw';

// ============================================================================
// Mock Data
// ============================================================================

export const mockUser = {
  id: 'user-1',
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+1234567890',
  role: 'user' as const,
  avatar: undefined,
  status: 'active' as const,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-15T00:00:00Z',
};

export const mockLoginResponse = {
  user: mockUser,
  accessToken: 'mock-access-token-jwt',
  refreshToken: 'mock-refresh-token-jwt',
  expiresIn: 3600,
};

export const mockTransactions = [
  {
    id: 'txn-1',
    referenceId: 'REF-001',
    accountId: 'acc-1',
    type: 'credit' as const,
    status: 'completed' as const,
    amount: 5000,
    currency: 'INR',
    fee: 25,
    netAmount: 4975,
    description: 'Salary payment',
    sender: { id: 'sender-1', name: 'Acme Corp', accountNumber: '1234567890', email: 'acme@example.com' },
    recipient: { id: 'user-1', name: 'John Doe', accountNumber: '0987654321', email: 'john@example.com' },
    initiatedAt: '2024-01-15T10:00:00Z',
    processedAt: '2024-01-15T10:01:00Z',
    completedAt: '2024-01-15T10:02:00Z',
  },
  {
    id: 'txn-2',
    referenceId: 'REF-002',
    accountId: 'acc-1',
    type: 'debit' as const,
    status: 'pending' as const,
    amount: 1500,
    currency: 'INR',
    fee: 10,
    netAmount: 1490,
    description: 'Electricity bill',
    sender: { id: 'user-1', name: 'John Doe', accountNumber: '0987654321', email: 'john@example.com' },
    recipient: { id: 'rec-1', name: 'Electric Co', accountNumber: '1111111111', email: 'bill@electric.com' },
    initiatedAt: '2024-01-16T08:00:00Z',
  },
  {
    id: 'txn-3',
    referenceId: 'REF-003',
    accountId: 'acc-1',
    type: 'transfer' as const,
    status: 'failed' as const,
    amount: 2000,
    currency: 'INR',
    fee: 15,
    netAmount: 1985,
    description: 'Transfer to savings',
    sender: { id: 'user-1', name: 'John Doe', accountNumber: '0987654321' },
    recipient: { id: 'user-1', name: 'John Doe', accountNumber: '5555555555' },
    initiatedAt: '2024-01-14T14:00:00Z',
    failedAt: '2024-01-14T14:01:00Z',
    failureReason: 'Insufficient funds',
  },
];

export const mockDashboardStats = {
  totalTransactions: { today: 42, week: 285, month: 1250 },
  totalVolume: { today: 150000, week: 980000, month: 4500000, currency: 'INR' },
  successRate: { current: 97.8, change: 1.2 },
  activeAccounts: { count: 156, change: 5.3 },
};

export const mockAccounts = [
  {
    id: 'acc-1',
    userId: 'user-1',
    accountNumber: '0987654321',
    accountType: 'savings' as const,
    currency: 'INR',
    balance: 125000,
    availableBalance: 120000,
    status: 'active' as const,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
    lastActivityAt: '2024-01-15T10:02:00Z',
  },
];

// ============================================================================
// Request Handlers
// ============================================================================

const BASE_URL = 'http://localhost:8080/api/v1';

export const handlers = [
  // Auth endpoints
  http.post(`${BASE_URL}/auth/login`, async ({ request }) => {
    const body = await request.json() as { email: string; password: string };

    if (body.email === 'john@example.com' && body.password === 'password123') {
      return HttpResponse.json({
        success: true,
        data: mockLoginResponse,
        timestamp: new Date().toISOString(),
      });
    }

    return HttpResponse.json(
      {
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
        timestamp: new Date().toISOString(),
      },
      { status: 401 }
    );
  }),

  http.post(`${BASE_URL}/auth/register`, async ({ request }) => {
    const body = await request.json() as { name: string; email: string };
    return HttpResponse.json({
      success: true,
      data: {
        user: { ...mockUser, name: body.name, email: body.email },
        accessToken: 'mock-access-token-jwt',
        refreshToken: 'mock-refresh-token-jwt',
        expiresIn: 3600,
      },
      timestamp: new Date().toISOString(),
    });
  }),

  http.post(`${BASE_URL}/auth/refresh`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        accessToken: 'new-mock-access-token-jwt',
        refreshToken: 'new-mock-refresh-token-jwt',
        expiresIn: 3600,
      },
      timestamp: new Date().toISOString(),
    });
  }),

  http.post(`${BASE_URL}/auth/logout`, () => {
    return HttpResponse.json({
      success: true,
      data: null,
      timestamp: new Date().toISOString(),
    });
  }),

  http.get(`${BASE_URL}/auth/me`, () => {
    return HttpResponse.json({
      success: true,
      data: mockUser,
      timestamp: new Date().toISOString(),
    });
  }),

  // Transaction endpoints
  http.get(`${BASE_URL}/transactions`, ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '20');
    const status = url.searchParams.get('status');
    const type = url.searchParams.get('type');
    const search = url.searchParams.get('search');

    let filtered = [...mockTransactions];

    if (status) {
      filtered = filtered.filter((t) => t.status === status);
    }
    if (type) {
      filtered = filtered.filter((t) => t.type === type);
    }
    if (search) {
      filtered = filtered.filter(
        (t) =>
          t.referenceId.toLowerCase().includes(search.toLowerCase()) ||
          t.description?.toLowerCase().includes(search.toLowerCase())
      );
    }

    return HttpResponse.json({
      success: true,
      data: {
        items: filtered.slice((page - 1) * pageSize, page * pageSize),
        total: filtered.length,
        page,
        pageSize,
        totalPages: Math.ceil(filtered.length / pageSize),
      },
      timestamp: new Date().toISOString(),
    });
  }),

  http.get(`${BASE_URL}/transactions/:id`, ({ params }) => {
    const txn = mockTransactions.find((t) => t.id === params.id);
    if (!txn) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Transaction not found' },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }
    return HttpResponse.json({
      success: true,
      data: { ...txn, timeline: [], auditLog: [] },
      timestamp: new Date().toISOString(),
    });
  }),

  // Dashboard endpoints
  http.get(`${BASE_URL}/dashboard/stats`, () => {
    return HttpResponse.json({
      success: true,
      data: mockDashboardStats,
      timestamp: new Date().toISOString(),
    });
  }),

  http.get(`${BASE_URL}/dashboard/charts`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        volume: [
          { date: '2024-01-10', count: 35, amount: 120000 },
          { date: '2024-01-11', count: 42, amount: 150000 },
          { date: '2024-01-12', count: 38, amount: 130000 },
        ],
        statusDistribution: [
          { status: 'completed', count: 180 },
          { status: 'pending', count: 25 },
          { status: 'failed', count: 8 },
        ],
        revenueByDay: [
          { date: '2024-01-10', revenue: 12000 },
          { date: '2024-01-11', revenue: 15000 },
          { date: '2024-01-12', revenue: 13000 },
        ],
      },
      timestamp: new Date().toISOString(),
    });
  }),

  // Payment endpoints
  http.post(`${BASE_URL}/payments/initiate`, async ({ request }) => {
    const body = await request.json() as { amount: number; currency: string };
    return HttpResponse.json({
      success: true,
      data: {
        payment: {
          id: 'pay-1',
          transactionId: 'txn-new-1',
          accountId: 'acc-1',
          amount: body.amount,
          currency: body.currency,
          method: 'bank_transfer',
          status: 'pending',
          recipientId: 'rec-1',
          recipientName: 'Jane Smith',
          initiatedAt: new Date().toISOString(),
        },
        transaction: {
          id: 'txn-new-1',
          referenceId: 'REF-NEW-001',
          status: 'pending',
        },
        requiresConfirmation: false,
      },
      timestamp: new Date().toISOString(),
    });
  }),

  http.post(`${BASE_URL}/payments/validate`, async ({ request }) => {
    const body = await request.json() as { amount?: number };
    if (!body.amount || body.amount <= 0) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Amount must be greater than 0' },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }
    return HttpResponse.json({
      success: true,
      data: { valid: true, estimatedFee: 25, estimatedDelivery: '2024-01-16T10:00:00Z' },
      timestamp: new Date().toISOString(),
    });
  }),

  // Account endpoints
  http.get(`${BASE_URL}/accounts`, () => {
    return HttpResponse.json({
      success: true,
      data: { items: mockAccounts, total: 1, page: 1, pageSize: 20, totalPages: 1 },
      timestamp: new Date().toISOString(),
    });
  }),

  http.get(`${BASE_URL}/accounts/:id/balance`, () => {
    return HttpResponse.json({
      success: true,
      data: { balance: 125000, availableBalance: 120000, currency: 'INR' },
      timestamp: new Date().toISOString(),
    });
  }),

  // Recipients
  http.get(`${BASE_URL}/payments/recipients`, () => {
    return HttpResponse.json({
      success: true,
      data: [
        { id: 'rec-1', name: 'Jane Smith', email: 'jane@example.com', accountNumber: '2222222222' },
        { id: 'rec-2', name: 'Bob Wilson', email: 'bob@example.com', phone: '+1987654321' },
      ],
      timestamp: new Date().toISOString(),
    });
  }),

  http.get(`${BASE_URL}/payments/recipients/search`, ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get('q') || '';
    const results = [
      { id: 'rec-1', name: 'Jane Smith', email: 'jane@example.com', accountNumber: '2222222222' },
      { id: 'rec-2', name: 'Bob Wilson', email: 'bob@example.com', phone: '+1987654321' },
    ].filter((r) => r.name.toLowerCase().includes(query.toLowerCase()));

    return HttpResponse.json({
      success: true,
      data: results,
      timestamp: new Date().toISOString(),
    });
  }),

  // Payment methods
  http.get(`${BASE_URL}/payments/methods`, () => {
    return HttpResponse.json({
      success: true,
      data: [
        { id: 'pm-1', type: 'card', last4: '4242', expiryMonth: 12, expiryYear: 2025, isDefault: true, createdAt: '2024-01-01T00:00:00Z' },
        { id: 'pm-2', type: 'bank_transfer', bankName: 'SBI', isDefault: false, createdAt: '2024-01-01T00:00:00Z' },
      ],
      timestamp: new Date().toISOString(),
    });
  }),

  // Recent transactions
  http.get(`${BASE_URL}/transactions/recent`, () => {
    return HttpResponse.json({
      success: true,
      data: mockTransactions,
      timestamp: new Date().toISOString(),
    });
  }),
];
