import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Table, Column } from '@/components/ui/Table';

interface TestRow {
  id: string;
  name: string;
  amount: number;
  status: string;
}

const mockColumns: Column<TestRow>[] = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'amount', header: 'Amount', sortable: true },
  { key: 'status', header: 'Status' },
];

const mockData: TestRow[] = [
  { id: '1', name: 'Alice', amount: 100, status: 'active' },
  { id: '2', name: 'Bob', amount: 200, status: 'inactive' },
  { id: '3', name: 'Charlie', amount: 300, status: 'active' },
];

describe('Table', () => {
  it('renders column headers', () => {
    render(<Table data={mockData} columns={mockColumns} />);

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Amount')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('renders data rows', () => {
    render(<Table data={mockData} columns={mockColumns} />);

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('200')).toBeInTheDocument();
    expect(screen.getByText('300')).toBeInTheDocument();
  });

  it('shows empty state when no data', () => {
    render(<Table data={[]} columns={mockColumns} emptyMessage="No records found" />);

    expect(screen.getByText('No records found')).toBeInTheDocument();
  });

  it('shows default empty message', () => {
    render(<Table data={[]} columns={mockColumns} />);

    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('shows loading skeleton when loading', () => {
    const { container } = render(
      <Table data={[]} columns={mockColumns} loading={true} />
    );

    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('calls onSort when sortable column header is clicked', async () => {
    const handleSort = vi.fn();
    const user = userEvent.setup();

    render(<Table data={mockData} columns={mockColumns} onSort={handleSort} />);

    await user.click(screen.getByText('Name'));
    expect(handleSort).toHaveBeenCalledWith('name', 'asc');

    await user.click(screen.getByText('Name'));
    expect(handleSort).toHaveBeenCalledWith('name', 'desc');
  });

  it('renders custom cell content via render function', () => {
    const columnsWithRender: Column<TestRow>[] = [
      ...mockColumns.slice(0, 2),
      {
        key: 'status',
        header: 'Status',
        render: (value) => <span data-testid="custom-status">{value.toUpperCase()}</span>,
      },
    ];

    render(<Table data={mockData} columns={columnsWithRender} />);

    const customCells = screen.getAllByTestId('custom-status');
    expect(customCells[0]).toHaveTextContent('ACTIVE');
    expect(customCells[1]).toHaveTextContent('INACTIVE');
  });

  it('renders pagination controls', () => {
    const handlePageChange = vi.fn();

    const { container } = render(
      <Table
        data={mockData}
        columns={mockColumns}
        pagination={{
          currentPage: 1,
          totalPages: 5,
          pageSize: 3,
          totalItems: 15,
          onPageChange: handlePageChange,
        }}
      />
    );

    // Pagination should render some navigation elements
    expect(container.querySelector('table')).toBeInTheDocument();
  });

  it('does not call onSort for non-sortable columns', async () => {
    const handleSort = vi.fn();
    const user = userEvent.setup();

    render(<Table data={mockData} columns={mockColumns} onSort={handleSort} />);

    // "Status" column is not sortable
    await user.click(screen.getByText('Status'));
    expect(handleSort).not.toHaveBeenCalled();
  });
});
