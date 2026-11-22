'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';

const INTERVAL_MS = 20_000;

/**
 * Menyinkronkan data lintas pengguna tanpa refresh manual.
 * router.refresh() mengambil ulang Server Component (layout + halaman),
 * sehingga perubahan status/izin dari user lain tampil otomatis.
 */
export default function AutoRefresh() {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const stopSpin = useRef<number | null>(null);

  const refresh = useCallback(() => {
    // Jangan buang request saat tab tidak aktif.
    if (document.visibilityState === 'hidden') return;
    setSyncing(true);
    router.refresh();
    if (stopSpin.current) window.clearTimeout(stopSpin.current);
    stopSpin.current = window.setTimeout(() => setSyncing(false), 700);
  }, [router]);

  useEffect(() => {
    const interval = window.setInterval(refresh, INTERVAL_MS);
    return () => {
      window.clearInterval(interval);
      if (stopSpin.current) window.clearTimeout(stopSpin.current);
    };
  }, [refresh]);

  return (
    <div
      className="hidden sm:flex items-center space-x-1.5 text-[11px] text-slate-400"
      title="Data disinkronkan otomatis tiap 20 detik"
    >
      <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin text-[#2563EB]' : ''}`} />
      <span>Otomatis tersinkron</span>
    </div>
  );
}
