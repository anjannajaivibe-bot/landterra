'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Layers,
  Search,
  ExternalLink,
  Trash2,
  FileCheck2,
  CheckCircle2,
  AlertCircle,
  LandPlot,
  Loader2,
  Eye,
  MapPin,
} from 'lucide-react';

import { IProperty, ListingStatus } from '@/types/property';
import { PropertyReviewModal } from '@/components/admin/PropertyReviewModal';
import { VerificationBadge } from '@/components/properties/VerificationBadge';
import {
  AdminSectionHeader,
  AdminTableHeader,
  StatusPill,
  EmptyState,
} from '@/components/admin/AdminUI';

export default function AdminPropertiesPage() {
  const [properties, setProperties] = useState<IProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPropertyForReview, setSelectedPropertyForReview] = useState<IProperty | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadProperties = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/properties?limit=100', {
        cache: 'no-store',
        credentials: 'include',
      });

      if (!res.ok) throw new Error('Failed to load platform properties.');

      const data = await res.json();
      if (Array.isArray(data?.data)) {
        setProperties(data.data);
      }
      setLastRefreshedAt(new Date());
      setError('');
    } catch (err: unknown) {
      console.error('Properties load error:', err);
      setError(err instanceof Error ? err.message : 'Error fetching properties list');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  const handleRefresh = () => {
    setLoading(true);
    setError('');
    loadProperties();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this property listing?')) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/properties/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Failed to delete listing');
      }

      setProperties((prev) => prev.filter((p) => p._id !== id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error deleting property');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredProperties = useMemo(() => {
    return properties.filter((prop) => {
      const matchesStatus = statusFilter === 'ALL' || prop.listingStatus === statusFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        prop.title?.toLowerCase().includes(q) ||
        prop.location?.city?.toLowerCase().includes(q) ||
        prop.sellerName?.toLowerCase().includes(q) ||
        prop.sellerEmail?.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [properties, statusFilter, searchQuery]);

  const stats = useMemo(() => {
    const total = properties.length;
    const published = properties.filter((p) => p.listingStatus === 'PUBLISHED').length;
    const drafts = properties.filter((p) => p.listingStatus === 'DRAFT' || p.listingStatus === 'PAYMENT_PENDING').length;
    const pending = properties.filter((p) => p.verificationStatus === 'PENDING').length;
    return { total, published, drafts, pending };
  }, [properties]);

  const STATUS_TABS = [
    'ALL',
    'PUBLISHED',
    'PAYMENT_PENDING',
    'DRAFT',
    'EXPIRING_SOON',
    'EXPIRED',
    'PAUSED',
    'SOLD',
    'REJECTED',
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Section Header with Dedicated Refresh */}
      <AdminSectionHeader
        eyebrow="Marketplace Inventory"
        title="All Properties"
        description="Inspect, moderate, edit, and manage all land classifieds across every lifecycle state."
        count={`${filteredProperties.length} of ${properties.length} Properties`}
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
          <p className="text-[10px] uppercase font-bold text-slate-500">Total Inventory</p>
          <p className="text-xl font-black text-white mt-1">{stats.total}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3.5">
          <p className="text-[10px] uppercase font-bold text-emerald-500">Live Published</p>
          <p className="text-xl font-black text-emerald-400 mt-1">{stats.published}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3.5">
          <p className="text-[10px] uppercase font-bold text-amber-500">Drafts / Unpaid</p>
          <p className="text-xl font-black text-amber-400 mt-1">{stats.drafts}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3.5">
          <p className="text-[10px] uppercase font-bold text-blue-500">Pending Review</p>
          <p className="text-xl font-black text-blue-400 mt-1">{stats.pending}</p>
        </div>
      </div>

      {/* Search & Status Filters */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by title, city, seller..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto w-full md:w-auto pb-1 scrollbar-none">
          {STATUS_TABS.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors shrink-0 ${
                statusFilter === status
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {status.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Properties Table */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800">
              <tr>
                <AdminTableHeader>Property</AdminTableHeader>
                <AdminTableHeader>Location &amp; Area</AdminTableHeader>
                <AdminTableHeader>Pricing</AdminTableHeader>
                <AdminTableHeader>Seller Details</AdminTableHeader>
                <AdminTableHeader>Status</AdminTableHeader>
                <AdminTableHeader>Actions</AdminTableHeader>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading && properties.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-400 mb-2" />
                    <span>Loading property records...</span>
                  </td>
                </tr>
              ) : filteredProperties.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <EmptyState
                      icon={Layers}
                      title="No properties match your filter"
                      description="Try clearing search keywords or switching status tabs."
                    />
                  </td>
                </tr>
              ) : (
                filteredProperties.map((prop) => {
                  const isDeleting = deletingId === prop._id;
                  const thumb = prop.images?.[0]?.secureUrl;

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
                          {prop.landAreaYards} sq.yds • {prop.landType?.replace(/_/g, ' ') || 'Land'}
                        </p>
                      </td>

                      {/* Pricing */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <p className="font-black text-white">
                          ₹{Number(prop.totalPrice || 0).toLocaleString('en-IN')}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          ₹{Number(prop.pricePerYard || 0).toLocaleString('en-IN')} / sq.yd
                        </p>
                      </td>

                      {/* Seller */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <p className="text-slate-300 font-medium">{prop.sellerName || 'Landowner'}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{prop.sellerEmail || prop.sellerPhone || '—'}</p>
                      </td>

                      {/* Status Badges */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div>
                            <StatusPill
                              label={prop.listingStatus}
                              tone={
                                prop.listingStatus === 'PUBLISHED'
                                  ? 'green'
                                  : prop.listingStatus === 'EXPIRING_SOON'
                                  ? 'amber'
                                  : prop.listingStatus === 'REJECTED'
                                  ? 'red'
                                  : 'neutral'
                              }
                            />
                          </div>
                          <VerificationBadge status={prop.verificationStatus} />
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedPropertyForReview(prop)}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                            title="Open moderation & audit review"
                          >
                            <FileCheck2 className="w-3.5 h-3.5" />
                            <span>Review</span>
                          </button>

                          <Link
                            href={`/properties/${prop._id}`}
                            target="_blank"
                            className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                            title="View public page"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>

                          <button
                            type="button"
                            disabled={isDeleting}
                            onClick={() => handleDelete(prop._id)}
                            className="p-1.5 rounded-lg border border-slate-700 hover:bg-rose-500/20 hover:border-rose-500/30 hover:text-rose-400 text-slate-500 transition-colors cursor-pointer"
                            title="Delete listing permanently"
                          >
                            {isDeleting ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
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
            await loadProperties();
          }}
        />
      )}
    </div>
  );
}
