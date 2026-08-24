'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

import { VerificationBadge } from '@/components/properties/VerificationBadge';
import { PropertyReviewModal } from '@/components/admin/PropertyReviewModal';

import { IProperty } from '@/types/property';
import { IReport } from '@/types/inquiry';
import { IPayment } from '@/types/payment';
import { IAuditLog } from '@/types/user';
import { IPlatformSettings } from '@/models/PlatformSettings';

import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  CreditCard,
  Eye,
  FileCheck2,
  Flag,
  Layers,
  LayoutDashboard,
  Lock,
  RefreshCw,
  Save,
  Server,
  Settings,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Users,
} from 'lucide-react';

interface IntegrationStatusItem {
  name: string;
  configured: boolean;
  envVar: string;
  description: string;
}

interface AdminSessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AdminSessionResponse {
  session?: {
    user?: AdminSessionUser;
  };
}

interface AdminStats {
  totalProperties?: number;
  publishedProperties?: number;
  pendingProperties?: number;
  totalUsers?: number;
  totalPublishingFees?: number;
  rejectedProperties?: number;
  paidProperties?: number;
  pendingReports?: number;
}

type AdminTab =
  | 'DASHBOARD'
  | 'USERS'
  | 'PROPERTIES'
  | 'VERIFICATION'
  | 'PAYMENTS'
  | 'SUBSCRIPTIONS'
  | 'REPORTS'
  | 'AUDIT'
  | 'SETTINGS';

const ADMIN_TABS: {
  id: AdminTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    id: 'DASHBOARD',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    id: 'USERS',
    label: 'Users',
    icon: Users,
  },
  {
    id: 'PROPERTIES',
    label: 'Properties',
    icon: Layers,
  },
  {
    id: 'VERIFICATION',
    label: 'Verification',
    icon: FileCheck2,
  },
  {
    id: 'PAYMENTS',
    label: 'Payments',
    icon: CreditCard,
  },
  {
    id: 'SUBSCRIPTIONS',
    label: 'Subscriptions',
    icon: Clock,
  },
  {
    id: 'REPORTS',
    label: 'Reports',
    icon: Flag,
  },
  {
    id: 'AUDIT',
    label: 'Audit Logs',
    icon: Activity,
  },
  {
    id: 'SETTINGS',
    label: 'Settings',
    icon: Settings,
  },
];

const EMPTY_SETTINGS: IPlatformSettings = {
  requireGoogleLogin: true,
  requirePhoneOtp: true,
  listingFeeAmount: 10,
  listingFeeDurationDays: 30,
  updatedBy: 'SYSTEM',
  updatedAt: new Date(),
};

export default function AdminControlPage() {
  /*
   * ================================================================
   * NAVIGATION
   * ================================================================
   */

  const [activeTab, setActiveTab] = useState<AdminTab>('DASHBOARD');

  /*
   * ================================================================
   * AUTHENTICATION
   * ================================================================
   */

  const [authChecking, setAuthChecking] = useState(true);
  const [isAdminAuthorized, setIsAdminAuthorized] = useState<boolean | null>(
    null,
  );

  const [currentAdmin, setCurrentAdmin] =
    useState<AdminSessionUser | null>(null);

  const [passcodeInput, setPasscodeInput] = useState('');
  const [passcodeLoading, setPasscodeLoading] = useState(false);
  const [passcodeError, setPasscodeError] = useState('');
  const [showPasscodeInput, setShowPasscodeInput] = useState(false);

  /*
   * ================================================================
   * ADMIN DATA
   * ================================================================
   */

  const [loadingData, setLoadingData] = useState(false);
  const [dataError, setDataError] = useState('');

  const [lastRefreshedAt, setLastRefreshedAt] =
    useState<Date | null>(null);

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [properties, setProperties] = useState<IProperty[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [reports, setReports] = useState<IReport[]>([]);
  const [payments, setPayments] = useState<IPayment[]>([]);
  const [auditLogs, setAuditLogs] = useState<IAuditLog[]>([]);
  const [integrations, setIntegrations] = useState<
    Record<string, IntegrationStatusItem>
  >({});

  /*
   * ================================================================
   * SETTINGS
   * ================================================================
   */

  const [settings, setSettings] =
    useState<IPlatformSettings>(EMPTY_SETTINGS);

  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaveSuccess, setSettingsSaveSuccess] = useState(false);
  const [settingsError, setSettingsError] = useState('');

  /*
   * ================================================================
   * PROPERTY REVIEW
   * ================================================================
   */

  const [selectedPropertyForReview, setSelectedPropertyForReview] =
    useState<IProperty | null>(null);

  /*
   * ================================================================
   * DERIVED DASHBOARD DATA
   * ================================================================
   */

  const pendingVerificationProperties = useMemo(
    () =>
      properties.filter(
        (property) => property.verificationStatus === 'PENDING',
      ),
    [properties],
  );

  const publishedProperties = useMemo(
    () =>
      properties.filter(
        (property) => property.listingStatus === 'PUBLISHED',
      ),
    [properties],
  );

  const rejectedProperties = useMemo(
    () =>
      properties.filter(
        (property) => property.verificationStatus === 'REJECTED',
      ),
    [properties],
  );

  const paidProperties = useMemo(
    () =>
      properties.filter(
        (property) => property.paymentStatus === 'PAID',
      ),
    [properties],
  );

  const pendingReports = useMemo(
    () => reports.length,
    [reports],
  );

  /*
   * ================================================================
   * SESSION CHECK
   * ================================================================
   */

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

      const data: AdminSessionResponse = await response.json();

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

  /*
   * ================================================================
   * ADMIN DATA LOADER
   * ================================================================
   */

  const loadAdminData = useCallback(async () => {
    setLoadingData(true);
    setDataError('');

    try {
      const isAuthorized = await checkAdminSession();

      if (!isAuthorized) {
        return;
      }

      const [
        statsRes,
        propertiesRes,
        usersRes,
        reportsRes,
        paymentsRes,
        auditRes,
        integrationsRes,
        settingsRes,
      ] = await Promise.all([
        fetch('/api/admin/stats', {
          cache: 'no-store',
          credentials: 'include',
        }),

        fetch('/api/admin/properties?limit=100', {
          cache: 'no-store',
          credentials: 'include',
        }),

        fetch('/api/admin/users', {
          cache: 'no-store',
          credentials: 'include',
        }),

        fetch('/api/reports', {
          cache: 'no-store',
          credentials: 'include',
        }),

        fetch('/api/payments/my', {
          cache: 'no-store',
          credentials: 'include',
        }),

        fetch('/api/admin/audit-logs', {
          cache: 'no-store',
          credentials: 'include',
        }),

        fetch('/api/integrations/status', {
          cache: 'no-store',
          credentials: 'include',
        }),

        fetch('/api/admin/settings', {
          cache: 'no-store',
          credentials: 'include',
        }),
      ]);

      const unauthorizedResponse = [
        statsRes,
        propertiesRes,
        usersRes,
        reportsRes,
        paymentsRes,
        auditRes,
        integrationsRes,
        settingsRes,
      ].some((response) => response.status === 401);

      if (unauthorizedResponse) {
        setCurrentAdmin(null);
        setIsAdminAuthorized(false);
        setDataError('Your administrative session has expired.');
        return;
      }

      if (statsRes.ok) {
        const data = await statsRes.json();
        if (data?.metrics) setStats(data.metrics);
      }

      if (propertiesRes.ok) {
        const data = await propertiesRes.json();
        if (Array.isArray(data?.data)) setProperties(data.data);
      }

      if (usersRes.ok) {
        const data = await usersRes.json();
        if (Array.isArray(data?.users)) setUsers(data.users);
      }

      if (reportsRes.ok) {
        const data = await reportsRes.json();
        if (Array.isArray(data?.reports)) setReports(data.reports);
      }

      if (paymentsRes.ok) {
        const data = await paymentsRes.json();
        if (Array.isArray(data?.payments)) setPayments(data.payments);
      }

      if (auditRes.ok) {
        const data = await auditRes.json();
        if (Array.isArray(data?.logs)) setAuditLogs(data.logs);
      }

      if (integrationsRes.ok) {
        const data = await integrationsRes.json();
        if (data?.status) setIntegrations(data.status);
      }

      if (settingsRes.ok) {
        const data = await settingsRes.json();
        if (data?.settings) setSettings(data.settings);
      }

      setLastRefreshedAt(new Date());
    } catch (error) {
      console.error('Failed to load admin data:', error);

      setDataError(
        error instanceof Error
          ? error.message
          : 'Failed to load administrative data.',
      );
    } finally {
      setLoadingData(false);
    }
  }, [checkAdminSession]);

  /*
   * ================================================================
   * INITIAL ADMIN SESSION CHECK
   * ================================================================
   */

  useEffect(() => {
    let mounted = true;

    async function initializeAdmin() {
      setAuthChecking(true);

      try {
        const authorized = await checkAdminSession();

        if (!mounted) {
          return;
        }

        if (!authorized) {
          return;
        }

        await loadAdminData();
      } finally {
        if (mounted) {
          setAuthChecking(false);
        }
      }
    }

    initializeAdmin();

    return () => {
      mounted = false;
    };
  }, [checkAdminSession, loadAdminData]);

  /*
   * ================================================================
   * SUPERADMIN PASSCODE UNLOCK
   * ================================================================
   */

  const handlePasscodeUnlock = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
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
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({
          passcode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403) {
          setPasscodeError(
            data?.error ||
              'This Google account is not authorized for BhoomiMitra administration.',
          );
        } else {
          setPasscodeError(
            data?.error ||
              'Invalid SuperAdmin passcode.',
          );
        }

        return;
      }

      const authorized = await checkAdminSession();

      if (!authorized) {
        setPasscodeError(
          'Admin session could not be established. Please try again.',
        );
        return;
      }

      setPasscodeInput('');
      setShowPasscodeInput(false);
      setPasscodeError('');

      await loadAdminData();
    } catch (error) {
      console.error('Admin unlock failed:', error);

      setPasscodeError(
        'Unable to contact the authentication server.',
      );
    } finally {
      setPasscodeLoading(false);
    }
  };

  /*
   * ================================================================
   * REFRESH
   * ================================================================
   */

  const handleRefresh = useCallback(async () => {
    if (loadingData) {
      return;
    }

    await loadAdminData();
  }, [loadAdminData, loadingData]);

  /*
   * ================================================================
   * SETTINGS SAVE
   * ================================================================
   */

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    setSettingsSaveSuccess(false);
    setSettingsError('');

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({
          requireGoogleLogin: settings.requireGoogleLogin,
          requirePhoneOtp: settings.requirePhoneOtp,
          listingFeeAmount: Number(settings.listingFeeAmount) || 10,
          listingFeeDurationDays: Number(settings.listingFeeDurationDays) || 30,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || 'Failed to save platform settings.',
        );
      }

      if (data?.settings) {
        setSettings(data.settings);
      }

      setSettingsSaveSuccess(true);

      window.setTimeout(() => {
        setSettingsSaveSuccess(false);
      }, 3000);
    } catch (error) {
      setSettingsError(
        error instanceof Error
          ? error.message
          : 'Failed to save platform settings.',
      );
    } finally {
      setSavingSettings(false);
    }
  };

  /*
   * ================================================================
   * LOADING SCREEN (STANDALONE ADMIN ENVIRONMENT)
   * ================================================================
   */

  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4">
        <main className="w-full max-w-md text-center">
          <div className="mx-auto mb-5 w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <ShieldCheck className="w-7 h-7 text-emerald-400 animate-pulse" />
          </div>

          <h1 className="text-lg font-black text-white">
            Verifying Administrative Access
          </h1>

          <p className="mt-2 text-xs text-slate-500">
            Checking your BhoomiMitra Google session and administrative
            privileges.
          </p>

          <div className="mt-6 h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div className="h-full w-1/2 bg-emerald-500 rounded-full animate-pulse" />
          </div>
        </main>
      </div>
    );
  }

  /*
   * ================================================================
   * ACCESS RESTRICTED / SUPERADMIN UNLOCK (STANDALONE ADMIN GATE)
   * ================================================================
   */

  if (isAdminAuthorized === false) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4 py-16">
        <main className="w-full max-w-lg">
          <div className="rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">

            {/* Security header */}

            <div className="px-7 pt-8 pb-6 text-center border-b border-slate-800">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <Lock className="w-8 h-8 text-rose-400" />
              </div>

              <div className="mt-5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <ShieldCheck className="w-3 h-3" />
                  Admin Security Gate
                </div>

                <h1 className="mt-3 text-2xl font-black tracking-tight text-white">
                  Access Restricted
                </h1>

                <p className="mt-2 text-xs leading-relaxed text-slate-400 max-w-sm mx-auto">
                  The BhoomiMitra administrative console requires an
                  authorized Google account and the SuperAdmin
                  passcode.
                </p>
              </div>
            </div>

            {/* Current Google identity */}

            <div className="p-6 space-y-4">

              {currentAdmin ? (
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                      <Users className="w-5 h-5 text-emerald-400" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wider font-bold text-emerald-400">
                        Google account
                      </p>

                      <p className="text-sm font-bold text-white truncate">
                        {currentAdmin.name}
                      </p>

                      <p className="text-[11px] text-slate-400 truncate">
                        {currentAdmin.email}
                      </p>
                    </div>

                    <div className="ml-auto">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />

                    <div>
                      <p className="text-xs font-bold text-amber-300">
                        Google authentication required
                      </p>

                      <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                        Sign in to BhoomiMitra with an authorized
                        Google account before attempting to unlock
                        the administrative console.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Error */}

              {passcodeError && (
                <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />

                    <p className="text-xs leading-relaxed text-rose-300">
                      {passcodeError}
                    </p>
                  </div>
                </div>
              )}

              {!showPasscodeInput ? (
                <div className="space-y-2.5">

                  <button
                    type="button"
                    disabled={!currentAdmin}
                    onClick={() => {
                      setPasscodeError('');
                      setShowPasscodeInput(true);
                    }}
                    className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-white text-xs font-black transition-all flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Enter SuperAdmin Passcode
                  </button>

                  {!currentAdmin && (
                    <Link
                      href="/"
                      className="w-full py-3 rounded-xl bg-white text-slate-950 hover:bg-slate-100 text-xs font-black transition-colors flex items-center justify-center"
                    >
                      Sign in with Google
                    </Link>
                  )}

                  <Link
                    href="/"
                    className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-bold transition-colors flex items-center justify-center"
                  >
                    Return to Marketplace
                  </Link>
                </div>
              ) : (
                <form
                  onSubmit={handlePasscodeUnlock}
                  className="space-y-4"
                >
                  <div>
                    <label
                      htmlFor="admin-passcode"
                      className="block text-xs font-bold text-slate-300 mb-2"
                    >
                      SuperAdmin Passcode
                    </label>

                    <input
                      id="admin-passcode"
                      type="password"
                      value={passcodeInput}
                      onChange={(event) => {
                        setPasscodeInput(event.target.value);
                        setPasscodeError('');
                      }}
                      placeholder="Enter your admin passcode"
                      autoComplete="current-password"
                      autoFocus
                      disabled={passcodeLoading}
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 disabled:opacity-50 font-mono"
                    />

                    <p className="mt-2 text-[10px] text-slate-500">
                      This passcode is verified server-side.
                      It is never exposed to the browser.
                    </p>
                  </div>

                  <div className="flex gap-2">

                    <button
                      type="submit"
                      disabled={
                        passcodeLoading ||
                        !passcodeInput.trim() ||
                        !currentAdmin
                      }
                      className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-black transition-colors flex items-center justify-center gap-2"
                    >
                      {passcodeLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4" />
                          Unlock Console
                        </>
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
                      className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Security explanation */}

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <ShieldCheck className="w-4 h-4 text-emerald-400 mb-2" />
              <p className="text-[11px] font-bold text-white">
                Identity
              </p>
              <p className="mt-1 text-[10px] leading-relaxed text-slate-500">
                Google account verifies who you are.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <Lock className="w-4 h-4 text-emerald-400 mb-2" />
              <p className="text-[11px] font-bold text-white">
                Passcode
              </p>
              <p className="mt-1 text-[10px] leading-relaxed text-slate-500">
                Secret key verifies admin authorization.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <Server className="w-4 h-4 text-emerald-400 mb-2" />
              <p className="text-[11px] font-bold text-white">
                Server
              </p>
              <p className="mt-1 text-[10px] leading-relaxed text-slate-500">
                Protected APIs enforce access independently.
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  /*
   * ================================================================
   * ADMIN CONSOLE (STANDALONE ADMIN WORKSPACE)
   * ================================================================
   */

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-600 selection:text-white">

      {/* ============================================================
          ADMIN HEADER
          ============================================================ */}

      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/95 backdrop-blur-xl">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="min-h-[76px] flex flex-col lg:flex-row lg:items-center justify-between gap-4 py-4">

            {/* Brand / identity */}

            <div className="flex items-center gap-4 min-w-0">

              <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">

                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black tracking-wider text-emerald-400">
                    ADMIN CONSOLE
                  </span>

                  <span className="text-[10px] text-slate-600">
                    •
                  </span>

                  <span className="text-[10px] font-medium text-slate-500">
                    Server-authorized
                  </span>
                </div>

                <h1 className="mt-1 text-lg sm:text-xl font-black tracking-tight text-white truncate">
                  LandTerra Platform Control
                </h1>
              </div>
            </div>

            {/* Admin identity / actions */}

            <div className="flex items-center gap-2">

              <div className="hidden sm:flex items-center gap-3 px-3 py-2 rounded-xl border border-slate-800 bg-slate-900">

                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Users className="w-4 h-4 text-emerald-400" />
                </div>

                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-white truncate max-w-[150px]">
                    {currentAdmin?.name || 'Administrator'}
                  </p>

                  <p className="text-[9px] text-slate-500 truncate max-w-[150px]">
                    {currentAdmin?.email || 'Authenticated'}
                  </p>
                </div>

                <span className="ml-1 px-1.5 py-0.5 rounded bg-emerald-500/10 text-[8px] font-black text-emerald-400">
                  ADMIN
                </span>
              </div>

              <Link
                href="/"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-[11px] font-bold text-slate-400 hover:text-slate-200 transition-colors"
              >
                Marketplace
              </Link>

              <button
                type="button"
                onClick={handleRefresh}
                disabled={loadingData}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-xs font-bold text-slate-300 transition-colors"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${
                    loadingData ? 'animate-spin' : ''
                  }`}
                />
                <span className="hidden sm:inline">
                  {loadingData ? 'Refreshing' : 'Refresh'}
                </span>
              </button>
            </div>
          </div>

          {/* Navigation */}

          <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-none">
            {ADMIN_TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    shrink-0 inline-flex items-center gap-2
                    px-3.5 py-2.5 rounded-xl
                    text-[11px] font-bold
                    transition-all
                    ${
                      active
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/30'
                        : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-white'
                    }
                  `}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* ============================================================
          MAIN CONTENT
          ============================================================ */}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">

        {/* Data error */}

        {dataError && (
          <div className="mb-6 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />

              <div className="flex-1">
                <p className="text-xs font-bold text-rose-300">
                  Administrative data warning
                </p>

                <p className="mt-1 text-[11px] text-slate-400">
                  {dataError}
                </p>
              </div>

              <button
                type="button"
                onClick={handleRefresh}
                className="text-[10px] font-bold text-rose-300 hover:text-white"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* ==========================================================
            DASHBOARD
            ========================================================== */}

        {activeTab === 'DASHBOARD' && (
          <div className="space-y-6 animate-in fade-in duration-150">

            {/* Dashboard heading */}

            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">

              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] font-black text-emerald-400">
                  Platform overview
                </p>

                <h2 className="mt-1 text-2xl font-black tracking-tight text-white">
                  Good evening, {currentAdmin?.name?.split(' ')[0] || 'Admin'}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Monitor listings, verification, payments and platform activity.
                </p>
              </div>

              <div className="text-right">
                <p className="text-[9px] uppercase tracking-wider text-slate-600">
                  Last refreshed
                </p>

                <p className="mt-0.5 text-[10px] font-mono text-slate-400">
                  {lastRefreshedAt
                    ? lastRefreshedAt.toLocaleTimeString('en-IN')
                    : 'Loading...'}
                </p>
              </div>
            </div>

            {/* ======================================================
                KPI CARDS
                ====================================================== */}

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

              <AdminMetricCard
                label="Total Properties"
                value={
                  stats?.totalProperties ??
                  properties.length
                }
                secondary={`${stats?.publishedProperties ?? publishedProperties.length} published`}
                icon={Layers}
              />

              <AdminMetricCard
                label="Verification Queue"
                value={
                  stats?.pendingProperties ??
                  pendingVerificationProperties.length
                }
                secondary="Requires admin review"
                icon={FileCheck2}
                tone="amber"
              />

              <AdminMetricCard
                label="Registered Users"
                value={
                  stats?.totalUsers ??
                  users.length
                }
                secondary="Customer accounts"
                icon={Users}
              />

              <AdminMetricCard
                label="Publishing Revenue"
                value={`₹${(
                  stats?.totalPublishingFees ?? 0
                ).toLocaleString('en-IN')}`}
                secondary="Publishing fees collected"
                icon={CreditCard}
                tone="emerald"
              />
            </div>

            {/* ======================================================
                SECONDARY METRICS
                ====================================================== */}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

              <MiniMetric
                label="Published"
                value={
                  stats?.publishedProperties ??
                  publishedProperties.length
                }
                icon={CheckCircle2}
              />

              <MiniMetric
                label="Paid"
                value={
                  stats?.paidProperties ??
                  paidProperties.length
                }
                icon={CreditCard}
              />

              <MiniMetric
                label="Rejected"
                value={
                  stats?.rejectedProperties ??
                  rejectedProperties.length
                }
                icon={AlertCircle}
              />

              <MiniMetric
                label="Reports"
                value={
                  stats?.pendingReports ??
                  pendingReports
                }
                icon={Flag}
              />
            </div>

            {/* ======================================================
                OPERATIONS
                ====================================================== */}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

              {/* Verification queue */}

              <section className="rounded-3xl border border-slate-800 bg-slate-900 overflow-hidden">

                <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">

                  <div>
                    <div className="flex items-center gap-2">
                      <FileCheck2 className="w-4 h-4 text-amber-400" />

                      <h3 className="text-sm font-black text-white">
                        Verification Queue
                      </h3>
                    </div>

                    <p className="mt-1 text-[10px] text-slate-500">
                      Properties waiting for title/document review.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('VERIFICATION')}
                    className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300"
                  >
                    View all
                  </button>
                </div>

                <div className="p-4">

                  {pendingVerificationProperties.length > 0 ? (
                    <div className="space-y-2">

                      {pendingVerificationProperties
                        .slice(0, 5)
                        .map((property) => (
                          <div
                            key={property._id}
                            className="group flex items-center gap-3 p-3.5 rounded-2xl border border-slate-800 bg-slate-950/50 hover:bg-slate-800/50 transition-colors"
                          >
                            <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                              <FileCheck2 className="w-4 h-4 text-amber-400" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-white truncate">
                                {property.title}
                              </p>

                              <p className="mt-0.5 text-[10px] text-slate-500 truncate">
                                {property.location.city},{' '}
                                {property.location.state}
                                {' • '}
                                {property.landAreaYards} sq.yds
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                setSelectedPropertyForReview(property)
                              }
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black transition-colors"
                            >
                              Review
                            </button>
                          </div>
                        ))}

                    </div>
                  ) : (
                    <EmptyState
                      icon={CheckCircle2}
                      title="Verification queue is clear"
                      description="There are no properties waiting for review."
                    />
                  )}
                </div>
              </section>

              {/* Audit activity */}

              <section className="rounded-3xl border border-slate-800 bg-slate-900 overflow-hidden">

                <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">

                  <div>
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-emerald-400" />

                      <h3 className="text-sm font-black text-white">
                        Recent Activity
                      </h3>
                    </div>

                    <p className="mt-1 text-[10px] text-slate-500">
                      Latest administrative actions recorded by the platform.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('AUDIT')}
                    className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300"
                  >
                    View all
                  </button>
                </div>

                <div className="p-4">

                  {auditLogs.length > 0 ? (
                    <div className="space-y-2">

                      {auditLogs
                        .slice(0, 5)
                        .map((log) => (
                          <div
                            key={log._id}
                            className="flex items-center gap-3 p-3 rounded-2xl border border-slate-800 bg-slate-950/50"
                          >
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                              <Activity className="w-3.5 h-3.5 text-emerald-400" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] font-mono font-bold text-emerald-400 truncate">
                                {log.action}
                              </p>

                              <p className="mt-0.5 text-[10px] text-slate-500 truncate">
                                {log.actorName || log.actorEmail}
                              </p>
                            </div>

                            <time className="text-[9px] text-slate-600 shrink-0">
                              {new Date(
                                log.createdAt,
                              ).toLocaleTimeString('en-IN')}
                            </time>
                          </div>
                        ))}

                    </div>
                  ) : (
                    <EmptyState
                      icon={Activity}
                      title="No recent activity"
                      description="Administrative actions will appear here."
                    />
                  )}
                </div>
              </section>
            </div>

            {/* ======================================================
                PLATFORM HEALTH
                ====================================================== */}

            <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">

                <div>
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-emerald-400" />

                    <h3 className="text-sm font-black text-white">
                      Platform Health
                    </h3>
                  </div>

                  <p className="mt-1 text-[10px] text-slate-500">
                    Configuration status of connected infrastructure.
                  </p>
                </div>

                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  ADMIN SESSION ACTIVE
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">

                {Object.entries(integrations)
                  .slice(0, 4)
                  .map(([key, item]) => (
                    <div
                      key={key}
                      className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[11px] font-bold text-white truncate">
                          {item.name}
                        </p>

                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            item.configured
                              ? 'bg-emerald-400'
                              : 'bg-rose-400'
                          }`}
                        />
                      </div>

                      <p className="mt-1 text-[9px] text-slate-600 truncate">
                        {item.envVar}
                      </p>

                      <p
                        className={`mt-2 text-[9px] font-bold ${
                          item.configured
                            ? 'text-emerald-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {item.configured
                          ? 'CONFIGURED'
                          : 'ACTION REQUIRED'}
                      </p>
                    </div>
                  ))}

              </div>
            </section>
          </div>
        )}

        {/* ==========================================================
            USERS
            ========================================================== */}

        {activeTab === 'USERS' && (
          <section className="space-y-5 animate-in fade-in duration-150">

            <AdminSectionHeader
              eyebrow="Customer accounts"
              title="Registered Users"
              description="All customer accounts registered on the LandTerra marketplace."
              count={`${users.length} accounts`}
            />

            <div className="rounded-3xl border border-slate-800 bg-slate-900 overflow-hidden">

              {users.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-950/70 border-b border-slate-800">
                      <tr>
                        <AdminTableHeader>User</AdminTableHeader>
                        <AdminTableHeader>Email</AdminTableHeader>
                        <AdminTableHeader>Phone</AdminTableHeader>
                        <AdminTableHeader>Role</AdminTableHeader>
                        <AdminTableHeader>Status</AdminTableHeader>
                        <AdminTableHeader>Joined</AdminTableHeader>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-800">
                      {users.map((user) => (
                        <tr
                          key={user._id}
                          className="hover:bg-slate-800/30 transition-colors"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/10 flex items-center justify-center">
                                <span className="text-xs font-black text-emerald-400">
                                  {(user.name || 'U')
                                    .charAt(0)
                                    .toUpperCase()}
                                </span>
                              </div>

                              <div className="min-w-0">
                                <p className="text-xs font-bold text-white truncate max-w-[180px]">
                                  {user.name || 'Unnamed User'}
                                </p>

                                <p className="text-[10px] text-slate-600">
                                  ID: {String(user._id).slice(-8)}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <span className="text-xs text-slate-300">
                              {user.email}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            {user.phone ? (
                              <div className="flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />

                                <div>
                                  <p className="text-[11px] text-slate-300">
                                    {user.phone}
                                  </p>

                                  <p className="text-[9px] text-emerald-500">
                                    {user.isPhoneVerified
                                      ? 'Verified'
                                      : 'Not verified'}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-600">
                                No phone
                              </span>
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex px-2 py-1 rounded-lg border text-[9px] font-black ${
                                user.role === 'ADMIN'
                                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                  : 'bg-slate-800 border-slate-700 text-slate-300'
                              }`}
                            >
                              {user.role || 'BUYER'}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 text-[10px] font-bold ${
                                user.isActive === false
                                  ? 'text-rose-400'
                                  : 'text-emerald-400'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  user.isActive === false
                                    ? 'bg-rose-400'
                                    : 'bg-emerald-400'
                                }`}
                              />

                              {user.isActive === false
                                ? 'Inactive'
                                : 'Active'}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-[10px] text-slate-500">
                            {user.createdAt
                              ? new Date(
                                  user.createdAt,
                                ).toLocaleDateString('en-IN')
                              : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState
                  icon={Users}
                  title="No users found"
                  description="No customer accounts are currently available."
                />
              )}
            </div>
          </section>
        )}

        {/* ==========================================================
            PROPERTIES
            ========================================================== */}

        {activeTab === 'PROPERTIES' && (
          <section className="space-y-5 animate-in fade-in duration-150">

            <AdminSectionHeader
              eyebrow="Inventory"
              title="Property Listings"
              description="Manage every land parcel submitted to the marketplace."
              count={`${properties.length} listings`}
            />

            <div className="rounded-3xl border border-slate-800 bg-slate-900 overflow-hidden">

              {properties.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-950/70 border-b border-slate-800">
                      <tr>
                        <AdminTableHeader>
                          Property
                        </AdminTableHeader>

                        <AdminTableHeader>
                          Area
                        </AdminTableHeader>

                        <AdminTableHeader>
                          Price
                        </AdminTableHeader>

                        <AdminTableHeader>
                          Listing
                        </AdminTableHeader>

                        <AdminTableHeader>
                          Verification
                        </AdminTableHeader>

                        <AdminTableHeader>
                          Action
                        </AdminTableHeader>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-800">
                      {properties.map((property) => (
                        <tr
                          key={property._id}
                          className="hover:bg-slate-800/30 transition-colors"
                        >
                          <td className="px-5 py-4">
                            <div className="max-w-[240px]">
                              <p className="text-xs font-bold text-white truncate">
                                {property.title}
                              </p>

                              <p className="mt-1 text-[10px] text-slate-500 truncate">
                                {property.location.city},{' '}
                                {property.location.state}
                              </p>

                              <p className="mt-1 text-[9px] text-slate-700">
                                Seller: {property.sellerName || 'Unknown'}
                              </p>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <span className="text-xs font-bold text-white">
                              {property.landAreaYards}
                            </span>

                            <span className="ml-1 text-[9px] text-slate-500">
                              sq.yds
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <span className="text-xs font-black text-emerald-400">
                              ₹
                              {property.totalPrice.toLocaleString(
                                'en-IN',
                              )}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <StatusPill
                              label={
                                property.listingStatus || 'UNKNOWN'
                              }
                              tone={
                                property.listingStatus === 'PUBLISHED'
                                  ? 'green'
                                  : property.listingStatus ===
                                      'REJECTED'
                                    ? 'red'
                                    : 'neutral'
                              }
                            />
                          </td>

                          <td className="px-5 py-4">
                            <VerificationBadge
                              status={property.verificationStatus}
                            />
                          </td>

                          <td className="px-5 py-4">
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedPropertyForReview(
                                  property,
                                )
                              }
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-emerald-600 border border-slate-700 hover:border-emerald-500 text-[10px] font-black text-slate-300 hover:text-white transition-all"
                            >
                              <Eye className="w-3 h-3" />
                              Inspect
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState
                  icon={Layers}
                  title="No properties"
                  description="No property listings exist in the marketplace."
                />
              )}
            </div>
          </section>
        )}

        {/* ==========================================================
            VERIFICATION
            ========================================================== */}

        {activeTab === 'VERIFICATION' && (
          <section className="space-y-5 animate-in fade-in duration-150">

            <AdminSectionHeader
              eyebrow="Compliance"
              title="Property Verification"
              description="Review ownership documents and approve or reject property submissions."
              count={`${pendingVerificationProperties.length} pending`}
            />

            {pendingVerificationProperties.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                {pendingVerificationProperties.map((property) => (
                  <article
                    key={property._id}
                    className="rounded-3xl border border-slate-800 bg-slate-900 overflow-hidden"
                  >
                    <div className="p-5 border-b border-slate-800">

                      <div className="flex items-start justify-between gap-4">

                        <div className="min-w-0">
                          <p className="text-[9px] uppercase tracking-widest text-amber-400 font-black">
                            Awaiting review
                          </p>

                          <h3 className="mt-1 text-sm font-black text-white truncate">
                            {property.title}
                          </h3>

                          <p className="mt-1 text-[10px] text-slate-500">
                            {property.location.city},{' '}
                            {property.location.state}
                          </p>
                        </div>

                        <VerificationBadge
                          status={property.verificationStatus}
                        />
                      </div>
                    </div>

                    <div className="p-5 space-y-4">

                      <div className="grid grid-cols-2 gap-2">

                        <InfoBox
                          label="Land Area"
                          value={`${property.landAreaYards} sq.yds`}
                        />

                        <InfoBox
                          label="Sale Value"
                          value={`₹${property.totalPrice.toLocaleString(
                            'en-IN',
                          )}`}
                        />

                        <InfoBox
                          label="Govt. Registration"
                          value={
                            property.governmentRegistrationId ||
                            'Not provided'
                          }
                        />

                        <InfoBox
                          label="Documents"
                          value={`${property.documents?.length || 0} uploaded`}
                        />

                      </div>

                      <div className="rounded-2xl bg-slate-950/60 border border-slate-800 p-4">

                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-400" />

                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                            Verification principle
                          </span>
                        </div>

                        <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
                          Review the submitted title and government
                          registration information before approving
                          this listing.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setSelectedPropertyForReview(property)
                        }
                        className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-colors flex items-center justify-center gap-2"
                      >
                        <FileCheck2 className="w-4 h-4" />
                        Review Documents & Title
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-slate-800 bg-slate-900">
                <EmptyState
                  icon={CheckCircle2}
                  title="Verification queue is clear"
                  description="Every submitted property has been reviewed."
                />
              </div>
            )}
          </section>
        )}

        {/* ==========================================================
            PAYMENTS
            ========================================================== */}

        {activeTab === 'PAYMENTS' && (
          <section className="space-y-5 animate-in fade-in duration-150">

            <AdminSectionHeader
              eyebrow="Revenue"
              title="Publishing Payments"
              description="Razorpay transactions associated with property publishing."
              count={`${payments.length} transactions`}
            />

            <div className="rounded-3xl border border-slate-800 bg-slate-900 overflow-hidden">

              {payments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">

                    <thead className="bg-slate-950/70 border-b border-slate-800">
                      <tr>
                        <AdminTableHeader>
                          Receipt
                        </AdminTableHeader>

                        <AdminTableHeader>
                          Property
                        </AdminTableHeader>

                        <AdminTableHeader>
                          Amount
                        </AdminTableHeader>

                        <AdminTableHeader>
                          Razorpay Order
                        </AdminTableHeader>

                        <AdminTableHeader>
                          Status
                        </AdminTableHeader>

                        <AdminTableHeader>
                          Date
                        </AdminTableHeader>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-800">

                      {payments.map((payment) => (
                        <tr
                          key={payment._id}
                          className="hover:bg-slate-800/30 transition-colors"
                        >
                          <td className="px-5 py-4">
                            <span className="font-mono text-[10px] font-bold text-white">
                              {payment.receiptNumber}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <span className="block max-w-[220px] truncate text-xs text-slate-300">
                              {payment.propertyTitle}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <span className="text-xs font-black text-emerald-400">
                              ₹
                              {payment.amount.toLocaleString(
                                'en-IN',
                              )}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <span className="font-mono text-[9px] text-slate-500">
                              {payment.razorpayOrderId}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <StatusPill
                              label={payment.paymentStatus}
                              tone={
                                payment.paymentStatus === 'PAID'
                                  ? 'green'
                                  : payment.paymentStatus ===
                                      'FAILED'
                                    ? 'red'
                                    : 'neutral'
                              }
                            />
                          </td>

                          <td className="px-5 py-4 text-[10px] text-slate-500">
                            {new Date(
                              payment.createdAt,
                            ).toLocaleDateString('en-IN')}
                          </td>
                        </tr>
                      ))}

                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState
                  icon={CreditCard}
                  title="No payment transactions"
                  description="Razorpay payment records will appear here."
                />
              )}
            </div>
          </section>
        )}

        {/* ==========================================================
            SUBSCRIPTIONS
            ========================================================== */}

        {activeTab === 'SUBSCRIPTIONS' && (
          <section className="space-y-5 animate-in fade-in duration-150">

            <AdminSectionHeader
              eyebrow="Billing"
              title="Listing Subscription Overview"
              description="Current marketplace listings and their publishing state."
              count={`${properties.length} listings`}
            />

            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">

              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 mb-5">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />

                  <div>
                    <p className="text-xs font-bold text-amber-300">
                      Subscription data source
                    </p>

                    <p className="mt-1 text-[10px] leading-relaxed text-slate-500">
                      This screen intentionally does not fabricate
                      subscription records from property area. Your
                      actual ListingSubscription collection should
                      be exposed through an admin API before this
                      becomes a true subscription-management screen.
                    </p>
                  </div>
                </div>
              </div>

              {properties.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">

                    <thead className="border-b border-slate-800">
                      <tr>
                        <AdminTableHeader>
                          Property
                        </AdminTableHeader>

                        <AdminTableHeader>
                          Area
                        </AdminTableHeader>

                        <AdminTableHeader>
                          Listing Status
                        </AdminTableHeader>

                        <AdminTableHeader>
                          Payment State
                        </AdminTableHeader>

                        <AdminTableHeader>
                          Verification
                        </AdminTableHeader>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-800">

                      {properties.map((property) => (
                        <tr
                          key={property._id}
                          className="hover:bg-slate-800/30"
                        >
                          <td className="px-5 py-4">
                            <p className="text-xs font-bold text-white truncate max-w-[240px]">
                              {property.title}
                            </p>

                            <p className="mt-1 text-[10px] text-slate-500">
                              {property.location.city},{' '}
                              {property.location.state}
                            </p>
                          </td>

                          <td className="px-5 py-4 text-xs text-slate-300">
                            {property.landAreaYards} sq.yds
                          </td>

                          <td className="px-5 py-4">
                            <StatusPill
                              label={
                                property.listingStatus ||
                                'UNKNOWN'
                              }
                              tone={
                                property.listingStatus ===
                                'PUBLISHED'
                                  ? 'green'
                                  : 'neutral'
                              }
                            />
                          </td>

                          <td className="px-5 py-4">
                            <StatusPill
                              label={
                                'paymentStatus' in property
                                  ? String(
                                      (
                                        property as IProperty & {
                                          paymentStatus?: string;
                                        }
                                      ).paymentStatus ||
                                        'UNKNOWN',
                                    )
                                  : 'See Payments'
                              }
                              tone="neutral"
                            />
                          </td>

                          <td className="px-5 py-4">
                            <VerificationBadge
                              status={property.verificationStatus}
                            />
                          </td>
                        </tr>
                      ))}

                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState
                  icon={Clock}
                  title="No listing records"
                  description="There are currently no properties to display."
                />
              )}
            </div>
          </section>
        )}

        {/* ==========================================================
            REPORTS
            ========================================================== */}

        {activeTab === 'REPORTS' && (
          <section className="space-y-5 animate-in fade-in duration-150">

            <AdminSectionHeader
              eyebrow="Trust & safety"
              title="Customer Reports"
              description="Review complaints and suspicious listing reports submitted by customers."
              count={`${reports.length} reports`}
            />

            {reports.length > 0 ? (
              <div className="space-y-3">

                {reports.map((report) => (
                  <article
                    key={report._id}
                    className="rounded-2xl border border-slate-800 bg-slate-900 p-5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">

                      <div>
                        <div className="flex items-center gap-2">

                          <span className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center">
                            <Flag className="w-3.5 h-3.5 text-rose-400" />
                          </span>

                          <div>
                            <p className="text-xs font-black text-rose-400">
                              {String(report.reason).replace(
                                /_/g,
                                ' ',
                              )}
                            </p>

                            <p className="text-[9px] text-slate-600">
                              Report ID: {String(report._id).slice(-8)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <time className="text-[10px] text-slate-600">
                        {new Date(
                          report.createdAt,
                        ).toLocaleString('en-IN')}
                      </time>
                    </div>

                    <div className="mt-4 rounded-xl bg-slate-950/60 border border-slate-800 p-4">
                      <p className="text-[11px] leading-relaxed text-slate-400">
                        &ldquo;{report.description}&rdquo;
                      </p>
                    </div>
                  </article>
                ))}

              </div>
            ) : (
              <div className="rounded-3xl border border-slate-800 bg-slate-900">
                <EmptyState
                  icon={Flag}
                  title="No customer reports"
                  description="No suspicious listing reports have been filed."
                />
              </div>
            )}
          </section>
        )}

        {/* ==========================================================
            AUDIT LOG
            ========================================================== */}

        {activeTab === 'AUDIT' && (
          <section className="space-y-5 animate-in fade-in duration-150">

            <AdminSectionHeader
              eyebrow="Security"
              title="Administrative Audit Trail"
              description="Immutable operational history of important platform actions."
              count={`${auditLogs.length} entries`}
            />

            <div className="rounded-3xl border border-slate-800 bg-slate-900 overflow-hidden">

              {auditLogs.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">

                    <thead className="bg-slate-950/70 border-b border-slate-800">
                      <tr>
                        <AdminTableHeader>
                          Action
                        </AdminTableHeader>

                        <AdminTableHeader>
                          Actor
                        </AdminTableHeader>

                        <AdminTableHeader>
                          Entity
                        </AdminTableHeader>

                        <AdminTableHeader>
                          Timestamp
                        </AdminTableHeader>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-800">

                      {auditLogs.map((log) => (
                        <tr
                          key={log._id}
                          className="hover:bg-slate-800/30"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <Activity className="w-3.5 h-3.5 text-emerald-400" />

                              <span className="font-mono text-[10px] font-bold text-emerald-400">
                                {log.action}
                              </span>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div>
                              <p className="text-xs font-bold text-white">
                                {log.actorName || 'Unknown'}
                              </p>

                              {log.actorEmail && (
                                <p className="mt-0.5 text-[9px] text-slate-600">
                                  {log.actorEmail}
                                </p>
                              )}
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <span className="px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-[9px] font-bold text-slate-400">
                              {log.entityType || 'SYSTEM'}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-[10px] text-slate-500">
                            {new Date(
                              log.createdAt,
                            ).toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}

                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState
                  icon={Activity}
                  title="Audit trail is empty"
                  description="Administrative activity will appear here."
                />
              )}
            </div>
          </section>
        )}

        {/* ==========================================================
            SETTINGS
            ========================================================== */}

        {activeTab === 'SETTINGS' && (
          <section className="space-y-6 animate-in fade-in duration-150">

            <AdminSectionHeader
              eyebrow="Platform configuration"
              title="Authentication & Platform Settings"
              description="Control customer authentication policies and inspect infrastructure configuration."
            />

            <div className="rounded-3xl border border-slate-800 bg-slate-900 overflow-hidden">

              <div className="p-6 sm:p-8 border-b border-slate-800">

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

                  <div>
                    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black uppercase tracking-wider text-emerald-400">
                      <ShieldCheck className="w-3 h-3" />
                      Authoritative Policy
                    </div>

                    <h2 className="mt-3 text-xl font-black text-white">
                      Security Policies
                    </h2>

                    <p className="mt-1 text-[10px] text-slate-500 max-w-xl">
                      These settings are stored in MongoDB and control
                      authentication requirements across the marketplace.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveSettings}
                    disabled={savingSettings}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-black transition-colors"
                  >
                    {savingSettings ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}

                    {savingSettings
                      ? 'Saving...'
                      : 'Save Settings'}
                  </button>
                </div>

                {settingsSaveSuccess && (
                  <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />

                      <p className="text-xs font-bold text-emerald-300">
                        Platform settings saved successfully.
                      </p>
                    </div>
                  </div>
                )}

                {settingsError && (
                  <div className="mt-5 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-400" />

                      <p className="text-xs font-bold text-rose-300">
                        {settingsError}
                      </p>
                    </div>
                  </div>
                )}

                {/* Fee & Commercial Rules */}
                <div className="mt-7 rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
                    <div>
                      <h3 className="text-sm font-black text-white">
                        Listing Publishing Fee & Duration
                      </h3>
                      <p className="mt-0.5 text-[10px] text-slate-500">
                        Universal publishing charge required from sellers to submit a property for verification.
                      </p>
                    </div>
                    <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-400">
                      Active: ₹{settings.listingFeeAmount || 10} for {settings.listingFeeDurationDays || 30} days
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="admin-listing-fee" className="block text-xs font-bold text-slate-300 mb-1.5">
                        Listing Fee Amount (₹ INR)
                      </label>
                      <input
                        id="admin-listing-fee"
                        type="number"
                        min={1}
                        max={100000}
                        step={1}
                        value={settings.listingFeeAmount || 10}
                        onChange={(e) => {
                          const val = Math.max(1, Math.min(100000, Number(e.target.value) || 10));
                          setSettings((prev) => ({ ...prev, listingFeeAmount: val }));
                        }}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm font-black text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                      />
                      <p className="mt-1.5 text-[10px] text-slate-500">
                        Flat fee charged via Razorpay for all new listings.
                      </p>
                    </div>

                    <div>
                      <label htmlFor="admin-duration-days" className="block text-xs font-bold text-slate-300 mb-1.5">
                        Validity Duration (Days)
                      </label>
                      <input
                        id="admin-duration-days"
                        type="number"
                        min={1}
                        max={365}
                        step={1}
                        value={settings.listingFeeDurationDays || 30}
                        onChange={(e) => {
                          const val = Math.max(1, Math.min(365, Number(e.target.value) || 30));
                          setSettings((prev) => ({ ...prev, listingFeeDurationDays: val }));
                        }}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm font-black text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                      />
                      <p className="mt-1.5 text-[10px] text-slate-500">
                        Active publishing cycle before renewal is requested.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">

                  <AdminToggle
                    title="Google Login Required"
                    description="Require Google authentication for protected customer actions such as accessing full property information and seller contact."
                    enabled={settings.requireGoogleLogin}
                    onChange={() =>
                      setSettings((previous) => ({
                        ...previous,
                        requireGoogleLogin:
                          !previous.requireGoogleLogin,
                      }))
                    }
                  />

                  <AdminToggle
                    title="Phone OTP Required"
                    description="Require verified phone OTP before a seller can create or publish land listings."
                    enabled={settings.requirePhoneOtp}
                    onChange={() =>
                      setSettings((previous) => ({
                        ...previous,
                        requirePhoneOtp:
                          !previous.requirePhoneOtp,
                      }))
                    }
                  />

                </div>
              </div>

              {/* Settings metadata */}

              <div className="px-6 sm:px-8 py-4 bg-slate-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-[9px] text-slate-600">
                  Updated by:{' '}
                  <span className="text-slate-500">
                    {settings.updatedBy || 'SYSTEM'}
                  </span>
                </span>

                <span className="text-[9px] text-slate-600">
                  Last modified:{' '}
                  <span className="text-slate-500">
                    {settings.updatedAt
                      ? new Date(
                          settings.updatedAt,
                        ).toLocaleString('en-IN')
                      : 'Recently'}
                  </span>
                </span>
              </div>
            </div>

            {/* Integrations */}

            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8">

              <div className="flex items-center gap-3">

                <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center">
                  <Server className="w-4 h-4 text-emerald-400" />
                </div>

                <div>
                  <h3 className="text-sm font-black text-white">
                    Infrastructure & Integrations
                  </h3>

                  <p className="mt-1 text-[10px] text-slate-500">
                    Environment-backed services used by BhoomiMitra.
                  </p>
                </div>
              </div>

              {Object.keys(integrations).length > 0 ? (
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">

                  {Object.entries(integrations).map(
                    ([key, item]) => (
                      <div
                        key={key}
                        className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">

                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white">
                              {item.name}
                            </p>

                            <p className="mt-1 text-[10px] leading-relaxed text-slate-500">
                              {item.description}
                            </p>

                            <p className="mt-2 font-mono text-[9px] text-slate-700">
                              {item.envVar}
                            </p>
                          </div>

                          <span
                            className={`shrink-0 px-2 py-1 rounded-lg text-[8px] font-black ${
                              item.configured
                                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                                : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                            }`}
                          >
                            {item.configured
                              ? 'READY'
                              : 'MISSING'}
                          </span>
                        </div>
                      </div>
                    ),
                  )}

                </div>
              ) : (
                <div className="mt-5">
                  <EmptyState
                    icon={Server}
                    title="No integration status available"
                    description="The integration status endpoint did not return any services."
                  />
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {/* ============================================================
          PROPERTY REVIEW MODAL
          ============================================================ */}

      {selectedPropertyForReview && (
        <PropertyReviewModal
          property={selectedPropertyForReview}
          isOpen={Boolean(selectedPropertyForReview)}
          onClose={() =>
            setSelectedPropertyForReview(null)
          }
          onActionComplete={async () => {
            setSelectedPropertyForReview(null);
            await loadAdminData();
          }}
        />
      )}
    </div>
  );
}

/* ================================================================
   REUSABLE UI COMPONENTS
================================================================ */

interface AdminMetricCardProps {
  label: string;
  value: string | number;
  secondary: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: 'default' | 'amber' | 'emerald';
}

function AdminMetricCard({
  label,
  value,
  secondary,
  icon: Icon,
  tone = 'default',
}: AdminMetricCardProps) {
  const toneClasses = {
    default: {
      icon: 'bg-slate-800 text-slate-300',
      value: 'text-white',
    },
    amber: {
      icon: 'bg-amber-500/10 text-amber-400',
      value: 'text-amber-400',
    },
    emerald: {
      icon: 'bg-emerald-500/10 text-emerald-400',
      value: 'text-emerald-400',
    },
  };

  const currentTone = toneClasses[tone];

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            {label}
          </p>

          <p
            className={`mt-2 text-2xl font-black tracking-tight ${currentTone.value}`}
          >
            {value}
          </p>
        </div>

        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center ${currentTone.icon}`}
        >
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <p className="mt-3 text-[9px] text-slate-600">
        {secondary}
      </p>
    </div>
  );
}

interface MiniMetricProps {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
}

function MiniMetric({
  label,
  value,
  icon: Icon,
}: MiniMetricProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
        <Icon className="w-3.5 h-3.5 text-slate-400" />
      </div>

      <div>
        <p className="text-[9px] uppercase tracking-wider text-slate-600">
          {label}
        </p>

        <p className="text-sm font-black text-white">
          {value}
        </p>
      </div>
    </div>
  );
}

interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: EmptyStateProps) {
  return (
    <div className="py-10 text-center">
      <div className="mx-auto w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
        <Icon className="w-4 h-4 text-slate-500" />
      </div>

      <p className="mt-3 text-xs font-bold text-slate-400">
        {title}
      </p>

      <p className="mt-1 text-[10px] text-slate-600">
        {description}
      </p>
    </div>
  );
}

interface AdminSectionHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  count?: string;
}

function AdminSectionHeader({
  eyebrow,
  title,
  description,
  count,
}: AdminSectionHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
      <div>
        <p className="text-[9px] uppercase tracking-[0.2em] font-black text-emerald-400">
          {eyebrow}
        </p>

        <h2 className="mt-1 text-2xl font-black tracking-tight text-white">
          {title}
        </h2>

        <p className="mt-1 text-xs text-slate-500 max-w-2xl">
          {description}
        </p>
      </div>

      {count && (
        <span className="shrink-0 inline-flex items-center px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[9px] font-bold text-slate-400">
          {count}
        </span>
      )}
    </div>
  );
}

function AdminTableHeader({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <th className="px-5 py-3 text-[9px] uppercase tracking-wider font-black text-slate-600 whitespace-nowrap">
      {children}
    </th>
  );
}

interface StatusPillProps {
  label: string;
  tone?: 'green' | 'red' | 'amber' | 'neutral';
}

function StatusPill({
  label,
  tone = 'neutral',
}: StatusPillProps) {
  const classes = {
    green:
      'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    red:
      'bg-rose-500/10 border-rose-500/20 text-rose-400',
    amber:
      'bg-amber-500/10 border-amber-500/20 text-amber-400',
    neutral:
      'bg-slate-800 border-slate-700 text-slate-400',
  };

  return (
    <span
      className={`inline-flex px-2 py-1 rounded-lg border text-[9px] font-black uppercase ${classes[tone]}`}
    >
      {label}
    </span>
  );
}

function InfoBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
      <p className="text-[8px] uppercase tracking-wider font-black text-slate-600">
        {label}
      </p>

      <p className="mt-1 text-[10px] font-bold text-slate-300 truncate">
        {value}
      </p>
    </div>
  );
}

interface AdminToggleProps {
  title: string;
  description: string;
  enabled: boolean;
  onChange: () => void;
}

function AdminToggle({
  title,
  description,
  enabled,
  onChange,
}: AdminToggleProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5">

      <div className="flex items-start justify-between gap-4">

        <div className="min-w-0">
          <h3 className="text-sm font-black text-white">
            {title}
          </h3>

          <p className="mt-1 text-[10px] leading-relaxed text-slate-500">
            {description}
          </p>
        </div>

        <button
          type="button"
          onClick={onChange}
          aria-label={`${title}: ${
            enabled ? 'enabled' : 'disabled'
          }`}
          className={`shrink-0 transition-colors ${
            enabled
              ? 'text-emerald-400'
              : 'text-slate-600'
          }`}
        >
          {enabled ? (
            <ToggleRight className="w-10 h-10" />
          ) : (
            <ToggleLeft className="w-10 h-10" />
          )}
        </button>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">

        <span className="text-[9px] font-bold text-slate-600">
          Current state
        </span>

        <span
          className={`px-2 py-1 rounded-lg text-[8px] font-black border ${
            enabled
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
          }`}
        >
          {enabled ? 'ENFORCED' : 'DISABLED'}
        </span>
      </div>
    </div>
  );
}
