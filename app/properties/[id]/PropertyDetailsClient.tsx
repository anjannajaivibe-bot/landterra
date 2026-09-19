'use client';

import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Edit,
  ExternalLink,
  Flag,
  Heart,
  LandPlot,
  LayoutDashboard,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Share2,
  ShieldCheck,
  Tag,
  UserRound,
} from 'lucide-react';

import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { AuthModal } from '@/components/auth/AuthModal';
import { InquiryModal } from '@/components/properties/InquiryModal';
import { ReportModal } from '@/components/properties/ReportModal';
import { CallSellerModal } from '@/components/properties/CallSellerModal';
import { GalleryCarousel } from '@/components/properties/GalleryCarousel';
import { LocationSection } from '@/components/properties/LocationSection';
import { PropertySpecifications } from '@/components/properties/PropertySpecifications';
import { DueDiligenceCard } from '@/components/properties/DueDiligenceCard';

import { IProperty } from '@/types/property';

/* ================================================================
   HELPERS
================================================================ */

function formatIndianCurrency(value: number) {
  if (!Number.isFinite(value)) return 'Price on request';
  return `₹${value.toLocaleString('en-IN')}`;
}

function formatCompactCurrency(value: number) {
  if (!Number.isFinite(value)) return 'Price on request';

  if (value >= 10000000) {
    const cr = value / 10000000;
    return `₹${cr.toFixed(cr >= 10 ? 1 : 2)} Cr`;
  }

  if (value >= 100000) {
    const lk = value / 100000;
    return `₹${lk.toFixed(lk >= 10 ? 1 : 2)} Lakh`;
  }

  return formatIndianCurrency(value);
}

function formatArea(value: number) {
  if (!Number.isFinite(value)) return 'Area on request';
  return `${value.toLocaleString('en-IN')} sq. yards`;
}

function formatLandType(value?: string) {
  if (!value) return 'Land';
  return value.replace(/_/g, ' ');
}

function formatDate(value?: string | Date) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 line-clamp-2 text-xs font-bold text-slate-800">{value}</p>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1.5 text-sm font-black text-slate-900">{value}</p>
    </div>
  );
}

/* ================================================================
   MAIN PAGE CONTENT
================================================================ */

function PropertyDetailsContent({
  initialProperty,
}: {
  initialProperty?: IProperty | null;
}) {
  const params = useParams();
  const router = useRouter();

  const propertyId =
    typeof params?.id === 'string'
      ? params.id
      : Array.isArray(params?.id)
        ? params.id[0]
        : '';

  const [property, setProperty] = useState<IProperty | null>(initialProperty || null);
  const [loading, setLoading] = useState(!initialProperty);
  const [error, setError] = useState('');

  const [user, setUser] = useState<any>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [showProtectedInformation, setShowProtectedInformation] = useState(false);

  const [favorite, setFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  const [shareMessage, setShareMessage] = useState('');
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const shareMenuRef = useRef<HTMLDivElement>(null);

  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reloadCount, setReloadCount] = useState(0);
  const [isListingOwner, setIsListingOwner] = useState(false);

  /* Call Seller State */
  const [callModalOpen, setCallModalOpen] = useState(false);
  const [callLoading, setCallLoading] = useState(false);
  const [sellerCallData, setSellerCallData] = useState<{
    sellerName: string;
    sellerPhone: string;
    sellerEmail?: string;
  } | null>(null);
  const [callError, setCallError] = useState('');

  /* Load Session */
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const response = await fetch('/api/auth/session', { cache: 'no-store' });
        if (!response.ok) {
          if (!cancelled) setUser(null);
          return;
        }
        const data = await response.json();
        if (!cancelled) setUser(data?.session?.user || null);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setSessionLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  /* Load Property (Hydrates or refetches if reload triggered) */
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      // If initialProperty is already provided via SSR and no reload was requested, skip duplicate network call
      if (initialProperty && reloadCount === 0) {
        return;
      }

      if (!propertyId) {
        setLoading(false);
        setError('Invalid property listing.');
        return;
      }

      try {
        const response = await fetch(`/api/properties/${encodeURIComponent(propertyId)}`, {
          cache: 'no-store',
        });

        if (response.status === 404) {
          const errData = await response.json().catch(() => null);
          if (!cancelled) {
            setProperty(null);
            setError(
              errData?.error ||
              'This land listing could not be found or has not been published yet.',
            );
          }
          return;
        }

        if (!response.ok) {
          throw new Error('Unable to load this property.');
        }

        const data = await response.json();
        const loadedProperty = data?.data || data?.property || data;

        if (!loadedProperty?._id) {
          throw new Error('Invalid property response.');
        }

        if (cancelled) return;

        setProperty(loadedProperty);
        if (data?.isOwner !== undefined) {
          setIsListingOwner(Boolean(data.isOwner));
        }

        if (loadedProperty.isFavorite) {
          setFavorite(true);
        }
      } catch (err) {
        if (cancelled) return;
        console.error('Property loading error:', err);
        if (!initialProperty) {
          setProperty(null);
          setError('We could not load this property right now. Please try again.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [propertyId, reloadCount, initialProperty]);

  /* Sync Favorites */
  useEffect(() => {
    let cancelled = false;
    if (!user || !propertyId) return;

    fetch('/api/favorites')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.favorites && Array.isArray(data.favorites)) {
          setFavorite(data.favorites.includes(propertyId));
        }
      })
      .catch(() => { });

    return () => {
      cancelled = true;
    };
  }, [user, propertyId]);

  /* Close share menu on outside click */
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target as Node)) {
        setShareMenuOpen(false);
      }
    }
    if (shareMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [shareMenuOpen]);

  const toggleFavorite = async () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    if (!propertyId || favoriteLoading) return;

    setFavoriteLoading(true);
    const prev = favorite;
    setFavorite(!prev);

    try {
      const res = await fetch('/api/favorites', {
        method: prev ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId }),
      });
      if (!res.ok) setFavorite(prev);
    } catch {
      setFavorite(prev);
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
      setShareMenuOpen(false);
    }
  };

  const handleShareWhatsApp = () => {
    if (typeof window !== 'undefined' && property) {
      const text = `Check out this land listing on BhoomiMitra: ${property.title} - ${window.location.href}`;
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
      setShareMenuOpen(false);
    }
  };

  const handleShareTwitter = () => {
    if (typeof window !== 'undefined' && property) {
      const text = `Check out this land listing on BhoomiMitra: ${property.title}`;
      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.href)}`,
        '_blank',
      );
      setShareMenuOpen(false);
    }
  };

  const isOwner = useMemo(() => {
    if (isListingOwner) return true;
    if (!user || !property) return false;
    return (
      (property.sellerId && String(property.sellerId) === String(user.id)) ||
      (property.sellerEmail && property.sellerEmail.toLowerCase() === user.email?.toLowerCase())
    );
  }, [isListingOwner, user, property]);

  const isDraft = property?.listingStatus === 'DRAFT' || property?.listingStatus === 'PAYMENT_PENDING';

  const openInquiry = () => {
    if (!property) return;
    if (isOwner) {
      setShareMessage('You are the owner of this listing.');
      setTimeout(() => setShareMessage(''), 3000);
      return;
    }
    if (isDraft) {
      setShareMessage('Draft listings cannot receive inquiries until published.');
      setTimeout(() => setShareMessage(''), 4000);
      return;
    }
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    setInquiryOpen(true);
  };

  const initiateCallSeller = () => {
    if (!property) return;
    if (isOwner) {
      setShareMessage('You are the owner of this listing.');
      setTimeout(() => setShareMessage(''), 3000);
      return;
    }
    if (isDraft) {
      setShareMessage('Draft listings cannot receive calls until published.');
      setTimeout(() => setShareMessage(''), 4000);
      return;
    }
    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    setCallError('');
    setCallModalOpen(true);

    if (!sellerCallData?.sellerPhone) {
      void fetchSellerContact();
    }

    if (
      sellerCallData?.sellerPhone &&
      typeof window !== 'undefined' &&
      /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
    ) {
      window.location.href = `tel:${sellerCallData.sellerPhone}`;
    }
  };

  const fetchSellerContact = async () => {
    if (!property) return;

    setCallLoading(true);
    setCallError('');

    try {
      const response = await fetch(`/api/properties/${encodeURIComponent(property._id)}/call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: 'PHONE' }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Unable to retrieve seller contact or contact limit reached.');
      }

      const phone = data.sellerPhone || property.sellerPhone;
      if (!phone) {
        throw new Error('Seller contact phone number is not available for this listing.');
      }

      const contactDetails = {
        sellerName: data.sellerName || property.sellerName || 'Seller',
        sellerPhone: phone,
        sellerEmail: data.sellerEmail || property.sellerEmail,
      };

      setSellerCallData(contactDetails);

      if (typeof window !== 'undefined' && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)) {
        window.location.href = `tel:${contactDetails.sellerPhone}`;
      }
    } catch (err: unknown) {
      setCallError(err instanceof Error ? err.message : 'Failed to retrieve seller phone number');
    } finally {
      setCallLoading(false);
    }
  };

  const handleTrackWhatsApp = () => {
    if (!property?._id) return;
    fetch(`/api/properties/${encodeURIComponent(property._id)}/call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel: 'WHATSAPP' }),
    }).catch((err) => {
      console.warn('Failed to record WhatsApp lead audit:', err);
    });
  };

  const locationText = [
    property?.location?.city,
    property?.location?.district,
    property?.location?.state,
    property?.location?.pincode,
  ].filter(Boolean).join(', ');

  const publishedDate = useMemo(() => {
    return formatDate(property?.publishedAt || property?.createdAt);
  }, [property?.publishedAt, property?.createdAt]);


  /* Loading Skeleton */
  if (loading && !property) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <PropertyPageSkeleton />
        </main>
        <Footer />
      </div>
    );
  }

  /* Error / Not Found */
  if (!property) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <main className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center px-4 py-16 text-center">
          <div>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
              <LandPlot className="h-7 w-7 text-slate-400" />
            </div>
            <h1 className="mt-5 text-2xl font-black text-slate-900">Property not available</h1>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              {error ||
                'This listing may have been removed, sold, paused, or is no longer available.'}
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => setReloadCount((c) => c + 1)}
                className="rounded-xl bg-slate-950 px-5 py-3 text-xs font-bold text-white hover:bg-slate-800"
              >
                Try Again
              </button>
              <Link
                href="/buy"
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Find Other Land
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />

      {/* Breadcrumb */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 overflow-hidden text-[11px] text-slate-500">
            <Link href="/" className="shrink-0 hover:text-[#c75e0a]">
              Home
            </Link>
            <span>/</span>
            <Link href="/buy" className="shrink-0 hover:text-[#c75e0a]">
              Find Property
            </Link>
            <span>/</span>
            <span className="truncate font-semibold text-slate-700">{property.title}</span>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-6 pb-28 sm:px-6 lg:px-8 lg:py-8 lg:pb-12">
        {/* Back Link */}
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-5 inline-flex items-center gap-2 text-xs font-bold text-slate-500 transition-colors hover:text-[#c75e0a] cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to listings
        </button>

        {/* Private Draft Preview Banner */}
        {isDraft && (
          <div className="mb-6 rounded-2xl border-2 border-amber-300 bg-amber-50/95 p-4 sm:p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white font-black text-sm shadow-xs">
                  🔒
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-amber-200 px-2.5 py-0.5 text-[10px] font-black uppercase text-amber-900 tracking-wider">
                      Private Draft Preview
                    </span>
                    <span className="text-[11px] font-bold text-amber-800">
                      Not Visible to Public
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-amber-900/90 leading-relaxed max-w-2xl">
                    This listing is currently in <strong>Draft (Payment Pending)</strong>. Only you can view this preview.
                    Public buyers and search engines cannot find or view this page until you activate your listing subscription.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={`/sell?propertyId=${property._id}`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FF9933] px-5 py-2.5 text-xs font-black text-white hover:bg-[#f07d12] shadow-sm transition-all"
                >
                  <span>Pay ₹10 &amp; Publish Live</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Property Header */}
        <section className="mb-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">
                  {formatLandType(property.landType)}
                </span>

                {isDraft && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-100 px-2.5 py-1 text-[10px] font-black text-amber-900">
                    🔒 Private Draft Preview
                  </span>
                )}

                {property.priceNegotiable && (
                  <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700">
                    Price negotiable
                  </span>
                )}
              </div>

              <h1 className="max-w-4xl text-2xl font-black tracking-tight text-slate-950 sm:text-3xl lg:text-4xl">
                {property.title}
              </h1>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-[#FF9933]" />
                  {locationText || 'Location available in listing'}
                </span>

                {publishedDate && (
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5" />
                    Listed {publishedDate}
                  </span>
                )}
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex shrink-0 items-center gap-2">
              <div className="relative" ref={shareMenuRef}>
                <button
                  type="button"
                  onClick={() => setShareMenuOpen((o) => !o)}
                  className="flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <Share2 className="h-4 w-4" />
                  <span>Share</span>
                </button>

                {shareMenuOpen && (
                  <div className="absolute right-0 top-12 z-30 w-48 rounded-xl border border-slate-200 bg-white p-2 shadow-xl animate-in fade-in zoom-in-95 duration-100">
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 text-left cursor-pointer"
                    >
                      {copiedLink ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-[#FF9933]" />
                          <span className="text-[#c75e0a]">Link Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5 text-slate-400" />
                          <span>Copy Link</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleShareWhatsApp}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 text-left cursor-pointer"
                    >
                      <MessageSquare className="h-3.5 w-3.5 text-[#25D366]" />
                      <span>WhatsApp</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleShareTwitter}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 text-left cursor-pointer"
                    >
                      <Share2 className="h-3.5 w-3.5 text-sky-500" />
                      <span>Twitter / X</span>
                    </button>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={toggleFavorite}
                disabled={favoriteLoading}
                className={`flex h-10 items-center gap-1.5 rounded-xl border px-3.5 text-xs font-bold transition-colors cursor-pointer ${favorite
                  ? 'border-rose-200 bg-rose-50 text-rose-600'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
              >
                <Heart className={`h-4 w-4 ${favorite ? 'fill-current text-rose-500' : ''}`} />
                <span>{favorite ? 'Saved' : 'Save'}</span>
              </button>

              {isOwner && (
                <Link
                  href={`/sell?propertyId=${property._id}`}
                  className="flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Edit className="h-4 w-4" />
                  <span>Edit</span>
                </Link>
              )}
            </div>
          </div>

          {shareMessage && (
            <p className="mt-2 text-xs font-bold text-amber-600 animate-in fade-in">{shareMessage}</p>
          )}
        </section>

        {/* Media & Summary Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Subcomponent: Gallery Carousel */}
          <section className="lg:col-span-7">
            <GalleryCarousel property={property} />
          </section>

          {/* Property Summary Card */}
          <section className="lg:col-span-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              {/* Price */}
              <div className="border-b border-slate-100 pb-5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Asking price
                </p>
                <div className="mt-1 flex flex-wrap items-baseline gap-2">
                  <span className="text-3xl font-black tracking-tight text-slate-950">
                    {formatCompactCurrency(property.totalPrice)}
                  </span>
                  {property.priceNegotiable && (
                    <span className="text-xs font-bold text-blue-600">Negotiable</span>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {formatIndianCurrency(property.pricePerYard)} per sq. yard
                </p>
              </div>

              {/* Core Facts */}
              <div className="grid grid-cols-2 gap-3 border-b border-slate-100 py-5">
                <Fact label="Land area" value={formatArea(property.landAreaYards)} />
                <Fact label="Land type" value={formatLandType(property.landType)} />
                <Fact label="Road access" value={property.roadAccess || 'Not specified'} />
                <Fact
                  label="Location"
                  value={property.location?.city || property.location?.state || 'See listing'}
                />
              </div>

              {/* CTA Gate & Actions */}
              {!user && !showProtectedInformation ? (
                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                      <ShieldCheck className="h-4 w-4 text-[#FF9933]" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-slate-900">
                        Want the full property information?
                      </h3>
                      <p className="mt-1 text-[11px] leading-5 text-slate-500">
                        Sign in to connect directly with the landowner without brokerage fees.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAuthModalOpen(true)}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-xs font-bold text-white transition-colors hover:bg-slate-800 cursor-pointer"
                  >
                    Sign in to Continue
                  </button>
                </div>
              ) : isDraft ? (
                <div className="mt-5 space-y-3">
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-center">
                    <p className="text-xs font-bold text-amber-900 flex items-center justify-center gap-1.5">
                      <span>🔒</span>
                      <span>Listing In Draft Mode</span>
                    </p>
                    <p className="text-[11px] text-amber-700 mt-1 leading-relaxed">
                      Buyer phone calls and inquiries will be activated once you publish this listing live.
                    </p>
                  </div>
                  <Link
                    href={`/sell?propertyId=${property._id}`}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FF9933] px-4 py-3.5 text-xs font-black text-white shadow-sm transition-all hover:bg-[#f07d12]"
                  >
                    <span>Pay ₹10 &amp; Publish Listing</span>
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </div>
              ) : isOwner ? (
                <div className="mt-5 space-y-3">
                  <div className="rounded-xl border border-blue-200 bg-blue-50/90 p-3.5 text-center">
                    <p className="text-xs font-bold text-blue-900 flex items-center justify-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-[#FF9933]" />
                      <span>You Own This Listing</span>
                    </p>
                    <p className="text-[11px] text-blue-700 mt-1 leading-relaxed">
                      This listing is live on the marketplace. You can edit details or review buyer inquiries.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Link
                      href={`/sell?propertyId=${property._id}`}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs font-bold text-slate-800 shadow-xs hover:bg-slate-50 transition-colors"
                    >
                      <Edit className="h-3.5 w-3.5 text-slate-500" />
                      <span>Edit Listing</span>
                    </Link>
                    <Link
                      href="/dashboard/seller"
                      className="flex items-center justify-center gap-1.5 rounded-xl bg-[#FF9933] px-3 py-3 text-xs font-bold text-white shadow-xs hover:bg-[#f07d12] transition-colors"
                    >
                      <LayoutDashboard className="h-3.5 w-3.5" />
                      <span>Seller Hub</span>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="mt-5 space-y-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={initiateCallSeller}
                      disabled={callLoading}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3.5 text-xs font-black text-white shadow-sm transition-all hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
                    >
                      {callLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Connecting...</span>
                        </>
                      ) : (
                        <>
                          <Phone className="h-4 w-4 text-[#FF9933]" />
                          <span>Call Owner</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={openInquiry}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FF9933] px-4 py-3.5 text-xs font-black text-white shadow-sm transition-colors hover:bg-[#f07d12] cursor-pointer"
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span>Send Message</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 pt-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-[#FF9933]" />
                    <span>Buyer protection: direct connection is logged on BhoomiMitra</span>
                  </div>
                </div>
              )}

              {/* Seller Identity */}
              {user && (
                <div className="mt-5 border-t border-slate-100 pt-5">
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Seller
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                      <UserRound className="h-5 w-5 text-slate-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900">
                        {property.sellerName || 'Property Seller'}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {property.sellerType === 'COMPANY'
                          ? 'Company'
                          : property.sellerType === 'AGENT'
                            ? 'Property Agent'
                            : 'Individual seller'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Details & Location Row */}
        <div className="mt-7 grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* About This Land */}
          <section className="lg:col-span-8">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#fff1dc] text-[#c75e0a]">
                  <LandPlot className="h-4 w-4" />
                </div>
                <h2 className="text-sm font-black text-slate-950">About this land</h2>
              </div>
              <div className="mt-5">
                <p className="whitespace-pre-line text-sm leading-7 text-slate-600">
                  {property.description ||
                    'The seller has not provided a detailed description for this listing.'}
                </p>
              </div>
            </div>
          </section>

          {/* Subcomponent: Location Section */}
          <section className="lg:col-span-4">
            <LocationSection property={property} />
          </section>
        </div>

        {/* Basic Property Features */}
        <section className="mt-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#fff1dc] text-[#c75e0a]">
                <Tag className="h-4 w-4" />
              </div>
              <h2 className="text-sm font-black text-slate-950">Property Information</h2>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <InfoCard label="Land area" value={formatArea(property.landAreaYards)} />
              <InfoCard
                label="Price / sq. yard"
                value={formatIndianCurrency(property.pricePerYard)}
              />
              <InfoCard
                label="Total asking price"
                value={formatCompactCurrency(property.totalPrice)}
              />
              <InfoCard label="Road access" value={property.roadAccess || 'Not specified'} />
            </div>

            {property.nearbyLandmarks && property.nearbyLandmarks.length > 0 && (
              <div className="mt-5 border-t border-slate-100 pt-5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Nearby landmarks
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {property.nearbyLandmarks.map((landmark, index) => (
                    <span
                      key={`${landmark}-${index}`}
                      className="rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-semibold text-slate-600"
                    >
                      {landmark}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Subcomponent: Dynamic Property Specifications & Amenities */}
        <PropertySpecifications property={property} />

        {/* Subcomponent: Land Buyer's Due Diligence Card */}
        <section className="mt-8">
          <DueDiligenceCard onOpenReportModal={() => setReportModalOpen(true)} />
        </section>

        {/* Seller / Contact Banner */}
        {user && (
          <section className="mt-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100">
                    <UserRound className="h-5 w-5 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900">
                      {isOwner ? 'Listing Management' : 'Interested in this property?'}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {isOwner
                        ? 'Manage details, review incoming inquiries, or check performance in your Seller Dashboard.'
                        : 'Send the seller an inquiry through BhoomiMitra.'}
                    </p>
                  </div>
                </div>

                {isOwner ? (
                  <Link
                    href="/dashboard/seller"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-xs font-black text-white hover:bg-slate-800 transition-colors"
                  >
                    <LayoutDashboard className="h-4 w-4 text-[#FF9933]" />
                    <span>View Seller Dashboard</span>
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={openInquiry}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FF9933] px-5 py-3 text-xs font-black text-white hover:bg-[#f07d12] transition-colors cursor-pointer"
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span>Contact Seller</span>
                  </button>
                )}
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Mobile Sticky Contact Bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-3 shadow-2xl backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-2">
          <button
            type="button"
            onClick={openInquiry}
            className="flex-1 rounded-xl bg-[#FF9933] py-3 text-center text-xs font-black text-white shadow-sm hover:bg-[#f07d12] transition-colors cursor-pointer"
          >
            Inquire Now
          </button>
          <button
            type="button"
            onClick={initiateCallSeller}
            disabled={callLoading}
            className="flex-1 rounded-xl bg-slate-900 py-3 text-center text-xs font-black text-white shadow-sm hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {callLoading ? 'Connecting...' : 'Call Seller'}
          </button>
        </div>
      </div>

      {/* Modals */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />

      {property && (
        <InquiryModal
          property={property}
          isOpen={inquiryOpen}
          onClose={() => setInquiryOpen(false)}
          buyerUser={user}
        />
      )}

      {property && (
        <ReportModal
          property={property}
          isOpen={reportModalOpen}
          onClose={() => setReportModalOpen(false)}
        />
      )}

      <CallSellerModal
        isOpen={callModalOpen}
        onClose={() => setCallModalOpen(false)}
        sellerData={sellerCallData}
        propertyTitle={property.title}
        propertyId={property._id}
        callLoading={callLoading}
        callError={callError}
        onRetry={() => setCallError('')}
        onOpenInquiry={openInquiry}
        onTrackWhatsApp={handleTrackWhatsApp}
        userEmail={user?.email}
      />

      <Footer />
    </div>
  );
}

/* Page Skeleton fallback */
function PropertyPageSkeleton() {
  return (
    <div>
      <div className="mb-6 h-4 w-32 rounded-md shimmer" />
      <div className="mb-6 space-y-3">
        <div className="h-8 w-3/4 max-w-xl rounded-xl shimmer" />
        <div className="h-4 w-1/3 max-w-xs rounded-md shimmer" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="aspect-[4/3] rounded-3xl shimmer lg:col-span-7" />
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 lg:col-span-5 space-y-6">
          <div className="space-y-2">
            <div className="h-4 w-24 rounded-md shimmer" />
            <div className="h-9 w-44 rounded-xl shimmer" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="h-16 rounded-2xl shimmer-light" />
            <div className="h-16 rounded-2xl shimmer-light" />
            <div className="h-16 rounded-2xl shimmer-light" />
            <div className="h-16 rounded-2xl shimmer-light" />
          </div>
          <div className="h-12 rounded-xl shimmer w-full" />
          <div className="h-12 rounded-xl shimmer w-full" />
        </div>
      </div>
    </div>
  );
}

export default function PropertyDetailsClient({
  initialProperty,
}: {
  initialProperty?: IProperty | null;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50">
          <Navbar />
          <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <PropertyPageSkeleton />
          </main>
          <Footer />
        </div>
      }
    >
      <PropertyDetailsContent initialProperty={initialProperty} />
    </Suspense>
  );
}