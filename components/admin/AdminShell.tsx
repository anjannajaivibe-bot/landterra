'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Layers,
  FileCheck2,
  CreditCard,
  Clock,
  Flag,
  MessageSquare,
  Activity,
  Settings,
  ShieldCheck,
  Lock,
  ArrowRight,
  ExternalLink,
  LogOut,
  Loader2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export interface AdminSessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export const ADMIN_NAV_ITEMS = [
  {
    href: '/admin',
    label: 'Dashboard',
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: '/admin/users',
    label: 'Users',
    icon: Users,
  },
  {
    href: '/admin/properties',
    label: 'Properties',
    icon: Layers,
  },
  {
    href: '/admin/moderation',
    label: 'Moderation',
    icon: FileCheck2,
  },
  {
    href: '/admin/payments',
    label: 'Payments',
    icon: CreditCard,
  },
  {
    href: '/admin/subscriptions',
    label: 'Subscriptions',
    icon: Clock,
  },
  {
    href: '/admin/reports',
    label: 'Reports',
    icon: Flag,
  },
  {
    href: '/admin/feedbacks',
    label: 'Feedbacks',
    icon: MessageSquare,
  },
  {
    href: '/admin/audit-logs',
    label: 'Audit Logs',
    icon: Activity,
  },
  {
    href: '/admin/settings',
    label: 'Settings',
    icon: Settings,
  },
];

interface AdminShellProps {
  children: React.ReactNode;
}

export function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [authChecking, setAuthChecking] = useState(true);
  const [isAdminAuthorized, setIsAdminAuthorized] = useState<boolean | null>(null);
  const [currentAdmin, setCurrentAdmin] = useState<AdminSessionUser | null>(null);

  // Passcode unlock modal state
  const [passcodeInput, setPasscodeInput] = useState('');
  const [passcodeLoading, setPasscodeLoading] = useState(false);
  const [passcodeError, setPasscodeError] = useState('');
  const [showPasscodeInput, setShowPasscodeInput] = useState(false);

  const checkAdminSession = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/session', {
        method: 'GET',
        cache: 'no-store',
        credentials: 'include',
      });

      if (!response.ok) {
        setCurrentAdmin(null);
        setIsAdminAuthorized(false);
        return false;
      }

      const data = await response.json();
      const user = data?.session?.user;

      if (!user) {
        setCurrentAdmin(null);
        setIsAdminAuthorized(false);
        return false;
      }

      setCurrentAdmin(user);

      if (user.role !== 'ADMIN') {
        setIsAdminAuthorized(false);
        return false;
      }

      setIsAdminAuthorized(true);
      return true;
    } catch (error) {
      console.error('Admin session check failed:', error);
      setCurrentAdmin(null);
      setIsAdminAuthorized(false);
      return false;
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    async function init() {
      setAuthChecking(true);
      try {
        await checkAdminSession();
      } finally {
        if (mounted) setAuthChecking(false);
      }
    }
    init();
    return () => {
      mounted = false;
    };
  }, [checkAdminSession]);

  const handlePasscodeUnlock = async (event: React.FormEvent) => {
    event.preventDefault();
    const passcode = passcodeInput.trim();
    if (!passcode) {
      setPasscodeError('Enter the SuperAdmin passcode.');
      return;
    }

    setPasscodeLoading(true);
    setPasscodeError('');

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setPasscodeError(data?.error || 'Invalid SuperAdmin passcode.');
        return;
      }

      const authorized = await checkAdminSession();
      if (!authorized) {
        setPasscodeError('Passcode accepted, but admin role assignment failed. Contact system administrator.');
        return;
      }

      setPasscodeInput('');
      setShowPasscodeInput(false);
      setPasscodeError('');
      router.refresh();
    } catch (error) {
      console.error('Passcode unlock failed:', error);
      setPasscodeError('Network error during passcode validation.');
    } finally {
      setPasscodeLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setCurrentAdmin(null);
      setIsAdminAuthorized(false);
      router.push('/');
    } catch {
      window.location.href = '/';
    }
  };

  /* Loading state */
  if (authChecking) {
    return (
      <div className="dark min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
          </div>
          <p className="text-xs font-bold text-slate-400 tracking-wider uppercase">
            Verifying Admin Credentials...
          </p>
        </div>
      </div>
    );
  }

  /* Unauthorized access restricted screen */
  if (!isAdminAuthorized) {
    return (
      <div className="dark min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-16">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/10 border border-rose-500/20 text-rose-400">
              Access Restricted
            </span>
            <h1 className="text-2xl font-black text-white tracking-tight pt-2">
              BhoomiMitra SuperAdmin
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
              This console is strictly restricted to platform administrators with verified credentials.
            </p>
          </div>

          {passcodeError && (
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3.5 text-xs font-semibold text-rose-300 flex items-start gap-2.5 text-left">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{passcodeError}</span>
            </div>
          )}

          {!showPasscodeInput ? (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => {
                  setPasscodeError('');
                  setShowPasscodeInput(true);
                }}
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-950/40 cursor-pointer"
              >
                <span>Enter SuperAdmin Passcode</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <Link
                href="/"
                className="block w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
              >
                Return to Public Marketplace
              </Link>
            </div>
          ) : (
            <form onSubmit={handlePasscodeUnlock} className="space-y-4 text-left">
              <div>
                <label
                  htmlFor="admin-passcode"
                  className="block text-xs font-bold text-slate-300 mb-1.5"
                >
                  SuperAdmin Passcode
                </label>
                <input
                  id="admin-passcode"
                  type="password"
                  value={passcodeInput}
                  onChange={(e) => {
                    setPasscodeInput(e.target.value);
                    setPasscodeError('');
                  }}
                  placeholder="Enter your admin secret key"
                  disabled={passcodeLoading}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  autoFocus
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={passcodeLoading || !passcodeInput.trim()}
                  className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  {passcodeLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <span>Unlock Console</span>
                  )}
                </button>

                <button
                  type="button"
                  disabled={passcodeLoading}
                  onClick={() => {
                    setShowPasscodeInput(false);
                    setPasscodeInput('');
                    setPasscodeError('');
                  }}
                  className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="pt-4 border-t border-slate-800 text-[10px] text-slate-600 flex items-center justify-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/50" />
            <span>Encrypted Session Gate • All actions audit-logged</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dark min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* ============================================================
          TOP HEADER
          ============================================================ */}
      <header className="border-b border-slate-800/80 bg-slate-950/95 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Logo & Title */}
            <div className="flex items-center gap-3">
              <Link href="/admin" className="flex items-center gap-2.5 group">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white font-black shadow-lg shadow-emerald-950/50 group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-white tracking-tight">
                      BhoomiMitra
                    </span>
                    <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-[9px] font-black text-emerald-400 uppercase tracking-wider">
                      Admin
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 hidden sm:block">
                    Platform Management Console
                  </p>
                </div>
              </Link>
            </div>

            {/* Quick Actions & Admin info */}
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/"
                target="_blank"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-[11px] font-bold text-slate-300 hover:text-white transition-colors"
                title="View live marketplace in new tab"
              >
                <span>Live Marketplace</span>
                <ExternalLink className="w-3 h-3 text-slate-500" />
              </Link>

              {currentAdmin && (
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-[10px] flex items-center justify-center">
                    {currentAdmin.name?.charAt(0) || 'A'}
                  </div>
                  <span className="font-bold text-slate-300 truncate max-w-[120px]">
                    {currentAdmin.name || currentAdmin.email}
                  </span>
                </div>
              )}

              <button
                type="button"
                onClick={handleSignOut}
                className="p-2 rounded-xl border border-slate-800 hover:bg-rose-500/10 hover:border-rose-500/20 hover:text-rose-400 text-slate-400 transition-colors cursor-pointer"
                title="Sign out of Admin Console"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ============================================================
              NAVIGATION TABS (ALL 9 INDEPENDENT FEATURES)
              ============================================================ */}
          <nav className="flex gap-1.5 overflow-x-auto pb-3 pt-1 scrollbar-none">
            {ADMIN_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? pathname === item.href
                : pathname === item.href || pathname?.startsWith(item.href + '/');

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    shrink-0 inline-flex items-center gap-2
                    px-3.5 py-2 rounded-xl
                    text-xs font-bold
                    transition-all
                    ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                        : 'bg-slate-900/90 text-slate-400 border border-slate-800/80 hover:bg-slate-800 hover:text-white'
                    }
                  `}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Feature Content Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        {children}
      </main>
    </div>
  );
}
