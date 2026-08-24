'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { GoogleMapPicker } from '@/components/maps/GoogleMapPicker';
import { RazorpayCheckoutModal } from '@/components/payments/RazorpayCheckoutModal';
import { AuthModal } from '@/components/auth/AuthModal';
import { LAND_TYPES, INDIAN_STATES } from '@/config/constants';
import { LandType, IProperty } from '@/types/property';
import { SellerType, IUser } from '@/types/user';
import {
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Upload,
  FileText,
  CreditCard,
  Building,
  MapPin,
  Lock,
  AlertCircle,
  HelpCircle,
  IndianRupee,
  Eye,
  EyeOff,
  Trash2,
  Calendar,
  Sparkles,
  Phone,
  Compass,
  Check,
} from 'lucide-react';

interface UploadedImagePreview {
  secureUrl: string;
  isPrimary: boolean;
  objectKey: string;
  fileName: string;
}

interface UploadedDocPreview {
  documentType: 'TITLE_DEED' | 'KHATA_7_12_CERTIFICATE' | 'ENCUMBRANCE_CERTIFICATE' | 'TAX_RECEIPT' | 'GOVT_SURVEY_RECORD' | 'POA_OR_OTHER';
  fileName: string;
  objectKey: string;
  size: number;
}

function SellPageForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const propertyIdParam = searchParams.get('propertyId') || searchParams.get('edit');

  const [currentUser, setCurrentUser] = useState<Partial<IUser> | null>(null);
  const [existingPropertyId, setExistingPropertyId] = useState<string | null>(null);

  // Settings & Fee State
  const [requireGoogleLogin, setRequireGoogleLogin] = useState<boolean>(true);
  const [requirePhoneOtp, setRequirePhoneOtp] = useState<boolean>(true);
  const [listingFeeAmount, setListingFeeAmount] = useState<number>(10);
  const [listingDurationDays, setListingDurationDays] = useState<number>(30);
  const [pageLoading, setPageLoading] = useState<boolean>(true);

  // Auth & Phone Verification State
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [phoneInput, setPhoneInput] = useState<string>('');
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [otpCode, setOtpCode] = useState<string>('');
  const [otpLoading, setOtpLoading] = useState<boolean>(false);
  const [otpMessage, setOtpMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [testOtpNotice, setTestOtpNotice] = useState<string | null>(null);

  // Wizard Step State
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Step 1: Basic Land Specs & Pricing
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [landAreaYards, setLandAreaYards] = useState<number>(300);
  const [pricePerYard, setPricePerYard] = useState<number>(25000);
  const [priceNegotiable, setPriceNegotiable] = useState<boolean>(true);
  const [landType, setLandType] = useState<LandType>('RESIDENTIAL_PLOT');
  const [roadAccess, setRoadAccess] = useState<string>('30_FT_PLUS');
  const [landmarks, setLandmarks] = useState<string>('');

  // Step 2: Location & Maps
  const [googleMapsShareLink, setGoogleMapsShareLink] = useState<string>('');
  const [latitude, setLatitude] = useState<number>(17.4123);
  const [longitude, setLongitude] = useState<number>(78.3512);
  const [address, setAddress] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [state, setState] = useState<string>('Telangana');
  const [pincode, setPincode] = useState<string>('');
  const [approximateLocation, setApproximateLocation] = useState<boolean>(false);

  // Step 3: Seller Profile
  const [sellerName, setSellerName] = useState<string>('');
  const [sellerPhone, setSellerPhone] = useState<string>('');
  const [sellerEmail, setSellerEmail] = useState<string>('');
  const [sellerType, setSellerType] = useState<SellerType>('INDIVIDUAL');
  const [sellerAddress, setSellerAddress] = useState<string>('');

  // Step 4: Optional Government Registration ID
  const [governmentRegistrationId, setGovernmentRegistrationId] = useState<string>('');
  const [idVerifiedDeclared, setIdVerifiedDeclared] = useState<boolean>(true);

  // Step 5: Images
  const [images, setImages] = useState<UploadedImagePreview[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Step 6: Documents
  const [documents, setDocuments] = useState<UploadedDocPreview[]>([]);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  // Step 7: Final Review & Acceptance
  const [termsAccepted, setTermsAccepted] = useState<boolean>(true);
  const [createdProperty, setCreatedProperty] = useState<IProperty | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState<boolean>(false);

  // Load session, platform settings, and existing draft if propertyIdParam exists
  useEffect(() => {
    async function init() {
      try {
        const [sessionRes, settingsRes] = await Promise.all([
          fetch('/api/auth/session').catch(() => null),
          fetch('/api/settings/public').catch(() => null),
        ]);

        if (settingsRes?.ok) {
          const s = await settingsRes.json();
          if (typeof s.requireGoogleLogin === 'boolean') setRequireGoogleLogin(s.requireGoogleLogin);
          if (typeof s.requirePhoneOtp === 'boolean') setRequirePhoneOtp(s.requirePhoneOtp);
          if (typeof s.listingFeeAmount === 'number') setListingFeeAmount(s.listingFeeAmount);
          if (typeof s.listingFeeDurationDays === 'number') setListingDurationDays(s.listingFeeDurationDays);
        }

        if (sessionRes?.ok) {
          const data = await sessionRes.json();
          if (data?.session?.user) {
            const u = data.session.user;
            setCurrentUser(u);
            setSellerName(u.name || '');
            setSellerEmail(u.email || '');
            if (u.phone) {
              setSellerPhone(u.phone);
              setPhoneInput(u.phone);
            }
          }
        }

        // If resume/edit mode is requested via query param
        if (propertyIdParam) {
          const propRes = await fetch(`/api/properties/${propertyIdParam}`).catch(() => null);
          if (propRes?.ok) {
            const pData = await propRes.json();
            if (pData?.property && (pData?.isOwner || pData?.isAdmin)) {
              const p = pData.property;
              setExistingPropertyId(p._id);
              if (p.title) setTitle(p.title);
              if (p.description) setDescription(p.description);
              if (p.landAreaYards) setLandAreaYards(p.landAreaYards);
              if (p.pricePerYard) setPricePerYard(p.pricePerYard);
              if (typeof p.priceNegotiable === 'boolean') setPriceNegotiable(p.priceNegotiable);
              if (p.landType) setLandType(p.landType);
              if (p.roadAccess) setRoadAccess(p.roadAccess);
              if (Array.isArray(p.nearbyLandmarks)) setLandmarks(p.nearbyLandmarks.join(', '));
              if (p.location) {
                if (p.location.address) setAddress(p.location.address);
                if (p.location.city) setCity(p.location.city);
                if (p.location.state) setState(p.location.state);
                if (p.location.pincode) setPincode(p.location.pincode);
              }
              if (p.googleMapsShareLink) setGoogleMapsShareLink(p.googleMapsShareLink);
              if (typeof p.latitude === 'number') setLatitude(p.latitude);
              if (typeof p.longitude === 'number') setLongitude(p.longitude);
              if (typeof p.approximateLocation === 'boolean') setApproximateLocation(p.approximateLocation);
              if (p.governmentRegistrationId) setGovernmentRegistrationId(p.governmentRegistrationId);
              if (p.sellerType) setSellerType(p.sellerType);
              if (Array.isArray(p.images) && p.images.length > 0) {
                setImages(
                  p.images.map((img: any) => ({
                    secureUrl: img.secureUrl,
                    isPrimary: img.isPrimary,
                    objectKey: img.objectKey,
                    fileName: img.fileName || 'image.jpg',
                  }))
                );
              }
              if (Array.isArray(p.documents) && p.documents.length > 0) {
                setDocuments(
                  p.documents.map((doc: any) => ({
                    documentType: doc.documentType,
                    fileName: doc.fileName || 'document.pdf',
                    objectKey: doc.objectKey,
                    size: doc.size || 0,
                  }))
                );
              }
            }
          }
        }
      } catch (err) {
        console.error('Init error on sell page:', err);
      } finally {
        setPageLoading(false);
      }
    }
    init();
  }, [propertyIdParam]);

  // Handle Send OTP
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

  // Handle Verify OTP
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
        setCurrentUser((prev) => (prev ? { ...prev, phone: data.phone, isPhoneVerified: true } : null));
        setSellerPhone(data.phone);
        setOtpSent(false);
        setOtpCode('');
        setTestOtpNotice(null);
      } else {
        setOtpMessage({ type: 'error', text: data.message || 'Invalid OTP. Please check and try again.' });
      }
    } catch {
      setOtpMessage({ type: 'error', text: 'Verification error. Please try again.' });
    } finally {
      setOtpLoading(false);
    }
  };

  // Authoritative calculations
  const totalValuation = landAreaYards * pricePerYard;
  const monthlyListingFee = listingFeeAmount;

  // Step validation
  const validateStep = (step: number): boolean => {
    setErrorMessage('');
    if (step === 1) {
      if (!title.trim() || title.length < 6) {
        setErrorMessage('Property title must be at least 6 characters long.');
        return false;
      }
      if (landAreaYards <= 0) {
        setErrorMessage('Land area must be greater than zero.');
        return false;
      }
      if (pricePerYard <= 0) {
        setErrorMessage('Price per sq. yard must be greater than zero.');
        return false;
      }
    }
    if (step === 2) {
      if (!address.trim() || !city.trim() || !state.trim() || !pincode.trim()) {
        setErrorMessage('Please complete all mandatory location fields (Address, City, State, Pincode).');
        return false;
      }
    }
    if (step === 3) {
      if (!sellerName.trim() || !sellerPhone.trim() || !sellerEmail.trim()) {
        setErrorMessage('Please provide your full seller profile information.');
        return false;
      }
    }
    if (step === 5) {
      if (images.length === 0) {
        setErrorMessage('Please upload at least 1 photo of the land parcel.');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 7));
    }
  };

  const handlePrev = () => {
    setErrorMessage('');
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // Image Upload handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingImage(true);
    setErrorMessage('');
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('isPrivate', 'false');
        formData.append('folder', 'properties');

        const res = await fetch('/api/uploads/direct', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        if (res.ok && data.file) {
          setImages((prev) => [
            ...prev,
            {
              secureUrl: data.file.secureUrl,
              isPrimary: prev.length === 0,
              objectKey: data.file.objectKey,
              fileName: file.name,
            },
          ]);
        } else {
          setErrorMessage(data.error || 'Failed to upload image');
        }
      }
    } catch (err) {
      console.error('Image upload failed:', err);
      setErrorMessage('Upload error occurred');
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Document Upload handler
  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingDoc(true);
    setErrorMessage('');
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('isPrivate', 'true');
        formData.append('folder', 'properties');

        const res = await fetch('/api/uploads/direct', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        if (res.ok && data.file) {
          setDocuments((prev) => [
            ...prev,
            {
              documentType: 'TITLE_DEED',
              fileName: file.name,
              objectKey: data.file.objectKey,
              size: file.size,
            },
          ]);
        } else {
          setErrorMessage(data.error || 'Failed to upload document');
        }
      }
    } catch (err) {
      console.error('Doc upload failed:', err);
      setErrorMessage('Document upload error occurred');
    } finally {
      setIsUploadingDoc(false);
    }
  };

  // Submit Listing Draft and open Payment Checkout
  const handleFinalSubmit = async () => {
    if (!termsAccepted) {
      setErrorMessage('You must accept the listing terms and publishing declaration.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const payload = {
        title,
        description,
        landAreaYards: Number(landAreaYards),
        pricePerYard: Number(pricePerYard),
        priceNegotiable,
        landType,
        roadAccess,
        nearbyLandmarks: landmarks
          ? landmarks.split(',').map((l) => l.trim()).filter(Boolean)
          : [],
        location: {
          address,
          city,
          state,
          pincode,
        },
        googleMapsShareLink,
        latitude,
        longitude,
        approximateLocation,
        governmentRegistrationId,
        sellerName,
        sellerPhone: (sellerPhone || phoneInput || '').replace(/^\+91/, '').replace(/\D/g, '').slice(-10),
        sellerEmail,
        sellerType,
        sellerDeclarationAccepted: Boolean(termsAccepted),
        images: images.map((img, idx) => ({
          objectKey: img.objectKey,
          secureUrl: img.secureUrl,
          fileName: img.fileName,
          mimeType: 'image/jpeg',
          size: 1024,
          isPrimary: img.isPrimary,
          sortOrder: idx,
        })),
        documents: documents.map((doc) => ({
          documentType: doc.documentType,
          objectKey: doc.objectKey,
          fileName: doc.fileName,
          mimeType: 'application/pdf',
          size: doc.size,
        })),
      };

      let res: Response;
      if (existingPropertyId) {
        res = await fetch(`/api/properties/${existingPropertyId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/properties', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        if (data.code === 'PHONE_VERIFICATION_REQUIRED') {
          setErrorMessage('Phone verification is required before listing. Please verify your phone number.');
        } else {
          throw new Error(data.error || 'Failed to submit listing draft');
        }
        setIsSubmitting(false);
        return;
      }

      const savedProp = data.property || (existingPropertyId ? { ...payload, _id: existingPropertyId } : null);
      setCreatedProperty(savedProp);
      setPaymentModalOpen(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error submitting listing';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <div className="max-w-4xl mx-auto py-20 px-4 text-center flex-1 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-700" />
        </div>
        <Footer />
      </div>
    );
  }

  // 1. Unauthenticated Gate
  if (requireGoogleLogin && !currentUser) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <Navbar />
        <div className="max-w-xl mx-auto px-4 py-20 flex-1 flex flex-col justify-center">
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xl text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
              <Compass className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Sign in to List Your Land
              </h1>
              <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
                LandTerra connects land owners directly with verified buyers across India with zero broker commissions. Sign in with Google to begin your listing.
              </p>
            </div>

            <button
              onClick={() => setAuthModalOpen(true)}
              className="w-full py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-3 transition-colors shadow-sm"
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
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
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

  // 2. Phone OTP Verification Gate (If Phone OTP is required and seller is not yet verified)
  if (requirePhoneOtp && currentUser && !currentUser.isPhoneVerified) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <Navbar />
        <div className="max-w-md mx-auto px-4 py-16 flex-1 flex flex-col justify-center">
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xl space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
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
                className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
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
                    onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, ''))}
                    disabled={otpSent || otpLoading}
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-emerald-600"
                  />
                  {!otpSent && (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={otpLoading || phoneInput.length < 10}
                      className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs disabled:opacity-50 transition-colors"
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
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      className="w-full text-center tracking-widest text-lg font-mono px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-emerald-600"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={otpLoading || otpCode.length !== 6}
                    className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-xs"
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
                      className="text-[11px] text-slate-500 hover:text-slate-800 underline font-medium"
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

  // 3. Main 7-Step Listing Creation Wizard
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />

      {/* Header Banner */}
      <div className="bg-slate-900 text-white py-10 border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-400 text-xs font-semibold mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Transparent Direct Marketplace</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">List Your Land Parcel</h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                Published directly to serious buyers across India. Rate: ₹10 / sq. yard per month.
              </p>
            </div>

            {/* Verified Seller Pill */}
            {currentUser && (
              <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-3 text-xs flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs">
                  {currentUser.name?.charAt(0) || 'U'}
                </div>
                <div>
                  <div className="font-bold text-white leading-tight">{currentUser.name}</div>
                  <div className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{currentUser.phone ? `${currentUser.phone} (Verified)` : 'Verified Profile'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Stepper Tabs */}
          <div className="mt-8 grid grid-cols-7 gap-1 sm:gap-2">
            {[
              'Specs & Price',
              'Location',
              'Seller Info',
              'Govt ID',
              'Photos',
              'Deed (Optional)',
              'Publish',
            ].map((stepName, index) => {
              const stepNum = index + 1;
              const isCompleted = stepNum < currentStep;
              const isCurrent = stepNum === currentStep;

              return (
                <div
                  key={index}
                  className={`text-center pb-2 border-b-2 transition-all ${
                    isCurrent
                      ? 'border-emerald-400 text-emerald-400 font-bold'
                      : isCompleted
                      ? 'border-emerald-600 text-slate-300'
                      : 'border-slate-800 text-slate-600'
                  }`}
                >
                  <div className="text-[10px] sm:text-xs">Step {stepNum}</div>
                  <div className="text-[9px] sm:text-[11px] truncate hidden sm:block">{stepName}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Wizard Form Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 w-full flex-1">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: Specs & Price */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <h2 className="text-lg font-bold text-slate-900">1. Land Specifications & Pricing</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Property Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 350 Sq.Yd Gated Community Villa Plot in Kokapet"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Land Classification <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={landType}
                    onChange={(e) => setLandType(e.target.value as LandType)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-emerald-600"
                  >
                    {LAND_TYPES.map((lt) => (
                      <option key={lt.value} value={lt.value}>
                        {lt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Land Area (in Square Yards) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={landAreaYards || ''}
                      onChange={(e) => setLandAreaYards(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:outline-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Price per Sq. Yard (₹) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={pricePerYard || ''}
                      onChange={(e) => setPricePerYard(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:outline-emerald-600"
                    />
                  </div>
                </div>

                {/* Live Calculation Preview */}
                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-xs space-y-2">
                  <div className="flex justify-between text-slate-700">
                    <span>Total Property Valuation:</span>
                    <span className="font-bold text-slate-900 text-sm">
                      ₹{totalValuation.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between text-emerald-900 font-semibold pt-1 border-t border-emerald-200/60">
                    <span>{listingDurationDays}-Day Listing Fee:</span>
                    <span className="font-extrabold text-emerald-800 text-sm">
                      ₹{listingFeeAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="neg"
                    checked={priceNegotiable}
                    onChange={(e) => setPriceNegotiable(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="neg" className="text-xs font-semibold text-slate-700">
                    Price is negotiable with serious buyers
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Detailed Property Description <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Describe road frontage, layout approvals, water/borewell, fencing, zoning, proximity to highways..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-emerald-600"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Location & Maps */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <h2 className="text-lg font-bold text-slate-900">2. Location & Geographic Coordinates</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Full Site Address / Plot Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Plot 42, Golden Heights Layout, Sy No. 88"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-emerald-600"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      City <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Hyderabad"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      State <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-emerald-600"
                    >
                      {INDIAN_STATES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Pincode <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="500075"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-emerald-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Google Maps Share Link (Recommended)
                  </label>
                  <input
                    type="url"
                    placeholder="https://maps.app.goo.gl/Y7zMajT3MBD2a2fG7"
                    value={googleMapsShareLink}
                    onChange={(e) => setGoogleMapsShareLink(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-emerald-600"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Tip: Open Google Maps on your phone/browser, long press on your land parcel, tap <strong>Share</strong>, and paste the link here.
                  </p>
                </div>

                {/* Map Picker */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Pin Exact Land Coordinates
                  </label>
                  <GoogleMapPicker
                    latitude={latitude}
                    longitude={longitude}
                    address={address}
                    city={city}
                    state={state}
                    pincode={pincode}
                    approximateLocation={approximateLocation}
                    onChange={(data) => {
                      setLatitude(data.latitude);
                      setLongitude(data.longitude);
                      if (data.address) setAddress(data.address);
                      if (data.city) setCity(data.city);
                      if (data.state) setState(data.state);
                      if (data.pincode) setPincode(data.pincode);
                      setApproximateLocation(data.approximateLocation);
                    }}
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="approx"
                    checked={approximateLocation}
                    onChange={(e) => setApproximateLocation(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="approx" className="text-xs font-medium text-slate-700">
                    Show approximate 500m radius to public (Exact coordinates protected until buyer inquiry)
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Seller Profile */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <h2 className="text-lg font-bold text-slate-900">3. Verified Seller Identity</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Full Legal Name / Company Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={sellerName}
                    onChange={(e) => setSellerName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-emerald-600"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Contact Mobile Number (Verified) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={sellerPhone}
                      readOnly
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-xs font-bold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={sellerEmail}
                      onChange={(e) => setSellerEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-emerald-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Seller Ownership Type
                  </label>
                  <select
                    value={sellerType}
                    onChange={(e) => setSellerType(e.target.value as SellerType)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-emerald-600"
                  >
                    <option value="INDIVIDUAL">Individual Property Owner</option>
                    <option value="COMPANY">Builder / Corporate Entity</option>
                    <option value="AGENT">Direct Authorized Agent</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Govt Registration ID */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <h2 className="text-lg font-bold text-slate-900">4. Government Land Registration ID</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Survey / Khata / Patta / RERA ID Number (Optional but recommended)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. TS-RR-KOKAPET-2024-8891 or Survey No. 44/2"
                    value={governmentRegistrationId}
                    onChange={(e) => setGovernmentRegistrationId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold focus:outline-emerald-600"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Providing a valid government registration ID fast-tracks your Verified Badge approval.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Images */}
          {currentStep === 5 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">5. Land Parcel Photos</h2>
                  <p className="text-xs text-slate-500">Upload clear ground photos of the land and approach road.</p>
                </div>
                <label className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs cursor-pointer inline-flex items-center gap-1.5 transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isUploadingImage ? 'Uploading...' : 'Add Photos'}</span>
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageUpload}
                    disabled={isUploadingImage}
                    className="hidden"
                  />
                </label>
              </div>

              {images.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {images.map((img, idx) => (
                    <div
                      key={idx}
                      className="relative aspect-4/3 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 group"
                    >
                      <Image
                        src={img.secureUrl}
                        alt="Uploaded preview"
                        fill
                        className="object-cover"
                        referrerPolicy="no-referrer"
                      />
                      {img.isPrimary && (
                        <div className="absolute top-2 left-2 bg-emerald-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                          Primary Photo
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => setImages((prev) => prev.filter((_, i) => i !== idx))}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border-2 border-dashed border-slate-300 rounded-3xl p-10 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
                    <Upload className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-slate-600">No photos uploaded yet. At least 1 photo required.</p>
                </div>
              )}
            </div>
          )}

          {/* STEP 6: Documents */}
          {currentStep === 6 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">6. Verification Documents (Confidential)</h2>
                  <p className="text-xs text-slate-500">
                    Uploaded sale deeds and 7/12 extracts are encrypted and only accessible by admin verifiers.
                  </p>
                </div>
                <label className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer inline-flex items-center gap-1.5 transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isUploadingDoc ? 'Uploading...' : 'Upload PDF'}</span>
                  <input
                    type="file"
                    multiple
                    accept="application/pdf"
                    onChange={handleDocUpload}
                    disabled={isUploadingDoc}
                    className="hidden"
                  />
                </label>
              </div>

              {documents.length > 0 ? (
                <div className="space-y-2">
                  {documents.map((doc, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-emerald-700" />
                        <div>
                          <span className="font-bold text-slate-900 block">{doc.fileName}</span>
                          <span className="text-[10px] text-slate-500">
                            {doc.documentType.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setDocuments((prev) => prev.filter((_, i) => i !== idx))}
                        className="text-rose-600 hover:text-rose-700 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                  Optional: You may skip document upload now and provide it later during admin verification.
                </div>
              )}
            </div>
          )}

          {/* STEP 7: Final Review & Publishing Fee */}
          {currentStep === 7 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <h2 className="text-lg font-bold text-slate-900">7. Final Summary & Acceptance</h2>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Title:</span>
                  <span className="font-bold text-slate-900">{title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Location:</span>
                  <span className="font-semibold text-slate-800">
                    {city}, {state}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Land Area:</span>
                  <span className="font-bold text-slate-900">{landAreaYards.toLocaleString('en-IN')} sq.yds</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Price:</span>
                  <span className="font-bold text-slate-900">₹{totalValuation.toLocaleString('en-IN')}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                  <span className="font-bold text-slate-900">{listingDurationDays}-Day Listing Fee:</span>
                  <span className="text-base font-extrabold text-emerald-800">
                    ₹{listingFeeAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 text-[11px] text-emerald-950 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Listing Guarantee:</strong> Zero broker commissions. 100% direct buyer leads routed straight to your account.
                </p>
              </div>

              <div className="flex items-start gap-2 pt-2">
                <input
                  type="checkbox"
                  id="terms"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 mt-0.5"
                />
                <label htmlFor="terms" className="text-xs text-slate-700 leading-snug">
                  I declare that I am the legal owner or authorized representative for this parcel and accept the LandTerra listing terms.
                </label>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handlePrev}
                className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs flex items-center gap-1.5 hover:bg-slate-50 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            {currentStep < 7 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={isSubmitting || !termsAccepted}
                className="px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-2 transition-colors shadow-md disabled:opacity-50 cursor-pointer"
              >
                <CreditCard className="w-4 h-4" />
                <span>{isSubmitting ? 'Creating Draft...' : `Proceed to Pay ₹${listingFeeAmount.toLocaleString('en-IN')}`}</span>
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Razorpay Payment Modal */}
      {createdProperty && (
        <RazorpayCheckoutModal
          property={createdProperty}
          isOpen={paymentModalOpen}
          feeAmount={listingFeeAmount}
          onClose={() => {
            setPaymentModalOpen(false);
            router.push('/dashboard/seller');
          }}
          onSuccess={() => {
            setPaymentModalOpen(false);
            router.push('/dashboard/seller');
          }}
        />
      )}

      <Footer />
    </div>
  );
}

export default function SellPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col bg-slate-50">
          <Navbar />
          <div className="max-w-4xl mx-auto py-20 px-4 text-center flex-1 flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-700" />
          </div>
          <Footer />
        </div>
      }
    >
      <SellPageForm />
    </Suspense>
  );
}
