import { useState, useMemo } from 'react';
import { CalendarDaysIcon } from '@heroicons/react/24/outline';

export type DateRangePreset = '7d' | '14d' | '30d' | '90d' | 'custom';

export interface DateRange {
  fromDate: string;
  toDate: string;
  preset: DateRangePreset;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

const PRESETS: { label: string; value: DateRangePreset }[] = [
  { label: '7D', value: '7d' },
  { label: '14D', value: '14d' },
  { label: '30D', value: '30d' },
  { label: '90D', value: '90d' },
  { label: 'Custom', value: 'custom' },
];

function getPresetDates(preset: DateRangePreset): { fromDate: string; toDate: string } {
  const today = new Date();
  const toDate = today.toISOString().split('T')[0];

  const daysMap: Record<string, number> = {
    '7d': 7,
    '14d': 14,
    '30d': 30,
    '90d': 90,
  };

  const days = daysMap[preset] ?? 30;
  const from = new Date(today);
  from.setDate(from.getDate() - days);
  const fromDate = from.toISOString().split('T')[0];

  return { fromDate, toDate };
}

export function useDateRange(initialPreset: DateRangePreset = '30d') {
  const initial = getPresetDates(initialPreset);
  const [range, setRange] = useState<DateRange>({
    ...initial,
    preset: initialPreset,
  });

  const handleChange = (newRange: DateRange) => {
    setRange(newRange);
  };

  return { range, setRange: handleChange };
}

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [showCustom, setShowCustom] = useState(value.preset === 'custom');

  const handlePreset = (preset: DateRangePreset) => {
    if (preset === 'custom') {
      setShowCustom(true);
      onChange({ ...value, preset: 'custom' });
      return;
    }
    setShowCustom(false);
    const dates = getPresetDates(preset);
    onChange({ ...dates, preset });
  };

  const handleFromDate = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...value, fromDate: e.target.value, preset: 'custom' });
  };

  const handleToDate = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...value, toDate: e.target.value, preset: 'custom' });
  };

  const maxDate = useMemo(() => new Date().toISOString().split('T')[0], []);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Preset Buttons */}
      <div className="flex items-center rounded-lg bg-secondary-100 dark:bg-secondary-700 p-0.5">
        {PRESETS.map((preset) => (
          <button
            key={preset.value}
            type="button"
            onClick={() => handlePreset(preset.value)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              value.preset === preset.value
                ? 'bg-white text-secondary-900 shadow-sm dark:bg-secondary-600 dark:text-white'
                : 'text-secondary-500 hover:text-secondary-700 dark:text-secondary-400 dark:hover:text-secondary-200'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Custom Date Inputs */}
      {showCustom && (
        <div className="flex items-center gap-1.5">
          <div className="relative">
            <CalendarDaysIcon className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-secondary-400" />
            <input
              type="date"
              value={value.fromDate}
              onChange={handleFromDate}
              max={value.toDate || maxDate}
              className="h-7 rounded-md border border-secondary-200 bg-white pl-7 pr-2 text-xs text-secondary-700 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 dark:border-secondary-600 dark:bg-secondary-800 dark:text-secondary-300"
            />
          </div>
          <span className="text-xs text-secondary-400">to</span>
          <div className="relative">
            <CalendarDaysIcon className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-secondary-400" />
            <input
              type="date"
              value={value.toDate}
              onChange={handleToDate}
              min={value.fromDate}
              max={maxDate}
              className="h-7 rounded-md border border-secondary-200 bg-white pl-7 pr-2 text-xs text-secondary-700 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 dark:border-secondary-600 dark:bg-secondary-800 dark:text-secondary-300"
            />
          </div>
        </div>
      )}
    </div>
  );
}
