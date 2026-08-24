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
import { IPayment } from '@/types/payment';
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
} from 'lucide-react';

export default function SellerDashboardPage() {
  const [activeTab, setActiveTab] = useState<'LISTINGS' | 'INQUIRIES' | 'PAYMENTS'>('LISTINGS');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [properties, setProperties] = useState<IProperty[]>([]);
  const [inquiries, setInquiries] = useState<IInquiry[]>([]);
  const [payments, setPayments] = useState<IPayment[]>([]);
  const [loading, setLoading] = useState(true);

  // Payment modal state for draft properties
  const [selectedPropertyForPayment, setSelectedPropertyForPayment] = useState<IProperty | null>(null);

  const loadSellerData = async () => {
    setLoading(true);
    try {
      // 1. Fetch seller properties
      const propsRes = await fetch('/api/properties?sellerOnly=true&listingStatus=ALL');
      const propsData = await propsRes.json();
      if (propsData?.data) {
        setProperties(propsData.data);
      }

      // 2. Fetch inquiries for seller
      const inqRes = await fetch('/api/inquiries');
      const inqData = await inqRes.json();
      if (inqData?.inquiries) {
        setInquiries(inqData.inquiries);
      }

      // 3. Fetch seller payments
      const payRes = await fetch('/api/payments/my');
      const payData = await payRes.json();
      if (payData?.payments) {
        setPayments(payData.payments);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function fetchData() {
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
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchData();
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
  const pendingCount = properties.filter((p) => p.verificationStatus === 'PENDING').length;
  const totalInquiriesCount = inquiries.length;
  const totalFeesPaid = payments
    .filter((p) => p.paymentStatus === 'PAID')
    .reduce((sum, p) => sum + p.amount, 0);

  const filteredProperties = properties.filter((p) => {
    if (statusFilter === 'PUBLISHED') return p.listingStatus === 'PUBLISHED';
    if (statusFilter === 'PENDING') return p.verificationStatus === 'PENDING';
    if (statusFilter === 'DRAFT') return p.listingStatus === 'DRAFT';
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
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Seller Management Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Track verification status, review buyer inquiries, and manage your published land parcels.
            </p>
          </div>

          <Link
            href="/sell"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>List Another Parcel</span>
          </Link>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 space-y-8">
        {/* KPI Metrics Row */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Total Listings
            </span>
            <span className="text-2xl font-extrabold text-slate-900">{totalCount}</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block mb-1">
              Live Published
            </span>
            <span className="text-2xl font-extrabold text-emerald-800">{publishedCount}</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block mb-1">
              Pending Review
            </span>
            <span className="text-2xl font-extrabold text-amber-800">{pendingCount}</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Buyer Inquiries
            </span>
            <span className="text-2xl font-extrabold text-slate-900">{totalInquiriesCount}</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs col-span-2 lg:col-span-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Publishing Fees Paid
            </span>
            <span className="text-2xl font-extrabold text-slate-900">
              ₹{totalFeesPaid.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="border-b border-slate-200 px-6 flex items-center justify-between">
            <div className="flex gap-6 text-xs font-bold text-slate-600">
              <button
                onClick={() => setActiveTab('LISTINGS')}
                className={`py-4 border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === 'LISTINGS'
                    ? 'border-emerald-600 text-emerald-800'
                    : 'border-transparent hover:text-slate-900'
                }`}
              >
                <span>My Land Listings ({properties.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('INQUIRIES')}
                className={`py-4 border-b-2 transition-colors flex items-center gap-1.5 ${
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
                className={`py-4 border-b-2 transition-colors flex items-center gap-1.5 ${
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
                  {['ALL', 'PUBLISHED', 'PENDING', 'DRAFT', 'PAUSED'].map((st) => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                        statusFilter === st
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {st}
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
                    {filteredProperties.map((prop) => (
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
                            <div className="flex items-center gap-2">
                              <VerificationBadge status={prop.verificationStatus} />
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold">
                                {prop.listingStatus}
                              </span>
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

                            <p className="text-[11px] font-mono text-slate-400">
                              Govt ID: {prop.governmentRegistrationId}
                            </p>
                          </div>
                        </div>

                        {/* Listing Actions */}
                        <div className="flex items-center gap-2 self-end md:self-center">
                          {/* Payment / Renewal Actions */}
                          {(prop.listingStatus === 'PAYMENT_PENDING' || prop.listingStatus === 'DRAFT' || prop.paymentStatus !== 'PAID') && (
                            <button
                              onClick={() => setSelectedPropertyForPayment(prop)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-xs"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>Pay Fee ₹{(prop.publishingFee || prop.landAreaYards * 10).toLocaleString('en-IN')}</span>
                            </button>
                          )}

                          {prop.listingStatus === 'PUBLISHED' && (
                            <button
                              onClick={() => setSelectedPropertyForPayment(prop)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-xs"
                              title="Renew 30-day listing subscription"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>Renew (₹{(prop.monthlyListingFee || prop.landAreaYards * 10).toLocaleString('en-IN')})</span>
                            </button>
                          )}

                          {prop.listingStatus === 'PUBLISHED' && (
                            <button
                              onClick={() => handleToggleListingStatus(prop._id, prop.listingStatus)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold"
                            >
                              <PauseCircle className="w-3.5 h-3.5" />
                              <span>Pause</span>
                            </button>
                          )}

                          {prop.listingStatus === 'PAUSED' && (
                            <button
                              onClick={() => handleToggleListingStatus(prop._id, prop.listingStatus)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold"
                            >
                              <PlayCircle className="w-3.5 h-3.5" />
                              <span>Resume</span>
                            </button>
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
                            className="p-2 rounded-lg border border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-400"
                            title="Delete listing"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
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
                        className="p-4 rounded-xl border border-slate-200 bg-white flex items-center justify-between shadow-xs text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">
                              Publishing Fee: ₹{p.amount.toLocaleString('en-IN')}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                              {p.paymentStatus}
                            </span>
                          </div>
                          <p className="text-slate-500 font-mono text-[11px]">
                            Order ID: {p.razorpayOrderId} • Pay ID: {p.razorpayPaymentId || 'Completed'}
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="text-slate-400 block">
                            {new Date(p.createdAt).toLocaleDateString('en-IN')}
                          </span>
                          <span className="text-emerald-700 font-semibold text-[11px]">
                            Razorpay Verified
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

      {/* Pay modal */}
      {selectedPropertyForPayment && (
        <RazorpayCheckoutModal
          property={selectedPropertyForPayment}
          isOpen={!!selectedPropertyForPayment}
          onClose={() => setSelectedPropertyForPayment(null)}
          onSuccess={() => {
            setSelectedPropertyForPayment(null);
            loadSellerData();
          }}
        />
      )}

      <Footer />
    </div>
  );
}
