'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Flag,
  Search,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Loader2,
  Check,
  X,
  MessageSquare,
} from 'lucide-react';

import { IReport } from '@/types/inquiry';
import {
  AdminSectionHeader,
  AdminTableHeader,
  StatusPill,
  EmptyState,
} from '@/components/admin/AdminUI';

export default function AdminReportsPage() {
  const [reports, setReports] = useState<IReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadReports = useCallback(async () => {
    try {
      const res = await fetch('/api/reports', {
        cache: 'no-store',
        credentials: 'include',
      });

      if (!res.ok) throw new Error('Failed to load user complaints & reports.');

      const data = await res.json();
      if (Array.isArray(data?.reports)) {
        setReports(data.reports);
      }
      setLastRefreshedAt(new Date());
      setError('');
    } catch (err: unknown) {
      console.error('Reports load error:', err);
      setError(err instanceof Error ? err.message : 'Error fetching reports');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleRefresh = () => {
    setLoading(true);
    setError('');
    loadReports();
  };

  const handleUpdateStatus = async (reportId: string, status: 'RESOLVED' | 'DISMISSED') => {
    setUpdatingId(reportId);
    try {
      const res = await fetch('/api/reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId, status }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Failed to update report status');
      }

      setReports((prev) =>
        prev.map((r) => (r._id === reportId ? { ...r, status } : r))
      );
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error updating report');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      if (statusFilter === 'ALL') return true;
      return r.status === statusFilter;
    });
  }, [reports, statusFilter]);

  const stats = useMemo(() => {
    const pending = reports.filter((r) => !r.status || r.status === 'PENDING').length;
    const resolved = reports.filter((r) => r.status === 'RESOLVED').length;
    const dismissed = reports.filter((r) => r.status === 'DISMISSED').length;
    return { total: reports.length, pending, resolved, dismissed };
  }, [reports]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Section Header with Dedicated Refresh */}
      <AdminSectionHeader
        eyebrow="Marketplace Integrity"
        title="User Reports &amp; Complaints"
        description="Inspect user grievances regarding fraudulent prices, misleading land data, or inappropriate behavior."
        count={`${filteredReports.length} of ${reports.length} Reports`}
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

      {/* Summary Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3.5">
          <p className="text-[10px] uppercase font-bold text-slate-500">Total Submissions</p>
          <p className="text-xl font-black text-white mt-1">{stats.total}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3.5">
          <p className="text-[10px] uppercase font-bold text-amber-500">Pending Review</p>
          <p className="text-xl font-black text-amber-400 mt-1">{stats.pending}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3.5">
          <p className="text-[10px] uppercase font-bold text-emerald-500">Resolved</p>
          <p className="text-xl font-black text-emerald-400 mt-1">{stats.resolved}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3.5">
          <p className="text-[10px] uppercase font-bold text-slate-500">Dismissed</p>
          <p className="text-xl font-black text-slate-400 mt-1">{stats.dismissed}</p>
        </div>
      </div>

      {/* Status Filter Bar */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {['ALL', 'PENDING', 'RESOLVED', 'DISMISSED'].map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors shrink-0 ${
              statusFilter === st
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Reports Table */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800">
              <tr>
                <AdminTableHeader>Report Reason</AdminTableHeader>
                <AdminTableHeader>Complaint Details</AdminTableHeader>
                <AdminTableHeader>Target Property</AdminTableHeader>
                <AdminTableHeader>Reporter</AdminTableHeader>
                <AdminTableHeader>Status</AdminTableHeader>
                <AdminTableHeader>Actions</AdminTableHeader>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading && reports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-400 mb-2" />
                    <span>Loading report records...</span>
                  </td>
                </tr>
              ) : filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <EmptyState
                      icon={Flag}
                      title="No reports match your filter"
                      description="There are no user grievances matching the selected state."
                    />
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => {
                  const isUpdating = updatingId === report._id;

                  return (
                    <tr key={report._id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Reason */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold text-xs">
                          {report.reason?.replace(/_/g, ' ') || 'General Report'}
                        </span>
                      </td>

                      {/* Details */}
                      <td className="px-5 py-4 min-w-[240px]">
                        <p className="text-slate-300 leading-relaxed max-w-sm line-clamp-2">
                          {report.description || 'No message provided.'}
                        </p>
                      </td>

                      {/* Target Property */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <Link
                          href={`/properties/${report.propertyId}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 font-mono text-emerald-400 hover:underline"
                        >
                          <span>{report.propertyId.slice(-8)}</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>

                      {/* Reporter */}
                      <td className="px-5 py-4 whitespace-nowrap text-slate-400">
                        <p className="text-slate-200 font-medium">{report.reporterName || 'Anonymous'}</p>
                        <p className="text-[10px] text-slate-500">{report.reporterEmail || '—'}</p>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <StatusPill
                          label={report.status || 'PENDING'}
                          tone={
                            report.status === 'RESOLVED'
                              ? 'green'
                              : report.status === 'DISMISSED'
                              ? 'neutral'
                              : 'amber'
                          }
                        />
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {report.status !== 'RESOLVED' && (
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => handleUpdateStatus(report._id, 'RESOLVED')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                              title="Mark resolved"
                            >
                              <Check className="w-3 h-3" />
                              <span>Resolve</span>
                            </button>
                          )}

                          {report.status !== 'DISMISSED' && (
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => handleUpdateStatus(report._id, 'DISMISSED')}
                              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white font-bold text-[11px] transition-colors cursor-pointer"
                              title="Dismiss report"
                            >
                              <X className="w-3 h-3" />
                              <span>Dismiss</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
