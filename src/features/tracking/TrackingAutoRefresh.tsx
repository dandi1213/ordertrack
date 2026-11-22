'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';

const INTERVAL_MS = 15_000;

/**
 * Menjadwalkan router.refresh() berkala agar Server Component tracking
 * mengambil data terbaru tanpa pengguna perlu menekan F5.
 */
export default function TrackingAutoRefresh() {
  const router = useRouter();
  const [spinning, setSpinning] = useState(false);
  const stopSpin = useRef<number | null>(null);

  const refresh = useCallback(() => {
    setSpinning(true);
    router.refresh();
    if (stopSpin.current) window.clearTimeout(stopSpin.current);
    stopSpin.current = window.setTimeout(() => setSpinning(false), 700);
  }, [router]);

  useEffect(() => {
    const interval = window.setInterval(refresh, INTERVAL_MS);
    return () => {
      window.clearInterval(interval);
      if (stopSpin.current) window.clearTimeout(stopSpin.current);
    };
  }, [refresh]);

  return (
    <button
      type="button"
      onClick={refresh}
      title="Klik untuk memperbarui status sekarang"
      className="inline-flex items-center justify-center space-x-2 text-[11px] text-[#64748B] hover:text-[#2563EB] transition-colors"
    >
      <RefreshCw className={`w-3.5 h-3.5 ${spinning ? 'animate-spin' : ''}`} />
      <span>Status diperbarui otomatis tiap 15 detik · klik untuk sekarang</span>
    </button>
  );
}
