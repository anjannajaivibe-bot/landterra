'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Clock,
  Search,
  CheckCircle2,
  AlertCircle,
  Calendar,
  ExternalLink,
  Loader2,
  Hourglass,
  RotateCcw,
  Download,
} from 'lucide-react';

import { IProperty } from '@/types/property';
import {
  AdminSectionHeader,
  AdminMetricCard,
  AdminTableHeader,
  StatusPill,
  EmptyState,
} from '@/components/admin/AdminUI';

export default function AdminSubscriptionsPage() {
  const [properties, setProperties] = useState<IProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);
  const [referenceTime, setReferenceTime] = useState(() => Date.now());

  const [filterType, setFilterType] = useState<'ALL' | 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const loadSubscriptions = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/properties?limit=100', {
        cache: 'no-store',
        credentials: 'include',
      });

      if (!res.ok) throw new Error('Failed to load listing subscriptions.');

      const data = await res.json();
      if (Array.isArray(data?.data)) {
        setProperties(data.data);
      }
      setLastRefreshedAt(new Date());
      setReferenceTime(Date.now());
      setError('');
    } catch (err: unknown) {
      console.error('Subscriptions load error:', err);
      setError(err instanceof Error ? err.message : 'Error fetching subscriptions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSubscriptions();
  }, [loadSubscriptions]);

  const handleRefresh = () => {
    setLoading(true);
    setError('');
    loadSubscriptions();
  };

  // Derive subscription items
  const subscriptionItems = useMemo(() => {
    const now = referenceTime;
    return properties
      .filter((p) => p.paymentStatus === 'PAID' || p.subscriptionExpiresAt || p.listingStatus === 'PUBLISHED')
      .map((p) => {
        let daysLeft = 0;
        let isExpired = false;
        let isExpiringSoon = false;

        if (p.subscriptionExpiresAt) {
          const expTime = new Date(p.subscriptionExpiresAt).getTime();
          const diffMs = expTime - now;
          daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
          isExpired = daysLeft <= 0;
          isExpiringSoon = daysLeft > 0 && daysLeft <= 7;
        } else if (p.listingStatus === 'EXPIRED') {
          isExpired = true;
        }

        return {
          property: p,
          daysLeft,
          isExpired,
          isExpiringSoon,
          status: isExpired ? 'EXPIRED' : isExpiringSoon ? 'EXPIRING_SOON' : 'ACTIVE',
        };
      });
  }, [properties, referenceTime]);

  const filteredItems = useMemo(() => {
    return subscriptionItems.filter((item) => {
      const matchesType = filterType === 'ALL' || item.status === filterType;
      const q = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        item.property.title?.toLowerCase().includes(q) ||
        item.property.sellerName?.toLowerCase().includes(q) ||
        item.property.location?.city?.toLowerCase().includes(q);
      return matchesType && matchesQuery;
    });
  }, [subscriptionItems, filterType, searchQuery]);

  const stats = useMemo(() => {
    const active = subscriptionItems.filter((s) => s.status === 'ACTIVE').length;
    const expiringSoon = subscriptionItems.filter((s) => s.status === 'EXPIRING_SOON').length;
    const expired = subscriptionItems.filter((s) => s.status === 'EXPIRED').length;
    return { total: subscriptionItems.length, active, expiringSoon, expired };
  }, [subscriptionItems]);

  const exportToCSV = () => {
    if (filteredItems.length === 0) return;

    const headers = [
      'Property ID',
      'Property Title',
      'Seller Name',
      'City',
      'Status',
      'Days Left',
      'Started Date',
      'Expiry Date',
      'Monthly Fee (INR)',
    ];

    const rows = filteredItems.map((item) => [
      item.property._id || 'N/A',
      `"${(item.property.title || '').replace(/"/g, '""')}"`,
      `"${(item.property.sellerName || 'Direct Landowner').replace(/"/g, '""')}"`,
      item.property.location?.city || 'N/A',
      item.status,
      item.daysLeft !== null ? item.daysLeft : 'N/A',
      item.property.subscriptionStartedAt
        ? new Date(item.property.subscriptionStartedAt).toLocaleString('en-IN')
        : '',
      item.property.subscriptionExpiresAt
        ? new Date(item.property.subscriptionExpiresAt).toLocaleString('en-IN')
        : '',
      item.property.publishingFee || item.property.monthlyListingFee || 0,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `landterra-subscriptions-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Section Header with Dedicated Refresh */}
      <AdminSectionHeader
        eyebrow="Lifecycle &amp; Retention"
        title="Listing Subscriptions"
        description="Track active publishing cycles, monitor 30-day subscription expiries, and review renewals."
        count={`${filteredItems.length} of ${subscriptionItems.length} Subscriptions`}
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

      {/* Subscription KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminMetricCard
          label="Total Tracked"
          value={stats.total}
          secondary="Paid classified advertisements"
          icon={Clock}
        />

        <AdminMetricCard
          label="Active Period"
          value={stats.active}
          secondary="Current live publishing period"
          icon={CheckCircle2}
          tone="emerald"
        />

        <AdminMetricCard
          label="Expiring Soon"
          value={stats.expiringSoon}
          secondary="Expires in ≤ 7 days"
          icon={Hourglass}
          tone="amber"
        />

        <AdminMetricCard
          label="Expired"
          value={stats.expired}
          secondary="Renewal fee required"
          icon={AlertCircle}
          tone="rose"
        />
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by property, seller, or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1">
          <div className="flex gap-1.5 shrink-0">
            {(['ALL', 'ACTIVE', 'EXPIRING_SOON', 'EXPIRED'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors shrink-0 ${
                  filterType === type
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {type.replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={exportToCSV}
            disabled={filteredItems.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            title="Export filtered subscriptions to CSV"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800">
              <tr>
                <AdminTableHeader>Property Listing</AdminTableHeader>
                <AdminTableHeader>Landowner / Seller</AdminTableHeader>
                <AdminTableHeader>Started On</AdminTableHeader>
                <AdminTableHeader>Expires On</AdminTableHeader>
                <AdminTableHeader>Remaining</AdminTableHeader>
                <AdminTableHeader>Status</AdminTableHeader>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading && subscriptionItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-400 mb-2" />
                    <span>Loading listing subscriptions...</span>
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <EmptyState
                      icon={Clock}
                      title="No matching subscriptions"
                      description="No subscription records match your current filter."
                    />
                  </td>
                </tr>
              ) : (
                filteredItems.map(({ property, daysLeft, status }) => (
                  <tr key={property._id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Property */}
                    <td className="px-5 py-4 min-w-[200px]">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/properties/${property._id}`}
                          target="_blank"
                          className="font-bold text-white hover:text-emerald-400 transition-colors truncate max-w-[220px]"
                          title={property.title}
                        >
                          {property.title}
                        </Link>
                        <ExternalLink className="w-3 h-3 text-slate-500 shrink-0" />
                      </div>
                      <p className="text-[10px] text-slate-500">
                        {property.location?.city || 'City'}, {property.location?.state || 'State'} • {property.landAreaYards} sq.yds
                      </p>
                    </td>

                    {/* Seller */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <p className="text-slate-300 font-medium">{property.sellerName || 'Landowner'}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{property.sellerEmail || property.sellerPhone || '—'}</p>
                    </td>

                    {/* Start Date */}
                    <td className="px-5 py-4 whitespace-nowrap text-slate-400">
                      {property.subscriptionStartedAt || property.publishedAt
                        ? new Date(property.subscriptionStartedAt || property.publishedAt!).toLocaleDateString('en-IN')
                        : '—'}
                    </td>

                    {/* Expiry Date */}
                    <td className="px-5 py-4 whitespace-nowrap font-mono text-slate-300">
                      {property.subscriptionExpiresAt
                        ? new Date(property.subscriptionExpiresAt).toLocaleDateString('en-IN')
                        : '—'}
                    </td>

                    {/* Remaining Days */}
                    <td className="px-5 py-4 whitespace-nowrap font-black">
                      {status === 'EXPIRED' ? (
                        <span className="text-rose-400">Expired</span>
                      ) : (
                        <span className={daysLeft <= 7 ? 'text-amber-400' : 'text-emerald-400'}>
                          {daysLeft} {daysLeft === 1 ? 'day' : 'days'}
                        </span>
                      )}
                    </td>

                    {/* Status Pill */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <StatusPill
                        label={status}
                        tone={
                          status === 'ACTIVE'
                            ? 'green'
                            : status === 'EXPIRING_SOON'
                            ? 'amber'
                            : 'red'
                        }
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
