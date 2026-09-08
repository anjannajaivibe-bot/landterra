'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CreditCard,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  Loader2,
  Calendar,
  Download,
} from 'lucide-react';

import { IPayment } from '@/types/payment';
import {
  AdminSectionHeader,
  AdminMetricCard,
  AdminTableHeader,
  StatusPill,
  EmptyState,
} from '@/components/admin/AdminUI';

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<IPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const loadPayments = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/payments', {
        cache: 'no-store',
        credentials: 'include',
      });

      if (!res.ok) throw new Error('Failed to load transaction history.');

      const data = await res.json();
      if (Array.isArray(data?.payments)) {
        setPayments(data.payments);
      }
      setLastRefreshedAt(new Date());
      setError('');
    } catch (err: unknown) {
      console.error('Payments load error:', err);
      setError(err instanceof Error ? err.message : 'Error fetching payments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const handleRefresh = () => {
    setLoading(true);
    setError('');
    loadPayments();
  };

  const filteredPayments = useMemo(() => {
    return payments.filter((pay) => {
      const matchesStatus = statusFilter === 'ALL' || pay.paymentStatus === statusFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        pay.razorpayOrderId?.toLowerCase().includes(q) ||
        pay.razorpayPaymentId?.toLowerCase().includes(q) ||
        pay.propertyTitle?.toLowerCase().includes(q) ||
        pay.sellerId?.toLowerCase().includes(q) ||
        (pay as any).sellerName?.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [payments, statusFilter, searchQuery]);

  const stats = useMemo(() => {
    const totalCollected = payments
      .filter((p) => p.paymentStatus === 'PAID')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const paidCount = payments.filter((p) => p.paymentStatus === 'PAID').length;
    const pendingCount = payments.filter((p) => p.paymentStatus === 'PENDING' || p.paymentStatus === 'CREATED').length;
    const failedCount = payments.filter((p) => p.paymentStatus === 'FAILED').length;

    return { totalCollected, paidCount, pendingCount, failedCount, total: payments.length };
  }, [payments]);

  const exportToCSV = () => {
    if (filteredPayments.length === 0) return;

    const headers = [
      'Transaction ID',
      'Order ID',
      'Property Title',
      'Property ID',
      'Seller ID',
      'Amount (INR)',
      'Status',
      'Created Date',
      'Paid Date',
    ];

    const rows = filteredPayments.map((p) => [
      p.razorpayPaymentId || 'N/A',
      p.razorpayOrderId || 'N/A',
      `"${(p.propertyTitle || '').replace(/"/g, '""')}"`,
      p.propertyId || 'N/A',
      p.sellerId || 'N/A',
      p.amount || 0,
      p.paymentStatus || 'UNKNOWN',
      p.createdAt ? new Date(p.createdAt).toLocaleString('en-IN') : '',
      (p as any).paidAt ? new Date((p as any).paidAt).toLocaleString('en-IN') : '',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `landterra-payments-${new Date().toISOString().slice(0, 10)}.csv`
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
        eyebrow="Financial Operations"
        title="Payments & Revenue"
        description="Monitor classified listing subscriptions, Razorpay transactions, and financial settlements."
        count={`${filteredPayments.length} of ${payments.length} Transactions`}
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

      {/* Financial KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminMetricCard
          label="Total Collected"
          value={`₹${stats.totalCollected.toLocaleString('en-IN')}`}
          secondary={`${stats.paidCount} successful payments`}
          icon={CreditCard}
          tone="emerald"
        />

        <AdminMetricCard
          label="Paid Invoices"
          value={stats.paidCount}
          secondary="Active verified payments"
          icon={CheckCircle2}
        />

        <AdminMetricCard
          label="Pending / Created"
          value={stats.pendingCount}
          secondary="Checkout initiated"
          icon={Clock}
          tone="amber"
        />

        <AdminMetricCard
          label="Failed / Cancelled"
          value={stats.failedCount}
          secondary="Payment dropped or rejected"
          icon={AlertCircle}
          tone="rose"
        />
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Order ID, Payment ID, Property..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1">
          <div className="flex gap-1.5 shrink-0">
            {['ALL', 'PAID', 'PENDING', 'FAILED'].map((status) => (
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
                {status}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={exportToCSV}
            disabled={filteredPayments.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            title="Export filtered transactions to CSV"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Payments Table */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800">
              <tr>
                <AdminTableHeader>Transaction / Order</AdminTableHeader>
                <AdminTableHeader>Property Listing</AdminTableHeader>
                <AdminTableHeader>Amount</AdminTableHeader>
                <AdminTableHeader>Status</AdminTableHeader>
                <AdminTableHeader>Date &amp; Time</AdminTableHeader>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading && payments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-400 mb-2" />
                    <span>Loading payment transactions...</span>
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <EmptyState
                      icon={CreditCard}
                      title="No transactions found"
                      description="No payment records match your selected filter."
                    />
                  </td>
                </tr>
              ) : (
                filteredPayments.map((pay) => {
                  return (
                    <tr key={pay._id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Order & Payment ID */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <p className="font-mono font-bold text-white text-[11px]">
                          {pay.razorpayOrderId}
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          {pay.razorpayPaymentId || 'Payment ID: Pending'}
                        </p>
                      </td>

                      {/* Property Title & Seller */}
                      <td className="px-5 py-4 min-w-[200px]">
                        <p className="font-bold text-slate-200 truncate max-w-[220px]">
                          {pay.propertyTitle || 'Property Listing'}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate">
                          {(pay as any).sellerName || `Seller #${pay.sellerId.slice(-6)}`} • Property #{pay.propertyId.slice(-6)}
                        </p>
                      </td>

                      {/* Amount */}
                      <td className="px-5 py-4 whitespace-nowrap font-black text-white">
                        ₹{Number(pay.amount || 0).toLocaleString('en-IN')}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <StatusPill
                          label={pay.paymentStatus}
                          tone={
                            pay.paymentStatus === 'PAID'
                              ? 'green'
                              : pay.paymentStatus === 'FAILED'
                              ? 'red'
                              : 'amber'
                          }
                        />
                      </td>

                      {/* Date */}
                      <td className="px-5 py-4 whitespace-nowrap text-slate-400 text-[11px]">
                        {pay.createdAt ? (
                          <>
                            <span>{new Date(pay.createdAt).toLocaleDateString('en-IN')}</span>
                            <span className="text-slate-600 ml-1">
                              {new Date(pay.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </>
                        ) : (
                          '—'
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
    </div>
  );
}
