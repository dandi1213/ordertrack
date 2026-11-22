'use client';

import { CalendarRange, X } from 'lucide-react';

interface DateRangeFilterProps {
  from: string;
  to: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  label?: string;
  /** Batas bawah tanggal yang bisa dipilih (default: 1 bulan lalu). */
  min?: string;
  /** Batas atas tanggal yang bisa dipilih (default: hari ini). */
  max?: string;
  /** Nilai saat tombol Reset ditekan. */
  defaultFrom?: string;
  defaultTo?: string;
}

/** Filter rentang tanggal inklusif yang dipakai bersama tabel. */
export default function DateRangeFilter({
  from,
  to,
  onFromChange,
  onToChange,
  label = 'Rentang Tanggal',
  min,
  max,
  defaultFrom = '',
  defaultTo = '',
}: DateRangeFilterProps) {
  const active = Boolean(from || to);
  const inputClass =
    'px-2.5 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/25 focus:border-[#2563EB]';

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
        <CalendarRange className="w-4 h-4" />
        {label}
      </span>
      <input
        type="date"
        value={from}
        min={min}
        max={to || max}
        onChange={(event) => onFromChange(event.target.value)}
        aria-label="Dari tanggal"
        className={inputClass}
      />
      <span className="text-xs text-slate-400">s.d.</span>
      <input
        type="date"
        value={to}
        min={from || min}
        max={max}
        onChange={(event) => onToChange(event.target.value)}
        aria-label="Sampai tanggal"
        className={inputClass}
      />
      {active && (
        <button
          type="button"
          onClick={() => {
            onFromChange(defaultFrom);
            onToChange(defaultTo);
          }}
          title="Kembali ke rentang 1 bulan terakhir"
          className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-semibold text-slate-500 hover:text-[#0F172A] hover:bg-slate-50 rounded-lg transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          Reset
        </button>
      )}
    </div>
  );
}
