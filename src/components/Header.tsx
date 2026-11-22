'use client';

import Link from 'next/link';
import { Menu, Bell, Search, UserCircle, ChevronDown, LogOut } from 'lucide-react';
import { useState } from 'react';
import { logoutAction } from '@/app/actions/auth';
import { SessionUser } from '@/types';

interface HeaderProps {
  onMenuClick?: () => void;
  user: SessionUser;
}

export default function Header({ onMenuClick, user }: HeaderProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="bg-white border-b border-[#E2E8F0] sticky top-0 z-20 h-16">
      <div className="flex items-center justify-between h-full px-6 lg:px-8">
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari pesanan, pelanggan..."
              className="w-64 pl-10 pr-4 py-2 text-sm bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-shadow"
            />
          </div>

          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors relative"
              aria-label="Notifikasi"
            >
              <Bell className="w-5 h-5" />
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-[#E2E8F0] rounded-xl shadow-lg py-2 z-50">
                <div className="px-4 py-3 border-b border-[#E2E8F0]">
                  <h3 className="text-sm font-semibold text-[#0F172A]">Notifikasi</h3>
                </div>
                <div className="px-4 py-3 text-center text-slate-500 text-sm">
                  Belum ada notifikasi baru
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center space-x-2 p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <UserCircle className="w-7 h-7 text-slate-400" />
              <div className="hidden md:block text-left">
                <p className="text-xs font-medium text-[#0F172A]">{user.fullName}</p>
                <p className="text-[10px] text-slate-400 capitalize">{user.role}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 hidden md:block" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-[#E2E8F0] rounded-xl shadow-lg py-2 z-50">
                <div className="px-4 py-3 border-b border-[#E2E8F0]">
                  <p className="text-sm font-semibold text-[#0F172A]">{user.fullName}</p>
                  <p className="text-xs text-slate-400 break-all">{user.email}</p>
                </div>
                <Link
                  href="/settings"
                  onClick={() => setShowProfileMenu(false)}
                  className="block px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                >
                  Pengaturan Akun
                </Link>
                <hr className="my-2 border-[#E2E8F0]" />
                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Keluar</span>
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
