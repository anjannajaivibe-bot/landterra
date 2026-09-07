'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Settings,
  Server,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  CreditCard,
  Lock,
  Phone,
} from 'lucide-react';

import { IPlatformSettings } from '@/models/PlatformSettings';
import {
  AdminSectionHeader,
  AdminToggle,
  EmptyState,
} from '@/components/admin/AdminUI';

interface IntegrationStatusItem {
  name: string;
  configured: boolean;
  envVar: string;
  description: string;
}

const DEFAULT_SETTINGS: IPlatformSettings = {
  requireGoogleLogin: true,
  requirePhoneOtp: true,
  listingFeeAmount: 10,
  listingFeeDurationDays: 30,
  updatedBy: 'SYSTEM',
  updatedAt: new Date(),
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<IPlatformSettings>(DEFAULT_SETTINGS);
  const [integrations, setIntegrations] = useState<Record<string, IntegrationStatusItem>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);

  // Saving state
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  const loadSettingsAndIntegrations = useCallback(async () => {
    try {
      const [settingsRes, intRes] = await Promise.all([
        fetch('/api/admin/settings', { cache: 'no-store', credentials: 'include' }).catch(() => null),
        fetch('/api/integrations/status', { cache: 'no-store', credentials: 'include' }).catch(() => null),
      ]);

      if (settingsRes?.ok) {
        const sData = await settingsRes.json();
        if (sData?.settings) setSettings(sData.settings);
      }

      if (intRes?.ok) {
        const iData = await intRes.json();
        if (iData?.status) setIntegrations(iData.status);
      }

      setLastRefreshedAt(new Date());
      setError('');
    } catch (err: unknown) {
      console.error('Settings load error:', err);
      setError(err instanceof Error ? err.message : 'Error fetching system settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettingsAndIntegrations();
  }, [loadSettingsAndIntegrations]);

  const handleRefresh = () => {
    setLoading(true);
    setError('');
    loadSettingsAndIntegrations();
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    setSaveError('');
    setSaveSuccess(false);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Failed to save system settings');
      }

      setSaveSuccess(true);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Error saving system settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Section Header with Dedicated Refresh */}
      <AdminSectionHeader
        eyebrow="System Configuration"
        title="Platform Rules &amp; Settings"
        description="Configure universal commercial pricing, publishing duration cycles, authentication gates, and review infrastructure status."
        onRefresh={handleRefresh}
        isRefreshing={loading}
        lastRefreshedAt={lastRefreshedAt}
        actions={
          <button
            type="button"
            disabled={saving || loading}
            onClick={handleSaveSettings}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-emerald-950/40 cursor-pointer transition-colors"
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save Configuration</span>
              </>
            )}
          </button>
        }
      />

      {saveSuccess && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs font-bold text-emerald-400 flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Platform rules and listing fee settings updated successfully across the entire marketplace.</span>
        </div>
      )}

      {saveError && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs font-bold text-rose-300 flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-400" />
          <span>{saveError}</span>
        </div>
      )}

      {/* Commercial & Fee Configuration Card */}
      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <h2 className="text-base font-black text-white">Listing Subscription &amp; Fee Policy</h2>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Universal commercial publishing fee charged via Razorpay for landowner classified advertisements.
            </p>
          </div>
          <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-black text-emerald-400 self-start sm:self-auto">
            Live Rate: ₹{settings.listingFeeAmount || 10} for {settings.listingFeeDurationDays || 30} Days
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label htmlFor="admin-listing-fee" className="block text-xs font-bold text-slate-300 mb-1.5">
              Classified Listing Fee (₹ INR)
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
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-sm font-black text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
            <p className="mt-1.5 text-[11px] text-slate-500 leading-relaxed">
              Standard subscription cost charged via Razorpay before a landowner&apos;s property becomes publicly visible.
            </p>
          </div>

          <div>
            <label htmlFor="admin-duration-days" className="block text-xs font-bold text-slate-300 mb-1.5">
              Listing Validity Duration (Days)
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
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-sm font-black text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
            <p className="mt-1.5 text-[11px] text-slate-500 leading-relaxed">
              Active lifecycle period before the advertisement expires and requires renewal.
            </p>
          </div>
        </div>
      </section>

      {/* Security & Access Gating */}
      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-blue-400" />
            <h2 className="text-base font-black text-white">Security &amp; Verification Enforcement</h2>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Control automated spam defense, mandatory Google SSO, and phone OTP requirements.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AdminToggle
            title="Google Login Gate"
            description="Require Google authentication before users can access full protected property details or call seller directly."
            enabled={Boolean(settings.requireGoogleLogin)}
            onChange={() =>
              setSettings((prev) => ({
                ...prev,
                requireGoogleLogin: !prev.requireGoogleLogin,
              }))
            }
          />

          <AdminToggle
            title="Phone OTP Verification Gate"
            description="Require verified Indian mobile phone OTP before a landowner can create or publish land listings."
            enabled={Boolean(settings.requirePhoneOtp)}
            onChange={() =>
              setSettings((prev) => ({
                ...prev,
                requirePhoneOtp: !prev.requirePhoneOtp,
              }))
            }
          />
        </div>

        <div className="pt-2 text-right">
          <button
            type="button"
            disabled={saving || loading}
            onClick={handleSaveSettings}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-emerald-950/40 cursor-pointer transition-colors"
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving Rules...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save All Platform Rules</span>
              </>
            )}
          </button>
        </div>
      </section>

      {/* Infrastructure & Integrations Status */}
      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-400" />
              <h2 className="text-base font-black text-white">Infrastructure &amp; External Integrations</h2>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Health check of environment credentials for payment gateways, cloud storage, maps, and bot defense.
            </p>
          </div>
        </div>

        {Object.keys(integrations).length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(integrations).map(([key, item]) => (
              <div
                key={key}
                className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4.5 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-bold text-white">{item.name}</p>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[8px] font-black shrink-0 ${
                        item.configured
                          ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                          : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                      }`}
                    >
                      {item.configured ? 'CONFIGURED' : 'MISSING'}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400 leading-relaxed">{item.description}</p>
                </div>

                <div className="pt-2 border-t border-slate-800/80">
                  <p className="text-[10px] font-mono text-slate-500 truncate" title={item.envVar}>
                    {item.envVar}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Server}
            title="No integration metadata available"
            description="Could not query integration status service."
          />
        )}
      </section>
    </div>
  );
}
