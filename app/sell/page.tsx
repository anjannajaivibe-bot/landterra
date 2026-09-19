'use client';

import React, { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { AuthModal } from '@/components/auth/AuthModal';
import { useSellForm } from '@/hooks/useSellForm';
import { Step1SpecsPricing } from '@/components/sell/steps/Step1SpecsPricing';
import { Step2Location } from '@/components/sell/steps/Step2Location';
import { Step3SellerContact } from '@/components/sell/steps/Step3SellerContact';
import { Step4Records } from '@/components/sell/steps/Step4Records';
import { Step5MediaUpload } from '@/components/sell/steps/Step5MediaUpload';
import { Step6Documents } from '@/components/sell/steps/Step6Documents';
import { Step7ReviewPayment } from '@/components/sell/steps/Step7ReviewPayment';
import {
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Phone,
  Compass,
  Loader2,
  Save,
  MapPin,
  Camera,
  FileCheck2,
  UserRound,
  Home,
  ClipboardCheck,
} from 'lucide-react';

const STEPS = [
  { step: 1, label: 'Basics', helper: 'Type, area & price', icon: Home },
  { step: 2, label: 'Location', helper: 'Address & map pin', icon: MapPin },
  { step: 3, label: 'Contact', helper: 'Seller details', icon: UserRound },
  { step: 4, label: 'Records', helper: 'Reference details', icon: FileCheck2 },
  { step: 5, label: 'Photos', helper: 'Photos & video', icon: Camera },
  { step: 6, label: 'Documents', helper: 'Optional documents', icon: ShieldCheck },
  { step: 7, label: 'Review', helper: 'Check & submit', icon: ClipboardCheck },
];

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
    progressPercent,
    existingPropertyId,
    isUpdateSuccess,
    pageLoading,
    requireGoogleLogin,
    requirePhoneOtp,
    phoneInput,
    otpSent,
    otpCode,
    otpLoading,
    otpMessage,
    testOtpNotice,
    termsAccepted,
    isUploadingImage,
    isUploadingDoc,
    transactionType,
    title,
    description,
    landType,
    authoritativeFees,
    monthlyRent,
    address,
    city,
    state: propertyState,
    pincode,
    sellerName,
    sellerPhone,
    sellerEmail,
    images,
    video,
    documents,
    governmentRegistrationId,
    selectedAmenities,
    landmarks,
  } = state;

  const {
    setCurrentStep,
    setAuthModalOpen,
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
  } = actions;

  if (pageLoading) {
    return <SellPageSkeleton />;
  }

  if (requireGoogleLogin && !currentUser) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <Navbar />
        <main className="flex-1 flex items-center">
          <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-12">
            <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8 items-center">
              <div>
                <p className="text-xs font-bold text-[#c75e0a]">
                  Post a property
                </p>
                <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950">
                  Create a clear listing in a few guided steps.
                </h1>
                <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-xl leading-relaxed">
                  Add the essentials first, save a draft anytime, then submit for platform review. Your listing stays editable from the seller dashboard.
                </p>

                <div className="mt-7 grid sm:grid-cols-3 gap-3 max-w-2xl">
                  {[
                    ['Simple flow', 'Only relevant fields are shown for the selected property type.'],
                    ['Save & resume', 'Come back later without starting over.'],
                    ['Quality guidance', 'See what to improve before you submit.'],
                  ].map(([heading, helper]) => (
                    <div key={heading} className="rounded-xl border border-slate-200 bg-white p-4">
                      <p className="text-sm font-extrabold text-slate-900">{heading}</p>
                      <p className="mt-1 text-[11px] leading-relaxed text-slate-500">{helper}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-sm">
                <div className="w-11 h-11 rounded-xl bg-[#fff1dc] text-[#c75e0a] flex items-center justify-center">
                  <Compass className="w-5 h-5" />
                </div>

                <h2 className="mt-5 text-xl font-extrabold text-slate-950">
                  Sign in to start your listing
                </h2>
                <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                  We use your account to save drafts, protect seller contact details and manage enquiries.
                </p>

                <button
                  type="button"
                  onClick={() => setAuthModalOpen(true)}
                  className="mt-6 w-full py-3.5 px-4 rounded-lg bg-slate-950 hover:bg-slate-800 text-white font-bold text-sm flex items-center justify-center gap-3 transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 0 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  Continue with Google
                </button>

                <div className="mt-4 flex items-start gap-2 text-[11px] text-slate-500">
                  <ShieldCheck className="w-4 h-4 text-[#c75e0a] shrink-0 mt-0.5" />
                  <span>No publishing payment is required to submit a listing for review.</span>
                </div>
              </div>
            </div>
          </div>
        </main>

        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          title="Sign in to list your property"
          description="Sign in with Google to save drafts, submit listings and manage buyer or tenant enquiries."
        />
        <Footer />
      </div>
    );
  }

  if (requirePhoneOtp && currentUser && !currentUser.isPhoneVerified) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <Navbar />
        <main className="flex-1 flex items-center">
          <div className="w-full max-w-md mx-auto px-4 py-12">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-sm">
              <div className="w-11 h-11 rounded-xl bg-[#fff1dc] text-[#c75e0a] flex items-center justify-center">
                <Phone className="w-5 h-5" />
              </div>

              <h2 className="mt-5 text-xl font-extrabold text-slate-950">
                Verify your mobile number
              </h2>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                One-time phone verification helps reduce spam listings and ensures enquiries reach the correct seller.
              </p>

              {otpMessage && (
                <div
                  className={`mt-5 p-3 rounded-lg text-xs font-medium flex items-start gap-2 ${
                    otpMessage.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {otpMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{otpMessage.text}</span>
                </div>
              )}

              {testOtpNotice && (
                <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
                  Development OTP: <span className="font-mono font-black">{testOtpNotice}</span>
                </div>
              )}

              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Mobile number
                  </label>
                  <div className="flex gap-2">
                    <div className="flex items-center px-3 rounded-lg bg-slate-100 border border-slate-200 text-xs font-bold text-slate-600">
                      +91
                    </div>
                    <input
                      type="tel"
                      maxLength={10}
                      placeholder="9876543210"
                      value={phoneInput}
                      onChange={(event) => setPhoneInput(event.target.value.replace(/\D/g, ''))}
                      disabled={otpSent || otpLoading}
                      className="min-w-0 flex-1 px-3.5 py-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933]"
                    />
                  </div>
                </div>

                {!otpSent ? (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={otpLoading || phoneInput.length < 10}
                    className="w-full py-3 rounded-lg bg-[#FF9933] hover:bg-[#e9821f] text-white font-bold text-sm disabled:opacity-50"
                  >
                    {otpLoading ? 'Sending OTP...' : 'Send OTP'}
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Verification code
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="6-digit OTP"
                        value={otpCode}
                        onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, ''))}
                        className="w-full text-center tracking-[0.28em] text-lg font-mono px-3 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#fff1dc] focus:border-[#FF9933]"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={otpLoading || otpCode.length !== 6}
                      className="w-full py-3 rounded-lg bg-[#FF9933] hover:bg-[#e9821f] text-white font-bold text-sm disabled:opacity-50"
                    >
                      {otpLoading ? 'Verifying...' : 'Verify & continue'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setOtpSent(false);
                        setOtpCode('');
                      }}
                      className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-900"
                    >
                      Change mobile number
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const salePriceValid = Number(authoritativeFees.pricePerYard || 0) > 0;
  const monthlyAmount = Number(String(monthlyRent).replace(/,/g, '')) || 0;

  const qualityPoints =
    (transactionType && landType ? 10 : 0) +
    (title.trim().length >= 10 ? 10 : 0) +
    (description.trim().length >= 80 ? 10 : 0) +
    (authoritativeFees.landAreaYards > 0 ? 10 : 0) +
    (transactionType === 'SALE' ? (salePriceValid ? 10 : 0) : (monthlyAmount > 0 ? 10 : 0)) +
    (address && city && propertyState && pincode ? 15 : 0) +
    (sellerName && (sellerPhone || phoneInput) && sellerEmail ? 10 : 0) +
    (images.length >= 5 ? 15 : images.length >= 1 ? 8 : 0) +
    (video ? 4 : 0) +
    (governmentRegistrationId || documents.length > 0 ? 3 : 0) +
    (selectedAmenities.length > 0 || landmarks.trim() ? 3 : 0);

  const qualityScore = Math.min(100, qualityPoints);

  const qualityTip =
    images.length === 0
      ? 'Add at least one clear property photo.'
      : images.length < 5
        ? 'Aim for 5 clear photos to make the listing easier to evaluate.'
        : description.trim().length < 80
          ? 'Add a more specific description with access, locality and key features.'
          : !governmentRegistrationId && documents.length === 0
            ? 'Optional records can improve buyer confidence.'
            : 'Your listing has strong coverage. Review the details before submitting.';

  const canSaveDraft =
    title.trim().length >= 6 &&
    authoritativeFees.landAreaYards >= 1;

  const activeStep = STEPS.find((item) => item.step === currentStep) || STEPS[0];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />

      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-9">
          <div className="mb-5 sm:mb-7 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold text-[#c75e0a]">
                {existingPropertyId ? 'Continue listing' : 'Post property'}
              </p>
              <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">
                {existingPropertyId ? 'Complete your property listing' : 'List your property'}
              </h1>
              <p className="mt-1.5 text-sm text-slate-500">
                Complete the essentials first. Optional details can be added later.
              </p>
            </div>

            {draftSavedTime && (
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="w-4 h-4" />
                Saved at {draftSavedTime}
              </div>
            )}
          </div>

          <div className="lg:hidden mb-4 rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Step {currentStep} of {STEPS.length}
                </p>
                <p className="text-sm font-extrabold text-slate-900 mt-0.5">
                  {activeStep.label}
                </p>
              </div>
              <span className="text-xs font-bold text-[#c75e0a]">
                {Math.round(progressPercent)}%
              </span>
            </div>
            <div className="mt-3 h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-[#FF9933] transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="grid lg:grid-cols-[230px_minmax(0,1fr)] gap-5 lg:gap-7 items-start">
            <aside className="hidden lg:block sticky top-24 space-y-4">
              <nav className="rounded-xl border border-slate-200 bg-white p-2">
                {STEPS.map(({ step, label, helper, icon: Icon }) => {
                  const active = currentStep === step;
                  const completed = currentStep > step;
                  const clickable = step <= currentStep;

                  return (
                    <button
                      key={step}
                      type="button"
                      disabled={!clickable}
                      onClick={() => {
                        if (!clickable) return;
                        setCurrentStep(step);
                        syncStepToUrl(step);
                      }}
                      className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                        active
                          ? 'bg-[#fff8ef] text-[#8f4308]'
                          : completed
                            ? 'text-slate-800 hover:bg-slate-50'
                            : 'text-slate-400'
                      }`}
                    >
                      <span
                        className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${
                          active
                            ? 'border-[#FF9933] bg-white'
                            : completed
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : 'border-slate-200 bg-slate-50'
                        }`}
                      >
                        {completed ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <Icon className="w-4 h-4" />
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-xs font-extrabold">{label}</span>
                        <span className="block text-[10px] mt-0.5 opacity-70">{helper}</span>
                      </span>
                    </button>
                  );
                })}
              </nav>

              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-extrabold text-slate-900">
                    Listing quality
                  </span>
                  <span className="text-xs font-black text-[#c75e0a]">
                    {qualityScore}%
                  </span>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-[#FF9933] transition-all duration-300"
                    style={{ width: `${qualityScore}%` }}
                  />
                </div>
                <p className="mt-3 text-[10px] leading-relaxed text-slate-500">
                  {qualityTip}
                </p>
              </div>
            </aside>

            <div className="min-w-0">
              {errorMessage && (
                <div className="mb-4 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
                  <div className="text-xs leading-relaxed">
                    <p className="font-bold mb-0.5">Please check this step</p>
                    <p>{errorMessage}</p>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
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
                  />
                )}

                {draftSavedMessage && (
                  <div className="mx-5 sm:mx-7 mb-4 rounded-lg bg-emerald-50 border border-emerald-200 p-3.5">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs font-bold text-emerald-900">Draft saved</p>
                        <p className="text-[11px] text-emerald-800 mt-0.5 leading-relaxed">
                          {draftSavedMessage}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setDraftSavedMessage(null)}
                        className="text-[11px] font-semibold text-emerald-700"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                )}

                <div className="sticky bottom-0 z-20 px-5 sm:px-7 py-4 border-t border-slate-200 bg-white/95 backdrop-blur flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={
                      currentStep === 1
                        ? () => router.push('/dashboard/seller')
                        : handlePrev
                    }
                    disabled={isSubmitting || isSavingDraft}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-50"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    {currentStep === 1 ? 'Exit' : 'Back'}
                  </button>

                  <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                    <button
                      type="button"
                      onClick={handleSaveDraft}
                      disabled={
                        !canSaveDraft ||
                        isSubmitting ||
                        isSavingDraft ||
                        isUploadingImage ||
                        isUploadingDoc
                      }
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold disabled:opacity-40"
                      title={!canSaveDraft ? 'Add a title and valid area first' : 'Save this listing as a draft'}
                    >
                      {isSavingDraft ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : draftSaveSuccess ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      {isSavingDraft ? 'Saving...' : draftSaveSuccess ? 'Saved' : 'Save draft'}
                    </button>

                    {currentStep < 7 ? (
                      <button
                        type="button"
                        onClick={handleNext}
                        disabled={isSubmitting || isSavingDraft || isUploadingImage || isUploadingDoc}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#FF9933] hover:bg-[#e9821f] text-white text-xs font-bold disabled:opacity-50"
                      >
                        Continue
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    ) : (
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
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#FF9933] hover:bg-[#e9821f] text-white text-xs font-bold disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                        {isSubmitting
                          ? 'Submitting...'
                          : isUpdateSuccess
                            ? 'Submitted'
                            : existingPropertyId
                              ? 'Save & submit for review'
                              : 'Submit listing for review'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="lg:hidden mt-4 rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-900">
                    Listing quality
                  </span>
                  <span className="text-xs font-black text-[#c75e0a]">
                    {qualityScore}%
                  </span>
                </div>
                <p className="mt-2 text-[10px] text-slate-500 leading-relaxed">
                  {qualityTip}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        title="Sign in to list your property"
        description="Sign in with Google to create and manage your property listing."
      />
    </div>
  );
}

function SellPageSkeleton() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="h-8 w-72 rounded-lg bg-slate-200 animate-pulse" />
          <div className="h-4 w-96 max-w-full mt-3 rounded bg-slate-200 animate-pulse" />
          <div className="mt-8 grid lg:grid-cols-[230px_minmax(0,1fr)] gap-7">
            <div className="hidden lg:block h-96 rounded-xl bg-slate-200 animate-pulse" />
            <div className="h-[620px] rounded-xl bg-white border border-slate-200 animate-pulse" />
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
