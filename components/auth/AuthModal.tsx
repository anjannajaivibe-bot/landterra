'use client';

import React, { useState } from 'react';

import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Compass,
  Loader2,
  ShieldCheck,
  X,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  redirectUrl?: string;
  title?: string;
  description?: string;
}

export function AuthModal({
  isOpen,
  onClose,
  redirectUrl,
  title = 'Sign in to BhoomiMitra',
  description = 'Continue with your Google account to access your BhoomiMitra account.',
}: AuthModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClose = () => {
    if (loading) return;

    setError('');
    onClose();
  };

  const handleGoogleLogin = async () => {
    if (loading) return;

    setLoading(true);
    setError('');

    try {
      const destination =
        redirectUrl ||
        `${window.location.pathname}${window.location.search}${window.location.hash}`;

      const response = await fetch(
        `/api/auth/google?redirect=${encodeURIComponent(destination)}`,
        {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        },
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error ||
          'Unable to start Google authentication.',
        );
      }

      if (!data?.url) {
        throw new Error(
          'Google authentication URL was not returned.',
        );
      }

      window.location.assign(data.url);
    } catch (err: unknown) {
      console.error(
        'Google authentication error:',
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to start Google authentication.',
      );

      setLoading(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bhoomimitra-auth-title"
    >
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/40 p-6 text-white">
          <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#FF9933]/15 blur-3xl" />

          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-slate-300 transition-colors hover:bg-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close sign in"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="relative flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FF9933] text-white shadow-lg">
              <Compass className="h-4 w-4" />
            </div>

            <span className="text-lg font-black tracking-tight">
              Bhoomi
              <span className="text-[#FF9933]">
                Mitra
              </span>
            </span>
          </div>

          <h2
            id="bhoomimitra-auth-title"
            className="relative mt-5 text-xl font-black tracking-tight"
          >
            {title}
          </h2>

          <p className="relative mt-2 max-w-sm text-xs leading-5 text-slate-300">
            {description}
          </p>
        </div>

        <div className="space-y-5 p-6">
          {error && (
            <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

              <p className="leading-5">
                {error}
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-sm font-bold text-slate-800 shadow-sm transition-all hover:bg-slate-50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin text-slate-600" />
            ) : (
              <GoogleIcon />
            )}

            <span>
              {loading
                ? 'Connecting to Google...'
                : 'Continue with Google'}
            </span>

            {!loading && (
              <ArrowRight className="ml-auto h-4 w-4 text-slate-400" />
            )}
          </button>

          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              One BhoomiMitra account
            </p>

            <AuthBenefit
              title="Find Property"
              description="Save properties, send inquiries and manage your property searches."
            />

            <AuthBenefit
              title="Sell your property"
              description="Create listings, manage their status and track inquiries."
            />

            <AuthBenefit
              title="One profile"
              description="The same account works for both buying and selling."
            />
          </div>

          <div className="rounded-2xl border border-[#FF9933]/30 bg-[#fff9f0] p-4">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#FF9933]" />

              <div>
                <p className="text-[11px] font-black text-slate-900">
                  Your account stays yours
                </p>

                <p className="mt-1 text-[10px] leading-5 text-[#7a3705]">
                  We use Google to securely identify your account.
                  BhoomiMitra does not ask you to create another password.
                </p>
              </div>
            </div>
          </div>

          <p className="text-center text-[9px] leading-4 text-slate-400">
            By continuing, you agree to use BhoomiMitra responsibly
            and understand that property information should be
            independently verified before making a transaction.
          </p>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg
      className="h-5 w-5 shrink-0"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

function AuthBenefit({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#fff1dc]">
        <CheckCircle2 className="h-3.5 w-3.5 text-[#FF9933]" />
      </div>

      <div>
        <p className="text-xs font-bold text-slate-800">
          {title}
        </p>

        <p className="mt-0.5 text-[10px] leading-4 text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
}