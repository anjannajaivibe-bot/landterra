'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  Loader2,
  FileCode,
  X,
} from 'lucide-react';

import { IAuditLog } from '@/types/user';
import {
  AdminSectionHeader,
  AdminTableHeader,
  StatusPill,
  EmptyState,
} from '@/components/admin/AdminUI';

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<IAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLogForMetadata, setSelectedLogForMetadata] = useState<IAuditLog | null>(null);

  const loadAuditLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/audit-logs', {
        cache: 'no-store',
        credentials: 'include',
      });

      if (!res.ok) throw new Error('Failed to load audit logs.');

      const data = await res.json();
      if (Array.isArray(data?.logs)) {
        setLogs(data.logs);
      }
      setLastRefreshedAt(new Date());
      setError('');
    } catch (err: unknown) {
      console.error('Audit logs load error:', err);
      setError(err instanceof Error ? err.message : 'Error fetching audit logs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAuditLogs();
  }, [loadAuditLogs]);

  const handleRefresh = () => {
    setLoading(true);
    setError('');
    loadAuditLogs();
  };

  const filteredLogs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return logs;

    return logs.filter((log) => {
      return (
        log.action?.toLowerCase().includes(q) ||
        log.actorName?.toLowerCase().includes(q) ||
        log.actorEmail?.toLowerCase().includes(q) ||
        log.entityType?.toLowerCase().includes(q) ||
        log.entityId?.toLowerCase().includes(q)
      );
    });
  }, [logs, searchQuery]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Section Header with Dedicated Refresh */}
      <AdminSectionHeader
        eyebrow="Security &amp; Compliance"
        title="System Audit Logs"
        description="Tamper-evident record of administrative moderation, user role modifications, and payment settlement events."
        count={`${filteredLogs.length} of ${logs.length} Events`}
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

      {/* Search Bar */}
      <div className="relative w-full sm:w-80">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Filter by action, actor, entity ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
        />
      </div>

      {/* Audit Logs Table */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800">
              <tr>
                <AdminTableHeader>Timestamp</AdminTableHeader>
                <AdminTableHeader>Action Event</AdminTableHeader>
                <AdminTableHeader>Actor / Trigger</AdminTableHeader>
                <AdminTableHeader>Target Entity</AdminTableHeader>
                <AdminTableHeader>Metadata Details</AdminTableHeader>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-400 mb-2" />
                    <span>Loading audit log stream...</span>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <EmptyState
                      icon={Activity}
                      title="No audit events found"
                      description="No security or moderation records match your search."
                    />
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  return (
                    <tr key={log._id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Timestamp */}
                      <td className="px-5 py-4 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                        {log.createdAt ? (
                          <>
                            <span>{new Date(log.createdAt).toLocaleDateString('en-IN')}</span>
                            <span className="text-slate-600 ml-1">
                              {new Date(log.createdAt).toLocaleTimeString('en-IN')}
                            </span>
                          </>
                        ) : (
                          '—'
                        )}
                      </td>

                      {/* Action */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="font-mono text-emerald-400 font-bold text-xs bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg inline-block">
                          {log.action}
                        </span>
                      </td>

                      {/* Actor */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <p className="text-white font-bold">{log.actorName || log.actorEmail || 'System'}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{log.actorRole || 'SYSTEM'}</p>
                      </td>

                      {/* Entity */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <p className="text-slate-300 font-semibold">{log.entityType}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{log.entityId?.slice(-10) || '—'}</p>
                      </td>

                      {/* Metadata Action */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {log.metadata && Object.keys(log.metadata).length > 0 ? (
                          <button
                            type="button"
                            onClick={() => setSelectedLogForMetadata(log)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold transition-colors cursor-pointer border border-slate-700"
                          >
                            <FileCode className="w-3.5 h-3.5 text-emerald-400" />
                            <span>View JSON</span>
                          </button>
                        ) : (
                          <span className="text-slate-600 italic text-[11px]">No extra data</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Metadata Inspector Modal */}
      {selectedLogForMetadata && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <span className="text-emerald-400 font-mono">{selectedLogForMetadata.action}</span>
                  <span className="text-xs text-slate-500">Metadata Payload</span>
                </h3>
                <p className="text-[10px] text-slate-500">
                  Logged by {selectedLogForMetadata.actorName || selectedLogForMetadata.actorRole} at{' '}
                  {selectedLogForMetadata.createdAt ? new Date(selectedLogForMetadata.createdAt).toLocaleString('en-IN') : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLogForMetadata(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto rounded-xl bg-slate-950 p-4 border border-slate-800/80 font-mono text-xs text-emerald-300">
              <pre>{JSON.stringify(selectedLogForMetadata.metadata, null, 2)}</pre>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLogForMetadata(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
