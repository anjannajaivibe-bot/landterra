'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { AuthModal } from '@/components/auth/AuthModal';
import { VerificationBadge } from '@/components/properties/VerificationBadge';
import {
  User,
  Phone,
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  LayoutDashboard,
  Heart,
  PlusCircle,
  ArrowRight,
  Bell,
  Clock,
  Sparkles,
  Search,
  FileCheck2,
  CreditCard,
  Edit3,
  ExternalLink,
  Trash2,
  MapPin,
  Building2,
  Calendar,
  LandPlot,
} from 'lucide-react';
import { IUser } from '@/types/user';
import { IProperty } from '@/types/property';

/* ================================================================
   PROFILE PAGE SKELETON (Gray Boxes with Continuous Shimmer Wave)
================================================================ */

function ProfilePageSkeleton() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />

      <main className="max-w-5xl mx-auto py-10 px-4 sm:px-6 lg:px-8 w-full flex-1 space-y-8">
        {/* 1. Header Profile Card Skeleton */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl shimmer shrink-0" />

              <div className="space-y-2">
                <div className="h-7 w-48 rounded-lg shimmer" />
                <div className="h-4 w-60 rounded-md shimmer" />
                <div className="flex items-center gap-2 pt-1">
                  <div className="h-6 w-32 rounded-full shimmer" />
                  <div className="h-6 w-40 rounded-full shimmer" />
                </div>
              </div>
            </div>

            <div className="h-10 w-36 rounded-xl shimmer shrink-0" />
          </div>
        </div>

        {/* 2. My Properties Card Skeleton */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl shimmer shrink-0" />
              <div className="space-y-1.5">
                <div className="h-5 w-56 rounded-md shimmer" />
                <div className="h-3.5 w-72 rounded-md shimmer" />
              </div>
            </div>
            <div className="h-4 w-28 rounded-md shimmer" />
          </div>

          <div className="divide-y divide-slate-100">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-16 h-16 rounded-xl shimmer shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-56 sm:w-72 rounded-md shimmer" />
                    <div className="h-3.5 w-40 rounded-md shimmer" />
                    <div className="flex gap-2">
                      <div className="h-5 w-20 rounded-md shimmer" />
                      <div className="h-5 w-24 rounded-md shimmer" />
                    </div>
                  </div>
                </div>
                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2">
                  <div className="h-5 w-24 rounded-md shimmer" />
                  <div className="h-8 w-28 rounded-lg shimmer" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Quick Actions & Inquiries Card Skeleton */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
          <div className="h-5 w-48 rounded-md shimmer" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="h-20 rounded-2xl shimmer-light" />
            <div className="h-20 rounded-2xl shimmer-light" />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function ProfilePage() {
  const [user, setUser] = useState<Partial<IUser> | null>(null);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // User properties state
  const [myProperties, setMyProperties] = useState<IProperty[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(true);

  // Phone verification state
  const [phoneInput, setPhoneInput] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpMessage, setOtpMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [testOtpNotice, setTestOtpNotice] = useState<string | null>(null);
  const [isEditingPhone, setIsEditingPhone] = useState(false);

  const loadProperties = async () => {
    try {
      setLoadingProperties(true);
      const res = await fetch('/api/properties?sellerOnly=true&listingStatus=ALL');
      if (res.ok) {
        const data = await res.json();
        if (data?.data) {
          setMyProperties(data.data);
        }
      }
    } catch (err) {
      console.error('Error fetching user properties:', err);
    } finally {
      setLoadingProperties(false);
    }
  };

  useEffect(() => {
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        if (data?.session?.user) {
          setUser(data.session.user);
          if (data.session.user.phone) {
            setPhoneInput(data.session.user.phone);
          }
          loadProperties();
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleDeleteProperty = async (propertyId: string) => {
    if (!confirm('Are you sure you want to remove this land listing?')) return;
    try {
      const res = await fetch(`/api/properties/${propertyId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        loadProperties();
      } else {
        alert('Failed to delete property. Please try again.');
      }
    } catch (err) {
      console.error('Delete property error:', err);
    }
  };

  const handleSendOtp = async () => {
    if (!phoneInput || phoneInput.length < 10) {
      setOtpMessage({ type: 'error', text: 'Please enter a valid 10-digit Indian mobile number' });
      return;
    }

    setOtpLoading(true);
    setOtpMessage(null);
    setTestOtpNotice(null);

    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneInput }),
      });
      const data = await res.json();

      if (res.ok) {
        setOtpSent(true);
        setOtpMessage({ type: 'success', text: data.message || 'OTP sent successfully!' });
        if (data.testOtpPreview) {
          setTestOtpNotice(data.testOtpPreview);
        }
      } else {
        setOtpMessage({ type: 'error', text: data.message || 'Failed to send OTP' });
      }
    } catch {
      setOtpMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length !== 6) {
      setOtpMessage({ type: 'error', text: 'Please enter the 6-digit OTP code' });
      return;
    }

    setOtpLoading(true);
    setOtpMessage(null);

    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneInput, otp: otpCode }),
      });
      const data = await res.json();

      if (res.ok) {
        setOtpMessage({ type: 'success', text: 'Mobile number verified successfully!' });
        setUser((prev) => (prev ? { ...prev, phone: data.phone, isPhoneVerified: true } : null));
        setOtpSent(false);
        setOtpCode('');
        setTestOtpNotice(null);
        setIsEditingPhone(false);
      } else {
        setOtpMessage({ type: 'error', text: data.message || 'Invalid OTP. Please try again.' });
      }
    } catch {
      setOtpMessage({ type: 'error', text: 'Verification error. Please try again.' });
    } finally {
      setOtpLoading(false);
    }
  };

  if (loading) {
    return <ProfilePageSkeleton />;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <Navbar />
        <div className="max-w-md mx-auto px-4 py-20 flex-1 flex flex-col justify-center text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#fff1dc] text-[#c75e0a] flex items-center justify-center mx-auto">
            <User className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">Sign in to Access Profile</h1>
          <p className="text-xs text-slate-600">
            Sign in with your Google account to manage saved lands, inquiries, listings, and phone verification.
          </p>
          <button
            onClick={() => setAuthModalOpen(true)}
            className="w-full py-3 rounded-xl bg-[#FF9933] hover:bg-[#f07d12] text-white font-bold text-xs transition-colors shadow-xs cursor-pointer"
          >
            Sign in with Google
          </button>
        </div>
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
        />
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />

      <main className="max-w-5xl mx-auto py-10 px-4 sm:px-6 lg:px-8 w-full flex-1 space-y-8">
        {/* 1. Header Profile Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              {user.profileImage || (user as any).image ? (
                <div className="relative w-16 h-16 rounded-2xl overflow-hidden shadow-md shrink-0 border border-slate-200">
                  <Image
                    src={user.profileImage || (user as any).image}
                    alt={user.name || 'User'}
                    fill
                    className="object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-[#FF9933] text-white flex items-center justify-center text-2xl font-black shadow-md shrink-0">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
              )}

              <div className="space-y-1">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">{user.name}</h1>
                <p className="text-xs text-slate-600 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{user.email}</span>
                </p>
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  {user.phone && user.isPhoneVerified ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#fff1dc] text-[#c75e0a] flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-[#FF9933]" />
                        <span>{user.phone} (Verified)</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingPhone((prev) => !prev);
                          setOtpMessage(null);
                          setOtpSent(false);
                          setOtpCode('');
                          setTestOtpNotice(null);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 hover:bg-[#fff1dc] hover:text-[#c75e0a] text-slate-700 transition-colors cursor-pointer border border-slate-200"
                      >
                        <Edit3 className="w-3 h-3 text-slate-500" />
                        <span>{isEditingPhone ? 'Cancel' : 'Edit Details'}</span>
                      </button>
                    </div>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900">
                      Phone Verification Pending
                    </span>
                  )}
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                    Unified Customer Account
                  </span>
                </div>
              </div>
            </div>

            <Link
              href="/sell"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF9933] hover:bg-[#f07d12] text-white text-xs font-bold shadow-sm transition-colors shrink-0 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>List New Land</span>
            </Link>
          </div>
        </div>

        {/* 2. My Land Listings & Direct Management */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#fff1dc] text-[#c75e0a]">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">My Properties & Land Listings</h2>
                <p className="text-xs text-slate-500">
                  Manage, edit details, upload photos, and update your published land parcels.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/dashboard/seller"
                className="inline-flex items-center gap-1 text-xs font-bold text-[#c75e0a] hover:text-[#7a3705]"
              >
                <span>Seller Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {loadingProperties ? (
            <div className="divide-y divide-slate-100">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="w-16 h-16 rounded-xl shimmer shrink-0" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 w-56 sm:w-72 rounded-md shimmer" />
                      <div className="h-3.5 w-40 rounded-md shimmer" />
                      <div className="flex gap-2">
                        <div className="h-5 w-20 rounded-md shimmer" />
                        <div className="h-5 w-24 rounded-md shimmer" />
                      </div>
                    </div>
                  </div>
                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2">
                    <div className="h-5 w-24 rounded-md shimmer" />
                    <div className="h-8 w-28 rounded-lg shimmer" />
                  </div>
                </div>
              ))}
            </div>
          ) : myProperties.length === 0 ? (
            <div className="p-6 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-3">
              <p className="text-xs font-semibold text-slate-600">
                You haven&apos;t listed any properties yet.
              </p>
              <Link
                href="/sell"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FF9933] hover:bg-[#f07d12] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>List Your First Land Parcel</span>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {myProperties.map((prop) => {
                const isUnpaid =
                  (prop.listingStatus === 'PAYMENT_PENDING' || prop.listingStatus === 'DRAFT') &&
                  prop.paymentStatus !== 'PAID';
                const isPublished = prop.listingStatus === 'PUBLISHED';
                const isUnderReview =
                  prop.listingStatus === 'PENDING_VERIFICATION' ||
                  (prop.verificationStatus === 'PENDING' && prop.paymentStatus === 'PAID');
                const isExpired = prop.listingStatus === 'EXPIRED';
                const isPaused = prop.listingStatus === 'PAUSED';

                return (
                  <div
                    key={prop._id}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200 flex items-center justify-center">
                        {prop.images?.[0]?.secureUrl ? (
                          <Image
                            src={prop.images[0].secureUrl}
                            alt={prop.title}
                            fill
                            className="object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <LandPlot className="w-6 h-6 text-slate-300" />
                        )}
                      </div>

                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {isPublished ? (
                            <span className="px-2 py-0.5 rounded-md bg-[#fff1dc] border border-[#FF9933]/30 text-[#c75e0a] text-[10px] font-bold">
                              Published &amp; Active
                            </span>
                          ) : isUnderReview ? (
                            <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold">
                              Inactive / Processing
                            </span>
                          ) : isUnpaid ? (
                            <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold">
                              Payment Pending
                            </span>
                          ) : isExpired ? (
                            <span className="px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-[10px] font-bold">
                              Expired
                            </span>
                          ) : isPaused ? (
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                              Paused
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold">
                              {prop.listingStatus}
                            </span>
                          )}

                          <VerificationBadge status={prop.verificationStatus} />
                        </div>

                        <h3 className="text-xs font-bold text-slate-900 truncate">
                          <Link href={`/properties/${prop._id}`} className="hover:underline">
                            {prop.title}
                          </Link>
                        </h3>

                        <p className="text-[11px] text-slate-500 truncate">
                          {prop.location.city}, {prop.location.state} • {prop.landAreaYards} sq.yds • ₹
                          {Number(prop.totalPrice || 0).toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <Link
                        href={`/sell?propertyId=${prop._id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#fff1dc] hover:bg-[#ffe5c2] text-[#c75e0a] border border-[#FF9933]/30 text-xs font-bold transition-colors cursor-pointer"
                        title="Edit title, photos, price, description, etc."
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit Property</span>
                      </Link>

                      <Link
                        href={`/properties/${prop._id}`}
                        className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
                        title="View public page"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleDeleteProperty(prop._id)}
                        className="p-2 rounded-lg border border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-400 transition-colors cursor-pointer"
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

        {/* 3. Find Land & Sell Land Unified Hubs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Find Land Hub */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#fff1dc] text-[#c75e0a]">
                  <Search className="w-5 h-5 text-[#FF9933]" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Find Land</h2>
                  <p className="text-xs text-slate-500">Search, save &amp; inquire about land parcels</p>
                </div>
              </div>

              <div className="space-y-2 pt-2 text-xs">
                <Link
                  href="/buy"
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-[#fff1dc] hover:text-[#c75e0a] transition-colors text-slate-700 font-semibold"
                >
                  <span className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-[#FF9933]" />
                    <span>Browse All Available Lands</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <Link
                  href="/dashboard/buyer"
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-[#fff1dc] hover:text-[#c75e0a] transition-colors text-slate-700 font-semibold"
                >
                  <span className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-rose-500" />
                    <span>Saved Lands &amp; Shortlisted Plots</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <Link
                  href="/dashboard/buyer"
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-[#fff1dc] hover:text-[#c75e0a] transition-colors text-slate-700 font-semibold"
                >
                  <span className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-sky-600" />
                    <span>My Inquiries &amp; Seller Messages</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Sell Land Hub */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#fff1dc] text-[#c75e0a]">
                  <LayoutDashboard className="w-5 h-5 text-[#FF9933]" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Sell Land</h2>
                  <p className="text-xs text-slate-500">List land, manage subscriptions &amp; renew</p>
                </div>
              </div>

              <div className="space-y-2 pt-2 text-xs">
                <Link
                  href="/sell"
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-[#fff1dc] hover:text-[#c75e0a] transition-colors text-slate-700 font-semibold"
                >
                  <span className="flex items-center gap-2">
                    <PlusCircle className="w-4 h-4 text-[#FF9933]" />
                    <span>Sell Your Land (Create Listing)</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <Link
                  href="/dashboard/seller"
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-[#fff1dc] hover:text-[#c75e0a] transition-colors text-slate-700 font-semibold"
                >
                  <span className="flex items-center gap-2">
                    <FileCheck2 className="w-4 h-4 text-[#FF9933]" />
                    <span>My Listings &amp; Subscription Status</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <Link
                  href="/dashboard/seller"
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-[#fff1dc] hover:text-[#c75e0a] transition-colors text-slate-700 font-semibold"
                >
                  <span className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-[#FF9933]" />
                    <span>Subscription Status &amp; Payment History</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Mobile Number Verification Section */}
        {(!user.isPhoneVerified || isEditingPhone) && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#fff1dc] text-[#c75e0a]">
                  <Phone className="w-5 h-5 text-[#FF9933]" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {user.isPhoneVerified ? 'Update Mobile Number' : 'Mobile Phone OTP Verification'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {user.isPhoneVerified
                      ? 'Enter your new 10-digit Indian mobile number to verify and update your contact info.'
                      : 'Verified phone numbers build trust and allow direct communication between land buyers and sellers.'}
                  </p>
                </div>
              </div>

              {isEditingPhone && (
                <button
                  type="button"
                  onClick={() => setIsEditingPhone(false)}
                  className="self-start sm:self-center text-xs font-bold text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>

            {otpMessage && (
              <div
                className={`p-3.5 rounded-xl text-xs font-medium flex items-center gap-2 ${
                  otpMessage.type === 'success'
                    ? 'bg-[#fff1dc] text-[#c75e0a] border border-[#FF9933]/30'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                {otpMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-[#FF9933]" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                )}
                <span>{otpMessage.text}</span>
              </div>
            )}

            {testOtpNotice && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between">
                <div>
                  <strong>Sandbox OTP Code:</strong>{' '}
                  <span className="font-mono font-bold tracking-widest">{testOtpNotice}</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-900 font-mono text-[10px] font-bold">
                  Dev Mode
                </span>
              </div>
            )}

            <div className="space-y-4 max-w-md pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Indian Mobile Number (10 Digits)
                </label>
                <div className="flex gap-2">
                  <div className="flex items-center px-3 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-600">
                    +91
                  </div>
                  <input
                    type="tel"
                    maxLength={10}
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="9876543210"
                    disabled={otpLoading}
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-[#FF9933]"
                  />
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={otpLoading || phoneInput.length < 10}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    {otpLoading ? 'Sending...' : otpSent ? 'Resend OTP' : 'Send OTP'}
                  </button>
                </div>
              </div>

              {otpSent && (
                <div className="space-y-3 pt-2 animate-in fade-in duration-150">
                  <label className="block text-xs font-bold text-slate-700">Enter 6-Digit OTP Code</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="• • • • • •"
                      className="w-40 text-center tracking-widest text-base font-mono px-3 py-2 rounded-xl border border-slate-300 focus:outline-[#FF9933]"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={otpLoading || otpCode.length !== 6}
                      className="px-5 py-2 rounded-xl bg-[#FF9933] hover:bg-[#f07d12] text-white font-bold text-xs disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      {otpLoading ? 'Verifying...' : 'Verify OTP'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 5. Platform Notifications Center */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Notifications & Alerts</h2>
              <p className="text-xs text-slate-500">
                Updates on your property listings, buyer inquiries, and subscription renewals.
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3 text-xs">
              <Sparkles className="w-4 h-4 text-[#FF9933] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 block">Welcome to BhoomiMitra</span>
                <span className="text-slate-600">
                  Your direct customer profile is active. You can browse land plots or list your own parcel.
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
