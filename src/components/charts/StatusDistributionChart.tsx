import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';
import { ChartWrapper } from './ChartWrapper';
import type { TransactionStatusDistribution } from '@/types';

interface StatusDistributionChartProps {
  data: TransactionStatusDistribution[];
  loading?: boolean;
  error?: boolean;
  headerAction?: React.ReactNode;
}

const STATUS_COLORS: Record<string, string> = {
  completed: '#22c55e',
  pending: '#f59e0b',
  processing: '#0ea5e9',
  failed: '#ef4444',
  reversed: '#8b5cf6',
  cancelled: '#6b7280',
};

const STATUS_LABELS: Record<string, string> = {
  completed: 'Completed',
  pending: 'Pending',
  processing: 'Processing',
  failed: 'Failed',
  reversed: 'Reversed',
  cancelled: 'Cancelled',
};

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;

  const item = payload[0];
  return (
    <div className="rounded-lg border border-secondary-200 bg-white px-4 py-3 shadow-lg dark:border-secondary-700 dark:bg-secondary-800">
      <div className="flex items-center gap-2">
        <span
          className="inline-block h-3 w-3 rounded-full"
          style={{ backgroundColor: item.payload.fill }}
        />
        <span className="text-sm font-medium text-secondary-900 dark:text-white">
          {STATUS_LABELS[item.name] ?? item.name}
        </span>
      </div>
      <div className="mt-1 space-y-0.5">
        <p className="text-xs text-secondary-500 dark:text-secondary-400">
          Count: <span className="font-semibold text-secondary-900 dark:text-white">{item.value.toLocaleString('en-IN')}</span>
        </p>
        <p className="text-xs text-secondary-500 dark:text-secondary-400">
          Share: <span className="font-semibold text-secondary-900 dark:text-white">{item.payload.percentage.toFixed(1)}%</span>
        </p>
      </div>
    </div>
  );
}

function CustomLegend({ payload }: any) {
  if (!payload?.length) return null;

  return (
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 pt-2">
      {payload.map((entry: any) => (
        <div key={entry.value} className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs text-secondary-600 dark:text-secondary-400">
            {STATUS_LABELS[entry.value] ?? entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

const RADIAN = Math.PI / 180;

function renderCustomLabel({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percentage,
}: any) {
  if (percentage < 5) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="#fff"
      textAnchor="middle"
      dominantBaseline="central"
      className="text-xs font-semibold"
    >
      {`${percentage.toFixed(0)}%`}
    </text>
  );
}

export function StatusDistributionChart({
  data,
  loading,
  error,
  headerAction,
}: StatusDistributionChartProps) {
  return (
    <ChartWrapper
      title="Status Distribution"
      subtitle="Transaction breakdown by status"
      loading={loading}
      error={error}
      empty={!loading && !error && data.length === 0}
      emptyMessage="No status data available."
      height={340}
      headerAction={headerAction}
    >
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="status"
            cx="50%"
            cy="45%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            strokeWidth={0}
            label={renderCustomLabel}
            labelLine={false}
          >
            {data.map((entry) => (
              <Cell
                key={entry.status}
                fill={STATUS_COLORS[entry.status] ?? '#94a3b8'}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} verticalAlign="bottom" />
        </PieChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
}
