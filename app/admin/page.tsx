'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Layers,
  FileCheck2,
  Users,
  CheckCircle2,
  AlertCircle,
  Flag,
  Activity,
  Server,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

import {
  AdminSectionHeader,
  AdminMetricCard,
  MiniMetric,
  EmptyState,
} from '@/components/admin/AdminUI';

interface AdminStats {
  totalProperties?: number;
  publishedProperties?: number;
  pendingProperties?: number;
  verifiedProperties?: number;
  rejectedProperties?: number;
  totalReportsCount?: number;
  pendingReports?: number;
  totalUsers?: number;
}

interface IntegrationStatusItem {
  name: string;
  configured: boolean;
  envVar: string;
  description: string;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [integrations, setIntegrations] = useState<Record<string, IntegrationStatusItem>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);

  const loadDashboardData = useCallback(async () => {
    try {
      const [statsRes, auditRes, intRes] = await Promise.all([
        fetch('/api/admin/stats', { cache: 'no-store' }).catch(() => null),
        fetch('/api/admin/audit-logs', { cache: 'no-store' }).catch(() => null),
        fetch('/api/integrations/status', { cache: 'no-store' }).catch(() => null),
      ]);

      if (statsRes?.ok) {
        const statsData = await statsRes.json();
        if (statsData?.metrics) setStats(statsData.metrics);
      }

      if (auditRes?.ok) {
        const auditData = await auditRes.json();
        if (Array.isArray(auditData?.logs)) setAuditLogs(auditData.logs);
      }

      if (intRes?.ok) {
        const intData = await intRes.json();
        if (intData?.status) setIntegrations(intData.status);
      }

      setLastRefreshedAt(new Date());
      setError('');
    } catch (err: unknown) {
      console.error('Dashboard load error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleRefresh = () => {
    setLoading(true);
    setError('');
    loadDashboardData();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Section Header with Dedicated Refresh */}
      <AdminSectionHeader
        eyebrow="Platform Overview"
        title="Admin Executive Dashboard"
        description="Real-time monitoring of listings, verification queue, customer accounts, reports and platform health."
        onRefresh={handleRefresh}
        isRefreshing={loading}
        lastRefreshedAt={lastRefreshedAt}
      />

      {error && (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs font-semibold text-rose-300 flex items-center justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={handleRefresh}
            className="px-3 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-bold"
          >
            Retry
          </button>
        </div>
      )}

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminMetricCard
          label="Total Properties"
          value={stats?.totalProperties ?? 0}
          secondary={`${stats?.publishedProperties ?? 0} active live listings`}
          icon={Layers}
        />

        <AdminMetricCard
          label="Verification Queue"
          value={stats?.pendingProperties ?? 0}
          secondary="Awaiting moderation review"
          icon={FileCheck2}
          tone="amber"
        />

        <AdminMetricCard
          label="Registered Users"
          value={stats?.totalUsers ?? 0}
          secondary="Buyers & sellers verified"
          icon={Users}
          tone="blue"
        />

        <AdminMetricCard
          label="Reports Pending"
          value={stats?.pendingReports ?? 0}
          secondary="Trust & safety items awaiting review"
          icon={Flag}
          tone="emerald"
        />
      </div>

      {/* Secondary Quick Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MiniMetric
          label="Published Live"
          value={stats?.publishedProperties ?? 0}
          icon={CheckCircle2}
        />

        <MiniMetric
          label="Reviewed"
          value={stats?.verifiedProperties ?? 0}
          icon={ShieldCheck}
        />

        <MiniMetric
          label="Rejected"
          value={stats?.rejectedProperties ?? 0}
          icon={AlertCircle}
        />

        <MiniMetric
          label="User Reports"
          value={stats?.totalReportsCount ?? 0}
          icon={Flag}
        />
      </div>

      {/* Quick Navigation Hub */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/admin/moderation"
          className="rounded-3xl border border-slate-800 bg-slate-900 p-5 hover:border-amber-500/40 hover:bg-slate-800/60 transition-all group shadow-xs"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="mt-4 text-sm font-black text-white">Moderate Listings</h3>
          <p className="mt-1 text-xs text-slate-400">
            {stats?.pendingProperties ?? 0} properties waiting for title, document, and fraud inspection.
          </p>
        </Link>

        <Link
          href="/admin/users"
          className="rounded-3xl border border-slate-800 bg-slate-900 p-5 hover:border-blue-500/40 hover:bg-slate-800/60 transition-all group shadow-xs"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="mt-4 text-sm font-black text-white">Manage Accounts</h3>
          <p className="mt-1 text-xs text-slate-400">
            Search users, adjust roles, verify phone status, and review activity.
          </p>
        </Link>
      </div>

      {/* Operations Overview & Recent Audit */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Platform Activity */}
        <section className="rounded-3xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xs">
          <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-black text-white">Latest Security &amp; Activity Logs</h3>
            </div>
            <Link
              href="/admin/audit-logs"
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              View all
            </Link>
          </div>

          <div className="p-4">
            {auditLogs.length > 0 ? (
              <div className="space-y-2">
                {auditLogs.slice(0, 5).map((log: any) => (
                  <div
                    key={log._id || log.id}
                    className="flex items-center gap-3 p-3 rounded-2xl border border-slate-800/80 bg-slate-950/60 hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <Activity className="w-3.5 h-3.5 text-emerald-400" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-mono font-bold text-emerald-400 truncate">
                        {log.action}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {log.actorName || log.actorEmail || 'System'} • {log.entityType || 'PLATFORM'}
                      </p>
                    </div>

                    <time className="text-[10px] text-slate-500 font-mono shrink-0">
                      {log.createdAt ? new Date(log.createdAt).toLocaleTimeString('en-IN') : ''}
                    </time>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Activity}
                title="No recent activity"
                description="Administrative and moderation actions will appear here."
              />
            )}
          </div>
        </section>

        {/* Platform Services & Infrastructure */}
        <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-black text-white">Infrastructure &amp; Integrations</h3>
              </div>
              <Link
                href="/admin/settings"
                className="text-xs font-bold text-emerald-400 hover:text-emerald-300"
              >
                Configure
              </Link>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {Object.entries(integrations).slice(0, 6).map(([key, item]) => (
                <div
                  key={key}
                  className="rounded-2xl border border-slate-800 bg-slate-950/50 p-3 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{item.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono truncate">{item.envVar}</p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[9px] font-black shrink-0 ${
                      item.configured
                        ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                        : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                    }`}
                  >
                    {item.configured ? 'ACTIVE' : 'MISSING'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>BhoomiMitra Property Marketplace</span>
            </span>
            <span className="font-mono text-[10px]">v2.4 Production</span>
          </div>
        </section>
      </div>
    </div>
  );
}
