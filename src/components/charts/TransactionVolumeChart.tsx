import { memo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { ChartWrapper } from './ChartWrapper';
import type { TransactionVolumeData } from '@/types';

interface TransactionVolumeChartProps {
  data: TransactionVolumeData[];
  loading?: boolean;
  error?: boolean;
  headerAction?: React.ReactNode;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

function formatVolume(value: number): string {
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
            {entry.dataKey === 'volume' ? 'Volume' : 'Count'}:
          </span>
          <span className="font-semibold text-secondary-900 dark:text-white">
            {entry.dataKey === 'volume'
              ? formatVolume(entry.value)
              : entry.value.toLocaleString('en-IN')}
          </span>
        </div>
      ))}
    </div>
  );
}

export const TransactionVolumeChart = memo(function TransactionVolumeChart({
  data,
  loading,
  error,
  headerAction,
}: TransactionVolumeChartProps) {
  return (
    <ChartWrapper
      title="Transaction Volume"
      subtitle="Volume and count over time"
      loading={loading}
      error={error}
      empty={!loading && !error && data.length === 0}
      emptyMessage="No transaction data for the selected period."
      height={340}
      headerAction={headerAction}
    >
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
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
            tick={{ fontSize: 12, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
            dy={8}
          />
          <YAxis
            yAxisId="volume"
            orientation="left"
            tickFormatter={formatVolume}
            tick={{ fontSize: 12, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
            width={60}
          />
          <YAxis
            yAxisId="count"
            orientation="right"
            tick={{ fontSize: 12, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="top"
            align="right"
            height={36}
            iconType="circle"
            iconSize={8}
            formatter={(value: string) => (
              <span className="text-xs text-secondary-600 dark:text-secondary-400 capitalize">
                {value}
              </span>
            )}
          />
          <Line
            yAxisId="volume"
            type="monotone"
            dataKey="volume"
            stroke="#0ea5e9"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5, strokeWidth: 2, fill: '#fff' }}
            name="Volume"
          />
          <Line
            yAxisId="count"
            type="monotone"
            dataKey="count"
            stroke="#8b5cf6"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
            name="Count"
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
});
