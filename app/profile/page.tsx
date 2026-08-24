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
} from 'lucide-react';
import { IUser } from '@/types/user';
import { IProperty } from '@/types/property';

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
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <div className="max-w-4xl mx-auto py-24 px-4 text-center flex-1 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-700" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <Navbar />
        <div className="max-w-md mx-auto px-4 py-20 flex-1 flex flex-col justify-center text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
            <User className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">Sign in to Access Profile</h1>
          <p className="text-xs text-slate-600">
            Sign in with your Google account to manage saved lands, inquiries, listings, and phone verification.
          </p>
          <button
            onClick={() => setAuthModalOpen(true)}
            className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-colors shadow-xs cursor-pointer"
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
                <div className="w-16 h-16 rounded-2xl bg-emerald-700 text-white flex items-center justify-center text-2xl font-black shadow-md shrink-0">
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
                  {user.phone ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>{user.phone} (Verified)</span>
                    </span>
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
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-sm transition-colors shrink-0 cursor-pointer"
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
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
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
                className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800"
              >
                <span>Seller Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {loadingProperties ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading your listings...</div>
          ) : myProperties.length === 0 ? (
            <div className="p-6 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-3">
              <p className="text-xs font-semibold text-slate-600">
                You haven&apos;t listed any properties yet.
              </p>
              <Link
                href="/sell"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-colors"
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
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
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

                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {isPublished ? (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold">
                              Published & Active
                            </span>
                          ) : isUnderReview ? (
                            <span className="px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-800 text-[10px] font-bold">
                              Under Review
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
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-colors cursor-pointer"
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
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
                  <Search className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Find Land</h2>
                  <p className="text-xs text-slate-500">Search, save & inquire about verified parcels</p>
                </div>
              </div>

              <div className="space-y-2 pt-2 text-xs">
                <Link
                  href="/buy"
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 transition-colors text-slate-700 font-semibold"
                >
                  <span className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-emerald-600" />
                    <span>Browse All Available Lands</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <Link
                  href="/dashboard/buyer"
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 transition-colors text-slate-700 font-semibold"
                >
                  <span className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-rose-500" />
                    <span>Saved Lands & Shortlisted Plots</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <Link
                  href="/dashboard/buyer"
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 transition-colors text-slate-700 font-semibold"
                >
                  <span className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-sky-600" />
                    <span>My Inquiries & Seller Messages</span>
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
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
                  <LayoutDashboard className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Sell Land</h2>
                  <p className="text-xs text-slate-500">List land, manage subscriptions & renew</p>
                </div>
              </div>

              <div className="space-y-2 pt-2 text-xs">
                <Link
                  href="/sell"
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 transition-colors text-slate-700 font-semibold"
                >
                  <span className="flex items-center gap-2">
                    <PlusCircle className="w-4 h-4 text-emerald-600" />
                    <span>Sell Your Land (Create Listing)</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <Link
                  href="/dashboard/seller"
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 transition-colors text-slate-700 font-semibold"
                >
                  <span className="flex items-center gap-2">
                    <FileCheck2 className="w-4 h-4 text-emerald-600" />
                    <span>My Listings & Verification Status</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <Link
                  href="/dashboard/seller"
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 transition-colors text-slate-700 font-semibold"
                >
                  <span className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                    <span>Subscription Status & Payment History</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Mobile Number Verification Section */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Mobile Phone OTP Verification</h2>
              <p className="text-xs text-slate-500">
                Verified phone numbers build trust and allow direct communication between land buyers and sellers.
              </p>
            </div>
          </div>

          {otpMessage && (
            <div
              className={`p-3.5 rounded-xl text-xs font-medium flex items-center gap-2 ${
                otpMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              {otpMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
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
              <button
                type="button"
                onClick={() => setOtpCode(testOtpNotice)}
                className="px-2.5 py-1 bg-amber-200 hover:bg-amber-300 text-amber-950 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Auto-fill Code
              </button>
            </div>
          )}

          <div className="space-y-4 max-w-lg pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Indian 10-Digit Mobile Number
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
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-emerald-600"
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
                    className="w-40 text-center tracking-widest text-base font-mono px-3 py-2 rounded-xl border border-slate-300 focus:outline-emerald-600"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={otpLoading || otpCode.length !== 6}
                    className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    {otpLoading ? 'Verifying...' : 'Verify OTP'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

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
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 block">Welcome to BhoomiMitra</span>
                <span className="text-slate-600">
                  Your direct customer profile is active. You can browse verified plots or list your own land.
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
