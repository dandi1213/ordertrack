'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  hint?: string;
  disabled?: boolean;
}

interface SelectProps {
  /** Nama field yang dikirim lewat FormData. */
  name?: string;
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  ariaLabel?: string;
}

/** Dropdown dengan panel opsi yang konsisten dengan design system. */
export default function Select({
  name,
  value,
  onValueChange,
  options,
  placeholder = 'Pilih...',
  className = '',
  ariaLabel,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left text-sm bg-white border border-[#CBD5E1] rounded-xl transition-all hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/25 focus:border-[#2563EB] ${
          open ? 'border-[#2563EB] ring-2 ring-[#2563EB]/20' : ''
        }`}
      >
        <span className={`truncate ${selected ? 'font-medium text-[#0F172A]' : 'text-slate-400'}`}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute z-50 mt-2 w-full max-h-64 overflow-y-auto bg-white border border-[#E2E8F0] rounded-xl shadow-xl p-1.5 space-y-0.5"
        >
          {options.map((option) => {
            const active = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={active}
                disabled={option.disabled}
                onClick={() => {
                  if (option.disabled) return;
                  onValueChange(option.value);
                  setOpen(false);
                }}
                className={`w-full flex items-start justify-between gap-2 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                  option.disabled
                    ? 'cursor-not-allowed text-slate-400 opacity-60'
                    : active
                      ? 'bg-blue-50 font-semibold text-[#2563EB]'
                      : 'text-[#0F172A] hover:bg-slate-50'
                }`}
              >
                <span className="min-w-0">
                  <span className="block truncate">{option.label}</span>
                  {option.hint && (
                    <span className="mt-0.5 block text-[11px] font-normal text-slate-400">
                      {option.hint}
                    </span>
                  )}
                </span>
                {active && <Check className="mt-0.5 w-4 h-4 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}

      {name && <input type="hidden" name={name} value={value} />}
    </div>
  );
}
