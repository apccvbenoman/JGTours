"use client"

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { FiHome, FiPackage, FiCalendar, FiFileText, FiUsers, FiLogOut, FiDollarSign } from 'react-icons/fi';
import { supabase } from '@/lib/supabase';
import { getActiveRole } from '@/lib/agent-service';
import { Logo } from '@/components/logo';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const role = getActiveRole();
      // If there is a Supabase session or an active role stored locally, allow access
      if ((session && role) || role) {
        setLoading(false);
      } else if (pathname !== '/admin/login') {
        router.push('/admin/login');
      }
    };
    checkUser();

    // Listen for auth changes (like logging out)
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        router.push('/admin/login');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [pathname, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  // Show a themed loading spinner while checking auth state
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f4f1ea]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#dfa241]"></div>
      </div>
    );
  }

  // If we are on the login page, render just the children without the sidebar/header
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-[#f4f1ea] font-sans antialiased text-slate-800 overflow-hidden">
      {/* Admin Sidebar */}
      <aside className="w-72 bg-gradient-to-b from-[#eadecb] via-[#e5cfb1] to-[#d6b589] backdrop-blur-xl text-slate-800 flex flex-col justify-between hidden md:flex border-r border-[#c29d6d]/40 shadow-[0_8px_30px_rgb(180,130,60,0.12)] relative overflow-hidden">

        <div className="absolute -top-12 -left-12 w-44 h-44 bg-gradient-to-br from-[#dfa241]/30 to-[#c88422]/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-12 -right-12 w-44 h-44 bg-gradient-to-tl from-[#e3af58]/25 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10">
          {/* Brand Header */}
          <div className="px-6 py-7 border-b border-[#c29d6d]/30 bg-white/30 backdrop-blur-md">
            <Logo className="h-10" />
            <p className="text-[10px] text-slate-600 font-bold tracking-widest uppercase mt-3">Admin Workspace</p>
          </div>

          {/* Navigation */}
          <nav className="mt-6 px-4 space-y-2 text-sm font-medium">
            <Link
              href="/admin"
              className="flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all text-slate-700 hover:text-slate-950 bg-white/50 hover:bg-white/80 active:scale-[0.98] border border-white/60 hover:border-[#c29d6d]/60 shadow-[0_2px_12px_rgb(150,100,30,0.04)] group"
            >
              <div className="p-2 rounded-xl bg-gradient-to-br from-[#dfa241] to-[#bf7b20] text-white group-hover:scale-105 transition-all shadow-xs">
                <FiHome size={16} />
              </div>
              <span className="font-semibold tracking-wide">Dashboard</span>
            </Link>

            <Link
              href="/admin/products"
              className="flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all text-slate-700 hover:text-slate-950 bg-white/50 hover:bg-white/80 active:scale-[0.98] border border-white/60 hover:border-[#c29d6d]/60 shadow-[0_2px_12px_rgb(150,100,30,0.04)] group"
            >
              <div className="p-2 rounded-xl bg-gradient-to-br from-[#dfa241] to-[#bf7b20] text-white group-hover:scale-105 transition-all shadow-xs">
                <FiPackage size={16} />
              </div>
              <span className="font-semibold tracking-wide">Services</span>
            </Link>

            <Link
              href="/admin/bookings"
              className="flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all text-slate-700 hover:text-slate-950 bg-white/50 hover:bg-white/80 active:scale-[0.98] border border-white/60 hover:border-[#c29d6d]/60 shadow-[0_2px_12px_rgb(150,100,30,0.04)] group"
            >
              <div className="p-2 rounded-xl bg-gradient-to-br from-[#dfa241] to-[#bf7b20] text-white group-hover:scale-105 transition-all shadow-xs">
                <FiCalendar size={16} />
              </div>
              <span className="font-semibold tracking-wide">Bookings</span>
            </Link>

            <Link
              href="/admin/quotation"
              className="flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all text-slate-700 hover:text-slate-950 bg-white/50 hover:bg-white/80 active:scale-[0.98] border border-white/60 hover:border-[#c29d6d]/60 shadow-[0_2px_12px_rgb(150,100,30,0.04)] group"
            >
              <div className="p-2 rounded-xl bg-gradient-to-br from-[#dfa241] to-[#bf7b20] text-white group-hover:scale-105 transition-all shadow-xs">
                <FiFileText size={16} />
              </div>
              <span className="font-semibold tracking-wide">Quotation</span>
            </Link>

            <Link
              href="/admin/invoices"
              className="flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all text-slate-700 hover:text-slate-950 bg-white/50 hover:bg-white/80 active:scale-[0.98] border border-white/60 hover:border-[#c29d6d]/60 shadow-[0_2px_12px_rgb(150,100,30,0.04)] group"
            >
              <div className="p-2 rounded-xl bg-gradient-to-br from-[#dfa241] to-[#bf7b20] text-white group-hover:scale-105 transition-all shadow-xs flex items-center justify-center w-8 h-8 font-bold">
                ₱
              </div>
              <span className="font-semibold tracking-wide">Invoices</span>
            </Link>

            <Link
              href="/admin/clients"
              className="flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all text-slate-700 hover:text-slate-950 bg-white/50 hover:bg-white/80 active:scale-[0.98] border border-white/60 hover:border-[#c29d6d]/60 shadow-[0_2px_12px_rgb(150,100,30,0.04)] group"
            >
              <div className="p-2 rounded-xl bg-gradient-to-br from-[#dfa241] to-[#bf7b20] text-white group-hover:scale-105 transition-all shadow-xs">
                <FiUsers size={16} />
              </div>
              <span className="font-semibold tracking-wide">Users</span>
            </Link>

            <Link
              href="/admin/commissions"
              className="flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all text-slate-700 hover:text-slate-950 bg-white/50 hover:bg-white/80 active:scale-[0.98] border border-white/60 hover:border-[#c29d6d]/60 shadow-[0_2px_12px_rgb(150,100,30,0.04)] group"
            >
              <div className="p-2 rounded-xl bg-gradient-to-br from-[#dfa241] to-[#bf7b20] text-white group-hover:scale-105 transition-all shadow-xs">
                <FiDollarSign size={16} />
              </div>
              <span className="font-semibold tracking-wide">Commissions</span>
            </Link>
          </nav>
        </div>

        {/* Logout Footer */}
        <div className="p-4 border-t border-[#c29d6d]/30 bg-white/30 backdrop-blur-md relative z-10">
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2.5 w-full py-3 bg-[#3d2e1b] hover:bg-[#261d11] active:scale-[0.98] rounded-xl text-xs font-bold uppercase tracking-wider transition-all text-amber-100 shadow-md border border-amber-900/30 cursor-pointer"
          >
            <FiLogOut size={15} /> Log Out &amp; Exit
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white/70 backdrop-blur-md shadow-xs px-8 py-4 flex justify-between items-center border-b border-amber-200/50 z-10">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold tracking-wider uppercase text-slate-500">Owner &amp; Sales Workspace</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-800">Administrator</p>
              <p className="text-[10px] text-slate-400">Active Session</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-amber-100 border border-amber-200 text-amber-900 flex items-center justify-center font-bold text-xs shadow-xs">
              AD
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[#f5f2eb]">
          {children}
        </main>
      </div>
    </div>
  );
}