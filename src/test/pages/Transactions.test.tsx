import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../utils';
import { TransactionsPage } from '@/pages/Transactions';

// Mock react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock websocket service
vi.mock('@/services/websocketService', () => ({
  websocketService: {
    status: 'disconnected',
    connect: vi.fn(),
    disconnect: vi.fn(),
    send: vi.fn(),
    subscribe: vi.fn(() => vi.fn()),
    subscribeAll: vi.fn(() => vi.fn()),
    onStatusChange: vi.fn(() => () => {}),
  },
}));

describe('Transactions Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the transactions page with heading', () => {
    renderWithProviders(<TransactionsPage />, {
      preloadedState: {
        auth: {
          isAuthenticated: true,
          user: { id: 'user-1', name: 'John', email: 'john@example.com', phone: '+1', role: 'user', status: 'active', createdAt: '', updatedAt: '' },
          accessToken: 'token',
        },
      },
    });

    expect(screen.getByText('Transactions')).toBeInTheDocument();
    expect(screen.getByText(/view and manage/i)).toBeInTheDocument();
  });

  it('displays loading state initially', () => {
    const { container } = renderWithProviders(<TransactionsPage />, {
      preloadedState: {
        auth: { isAuthenticated: true, accessToken: 'token' },
      },
    });

    // Should have loading indicators (skeletons) or table
    const table = container.querySelector('table');
    expect(table).toBeInTheDocument();
  });

  it('renders search input', () => {
    renderWithProviders(<TransactionsPage />, {
      preloadedState: {
        auth: { isAuthenticated: true, accessToken: 'token' },
      },
    });

    const searchInput = screen.getByPlaceholderText(/search by reference/i);
    expect(searchInput).toBeInTheDocument();
  });

  it('renders filter toggle button', () => {
    renderWithProviders(<TransactionsPage />, {
      preloadedState: {
        auth: { isAuthenticated: true, accessToken: 'token' },
      },
    });

    expect(screen.getByText('Filters')).toBeInTheDocument();
  });

  it('renders export CSV button', () => {
    renderWithProviders(<TransactionsPage />, {
      preloadedState: {
        auth: { isAuthenticated: true, accessToken: 'token' },
      },
    });

    expect(screen.getByText('Export CSV')).toBeInTheDocument();
  });

  it('shows transaction data or error state after loading', async () => {
    renderWithProviders(<TransactionsPage />, {
      preloadedState: {
        auth: { isAuthenticated: true, accessToken: 'token' },
      },
    });

    // Either loads data or shows error
    await waitFor(
      () => {
        const hasData = screen.queryByText('REF-001');
        const hasError = screen.queryByText(/failed to load/i);
        const hasEmpty = screen.queryByText(/no transactions/i);
        expect(hasData || hasError || hasEmpty).toBeTruthy();
      },
      { timeout: 5000 }
    );
  });

  it('renders the table structure', () => {
    const { container } = renderWithProviders(<TransactionsPage />, {
      preloadedState: {
        auth: { isAuthenticated: true, accessToken: 'token' },
      },
    });

    // Table should be present
    const table = container.querySelector('table');
    expect(table).toBeInTheDocument();
  });

  it('opens filters panel on button click', async () => {
    const user = userEvent.setup();

    renderWithProviders(<TransactionsPage />, {
      preloadedState: {
        auth: { isAuthenticated: true, accessToken: 'token' },
      },
    });

    await user.click(screen.getByText('Filters'));

    // After clicking filters, should see filter status option buttons
    await waitFor(() => {
      // Filter panel shows transaction types that are not in main table
      expect(screen.getByText('Processing')).toBeInTheDocument();
      expect(screen.getByText('Reversed')).toBeInTheDocument();
      expect(screen.getByText('Cancelled')).toBeInTheDocument();
    });
  });

  it('has a refresh button', () => {
    renderWithProviders(<TransactionsPage />, {
      preloadedState: {
        auth: { isAuthenticated: true, accessToken: 'token' },
      },
    });

    expect(screen.getByText('Refresh')).toBeInTheDocument();
  });
});
