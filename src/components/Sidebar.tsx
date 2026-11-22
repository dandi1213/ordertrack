'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBag,
  CreditCard,
  Users,
  Settings,
  LogOut,
  PackageCheck,
  UserCircle,
} from 'lucide-react';
import { logoutAction } from '@/app/actions/auth';
import { SessionUser } from '@/types';

interface SidebarProps {
  user: SessionUser;
  onNavigate?: () => void;
}

export default function Sidebar({ user, onNavigate }: SidebarProps) {
  const pathname = usePathname();

  const canAccess = (permission: string) =>
    user.role === 'owner' || user.permissions?.[permission] === true;

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, permission: 'view_dashboard' },
    { name: 'Pesanan', href: '/orders', icon: ShoppingBag, permission: 'view_orders' },
    { name: 'Pembayaran', href: '/payments', icon: CreditCard, permission: 'view_payments' },
    { name: 'Tim / Staff', href: '/team', icon: Users, permission: 'manage_staff' },
    { name: 'Pengaturan', href: '/settings', icon: Settings, permission: 'manage_business_settings' },
  ].filter((item) => canAccess(item.permission));

  return (
    <aside className="w-64 bg-[#0F172A] text-[#CBD5E1] flex flex-col h-screen fixed left-0 top-0 z-30">
      <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-[#2563EB] flex items-center justify-center text-white font-bold shadow-md shadow-blue-900/30">
          <PackageCheck className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-white font-bold text-base leading-tight truncate max-w-[140px]">
            OrderTrack
          </h1>
          <span className="text-xs text-slate-400 capitalize">SaaS Workspace</span>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-[#1E40AF] text-white shadow-sm shadow-blue-900/50'
                  : 'text-[#CBD5E1] hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
        <Link
          href="/account"
          onClick={onNavigate}
          className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
            pathname === '/account'
              ? 'bg-[#1E40AF] text-white shadow-sm shadow-blue-900/50'
              : 'text-[#CBD5E1] hover:bg-slate-800/60 hover:text-white'
          }`}
        >
          <UserCircle
            className={`w-5 h-5 ${pathname === '/account' ? 'text-white' : 'text-slate-400'}`}
          />
          <span>Akun Saya</span>
        </Link>
      </nav>

      <div className="p-4 border-t border-slate-800 bg-slate-900/50">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-white font-semibold text-sm shrink-0">
              {user.fullName.charAt(0).toUpperCase()}
            </div>
            <div className="truncate">
              <p className="text-sm font-medium text-white truncate">{user.fullName}</p>
              <p className="text-xs text-slate-400 capitalize">{user.role}</p>
            </div>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              title="Keluar"
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
