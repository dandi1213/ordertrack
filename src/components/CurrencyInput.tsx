'use client';

/** Mengubah angka mentah menjadi tampilan ribuan Indonesia, mis. 50000 -> 50.000. */
export function formatCurrencyDisplay(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  return Number(digits).toLocaleString('id-ID');
}

interface CurrencyInputProps {
  /** Nama field yang dikirim ke FormData. Nilainya dikirim dalam format tampilan, lalu dinormalisasi di server. */
  name: string;
  placeholder?: string;
  className?: string;
  required?: boolean;
  defaultValue?: string;
}

/**
 * Input uang dengan format ribuan otomatis.
 * Satu input saja yang dikirim, sehingga tidak ada sinkronisasi input hidden yang bisa hilang saat production.
 */
export default function CurrencyInput({
  name,
  placeholder,
  className = '',
  required,
  defaultValue = '',
}: CurrencyInputProps) {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const caret = input.selectionStart ?? input.value.length;
    const digitsBeforeCaret = input.value.slice(0, caret).replace(/\D/g, '').length;

    const raw = input.value
      .replace(/\D/g, '')
      .replace(/^0+(?=\d)/, '')
      .slice(0, 15);
    const formatted = formatCurrencyDisplay(raw);

    input.value = formatted;

    // Pertahankan posisi kursor relatif terhadap jumlah digit sebelum kursor.
    let position = 0;
    let seen = 0;
    while (position < formatted.length && seen < digitsBeforeCaret) {
      if (/\d/.test(formatted[position])) seen += 1;
      position += 1;
    }
    input.setSelectionRange(position, position);
  };

  return (
    <input
      type="text"
      name={name}
      inputMode="numeric"
      autoComplete="off"
      defaultValue={formatCurrencyDisplay(defaultValue)}
      onChange={handleChange}
      placeholder={placeholder}
      required={required}
      aria-label={name}
      className={className}
    />
  );
}
