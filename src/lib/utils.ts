import { OrderStatus } from '@/types';

export const formatIDR = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  try {
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  } catch {
    return dateString;
  }
};

export const getStatusLabel = (status: OrderStatus): string => {
  switch (status) {
    case 'received':
      return 'Pesanan Diterima';
    case 'in_progress':
      return 'Sedang Dikerjakan';
    case 'ready':
      return 'Siap Diambil/Dikirim';
    case 'completed':
      return 'Selesai';
    case 'cancelled':
      return 'Dibatalkan';
    default:
      return status;
  }
};

export const getStatusBadgeClass = (status: OrderStatus): string => {
  switch (status) {
    case 'received':
      return 'bg-blue-50 text-blue-700 border border-blue-200';
    case 'in_progress':
      return 'bg-amber-50 text-amber-700 border border-amber-200';
    case 'ready':
      return 'bg-green-50 text-green-700 border border-green-200';
    case 'completed':
      return 'bg-slate-100 text-slate-700 border border-slate-200';
    case 'cancelled':
      return 'bg-red-50 text-red-700 border border-red-200';
    default:
      return 'bg-slate-100 text-slate-700 border border-slate-200';
  }
};

/** Parsing tanggal `YYYY-MM-DD` sebagai tanggal lokal (bukan UTC) agar tidak bergeser. */
function parseLocalDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  }
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

export const isOverdue = (
  deadline: string,
  status: OrderStatus,
  today: Date,
): boolean => {
  if (status === 'completed' || status === 'cancelled' || status === 'ready') return false;

  const dueDate = parseLocalDate(deadline);
  if (!dueDate) return false;

  // Bandingkan tanggal (tanpa jam). Terlambat mulai H+1 setelah deadline.
  const currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return dueDate.getTime() < currentDate.getTime();
};

/** Filter rentang tanggal inklusif. `value` boleh ISO datetime atau `YYYY-MM-DD`. */
export const isWithinDateRange = (
  value: string,
  from: string,
  to: string
): boolean => {
  const datePart = String(value).slice(0, 10);
  if (from && datePart < from) return false;
  if (to && datePart > to) return false;
  return true;
};

const toDateInputValue = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`;

/** Rentang 1 bulan terakhir sampai hari ini, dipakai sebagai default filter tanggal. */
export const getLastMonthRange = (today: Date = new Date()): { from: string; to: string } => {
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const lastDayOfPreviousMonth = new Date(end.getFullYear(), end.getMonth(), 0).getDate();
  const start = new Date(
    end.getFullYear(),
    end.getMonth() - 1,
    Math.min(end.getDate(), lastDayOfPreviousMonth)
  );
  return { from: toDateInputValue(start), to: toDateInputValue(end) };
};

export const getDaysUntil = (deadline: string, today: Date): number => {
  const dueDate = parseLocalDate(deadline);
  if (!dueDate) return 0;
  const currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((dueDate.getTime() - currentDate.getTime()) / 86400000);
};


