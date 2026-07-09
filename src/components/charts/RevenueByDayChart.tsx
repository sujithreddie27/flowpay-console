import { memo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { ChartWrapper } from './ChartWrapper';
import type { RevenueByDay } from '@/types';

interface RevenueByDayChartProps {
  data: RevenueByDay[];
  loading?: boolean;
  error?: boolean;
  headerAction?: React.ReactNode;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

function formatRevenue(value: number): string {
  if (value >= 10_00_000) return `₹${(value / 10_00_000).toFixed(1)}M`;
  if (value >= 1_000) return `₹${(value / 1_000).toFixed(1)}K`;
  return `₹${value}`;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-secondary-200 bg-white px-4 py-3 shadow-lg dark:border-secondary-700 dark:bg-secondary-800">
      <p className="text-xs font-medium text-secondary-500 dark:text-secondary-400 mb-2">
        {formatDate(label)}
      </p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center gap-2 text-sm">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-secondary-600 dark:text-secondary-300">
            Revenue:
          </span>
          <span className="font-semibold text-secondary-900 dark:text-white">
            {formatRevenue(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export const RevenueByDayChart = memo(function RevenueByDayChart({
  data,
  loading,
  error,
  headerAction,
}: RevenueByDayChartProps) {
  return (
    <ChartWrapper
      title="Revenue by Day"
      subtitle="Daily revenue from transaction fees"
      loading={loading}
      error={error}
      empty={!loading && !error && data.length === 0}
      emptyMessage="No revenue data for the selected period."
      height={340}
      headerAction={headerAction}
    >
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--chart-grid, #e2e8f0)"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fontSize: 12, fill: 'var(--chart-text, #94a3b8)' }}
            axisLine={false}
            tickLine={false}
            dy={8}
          />
          <YAxis
            tickFormatter={formatRevenue}
            tick={{ fontSize: 12, fill: 'var(--chart-text, #94a3b8)' }}
            axisLine={false}
            tickLine={false}
            width={60}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--chart-cursor, rgba(14, 165, 233, 0.06))' }} />
          <Legend
            verticalAlign="top"
            align="right"
            height={36}
            iconType="circle"
            iconSize={8}
            formatter={() => (
              <span className="text-xs text-secondary-600 dark:text-secondary-400">
                Revenue
              </span>
            )}
          />
          <Bar
            dataKey="revenue"
            fill="#0ea5e9"
            radius={[4, 4, 0, 0]}
            maxBarSize={48}
            name="Revenue"
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
});
