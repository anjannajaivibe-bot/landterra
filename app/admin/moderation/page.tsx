'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  FileCheck2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  LandPlot,
  Loader2,
  Clock,
} from 'lucide-react';

import { IProperty } from '@/types/property';
import { PropertyReviewModal } from '@/components/admin/PropertyReviewModal';
import { VerificationBadge } from '@/components/properties/VerificationBadge';
import {
  AdminSectionHeader,
  AdminTableHeader,
  StatusPill,
  EmptyState,
} from '@/components/admin/AdminUI';

export default function AdminModerationPage() {
  const [properties, setProperties] = useState<IProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);

  const [selectedPropertyForReview, setSelectedPropertyForReview] = useState<IProperty | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadModerationQueue = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/properties?limit=100', {
        cache: 'no-store',
        credentials: 'include',
      });

      if (!res.ok) throw new Error('Failed to load moderation queue.');

      const data = await res.json();
      if (Array.isArray(data?.data)) {
        setProperties(data.data);
      }
      setLastRefreshedAt(new Date());
      setError('');
    } catch (err: unknown) {
      console.error('Moderation load error:', err);
      setError(err instanceof Error ? err.message : 'Error fetching moderation queue');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadModerationQueue();
  }, [loadModerationQueue]);

  const handleRefresh = () => {
    setLoading(true);
    setError('');
    loadModerationQueue();
  };

  // Fast quick approve
  const handleQuickApprove = async (property: IProperty) => {
    if (!confirm(`Approve and mark "${property.title}" as verified?`)) return;

    setProcessingId(property._id);
    try {
      const res = await fetch(`/api/admin/properties/${property._id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'APPROVE' }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Failed to approve listing');
      }

      await loadModerationQueue();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error approving listing');
    } finally {
      setProcessingId(null);
    }
  };

  const pendingQueue = useMemo(() => {
    return properties.filter((p) => p.verificationStatus === 'PENDING');
  }, [properties]);

  const stats = useMemo(() => {
    const pending = properties.filter((p) => p.verificationStatus === 'PENDING').length;
    const verified = properties.filter((p) => p.verificationStatus === 'VERIFIED').length;
    const rejected = properties.filter((p) => p.verificationStatus === 'REJECTED').length;
    const total = properties.length;
    return { pending, verified, rejected, total };
  }, [properties]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Section Header with Dedicated Refresh */}
      <AdminSectionHeader
        eyebrow="Trust & Safety"
        title="Listing Moderation"
        description="Review seller title deeds, government registration IDs, fraud signals, and approve or reject listings."
        count={`${pendingQueue.length} Pending Review`}
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

      {/* Moderation Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3.5">
          <p className="text-[10px] uppercase font-bold text-amber-500 flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            <span>Pending Review</span>
          </p>
          <p className="text-xl font-black text-amber-400 mt-1">{stats.pending}</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3.5">
          <p className="text-[10px] uppercase font-bold text-emerald-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3" />
            <span>Verified Live</span>
          </p>
          <p className="text-xl font-black text-emerald-400 mt-1">{stats.verified}</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3.5">
          <p className="text-[10px] uppercase font-bold text-rose-500 flex items-center gap-1.5">
            <XCircle className="w-3 h-3" />
            <span>Rejected</span>
          </p>
          <p className="text-xl font-black text-rose-400 mt-1">{stats.rejected}</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3.5">
          <p className="text-[10px] uppercase font-bold text-slate-500">Total Reviewed</p>
          <p className="text-xl font-black text-white mt-1">{stats.total}</p>
        </div>
      </div>

      {/* Moderation Queue Table */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-black text-white">Pending Moderation Queue</h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {pendingQueue.length} listings awaiting action
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800">
              <tr>
                <AdminTableHeader>Property</AdminTableHeader>
                <AdminTableHeader>Location &amp; Area</AdminTableHeader>
                <AdminTableHeader>Documents Attached</AdminTableHeader>
                <AdminTableHeader>Seller Contact</AdminTableHeader>
                <AdminTableHeader>Payment State</AdminTableHeader>
                <AdminTableHeader>Actions</AdminTableHeader>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading && properties.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-400 mb-2" />
                    <span>Loading moderation queue...</span>
                  </td>
                </tr>
              ) : pendingQueue.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <EmptyState
                      icon={CheckCircle2}
                      title="Moderation queue is all caught up!"
                      description="There are currently zero listings waiting for administrative title or verification review."
                    />
                  </td>
                </tr>
              ) : (
                pendingQueue.map((prop) => {
                  const isProcessing = processingId === prop._id;
                  const thumb = prop.images?.[0]?.secureUrl;
                  const docCount = prop.documents?.length || 0;

                  return (
                    <tr key={prop._id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Title & Image */}
                      <td className="px-5 py-4 min-w-[220px]">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden relative shrink-0 flex items-center justify-center">
                            {thumb ? (
                              <Image
                                src={thumb}
                                alt={prop.title}
                                fill
                                className="object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <LandPlot className="w-5 h-5 text-slate-600" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-white truncate max-w-[200px]" title={prop.title}>
                              {prop.title}
                            </p>
                            <p className="text-[10px] text-slate-500 font-mono">
                              ID: {prop._id.slice(-8)}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Location & Area */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <p className="text-slate-300 font-semibold">
                          {prop.location?.city || '—'}, {prop.location?.state || ''}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {prop.landAreaYards} sq.yds • ₹{Number(prop.totalPrice || 0).toLocaleString('en-IN')}
                        </p>
                      </td>

                      {/* Documents */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              docCount > 0
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {docCount} {docCount === 1 ? 'Doc' : 'Docs'}
                          </span>
                          {prop.governmentRegistrationId && (
                            <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 text-[10px] font-mono border border-blue-500/20">
                              Reg #{prop.governmentRegistrationId}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Seller */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <p className="text-slate-300 font-medium">{prop.sellerName || 'Landowner'}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{prop.sellerEmail || prop.sellerPhone || '—'}</p>
                      </td>

                      {/* Payment Status */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <StatusPill
                          label={prop.paymentStatus || 'UNPAID'}
                          tone={prop.paymentStatus === 'PAID' ? 'green' : 'amber'}
                        />
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedPropertyForReview(prop)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                            title="Full moderation inspection & document viewer"
                          >
                            <FileCheck2 className="w-3.5 h-3.5" />
                            <span>Audit &amp; Decide</span>
                          </button>

                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handleQuickApprove(prop)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-emerald-600/20 hover:text-emerald-400 border border-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
                            title="Quick Approve"
                          >
                            {isProcessing ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <span>Approve</span>
                            )}
                          </button>

                          <Link
                            href={`/properties/${prop._id}`}
                            target="_blank"
                            className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                            title="Open preview page"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
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

      {/* Property Review Modal */}
      {selectedPropertyForReview && (
        <PropertyReviewModal
          property={selectedPropertyForReview}
          isOpen={Boolean(selectedPropertyForReview)}
          onClose={() => setSelectedPropertyForReview(null)}
          onActionComplete={async () => {
            setSelectedPropertyForReview(null);
            await loadModerationQueue();
          }}
        />
      )}
    </div>
  );
}
