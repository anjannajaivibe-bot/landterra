'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { VerificationBadge } from '@/components/properties/VerificationBadge';
import { RazorpayCheckoutModal } from '@/components/payments/RazorpayCheckoutModal';
import { IProperty, ListingStatus } from '@/types/property';
import { IInquiry } from '@/types/inquiry';
import { IPayment, PaymentPurpose } from '@/types/payment';
import {
  LayoutDashboard,
  PlusCircle,
  Clock,
  ShieldCheck,
  Mail,
  Receipt,
  PauseCircle,
  PlayCircle,
  Trash2,
  ExternalLink,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Edit3,
  Calendar,
} from 'lucide-react';

export default function SellerDashboardPage() {
  const [activeTab, setActiveTab] = useState<'LISTINGS' | 'INQUIRIES' | 'PAYMENTS'>('LISTINGS');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [properties, setProperties] = useState<IProperty[]>([]);
  const [inquiries, setInquiries] = useState<IInquiry[]>([]);
  const [payments, setPayments] = useState<IPayment[]>([]);
  const [loading, setLoading] = useState(true);

  // Payment modal state
  const [paymentTarget, setPaymentTarget] = useState<{
    property: IProperty;
    purpose: PaymentPurpose;
  } | null>(null);

  const loadSellerData = async () => {
    try {
      const [propsRes, inqRes, payRes] = await Promise.all([
        fetch('/api/properties?sellerOnly=true&listingStatus=ALL').catch(() => null),
        fetch('/api/inquiries').catch(() => null),
        fetch('/api/payments/my').catch(() => null),
      ]);

      if (propsRes?.ok) {
        const propsData = await propsRes.json();
        if (propsData?.data) setProperties(propsData.data);
      }
      if (inqRes?.ok) {
        const inqData = await inqRes.json();
        if (inqData?.inquiries) setInquiries(inqData.inquiries);
      }
      if (payRes?.ok) {
        const payData = await payRes.json();
        if (payData?.payments) setPayments(payData.payments);
      }
    } catch (e) {
      console.error('Error loading seller data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function init() {
      try {
        const [propsRes, inqRes, payRes] = await Promise.all([
          fetch('/api/properties?sellerOnly=true&listingStatus=ALL').catch(() => null),
          fetch('/api/inquiries').catch(() => null),
          fetch('/api/payments/my').catch(() => null),
        ]);

        if (!isMounted) return;

        if (propsRes?.ok) {
          const propsData = await propsRes.json();
          if (propsData?.data) setProperties(propsData.data);
        }
        if (inqRes?.ok) {
          const inqData = await inqRes.json();
          if (inqData?.inquiries) setInquiries(inqData.inquiries);
        }
        if (payRes?.ok) {
          const payData = await payRes.json();
          if (payData?.payments) setPayments(payData.payments);
        }
      } catch (e) {
        console.error('Error loading seller data:', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    init();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleToggleListingStatus = async (propertyId: string, currentStatus: ListingStatus) => {
    const newStatus = currentStatus === 'PAUSED' ? 'PUBLISHED' : 'PAUSED';
    try {
      const res = await fetch(`/api/properties/${propertyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingStatus: newStatus }),
      });
      if (res.ok) {
        loadSellerData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteProperty = async (propertyId: string) => {
    if (!confirm('Are you sure you want to remove this listing?')) return;
    try {
      const res = await fetch(`/api/properties/${propertyId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        loadSellerData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Metrics
  const totalCount = properties.length;
  const publishedCount = properties.filter((p) => p.listingStatus === 'PUBLISHED').length;
  const pendingCount = properties.filter(
    (p) =>
      p.listingStatus === 'PENDING_VERIFICATION' ||
      (p.verificationStatus === 'PENDING' && p.paymentStatus === 'PAID')
  ).length;
  const draftsCount = properties.filter(
    (p) =>
      (p.listingStatus === 'PAYMENT_PENDING' || p.listingStatus === 'DRAFT') &&
      p.paymentStatus !== 'PAID'
  ).length;
  const expiredCount = properties.filter((p) => p.listingStatus === 'EXPIRED').length;
  const totalInquiriesCount = inquiries.length;
  const totalFeesPaid = payments
    .filter((p) => p.paymentStatus === 'PAID')
    .reduce((sum, p) => sum + p.amount, 0);

  const filteredProperties = properties.filter((p) => {
    if (statusFilter === 'PUBLISHED') return p.listingStatus === 'PUBLISHED';
    if (statusFilter === 'PENDING')
      return (
        p.listingStatus === 'PENDING_VERIFICATION' ||
        (p.verificationStatus === 'PENDING' && p.paymentStatus === 'PAID')
      );
    if (statusFilter === 'PAYMENT_REQUIRED')
      return (
        (p.listingStatus === 'PAYMENT_PENDING' || p.listingStatus === 'DRAFT') &&
        p.paymentStatus !== 'PAID'
      );
    if (statusFilter === 'EXPIRED') return p.listingStatus === 'EXPIRED';
    if (statusFilter === 'PAUSED') return p.listingStatus === 'PAUSED';
    return true;
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />

      {/* Header */}
      <div className="bg-slate-900 text-white py-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-semibold mb-1">
              <LayoutDashboard className="w-4 h-4" />
              <span>Seller Control Center</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight">Land Portfolio Management</h1>
            <p className="text-xs text-slate-400 mt-1">
              Publish residential, commercial, and agricultural land parcels with verified documentation.
            </p>
          </div>

          <Link
            href="/sell"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md self-start md:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>List New Property</span>
          </Link>
        </div>
      </div>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 space-y-6 w-full">
        {/* KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Total Listings
            </span>
            <span className="text-2xl font-extrabold text-slate-900">{totalCount}</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block mb-1">
              Published Active
            </span>
            <span className="text-2xl font-extrabold text-emerald-700">{publishedCount}</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block mb-1">
              Payment Pending
            </span>
            <span className="text-2xl font-extrabold text-amber-700">{draftsCount}</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block mb-1">
              Under Review
            </span>
            <span className="text-2xl font-extrabold text-blue-700">{pendingCount}</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs col-span-2 lg:col-span-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Buyer Inquiries
            </span>
            <span className="text-2xl font-extrabold text-slate-900">{totalInquiriesCount}</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="border-b border-slate-200 px-6 flex items-center justify-between">
            <div className="flex gap-6 text-xs font-bold text-slate-600">
              <button
                onClick={() => setActiveTab('LISTINGS')}
                className={`py-4 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'LISTINGS'
                    ? 'border-emerald-600 text-emerald-800'
                    : 'border-transparent hover:text-slate-900'
                }`}
              >
                <span>My Land Listings ({properties.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('INQUIRIES')}
                className={`py-4 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'INQUIRIES'
                    ? 'border-emerald-600 text-emerald-800'
                    : 'border-transparent hover:text-slate-900'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Buyer Inquiries ({inquiries.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('PAYMENTS')}
                className={`py-4 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'PAYMENTS'
                    ? 'border-emerald-600 text-emerald-800'
                    : 'border-transparent hover:text-slate-900'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Publishing Receipts ({payments.length})</span>
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* TAB 1: LISTINGS */}
            {activeTab === 'LISTINGS' && (
              <div className="space-y-4">
                {/* Status Subfilters */}
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="text-slate-500 font-semibold">Filter:</span>
                  {[
                    { id: 'ALL', label: 'All' },
                    { id: 'PUBLISHED', label: `Published (${publishedCount})` },
                    { id: 'PENDING', label: `Under Review (${pendingCount})` },
                    { id: 'PAYMENT_REQUIRED', label: `Payment Required (${draftsCount})` },
                    { id: 'EXPIRED', label: `Expired (${expiredCount})` },
                    { id: 'PAUSED', label: 'Paused' },
                  ].map((st) => (
                    <button
                      key={st.id}
                      onClick={() => setStatusFilter(st.id)}
                      className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                        statusFilter === st.id
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>

                {loading ? (
                  <div className="py-12 text-center text-slate-500 text-xs">Loading listings...</div>
                ) : filteredProperties.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-xs">
                    No properties in this view.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {filteredProperties.map((prop) => {
                      const isUnpaid =
                        (prop.listingStatus === 'PAYMENT_PENDING' || prop.listingStatus === 'DRAFT') &&
                        prop.paymentStatus !== 'PAID';
                      const isExpired = prop.listingStatus === 'EXPIRED';
                      const isUnderReview =
                        prop.listingStatus === 'PENDING_VERIFICATION' ||
                        (prop.verificationStatus === 'PENDING' && prop.paymentStatus === 'PAID');
                      const isPublished = prop.listingStatus === 'PUBLISHED';
                      const isPaused = prop.listingStatus === 'PAUSED';
                      const isRejected =
                        prop.listingStatus === 'REJECTED' || prop.verificationStatus === 'REJECTED';

                      return (
                        <div
                          key={prop._id}
                          className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                        >
                          <div className="flex items-start gap-4">
                            <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                              <Image
                                src={
                                  prop.images?.[0]?.secureUrl ||
                                  'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400'
                                }
                                alt={prop.title}
                                fill
                                className="object-cover"
                                referrerPolicy="no-referrer"
                              />
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                {isUnpaid ? (
                                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 border border-amber-200 text-amber-900 text-[10px] font-bold">
                                    Payment Required
                                  </span>
                                ) : isExpired ? (
                                  <span className="px-2.5 py-0.5 rounded-full bg-rose-100 border border-rose-200 text-rose-900 text-[10px] font-bold">
                                    Subscription Expired
                                  </span>
                                ) : isUnderReview ? (
                                  <span className="px-2.5 py-0.5 rounded-full bg-blue-100 border border-blue-200 text-blue-900 text-[10px] font-bold">
                                    Under Verification
                                  </span>
                                ) : isPublished ? (
                                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-900 text-[10px] font-bold">
                                    Published & Active
                                  </span>
                                ) : isPaused ? (
                                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold">
                                    Paused
                                  </span>
                                ) : isRejected ? (
                                  <span className="px-2.5 py-0.5 rounded-full bg-rose-100 border border-rose-200 text-rose-900 text-[10px] font-bold">
                                    Rejected
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold">
                                    {prop.listingStatus}
                                  </span>
                                )}

                                <VerificationBadge status={prop.verificationStatus} />
                              </div>

                              <h4 className="font-bold text-slate-900 text-sm">
                                <Link href={`/properties/${prop._id}`} className="hover:underline">
                                  {prop.title}
                                </Link>
                              </h4>

                              <p className="text-xs text-slate-500">
                                {prop.location.city}, {prop.location.state} • {prop.landAreaYards} sq.yds • ₹
                                {prop.totalPrice.toLocaleString('en-IN')}
                              </p>

                              {isPublished && prop.subscriptionExpiresAt && (
                                <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  <span>
                                    Valid until {new Date(prop.subscriptionExpiresAt).toLocaleDateString('en-IN')}
                                  </span>
                                </p>
                              )}

                              {isUnpaid && (
                                <p className="text-[11px] text-amber-700 font-medium">
                                  Draft safely saved. Complete listing fee payment to submit for verification.
                                </p>
                              )}

                              {isRejected && prop.rejectionReason && (
                                <p className="text-[11px] text-rose-700 font-medium">
                                  Reason: {prop.rejectionReason}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Listing Actions */}
                          <div className="flex items-center gap-2 self-end md:self-center flex-wrap">
                            {/* Incomplete / Unpaid Draft Action */}
                            {isUnpaid && (
                              <>
                                <button
                                  onClick={() =>
                                    setPaymentTarget({
                                      property: prop,
                                      purpose: 'LISTING_SUBSCRIPTION',
                                    })
                                  }
                                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer transition-colors"
                                >
                                  <CreditCard className="w-3.5 h-3.5" />
                                  <span>Continue Payment</span>
                                </button>

                                <Link
                                  href={`/sell?propertyId=${prop._id}`}
                                  className="inline-flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                  <span>Edit Listing</span>
                                </Link>
                              </>
                            )}

                            {/* Expired Subscription Renewal Action */}
                            {isExpired && (
                              <>
                                <button
                                  onClick={() =>
                                    setPaymentTarget({
                                      property: prop,
                                      purpose: 'SUBSCRIPTION_RENEWAL',
                                    })
                                  }
                                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer transition-colors"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  <span>Renew Listing</span>
                                </button>

                                <Link
                                  href={`/sell?propertyId=${prop._id}`}
                                  className="inline-flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                  <span>Edit</span>
                                </Link>
                              </>
                            )}

                            {/* Published Property Actions */}
                            {isPublished && (
                              <>
                                <button
                                  onClick={() =>
                                    setPaymentTarget({
                                      property: prop,
                                      purpose: 'SUBSCRIPTION_RENEWAL',
                                    })
                                  }
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
                                  title="Renew or extend listing subscription"
                                >
                                  <CreditCard className="w-3.5 h-3.5" />
                                  <span>Renew</span>
                                </button>

                                <button
                                  onClick={() => handleToggleListingStatus(prop._id, prop.listingStatus)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold cursor-pointer"
                                >
                                  <PauseCircle className="w-3.5 h-3.5" />
                                  <span>Pause</span>
                                </button>

                                <Link
                                  href={`/sell?propertyId=${prop._id}`}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                                  title="Edit listing details and images"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                  <span>Edit</span>
                                </Link>
                              </>
                            )}

                            {/* Under Review Actions */}
                            {isUnderReview && (
                              <Link
                                href={`/sell?propertyId=${prop._id}`}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                                title="Edit listing details and images"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </Link>
                            )}

                            {isPaused && (
                              <>
                                <button
                                  onClick={() => handleToggleListingStatus(prop._id, prop.listingStatus)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold cursor-pointer"
                                >
                                  <PlayCircle className="w-3.5 h-3.5" />
                                  <span>Resume</span>
                                </button>

                                <Link
                                  href={`/sell?propertyId=${prop._id}`}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                  <span>Edit</span>
                                </Link>
                              </>
                            )}

                            {isRejected && (
                              <Link
                                href={`/sell?propertyId=${prop._id}`}
                                className="inline-flex items-center gap-1 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-lg text-xs font-semibold"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Fix & Re-submit</span>
                              </Link>
                            )}

                            <Link
                              href={`/properties/${prop._id}`}
                              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700"
                              title="View public listing"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>

                            <button
                              onClick={() => handleDeleteProperty(prop._id)}
                              className="p-2 rounded-lg border border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-400 cursor-pointer"
                              title="Delete listing"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: INQUIRIES */}
            {activeTab === 'INQUIRIES' && (
              <div className="space-y-4">
                {inquiries.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-xs">
                    No buyer inquiries received yet. Once serious buyers message via your listings, tickets will appear here.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {inquiries.map((inq) => (
                      <div
                        key={inq._id}
                        className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 shadow-xs"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-900">From: {inq.buyerName}</span>
                          <span className="text-slate-400">
                            {new Date(inq.createdAt).toLocaleDateString('en-IN')}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                          {inq.message}
                        </p>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                          <span>
                            Contact: {inq.buyerEmail} {inq.buyerPhone ? `• Phone: ${inq.buyerPhone}` : ''}
                          </span>
                          <span className="text-emerald-700 font-semibold">Inquiry Ticket Open</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: PAYMENTS */}
            {activeTab === 'PAYMENTS' && (
              <div className="space-y-4">
                {payments.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-xs">
                    No payment transactions recorded.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {payments.map((p) => (
                      <div
                        key={p._id}
                        className="p-4 rounded-xl border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                p.paymentStatus === 'PAID'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : p.paymentStatus === 'FAILED'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {p.paymentStatus}
                            </span>
                            <span className="text-xs font-semibold text-slate-900">
                              Receipt #{p.receiptNumber}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">
                            {p.propertyTitle || 'Land Property Listing'} • {p.paymentPurpose === 'SUBSCRIPTION_RENEWAL' ? '30-Day Renewal' : 'Initial 30-Day Pass'}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono">
                            Razorpay Order: {p.razorpayOrderId}
                          </p>
                        </div>

                        <div className="text-left sm:text-right">
                          <span className="text-base font-extrabold text-slate-900 block">
                            ₹{p.amount.toLocaleString('en-IN')}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {new Date(p.createdAt).toLocaleDateString('en-IN')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Payment / Renewal Modal */}
      {paymentTarget && (
        <RazorpayCheckoutModal
          property={paymentTarget.property}
          purpose={paymentTarget.purpose}
          isOpen={Boolean(paymentTarget)}
          onClose={() => {
            setPaymentTarget(null);
            loadSellerData();
          }}
          onSuccess={() => {
            setPaymentTarget(null);
            loadSellerData();
          }}
        />
      )}

      <Footer />
    </div>
  );
}
