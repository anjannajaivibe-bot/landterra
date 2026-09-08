'use client';

import React, { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { RazorpayCheckoutModal } from '@/components/payments/RazorpayCheckoutModal';
import { AuthModal } from '@/components/auth/AuthModal';
import { useSellForm } from '@/hooks/useSellForm';
import { Step1SpecsPricing } from '@/components/sell/steps/Step1SpecsPricing';
import { Step2Location } from '@/components/sell/steps/Step2Location';
import { Step3SellerContact } from '@/components/sell/steps/Step3SellerContact';
import { Step4Records } from '@/components/sell/steps/Step4Records';
import { Step5MediaUpload } from '@/components/sell/steps/Step5MediaUpload';
import { Step6Documents } from '@/components/sell/steps/Step6Documents';
import { Step7ReviewPayment } from '@/components/sell/steps/Step7ReviewPayment';
import { CloudflareTurnstile } from '@/components/security/CloudflareTurnstile';
import {
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  CreditCard,
  MapPin,
  AlertCircle,
  FileText,
  Sparkles,
  Phone,
  Compass,
  Loader2,
  Save,
} from 'lucide-react';

function SellPageForm() {
  const router = useRouter();
  const form = useSellForm();
  const { state, actions } = form;

  const {
    currentStep,
    errorMessage,
    isSubmitting,
    isSavingDraft,
    draftSaveSuccess,
    draftSavedMessage,
    draftSavedTime,
    currentUser,
    authModalOpen,
    paymentModalOpen,
    createdProperty,
    progressPercent,
    existingPropertyId,
    existingPaymentStatus,
    isUpdateSuccess,
    pageLoading,
    requireGoogleLogin,
    requirePhoneOtp,
    listingFeeAmount,
    listingDurationDays,
    phoneInput,
    otpSent,
    otpCode,
    otpLoading,
    otpMessage,
    testOtpNotice,
    termsAccepted,
    turnstileToken,
    humanVerified,
    isUploadingImage,
    isUploadingDoc,
  } = state;

  const {
    setCurrentStep,
    setAuthModalOpen,
    setPaymentModalOpen,
    syncStepToUrl,
    handleNext,
    handlePrev,
    setDraftSavedMessage,
    setPhoneInput,
    setOtpCode,
    setOtpSent,
    handleSendOtp,
    handleVerifyOtp,
    handleSaveDraft,
    handleProceedToPayment,
    handlePaymentSuccess,
    setHumanVerified,
  } = actions;

  // Loading state
  if (pageLoading) {
    return <SellPageSkeleton />;
  }

  // Auth Gate
  if (requireGoogleLogin && !currentUser) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <Navbar />
        <div className="max-w-xl mx-auto px-4 py-20 flex-1 flex flex-col justify-center">
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xl text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-[#fff1dc] text-[#c75e0a] flex items-center justify-center mx-auto">
              <Compass className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Sign in to List Your Property
              </h1>
              <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
                BhoomiMitra connects land owners directly with serious buyers across India with zero broker commissions. Sign in with Google to begin your listing.
              </p>
            </div>

            <button
              onClick={() => setAuthModalOpen(true)}
              className="w-full py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-3 transition-colors shadow-sm cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-500">
              <ShieldCheck className="w-4 h-4 text-[#FF9933]" />
              <span>100% Direct Seller-to-Buyer Contact</span>
            </div>
          </div>
        </div>

        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          title="Sign in to Sell Your Land"
          description="Authenticate with Google to create your land listing, manage inquiries, and track monthly subscriptions."
        />

        <Footer />
      </div>
    );
  }

  // Phone OTP Verification Gate
  if (requirePhoneOtp && currentUser && !currentUser.isPhoneVerified) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <Navbar />
        <div className="max-w-md mx-auto px-4 py-16 flex-1 flex flex-col justify-center">
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xl space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-[#fff1dc] text-[#c75e0a] flex items-center justify-center mx-auto">
              <Phone className="w-7 h-7" />
            </div>

            <div className="text-center space-y-1">
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Verify Your Mobile Number
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                To prevent fraud and spam listings, all land sellers must verify their mobile phone number via OTP before listing parcels.
              </p>
            </div>

            {otpMessage && (
              <div
                className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${otpMessage.type === 'success'
                    ? 'bg-[#fff9f0] text-[#c75e0a] border border-[#FF9933]/30'
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
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Development OTP Code:</span>
                </p>
                <p className="font-mono text-base font-black tracking-widest text-amber-950">
                  {testOtpNotice}
                </p>
                <p className="text-[10px] text-amber-700">
                  (Shown only outside production for convenient workflow testing)
                </p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  10-Digit Mobile Number
                </label>

                <div className="flex gap-2">
                  <div className="flex items-center px-3 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-600">
                    +91
                  </div>

                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="9876543210"
                    value={phoneInput}
                    onChange={(event) =>
                      setPhoneInput(event.target.value.replace(/\D/g, ''))
                    }
                    disabled={otpSent || otpLoading}
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-[#FF9933]"
                  />

                  {!otpSent && (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={otpLoading || phoneInput.length < 10}
                      className="px-4 py-2.5 rounded-xl bg-[#FF9933] hover:bg-[#f07d12] text-white font-bold text-xs disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      {otpLoading ? 'Sending...' : 'Send OTP'}
                    </button>
                  )}
                </div>
              </div>

              {otpSent && (
                <div className="space-y-3 animate-in fade-in duration-150">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Enter 6-Digit Verification Code
                    </label>

                    <input
                      type="text"
                      maxLength={6}
                      placeholder="• • • • • •"
                      value={otpCode}
                      onChange={(event) =>
                        setOtpCode(event.target.value.replace(/\D/g, ''))
                      }
                      className="w-full text-center tracking-widest text-lg font-mono px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-[#FF9933]"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={otpLoading || otpCode.length !== 6}
                    className="w-full py-3 rounded-xl bg-[#FF9933] hover:bg-[#f07d12] text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
                  >
                    <span>{otpLoading ? 'Verifying...' : 'Verify Phone & Continue'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setOtpSent(false);
                        setOtpCode('');
                      }}
                      className="text-[11px] text-slate-500 hover:text-slate-800 underline font-medium cursor-pointer"
                    >
                      Change phone number
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <Footer />
      </div>
    );
  }

  // ── Cloudflare Turnstile Entry Gate ──
  // After login + phone OTP, before Step 1 renders.
  // Skip if this is an existing draft being edited.
  if (!humanVerified && !existingPropertyId) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-20 flex-1 flex flex-col justify-center">
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xl text-center space-y-6">
            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl bg-[#fff1dc] text-[#c75e0a] flex items-center justify-center mx-auto">
              <ShieldCheck className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Quick Security Check
              </h1>
              <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                To protect sellers and buyers from bots and spam listings, please complete the security check below before accessing the listing form.
              </p>
            </div>

            {/* Turnstile widget — centred */}
            <div className="flex justify-center pt-2">
              <CloudflareTurnstile
                action="sell_entry"
                onSuccess={(token) => {
                  setHumanVerified(true);
                  actions.setTurnstileToken(token);
                }}
                onError={() => {
                  setHumanVerified(false);
                  actions.setTurnstileToken(null);
                }}
                onExpire={() => {
                  setHumanVerified(false);
                  actions.setTurnstileToken(null);
                }}
              />
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-[#FF9933]" />
              <span>Verified by Cloudflare Turnstile — Zero Brokerage Platform</span>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const steps = [
    { step: 1, label: 'Specifications' },
    { step: 2, label: 'Location' },
    { step: 3, label: 'Seller Details' },
    { step: 4, label: 'Govt Records' },
    { step: 5, label: 'Photos & Video' },
    { step: 6, label: 'Documents' },
    { step: 7, label: 'Review & Pay' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />

      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between gap-4 mb-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-[#FF9933] mb-1">
                  {existingPropertyId ? 'Continue Your Listing Draft' : 'Seller Listing'}
                </p>

                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">
                  {existingPropertyId ? 'Complete Your Land Listing' : 'List Your Land'}
                </h1>

                <p className="mt-1 text-xs sm:text-sm text-slate-500">
                  Add your property details, upload supporting documents, and publish after flat-fee payment.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {draftSavedTime ? (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold shadow-xs animate-in fade-in">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Saved at {draftSavedTime}</span>
                  </div>
                ) : existingPropertyId ? (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold shadow-xs">
                    <Save className="w-3.5 h-3.5 text-amber-600" />
                    <span>Draft in Progress</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 text-[11px] font-semibold shadow-2xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#FF9933]" />
                    <span>Direct Platform • Zero Brokerage</span>
                  </div>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden mt-6">
              <div
                className="h-full bg-gradient-to-r from-[#FF9933] to-[#f07d12] transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Stepper Tabs */}
          <div className="grid grid-cols-7 gap-1.5 mb-8">
            {steps.map(({ step, label }) => {
              const active = currentStep === step;
              const completed = currentStep > step;

              return (
                <button
                  key={step}
                  type="button"
                  onClick={() => {
                    if (step < currentStep) {
                      setCurrentStep(step);
                      syncStepToUrl(step);
                    }
                  }}
                  disabled={step > currentStep}
                  className={`p-2 sm:p-2.5 rounded-xl text-center transition-all ${active
                      ? 'bg-[#FF9933] text-white shadow-sm'
                      : completed
                        ? 'bg-[#fff9f0] text-[#c75e0a] border border-[#FF9933]/30 cursor-pointer'
                        : 'bg-white text-slate-400 border border-slate-200'
                    }`}
                >
                  <div className="text-[9px] sm:text-[10px] font-bold">
                    {completed ? '✓' : step}
                  </div>
                  <div className="hidden sm:block text-[9px] font-semibold truncate mt-0.5">
                    {label}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
              <div className="text-xs leading-relaxed">
                <p className="font-bold mb-0.5">Please check the following</p>
                <p>{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Main Wizard Form Card */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            {currentStep === 1 && <Step1SpecsPricing form={form} />}
            {currentStep === 2 && <Step2Location form={form} />}
            {currentStep === 3 && <Step3SellerContact form={form} />}
            {currentStep === 4 && <Step4Records form={form} />}
            {currentStep === 5 && <Step5MediaUpload form={form} />}
            {currentStep === 6 && <Step6Documents form={form} />}
            {currentStep === 7 && (
              <Step7ReviewPayment
                form={form}
                existingPropertyId={existingPropertyId}
                existingPaymentStatus={existingPaymentStatus}
                listingDurationDays={listingDurationDays}
                listingFeeAmount={listingFeeAmount}
              />
            )}

            {/* Draft Saved Banner */}
            {draftSavedMessage && (
              <div className="mx-5 sm:mx-8 mb-4 rounded-xl bg-emerald-50 border border-emerald-200 p-4 shadow-xs animate-in fade-in">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-emerald-950">
                      Listing Draft Saved to Your Account
                    </p>
                    <p className="text-[11px] text-emerald-800/90 mt-0.5 leading-relaxed">
                      {draftSavedMessage}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDraftSavedMessage(null)}
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-950 cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {/* Navigation Footer */}
            <div className="px-5 sm:px-8 py-4 border-t border-slate-100 bg-slate-50 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <button
                type="button"
                onClick={
                  currentStep === 1
                    ? () => router.push('/dashboard/seller')
                    : handlePrev
                }
                disabled={isSubmitting || isSavingDraft}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-200 transition-colors cursor-pointer disabled:opacity-50"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{currentStep === 1 ? 'Exit' : 'Back'}</span>
              </button>

              {currentStep < 7 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={
                    isSubmitting || isSavingDraft || isUploadingImage || isUploadingDoc
                  }
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#FF9933] hover:bg-[#f07d12] text-white text-xs font-bold transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  {/* Save Draft Button */}
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    disabled={
                      isSubmitting ||
                      isSavingDraft ||
                      isUploadingImage ||
                      isUploadingDoc
                    }
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-200 hover:border-[#FF9933] text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    {isSavingDraft ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-[#FF9933]" />
                        <span>Saving Draft...</span>
                      </>
                    ) : draftSaveSuccess ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span className="text-emerald-700 font-extrabold">Draft Saved!</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 text-slate-600" />
                        <span>Save Draft</span>
                      </>
                    )}
                  </button>

                  {/* Proceed to Pay Button (or Save & Update Property if already paid) */}
                  <button
                    type="button"
                    onClick={handleProceedToPayment}
                    disabled={
                      isSubmitting ||
                      isSavingDraft ||
                      !termsAccepted ||
                      isUploadingImage ||
                      isUploadingDoc
                    }
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#FF9933] hover:bg-[#f07d12] text-white text-xs font-bold transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    {existingPropertyId && existingPaymentStatus === 'PAID' ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <CreditCard className="w-4 h-4" />
                    )}
                    <span>
                      {isSubmitting
                        ? 'Saving Changes...'
                        : isUpdateSuccess
                          ? 'Listing Updated Successfully!'
                          : existingPropertyId && existingPaymentStatus === 'PAID'
                            ? 'Save & Update Property'
                            : `Proceed to Pay ₹${listingFeeAmount.toLocaleString('en-IN')}`}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[10px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Secure seller authentication
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              GPS Location Pinning
            </span>
            <span className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Direct buyer connection
            </span>
          </div>
        </div>
      </main>

      <Footer />

      {/* Razorpay Checkout Modal */}
      {createdProperty && (
        <RazorpayCheckoutModal
          property={createdProperty}
          isOpen={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        title="Sign in to Sell Your Land"
        description="Authenticate with Google to create and manage your land listing."
      />
    </div>
  );
}

/* ================================================================
   SELL PAGE SKELETON (Gray Boxes with Continuous Shimmer Wave)
================================================================ */

function SellPageSkeleton() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />

      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
          {/* Header Skeleton */}
          <div>
            <div className="flex items-center justify-between gap-4 mb-3">
              <div className="space-y-2">
                <div className="h-3.5 w-28 rounded-md shimmer" />
                <div className="h-8 w-64 sm:w-80 rounded-xl shimmer" />
                <div className="h-4 w-72 sm:w-96 rounded-md shimmer" />
              </div>

              <div className="hidden sm:block h-10 w-44 rounded-xl shimmer" />
            </div>

            {/* Progress Bar Skeleton */}
            <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden mt-6">
              <div className="h-full w-1/6 shimmer" />
            </div>
          </div>

          {/* Stepper Skeleton (7 steps) */}
          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: 7 }).map((_, index) => (
              <div key={index} className="h-12 rounded-lg shimmer" />
            ))}
          </div>

          {/* Form Card Skeleton */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs space-y-6">
            {/* Step Title & Subtitle */}
            <div className="space-y-2 pb-4 border-b border-slate-100">
              <div className="h-6 w-56 rounded-lg shimmer" />
              <div className="h-4 w-72 rounded-md shimmer" />
            </div>

            {/* Category Filter Tabs */}
            <div className="h-11 rounded-2xl shimmer w-full" />

            {/* Property Type Buttons Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-16 rounded-xl shimmer" />
              ))}
            </div>

            {/* Title Input Field */}
            <div className="space-y-2 pt-2">
              <div className="h-4 w-36 rounded-md shimmer" />
              <div className="h-12 rounded-xl shimmer w-full" />
            </div>

            {/* Area & Price Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="h-4 w-28 rounded-md shimmer" />
                <div className="h-12 rounded-xl shimmer w-full" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-28 rounded-md shimmer" />
                <div className="h-12 rounded-xl shimmer w-full" />
              </div>
            </div>

            {/* Description Textarea */}
            <div className="space-y-2">
              <div className="h-4 w-32 rounded-md shimmer" />
              <div className="h-28 rounded-xl shimmer w-full" />
            </div>

            {/* Bottom Action Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-100">
              <div className="h-11 w-28 rounded-xl shimmer" />
              <div className="h-11 w-44 rounded-xl shimmer" />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function SellPage() {
  return (
    <Suspense fallback={<SellPageSkeleton />}>
      <SellPageForm />
    </Suspense>
  );
}