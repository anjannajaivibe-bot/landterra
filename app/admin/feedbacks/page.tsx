'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  MessageSquare,
  Search,
  CheckCircle2,
  TrendingDown,
  RotateCcw,
  Sparkles,
  MapPin,
  Calendar,
  User,
  Phone,
  Mail,
  Loader2,
  XCircle,
  HelpCircle,
  Tag,
  ThumbsUp,
} from 'lucide-react';
import { IFeedback, FeedbackReason, FEEDBACK_REASON_LABELS } from '@/types/feedback';
import {
  AdminSectionHeader,
  AdminMetricCard,
  EmptyState,
} from '@/components/admin/AdminUI';

interface FeedbackStats {
  total: number;
  soldOnPlatform: number;
  soldExternally: number;
  notUseful: number;
  priceChangeRelist: number;
  decidedNotToSell: number;
  other: number;
}

const REASON_CONFIG: Record<
  FeedbackReason,
  { label: string; badgeClass: string; icon: React.ComponentType<{ className?: string }> }
> = {
  SOLD_ON_PLATFORM: {
    label: '🎉 Sold on BhoomiMitra',
    badgeClass: 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300',
    icon: CheckCircle2,
  },
  SOLD_EXTERNALLY: {
    label: '🤝 Sold Offline / Externally',
    badgeClass: 'bg-blue-950/60 border-blue-500/30 text-blue-300',
    icon: ThumbsUp,
  },
  NOT_USEFUL: {
    label: '📉 Not Useful / Low Inquiries',
    badgeClass: 'bg-rose-950/60 border-rose-500/30 text-rose-300',
    icon: TrendingDown,
  },
  PRICE_CHANGE_RELIST: {
    label: '✏️ Price Change / Relisting',
    badgeClass: 'bg-amber-950/60 border-amber-500/30 text-amber-300',
    icon: RotateCcw,
  },
  DECIDED_NOT_TO_SELL: {
    label: '🛑 Decided Not to Sell',
    badgeClass: 'bg-purple-950/60 border-purple-500/30 text-purple-300',
    icon: XCircle,
  },
  OTHER: {
    label: '💬 Other Reason',
    badgeClass: 'bg-slate-800/80 border-slate-700 text-slate-300',
    icon: HelpCircle,
  },
};

export default function AdminFeedbacksPage() {
  const [feedbacks, setFeedbacks] = useState<IFeedback[]>([]);
  const [stats, setStats] = useState<FeedbackStats>({
    total: 0,
    soldOnPlatform: 0,
    soldExternally: 0,
    notUseful: 0,
    priceChangeRelist: 0,
    decidedNotToSell: 0,
    other: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);

  // Filters & Search
  const [reasonFilter, setReasonFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchFeedbacks = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (reasonFilter && reasonFilter !== 'ALL') params.set('reason', reasonFilter);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      params.set('page', String(page));
      params.set('limit', '25');

      const res = await fetch(`/api/admin/feedbacks?${params.toString()}`, {
        cache: 'no-store',
      });

      if (!res.ok) {
        throw new Error('Failed to load deletion feedback.');
      }

      const data = await res.json();
      if (data.success) {
        setFeedbacks(data.feedbacks || []);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.total || 0);
        if (data.stats) {
          setStats(data.stats);
        }
      }
      setLastRefreshedAt(new Date());
      setError('');
    } catch (err: unknown) {
      console.error('Feedbacks load error:', err);
      setError(err instanceof Error ? err.message : 'Error fetching feedback records');
    } finally {
      setLoading(false);
    }
  }, [reasonFilter, searchQuery, page]);

  useEffect(() => {
    fetchFeedbacks();
  }, [fetchFeedbacks]);

  const handleRefresh = () => {
    fetchFeedbacks();
  };

  const handleFilterChange = (reason: string) => {
    setReasonFilter(reason);
    setPage(1);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchFeedbacks();
  };

  const platformSuccessRate =
    stats.total > 0 ? Math.round((stats.soldOnPlatform / stats.total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <AdminSectionHeader
        eyebrow="Seller Intelligence & Churn Analysis"
        title="Listing Deletion Feedbacks"
        description="Seller exit feedback captured when listings are permanently deleted or marked sold from the platform."
        count={totalCount}
        onRefresh={handleRefresh}
        isRefreshing={loading}
        lastRefreshedAt={lastRefreshedAt}
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <AdminMetricCard
          label="Total Deletions"
          value={stats.total}
          secondary="Exit responses recorded"
          icon={MessageSquare}
          tone="default"
        />
        <AdminMetricCard
          label="Sold on BhoomiMitra"
          value={stats.soldOnPlatform}
          secondary={`${platformSuccessRate}% platform success rate`}
          icon={CheckCircle2}
          tone="emerald"
        />
        <AdminMetricCard
          label="Sold Offline"
          value={stats.soldExternally}
          secondary="External / broker deal"
          icon={ThumbsUp}
          tone="blue"
        />
        <AdminMetricCard
          label="Not Useful"
          value={stats.notUseful}
          secondary="Low response or churn"
          icon={TrendingDown}
          tone="rose"
        />
        <AdminMetricCard
          label="Relisting / Price"
          value={stats.priceChangeRelist}
          secondary="Temporary revision"
          icon={RotateCcw}
          tone="amber"
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Reason Pills */}
          <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
            {[
              { id: 'ALL', label: 'All Feedbacks' },
              { id: 'SOLD_ON_PLATFORM', label: '🎉 Sold on Platform' },
              { id: 'SOLD_EXTERNALLY', label: '🤝 Sold Offline' },
              { id: 'NOT_USEFUL', label: '📉 Not Useful' },
              { id: 'PRICE_CHANGE_RELIST', label: '✏️ Price Change' },
              { id: 'DECIDED_NOT_TO_SELL', label: '🛑 Decided Not to Sell' },
              { id: 'OTHER', label: '💬 Other' },
            ].map((pill) => (
              <button
                key={pill.id}
                type="button"
                onClick={() => handleFilterChange(pill.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  reasonFilter === pill.id
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, seller, notes..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          </form>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-rose-950/40 border border-rose-800/50 rounded-xl text-rose-300 text-xs">
          {error}
        </div>
      )}

      {/* Feedback Records List */}
      {loading && feedbacks.length === 0 ? (
        <div className="py-16 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
          <span className="text-xs">Loading seller feedbacks...</span>
        </div>
      ) : feedbacks.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No Feedback Records Found"
          description={
            searchQuery || reasonFilter !== 'ALL'
              ? 'No feedback entries match the selected filters. Try clearing your search query.'
              : 'No seller deletion feedback has been recorded yet. Exit responses will appear here when sellers delete listings.'
          }
        />
      ) : (
        <div className="space-y-3.5">
          {feedbacks.map((fb) => {
            const config = REASON_CONFIG[fb.reason] || REASON_CONFIG.OTHER;
            const Icon = config.icon;
            const formattedDate = new Date(fb.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={fb._id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 space-y-3.5 transition-all shadow-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${config.badgeClass}`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{fb.reasonLabel || config.label}</span>
                    </span>

                    {fb.propertyTitle ? (
                      <span className="text-xs font-medium text-slate-300">
                        Listing: <strong className="text-white font-bold">{fb.propertyTitle}</strong>
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500 italic">Listing (Removed)</span>
                    )}

                    {fb.propertyLocation && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        {fb.propertyLocation}
                      </span>
                    )}
                  </div>

                  <div className="inline-flex items-center gap-1.5 text-[11px] text-slate-500">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formattedDate}</span>
                  </div>
                </div>

                {/* Feedback Comments / Seller Notes */}
                {fb.comments ? (
                  <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 text-xs text-slate-200">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">
                      Seller Notes:
                    </p>
                    <p className="italic font-normal text-slate-300 leading-relaxed">
                      &ldquo;{fb.comments}&rdquo;
                    </p>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 italic">No additional comments provided.</p>
                )}

                {/* Seller Details Footer */}
                <div className="pt-2 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400">
                  <div className="flex items-center gap-4 flex-wrap">
                    {fb.sellerName && (
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-300">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        {fb.sellerName}
                      </span>
                    )}
                    {fb.sellerEmail && (
                      <span className="inline-flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-slate-500" />
                        {fb.sellerEmail}
                      </span>
                    )}
                    {fb.sellerPhone && (
                      <span className="inline-flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                        {fb.sellerPhone}
                      </span>
                    )}
                  </div>

                  {fb.propertyId && (
                    <span className="text-[10px] font-mono text-slate-600">
                      ID: {fb.propertyId}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
            className="px-3.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-300 disabled:opacity-40 cursor-pointer"
          >
            Previous
          </button>
          <span className="text-xs text-slate-500">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || loading}
            className="px-3.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-300 disabled:opacity-40 cursor-pointer"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
