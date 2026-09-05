'use client';

import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Edit,
  ExternalLink,
  Flag,
  Heart,
  ImageIcon,
  Info,
  LandPlot,
  LayoutDashboard,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
  Tag,
  UserRound,
  Home,
  Video,
  Play,
  Film,
  Maximize2,
  X,
} from 'lucide-react';

import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { AuthModal } from '@/components/auth/AuthModal';
import { ReportModal } from '@/components/properties/ReportModal';
import { DueDiligenceChecklist } from '@/components/legal/DueDiligenceChecklist';

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
    const crores = value / 10000000;

    return `₹${crores.toFixed(
      Number.isInteger(crores) ? 0 : 1,
    )} Cr`;
  }

  if (value >= 100000) {
    const lakhs = value / 100000;

    return `₹${lakhs.toFixed(
      Number.isInteger(lakhs) ? 0 : 1,
    )} L`;
  }

  return formatIndianCurrency(value);
}

function formatArea(value: number) {
  if (!Number.isFinite(value)) return '—';

  return `${value.toLocaleString('en-IN')} sq. yd`;
}

function formatLandType(value?: string) {
  if (!value) return 'Land';

  return value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value?: string | Date) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/* ================================================================
   MAIN PAGE
================================================================ */

function PropertyDetailsContent() {
  const params = useParams();
  const router = useRouter();

  const propertyId =
    typeof params?.id === 'string'
      ? params.id
      : Array.isArray(params?.id)
        ? params.id[0]
        : '';

  /* ---------------------------------------------------------------
     PROPERTY
  --------------------------------------------------------------- */

  const [property, setProperty] = useState<IProperty | null>(
    null,
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  /* ---------------------------------------------------------------
     SESSION / AUTH
  --------------------------------------------------------------- */

  const [user, setUser] = useState<any>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  const [authModalOpen, setAuthModalOpen] = useState(false);

  /*
   * The page intentionally lets the visitor reach the property
   * page before authentication.
   *
   * Authentication is required when protected property information
   * or buyer actions are requested.
   */
  const [showProtectedInformation, setShowProtectedInformation] =
    useState(false);

  /* ---------------------------------------------------------------
     UI STATE
  --------------------------------------------------------------- */

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [activeMediaTab, setActiveMediaTab] = useState<'PHOTOS' | 'VIDEO'>('PHOTOS');
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const [favorite, setFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  const [shareMessage, setShareMessage] = useState('');

  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [inquiryPhone, setInquiryPhone] = useState('');
  const [inquiryEmail, setInquiryEmail] = useState('');
  const [sharePhone, setSharePhone] = useState(true);
  const [inquirySending, setInquirySending] = useState(false);
  const [inquirySuccess, setInquirySuccess] = useState(false);
  const [inquiryError, setInquiryError] = useState('');
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reloadCount, setReloadCount] = useState(0);
  const [isListingOwner, setIsListingOwner] = useState(false);

  /* Call Seller State */
  const [callModalOpen, setCallModalOpen] = useState(false);
  const [callLoading, setCallLoading] = useState(false);
  const [callCopied, setCallCopied] = useState(false);
  const [sellerCallData, setSellerCallData] = useState<{
    sellerName: string;
    sellerPhone: string;
    sellerEmail?: string;
  } | null>(null);
  const [callError, setCallError] = useState('');

  /* ================================================================
     LOAD SESSION
  ================================================================= */

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const response = await fetch('/api/auth/session', {
          cache: 'no-store',
        });

        if (!response.ok) {
          if (!cancelled) {
            setUser(null);
          }
          return;
        }

        const data = await response.json();

        if (!cancelled) {
          setUser(data?.session?.user || null);
        }
      } catch {
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setSessionLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ================================================================
     LOAD PROPERTY
  ================================================================= */

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!propertyId) {
        setLoading(false);
        setError('Invalid property listing.');
        return;
      }

      try {
        const response = await fetch(
          `/api/properties/${encodeURIComponent(propertyId)}`,
          {
            cache: 'no-store',
          },
        );

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

        const loadedProperty =
          data?.data ||
          data?.property ||
          data;

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

        setProperty(null);
        setError(
          'We could not load this property right now. Please try again.',
        );
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
  }, [propertyId, reloadCount]);

  /* ================================================================
     FAVORITE STATUS SYNC
  ================================================================= */

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

  /* ================================================================
     PROPERTY DERIVED DATA
  ================================================================= */

  const images = useMemo(() => {
    if (!property?.images?.length) {
      return [];
    }

    return [...property.images].sort(
      (a, b) => a.sortOrder - b.sortOrder,
    );
  }, [property]);

  const activeImage = images[activeImageIndex];

  const locationText = useMemo(() => {
    if (!property) return '';

    const parts = [
      property.location?.city,
      property.location?.district,
      property.location?.state,
    ].filter(Boolean);

    return parts.join(', ');
  }, [property]);

  const verificationLabel =
    property?.verificationStatus === 'VERIFIED'
      ? 'Direct Classified'
      : property?.verificationStatus === 'PENDING'
        ? 'Draft'
        : property?.verificationStatus === 'VERIFICATION_REQUIRED'
          ? 'Information needed'
          : property?.verificationStatus === 'REJECTED'
            ? 'Suspended'
            : 'Direct Classified';

  const publishedDate = formatDate(property?.publishedAt);

  const isOwner = Boolean(
    isListingOwner || (user && property && user.id === property.sellerId),
  );

  const isDraft = Boolean(
    property &&
    (property.listingStatus === 'DRAFT' ||
      property.listingStatus === 'PAYMENT_PENDING' ||
      property.listingStatus === 'PENDING_VERIFICATION' ||
      property.paymentStatus !== 'PAID'),
  );

  /* ================================================================
     SEO SCHEMA (JSON-LD)
  ================================================================= */

  const jsonLd = useMemo(() => {
    if (!property) return null;

    return {
      '@context': 'https://schema.org',
      '@type': 'RealEstateListing',
      name: property.title,
      description: property.description,
      datePosted: property.publishedAt || (property as any).createdAt,
      offers: {
        '@type': 'Offer',
        price: property.totalPrice,
        priceCurrency: 'INR',
        availability:
          property.listingStatus === 'PUBLISHED'
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
      },
      contentLocation: {
        '@type': 'Place',
        name: `${property.location?.city || ''}, ${property.location?.state || ''}`.trim(),
        address: {
          '@type': 'PostalAddress',
          streetAddress: property.location?.address,
          addressLocality: property.location?.city,
          addressRegion: property.location?.state,
          postalCode: property.location?.pincode,
          addressCountry: 'IN',
        },
        geo:
          property.latitude && property.longitude
            ? {
              '@type': 'GeoCoordinates',
              latitude: property.latitude,
              longitude: property.longitude,
            }
            : undefined,
      },
      image: property.images?.map((img) => img.secureUrl).filter(Boolean),
    };
  }, [property]);

  const requireLoginForProtectedInformation = () => {
    if (user) {
      setShowProtectedInformation(true);
      return true;
    }

    setAuthModalOpen(true);
    return false;
  };

  /* ================================================================
     FAVORITE
  ================================================================= */

  const toggleFavorite = async () => {
    if (!property) return;

    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    setFavoriteLoading(true);

    try {
      const response = await fetch('/api/favorites', {
        method: favorite ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          propertyId: property._id,
        }),
      });

      if (response.status === 401) {
        setAuthModalOpen(true);
        return;
      }

      if (!response.ok) {
        throw new Error('Favorite action failed.');
      }

      const data = await response.json().catch(() => null);
      if (typeof data?.isFavorite === 'boolean') {
        setFavorite(data.isFavorite);
      } else {
        setFavorite((current) => !current);
      }
    } catch (err) {
      console.error('Favorite error:', err);
    } finally {
      setFavoriteLoading(false);
    }
  };

  /* ================================================================
     SHARE
  ================================================================= */

  const shareProperty = async () => {
    if (!property) return;

    if (isDraft) {
      setShareMessage('Draft listings cannot be shared publicly. Please publish this listing first.');
      window.setTimeout(() => {
        setShareMessage('');
      }, 4000);
      return;
    }

    const url = window.location.href;

    try {
      if (
        typeof navigator !== 'undefined' &&
        navigator.share
      ) {
        await navigator.share({
          title: property.title,
          text: `Take a look at this land listing on BhoomiMitra.`,
          url,
        });

        return;
      }

      await navigator.clipboard.writeText(url);

      setShareMessage('Link copied');

      window.setTimeout(() => {
        setShareMessage('');
      }, 2500);
    } catch {
      // User cancelled native share.
    }
  };

  /* ================================================================
     REPORT LISTING
  ================================================================= */

  const openReportModal = () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    setReportModalOpen(true);
  };

  /* ================================================================
     IMAGE NAVIGATION
  ================================================================= */

  const previousImage = () => {
    if (!images.length) return;

    setActiveImageIndex((current) =>
      current === 0 ? images.length - 1 : current - 1,
    );
  };

  const nextImage = () => {
    if (!images.length) return;

    setActiveImageIndex((current) =>
      current === images.length - 1 ? 0 : current + 1,
    );
  };

  /* Keyboard navigation and scroll lock for Lightbox */
  useEffect(() => {
    if (!isLightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsLightboxOpen(false);
      } else if (e.key === 'ArrowLeft') {
        if (activeMediaTab === 'PHOTOS' && images.length > 1) {
          setActiveImageIndex((current) =>
            current === 0 ? images.length - 1 : current - 1,
          );
        }
      } else if (e.key === 'ArrowRight') {
        if (activeMediaTab === 'PHOTOS' && images.length > 1) {
          setActiveImageIndex((current) =>
            current === images.length - 1 ? 0 : current + 1,
          );
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isLightboxOpen, activeMediaTab, images.length]);

  /* ================================================================
     INQUIRY
  ================================================================= */

  const openInquiry = () => {
    if (!property) return;

    if (isOwner) {
      setShareMessage('You are the owner of this listing.');
      window.setTimeout(() => setShareMessage(''), 3000);
      return;
    }

    if (isDraft) {
      setShareMessage('Draft listings cannot receive inquiries until published.');
      window.setTimeout(() => setShareMessage(''), 4000);
      return;
    }

    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    setInquiryError('');
    setInquirySuccess(false);
    setInquiryPhone(''); // Empty by default - manual entry
    setInquiryEmail(user?.email || ''); // Default to signed-in email
    setInquiryOpen(true);
  };

  const sendInquiry = async () => {
    if (!property) return;

    const trimmedMsg = inquiryMessage.trim();
    if (!trimmedMsg) {
      setInquiryError('Please enter an inquiry message.');
      return;
    }

    if (trimmedMsg.length < 10) {
      setInquiryError('Inquiry message must be at least 10 characters.');
      return;
    }

    let cleanPhone = inquiryPhone.trim().replace(/\D/g, '');
    if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
      cleanPhone = cleanPhone.slice(2);
    } else if (cleanPhone.length === 11 && cleanPhone.startsWith('0')) {
      cleanPhone = cleanPhone.slice(1);
    }
    if (!cleanPhone) {
      setInquiryError('Please enter your 10-digit mobile number so the landowner can contact you.');
      return;
    }

    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setInquiryError('Please enter a valid 10-digit Indian mobile number (starting with 6, 7, 8, or 9).');
      return;
    }

    const cleanEmail = inquiryEmail.trim() || user?.email?.trim();
    if (!cleanEmail) {
      setInquiryError('Please enter your contact email address.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setInquiryError('Please enter a valid email address.');
      return;
    }

    setInquirySending(true);
    setInquiryError('');

    try {
      const response = await fetch('/api/inquiries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          propertyId: property._id,
          message: trimmedMsg,
          phoneShared: true,
          buyerPhone: cleanPhone,
          buyerEmail: cleanEmail,
        }),
      });

      const data = await response.json().catch(() => null);

      if (response.status === 401) {
        setInquiryOpen(false);
        setAuthModalOpen(true);
        return;
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
          data?.error ||
          'Unable to send your inquiry.',
        );
      }

      setInquirySuccess(true);
      setInquiryMessage('');
    } catch (err) {
      console.error('Inquiry error:', err);

      setInquiryError(
        err instanceof Error
          ? err.message
          : 'Unable to send your inquiry.',
      );
    } finally {
      setInquirySending(false);
    }
  };

  /* ================================================================
     CALL SELLER ACTION (Database Recorded)
  ================================================================= */

  const initiateCallSeller = async () => {
    if (!property) return;

    if (isOwner) {
      setShareMessage('You are the owner of this listing.');
      window.setTimeout(() => setShareMessage(''), 3000);
      return;
    }

    if (isDraft) {
      setShareMessage('Draft listings cannot receive direct calls until published.');
      window.setTimeout(() => setShareMessage(''), 4000);
      return;
    }

    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    setCallLoading(true);
    setCallError('');
    setCallCopied(false);

    try {
      const response = await fetch(
        `/api/properties/${encodeURIComponent(property._id)}/call`,
        {
          method: 'POST',
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initiate phone call.');
      }

      const phone = data.sellerPhone || property.sellerPhone;

      if (!phone) {
        throw new Error('Seller contact phone number is not available for this listing.');
      }

      setSellerCallData({
        sellerName: data.sellerName || property.sellerName || 'Landowner',
        sellerPhone: phone,
        sellerEmail: data.sellerEmail || property.sellerEmail,
      });

      setCallModalOpen(true);

      // If mobile device, automatically trigger tel: prompt
      if (
        typeof window !== 'undefined' &&
        /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
      ) {
        window.location.href = `tel:${phone}`;
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Unable to initiate call.';
      setCallError(msg);
      setCallModalOpen(true);
    } finally {
      setCallLoading(false);
    }
  };

  /* ================================================================
     LOADING STATE
  ================================================================= */

  if (loading || sessionLoading) {
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

  /* ================================================================
     ERROR / NOT FOUND
  ================================================================= */

  if (!property) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />

        <main className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center px-4 py-16 text-center">
          <div>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
              <LandPlot className="h-7 w-7 text-slate-400" />
            </div>

            <h1 className="mt-5 text-2xl font-black text-slate-900">
              Property not available
            </h1>

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

  /* ================================================================
     MAIN PROPERTY PAGE
  ================================================================= */

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <Navbar />

      {/* ============================================================
          BREADCRUMB
      ============================================================ */}

      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 overflow-hidden text-[11px] text-slate-500">
            <Link
              href="/"
              className="shrink-0 hover:text-[#c75e0a]"
            >
              Home
            </Link>

            <span>/</span>

            <Link
              href="/buy"
              className="shrink-0 hover:text-[#c75e0a]"
            >
              Find Land
            </Link>

            <span>/</span>

            <span className="truncate font-semibold text-slate-700">
              {property.title}
            </span>
          </div>
        </div>
      </div>

      {/* ============================================================
          MAIN
      ============================================================ */}

      <main className="mx-auto max-w-7xl px-4 py-6 pb-28 sm:px-6 lg:px-8 lg:py-8 lg:pb-12">
        {/* Back */}

        <button
          type="button"
          onClick={() => router.back()}
          className="mb-5 inline-flex items-center gap-2 text-xs font-bold text-slate-500 transition-colors hover:text-[#c75e0a]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to listings
        </button>

        {/* ========================================================
            PROPERTY HEADER
        ======================================================== */}

        {/* ========================================================
            DRAFT PREVIEW BANNER (OWNER ONLY)
        ======================================================== */}
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

        {/* ========================================================
            PROPERTY HEADER
        ======================================================== */}

        <section className="mb-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">
                  {formatLandType(property.landType)}
                </span>

                {isDraft ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-100 px-2.5 py-1 text-[10px] font-black text-amber-900">
                    🔒 Private Draft Preview
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full border border-[#FF9933]/40 bg-[#fff1dc] px-2.5 py-1 text-[10px] font-bold text-[#c75e0a]">
                    <ShieldCheck className="h-3.5 w-3.5 text-[#FF9933]" />
                    Direct Classified
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

            {/* Header actions */}

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={shareProperty}
                className={`relative inline-flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-bold shadow-sm transition-colors ${
                  isDraft
                    ? 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
                title={isDraft ? 'Draft listings cannot be shared' : 'Share property'}
              >
                <Share2 className={`h-4 w-4 ${isDraft ? 'text-amber-600' : ''}`} />

                <span className="hidden sm:inline">
                  {shareMessage || (isDraft ? 'Draft (Private)' : 'Share')}
                </span>
              </button>

              <button
                type="button"
                onClick={toggleFavorite}
                disabled={favoriteLoading}
                className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-bold shadow-sm transition-colors ${favorite
                  ? 'border-rose-200 bg-rose-50 text-rose-600'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
              >
                {favoriteLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Heart
                    className={`h-4 w-4 ${favorite ? 'fill-current' : ''
                      }`}
                  />
                )}

                <span className="hidden sm:inline">
                  {favorite ? 'Saved' : 'Save'}
                </span>
              </button>

              {!isDraft && (
                <button
                  type="button"
                  onClick={openReportModal}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                  title="Report suspicious or incorrect listing"
                  aria-label="Report listing"
                >
                  <Flag className="h-4 w-4" />
                  <span className="hidden sm:inline">Report</span>
                </button>
              )}
            </div>
          </div>
        </section>

        {/* ========================================================
            IMAGE + SUMMARY GRID
        ======================================================== */}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* ======================================================
              IMAGE GALLERY
          ====================================================== */}

          <section className="lg:col-span-7">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="relative aspect-[4/3] overflow-hidden bg-slate-900 sm:aspect-[16/10]">
                {/* Media Switcher Tab (Photos vs Video Tour) */}
                {property.video?.secureUrl && (
                  <div className="absolute top-3 right-3 z-20 flex items-center gap-1 rounded-xl bg-black/70 p-1 backdrop-blur-md text-white text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setActiveMediaTab('PHOTOS')}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                        activeMediaTab === 'PHOTOS' ? 'bg-[#FF9933] text-white shadow-xs' : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Photos ({images.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveMediaTab('VIDEO')}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                        activeMediaTab === 'VIDEO' ? 'bg-[#FF9933] text-white shadow-xs' : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Video Tour</span>
                    </button>
                  </div>
                )}

                {activeMediaTab === 'VIDEO' && property.video?.secureUrl ? (
                  <div className="relative w-full h-full flex items-center justify-center bg-black">
                    <video
                      src={property.video.secureUrl}
                      controls
                      playsInline
                      autoPlay
                      preload="metadata"
                      className="w-full h-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => setIsLightboxOpen(true)}
                      className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 text-white text-xs font-bold backdrop-blur-md transition-all shadow-md cursor-pointer hover:scale-105"
                      title="Expand video to fullscreen"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Maximize</span>
                    </button>
                  </div>
                ) : activeImage?.secureUrl ? (
                  <div
                    onClick={() => setIsLightboxOpen(true)}
                    className="relative w-full h-full cursor-zoom-in group"
                    title="Click to maximize image"
                  >
                    <Image
                      src={activeImage.secureUrl}
                      alt={
                        activeImage.fileName ||
                        property.title
                      }
                      fill
                      sizes="(max-width: 1024px) 100vw, 58vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      priority
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsLightboxOpen(true);
                      }}
                      className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 text-white text-xs font-bold backdrop-blur-md transition-all shadow-md cursor-pointer hover:scale-105"
                      title="Click to maximize image"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Click to Maximize</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center bg-slate-100">
                    <div className="text-center">
                      <LandPlot className="mx-auto h-12 w-12 text-slate-300" />

                      <p className="mt-3 text-xs font-semibold text-slate-400">
                        No property images available
                      </p>
                    </div>
                  </div>
                )}

                {/* Image count */}
                {activeMediaTab === 'PHOTOS' && images.length > 0 && (
                  <div className="absolute bottom-3 left-3 rounded-lg bg-black/60 px-2.5 py-1.5 text-[10px] font-bold text-white backdrop-blur">
                    {activeImageIndex + 1} / {images.length}
                  </div>
                )}

                {/* Navigation (Only on photos) */}
                {activeMediaTab === 'PHOTOS' && images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={previousImage}
                      aria-label="Previous property image"
                      className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition-colors hover:bg-black/70"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>

                    <button
                      type="button"
                      onClick={nextImage}
                      aria-label="Next property image"
                      className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition-colors hover:bg-black/70"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}

                {/* Verification */}
                <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-lg bg-[#FF9933] px-3 py-2 text-[10px] font-black text-white shadow-lg">
                  <ShieldCheck className="h-4 w-4" />
                  Direct Classified
                </div>
              </div>

              {/* Thumbnails */}
              {(images.length > 1 || Boolean(property.video?.secureUrl)) && (
                <div className="flex gap-2 overflow-x-auto p-3 items-center">
                  {images.map((image, index) => (
                    <button
                      type="button"
                      key={
                        image._id ||
                        image.objectKey ||
                        index
                      }
                      onClick={() => {
                        setActiveImageIndex(index);
                        setActiveMediaTab('PHOTOS');
                      }}
                      className={`relative h-16 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-colors cursor-pointer ${
                        activeMediaTab === 'PHOTOS' && activeImageIndex === index
                          ? 'border-[#FF9933]'
                          : 'border-transparent opacity-80 hover:opacity-100'
                      }`}
                    >
                      <Image
                        src={image.secureUrl}
                        alt=""
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </button>
                  ))}

                  {/* Video Thumbnail Button */}
                  {property.video?.secureUrl && (
                    <button
                      type="button"
                      onClick={() => setActiveMediaTab('VIDEO')}
                      className={`relative h-16 w-20 shrink-0 overflow-hidden rounded-lg border-2 bg-slate-950 flex flex-col items-center justify-center text-white transition-all cursor-pointer ${
                        activeMediaTab === 'VIDEO'
                          ? 'border-[#FF9933] shadow-sm'
                          : 'border-slate-800 opacity-80 hover:opacity-100 hover:border-slate-700'
                      }`}
                      title="Watch Video Tour"
                    >
                      <div className="w-7 h-7 rounded-full bg-[#fff1dc] text-[#c75e0a] flex items-center justify-center mb-0.5">
                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                      </div>
                      <span className="text-[9px] font-black text-white uppercase tracking-wider">Video</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* ======================================================
              PROPERTY SUMMARY CARD
          ====================================================== */}

          <section className="lg:col-span-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              {/* Price */}

              <div className="border-b border-slate-100 pb-5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Asking price
                </p>

                <div className="mt-1 flex flex-wrap items-baseline gap-2">
                  <span className="text-3xl font-black tracking-tight text-slate-950">
                    {formatCompactCurrency(
                      property.totalPrice,
                    )}
                  </span>

                  {property.priceNegotiable && (
                    <span className="text-xs font-bold text-blue-600">
                      Negotiable
                    </span>
                  )}
                </div>

                <p className="mt-1 text-xs text-slate-500">
                  {formatIndianCurrency(
                    property.pricePerYard,
                  )}{' '}
                  per sq. yard
                </p>
              </div>

              {/* Core facts */}

              <div className="grid grid-cols-2 gap-3 border-b border-slate-100 py-5">
                <Fact
                  label="Land area"
                  value={formatArea(
                    property.landAreaYards,
                  )}
                />

                <Fact
                  label="Land type"
                  value={formatLandType(
                    property.landType,
                  )}
                />

                <Fact
                  label="Road access"
                  value={
                    property.roadAccess || 'Not specified'
                  }
                />

                <Fact
                  label="Location"
                  value={
                    property.location?.city ||
                    property.location?.state ||
                    'See listing'
                  }
                />
              </div>

              {/* Protected information gate */}

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
                        Sign in with Google to continue to
                        protected property information and buyer
                        actions.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={requireLoginForProtectedInformation}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-xs font-bold text-white transition-colors hover:bg-slate-800"
                  >
                    Continue with Google
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
                          Connecting...
                        </>
                      ) : (
                        <>
                          <Phone className="h-4 w-4 text-[#FF9933]" />
                          Call Seller
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={openInquiry}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FF9933] px-4 py-3.5 text-xs font-black text-white shadow-sm transition-colors hover:bg-[#f07d12] cursor-pointer"
                    >
                      <MessageSquare className="h-4 w-4" />
                      Send Message
                    </button>
                  </div>

                  <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 pt-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-[#FF9933]" />
                    Buyer protection: direct call action is logged on BhoomiMitra
                  </div>
                </div>
              )}

              {/* Seller identity */}

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
                        {property.sellerName ||
                          'Property Seller'}
                      </p>

                      <p className="text-[10px] text-slate-500">
                        {property.sellerType ===
                          'COMPANY'
                          ? 'Company'
                          : property.sellerType ===
                            'AGENT'
                            ? 'Property Agent'
                            : 'Individual seller'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Fee clarification */}

            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

              <p className="text-[10px] leading-5 text-slate-500">
                The price shown is the seller&apos;s asking price.
                BhoomiMitra&apos;s listing subscription fee is charged
                to sellers and is separate from the property price.
              </p>
            </div>
          </section>
        </div>

        {/* ========================================================
            DETAILS
        ======================================================== */}

        <div className="mt-7 grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Description */}

          <section className="lg:col-span-8">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <SectionHeading
                icon={<LandPlot className="h-4 w-4" />}
                title="About this land"
              />

              <div className="mt-5">
                <p className="whitespace-pre-line text-sm leading-7 text-slate-600">
                  {property.description ||
                    'The seller has not provided a detailed description for this listing.'}
                </p>
              </div>
            </div>
          </section>

          {/* Location */}

          <section className="lg:col-span-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <SectionHeading
                icon={<MapPin className="h-4 w-4" />}
                title="Location"
              />

              <div className="mt-5 space-y-4">
                <LocationRow
                  label="City"
                  value={
                    property.location?.city ||
                    'Not specified'
                  }
                />

                <LocationRow
                  label="District"
                  value={
                    property.location?.district ||
                    'Not specified'
                  }
                />

                <LocationRow
                  label="State"
                  value={
                    property.location?.state ||
                    'Not specified'
                  }
                />

                <LocationRow
                  label="Pincode"
                  value={
                    property.location?.pincode ||
                    'Not specified'
                  }
                />

                {property.location?.address && (
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Address
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-700">
                      {property.location.address}
                    </p>
                  </div>
                )}

                {property.googleMapsShareLink && (
                  <a
                    href={property.googleMapsShareLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-700 transition-colors hover:border-[#FF9933] hover:bg-[#fff9f0] hover:text-[#c75e0a]"
                  >
                    <MapPin className="h-4 w-4" />
                    Open in Google Maps
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* ========================================================
            PROPERTY FEATURES
        ======================================================== */}

        <section className="mt-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <SectionHeading
              icon={<Tag className="h-4 w-4" />}
              title="Property information"
            />

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <InfoCard
                label="Land area"
                value={formatArea(
                  property.landAreaYards,
                )}
              />

              <InfoCard
                label="Price / sq. yard"
                value={formatIndianCurrency(
                  property.pricePerYard,
                )}
              />

              <InfoCard
                label="Total asking price"
                value={formatCompactCurrency(
                  property.totalPrice,
                )}
              />

              <InfoCard
                label="Road access"
                value={
                  property.roadAccess ||
                  'Not specified'
                }
              />
            </div>

            {property.nearbyLandmarks?.length > 0 && (
              <div className="mt-5 border-t border-slate-100 pt-5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Nearby landmarks
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {property.nearbyLandmarks.map(
                    (landmark, index) => (
                      <span
                        key={`${landmark}-${index}`}
                        className="rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-semibold text-slate-600"
                      >
                        {landmark}
                      </span>
                    ),
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ========================================================
            DYNAMIC PROPERTY SPECIFICATIONS & EXCLUSIVE AMENITIES
        ======================================================== */}
        {(property.bhk ||
          property.facing ||
          property.bathrooms ||
          property.balconies ||
          property.superBuiltUpAreaSqFt ||
          property.carpetAreaSqFt ||
          property.propertyAttributes?.villaType ||
          property.propertyAttributes?.villaFloors ||
          property.propertyAttributes?.vastuCompliant ||
          (Array.isArray(property.propertyAttributes?.additionalRooms) && property.propertyAttributes.additionalRooms.length > 0) ||
          (Array.isArray(property.propertyAttributes?.villaPrivateFeatures) && property.propertyAttributes.villaPrivateFeatures.length > 0) ||
          (Array.isArray(property.propertyAttributes?.furnishingDetails) && property.propertyAttributes.furnishingDetails.length > 0) ||
          (Array.isArray(property.amenities) && property.amenities.length > 0)) && (
          <section className="mt-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 space-y-6">
              <div className="flex items-center justify-between">
                <SectionHeading
                  icon={<Home className="h-4 w-4" />}
                  title="Property Specifications &amp; Highlights"
                />
                <span className="text-[10px] font-bold text-[#c75e0a] bg-[#fff1dc] px-2.5 py-1 rounded-full">
                  Direct Owner Verified
                </span>
              </div>

              {/* Grid of Key Structural Details */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {property.bhk && property.bhk !== 'NOT_SPECIFIED' && (
                  <Fact label="Configuration" value={property.bhk} />
                )}

                {property.propertyAttributes?.villaType && property.propertyAttributes.villaType !== 'NOT_SPECIFIED' && (
                  <Fact
                    label="Villa Architecture"
                    value={
                      property.propertyAttributes.villaType === 'GATED_VILLA'
                        ? 'Gated Luxury Villa'
                        : property.propertyAttributes.villaType === 'INDEPENDENT_HOUSE'
                        ? 'Independent Bungalow'
                        : property.propertyAttributes.villaType === 'DUPLEX_VILLA'
                        ? 'Duplex Villa'
                        : property.propertyAttributes.villaType === 'TRIPLEX_VILLA'
                        ? 'Triplex Villa'
                        : property.propertyAttributes.villaType === 'ROW_HOUSE'
                        ? 'Row House / Townhouse'
                        : property.propertyAttributes.villaType === 'FARMHOUSE_VILLA'
                        ? 'Farmhouse Villa'
                        : property.propertyAttributes.villaType.replace(/_/g, ' ')
                    }
                  />
                )}

                {property.propertyAttributes?.villaFloors && property.propertyAttributes.villaFloors !== 'NOT_SPECIFIED' && (
                  <Fact
                    label="Structure Levels"
                    value={
                      property.propertyAttributes.villaFloors === 'G'
                        ? 'Ground Only (G)'
                        : property.propertyAttributes.villaFloors === 'G_PLUS_1'
                        ? 'G + 1 Floor (Duplex)'
                        : property.propertyAttributes.villaFloors === 'G_PLUS_2'
                        ? 'G + 2 Floors (Triplex)'
                        : property.propertyAttributes.villaFloors === 'G_PLUS_3'
                        ? 'G + 3 Floors'
                        : property.propertyAttributes.villaFloors.replace(/_/g, ' ')
                    }
                  />
                )}

                {property.facing && property.facing !== 'NOT_SPECIFIED' && (
                  <Fact label="Main Facing" value={`${property.facing.replace(/_/g, ' ')} Facing`} />
                )}

                {property.bathrooms && property.bathrooms > 0 && (
                  <Fact label="Bathrooms" value={`${property.bathrooms} Baths`} />
                )}

                {property.balconies !== undefined && property.balconies >= 0 && (
                  <Fact label="Balconies / Sit-outs" value={`${property.balconies} Balconies`} />
                )}

                {property.superBuiltUpAreaSqFt && (
                  <Fact label="Built-up Area" value={`${property.superBuiltUpAreaSqFt.toLocaleString('en-IN')} sq. ft`} />
                )}

                {property.carpetAreaSqFt && (
                  <Fact label="Carpet Area" value={`${property.carpetAreaSqFt.toLocaleString('en-IN')} sq. ft`} />
                )}

                {property.furnishingStatus && property.furnishingStatus !== 'NOT_SPECIFIED' && (
                  <Fact label="Furnishing" value={property.furnishingStatus.replace(/_/g, ' ')} />
                )}

                {property.propertyAttributes?.parkingSlots && property.propertyAttributes.parkingSlots !== 'NOT_SPECIFIED' && (
                  <Fact
                    label="Car Parking"
                    value={
                      property.propertyAttributes.parkingSlots === '1_COVERED'
                        ? '1 Covered Porch'
                        : property.propertyAttributes.parkingSlots === '2_COVERED'
                        ? '2 Covered Porch'
                        : property.propertyAttributes.parkingSlots === '3_PLUS_COVERED'
                        ? '3+ Covered Porch'
                        : property.propertyAttributes.parkingSlots === 'OPEN'
                        ? 'Open Driveway'
                        : property.propertyAttributes.parkingSlots.replace(/_/g, ' ')
                    }
                  />
                )}

                {property.propertyAttributes?.possessionStatus && property.propertyAttributes.possessionStatus !== 'NOT_SPECIFIED' && (
                  <Fact label="Possession Status" value={property.propertyAttributes.possessionStatus.replace(/_/g, ' ')} />
                )}

                {property.propertyAttributes?.ageOfProperty && property.propertyAttributes.ageOfProperty !== 'NOT_SPECIFIED' && (
                  <Fact
                    label="Property Age"
                    value={
                      property.propertyAttributes.ageOfProperty === 'NEW'
                        ? 'Brand New (0-1 yr)'
                        : property.propertyAttributes.ageOfProperty.replace(/_/g, ' ')
                    }
                  />
                )}
              </div>

              {/* 100% Vastu Badge */}
              {property.propertyAttributes?.vastuCompliant && (
                <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>100% Vastu Compliant Architecture (Entrance, Kitchen, Master Bedroom &amp; Pooja aligned)</span>
                </div>
              )}

              {/* Dedicated Additional Rooms */}
              {Array.isArray(property.propertyAttributes?.additionalRooms) && property.propertyAttributes.additionalRooms.length > 0 && (
                <div className="pt-4 border-t border-slate-100">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Dedicated Additional Rooms ({property.propertyAttributes.additionalRooms.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {property.propertyAttributes.additionalRooms.map((room: string) => (
                      <span
                        key={room}
                        className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs font-bold"
                      >
                        ✓ {room}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Exclusive Private Villa Grounds & Features */}
              {Array.isArray(property.propertyAttributes?.villaPrivateFeatures) && property.propertyAttributes.villaPrivateFeatures.length > 0 && (
                <div className="pt-4 border-t border-slate-100">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Exclusive Private Grounds &amp; Features ({property.propertyAttributes.villaPrivateFeatures.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {property.propertyAttributes.villaPrivateFeatures.map((feat: string) => (
                      <span
                        key={feat}
                        className="px-3 py-1.5 rounded-xl bg-[#fff9f0] border border-[#FF9933]/40 text-[#7a3705] text-xs font-bold shadow-xs"
                      >
                        ★ {feat}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Included Furnishings & Inclusions */}
              {Array.isArray(property.propertyAttributes?.furnishingDetails) && property.propertyAttributes.furnishingDetails.length > 0 && (
                <div className="pt-4 border-t border-slate-100">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Fittings &amp; Interior Inclusions ({property.propertyAttributes.furnishingDetails.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {property.propertyAttributes.furnishingDetails.map((inc: string) => (
                      <span
                        key={inc}
                        className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold"
                      >
                        + {inc}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Society / Community Amenities */}
              {Array.isArray(property.amenities) && property.amenities.length > 0 && (
                <div className="pt-4 border-t border-slate-100">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Community Amenities &amp; Infrastructure ({property.amenities.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {property.amenities.map((amenity: string) => (
                      <span
                        key={amenity}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold"
                      >
                        ✓ {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ========================================================
            VERIFICATION
        ======================================================== */}

        {/* ========================================================
            LAND BUYER'S DUE DILIGENCE CHECKLIST & LEGAL NOTICE
        ========================================================= */}

        <section className="mt-8">
          <DueDiligenceChecklist />
        </section>

        {/* ========================================================
            SELLER / CONTACT
        ======================================================== */}

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
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FF9933] px-5 py-3 text-xs font-black text-white hover:bg-[#f07d12] transition-colors"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Contact Seller
                  </button>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ========================================================
            DISCLAIMER
        ======================================================== */}

        <section className="mt-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

              <div>
                <h3 className="text-[11px] font-bold text-slate-700">
                  Before you proceed
                </h3>

                <p className="mt-1 text-[10px] leading-5 text-slate-500">
                  BhoomiMitra facilitates property discovery, advertising hosting,
                  and direct communication between sellers and prospective buyers.
                  BhoomiMitra does not provide title verification, legal opinions,
                  or survey certification. A listing does not constitute a guarantee
                  of title, ownership, legality, boundary accuracy, or dispute-free status.
                  Conduct independent legal, title, registration, and physical due
                  diligence with qualified advocates and revenue authorities before entering
                  into any transaction.
                </p>

                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">Notice fraudulent or misleading information?</span>
                  <button
                    type="button"
                    onClick={openReportModal}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 hover:underline cursor-pointer"
                  >
                    <Flag className="h-3.5 w-3.5 text-rose-600" />
                    <span>Report Listing to Moderation</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ============================================================
          MOBILE STICKY CONTACT BAR
      ============================================================ */}

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-3 shadow-2xl backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-2">
          <button
            type="button"
            onClick={toggleFavorite}
            disabled={favoriteLoading}
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${favorite
              ? 'border-rose-200 bg-rose-50 text-rose-600'
              : 'border-slate-200 bg-white text-slate-600'
              }`}
            aria-label={
              favorite
                ? 'Remove from saved properties'
                : 'Save property'
            }
          >
            <Heart
              className={`h-5 w-5 ${favorite ? 'fill-current' : ''
                }`}
            />
          </button>

          {isDraft ? (
            <Link
              href={`/sell?propertyId=${property._id}`}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#FF9933] px-4 text-xs font-black text-white hover:bg-[#f07d12] transition-colors"
            >
              <span>Publish Listing (₹10)</span>
              <ExternalLink className="h-4 w-4" />
            </Link>
          ) : isOwner ? (
            <Link
              href="/dashboard/seller"
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-xs font-black text-white hover:bg-slate-800 transition-colors"
            >
              <LayoutDashboard className="h-4 w-4 text-[#FF9933]" />
              <span>Seller Control Center</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={openInquiry}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#FF9933] px-4 text-xs font-black text-white hover:bg-[#f07d12] transition-colors"
            >
              <MessageSquare className="h-4 w-4" />
              {user ? 'Contact Seller' : 'Sign in to Contact'}
            </button>
          )}
        </div>
      </div>

      {/* ============================================================
          INQUIRY MODAL
      ============================================================ */}

      {inquiryOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fff1dc] text-[#c75e0a]">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-900">
                    Contact Landowner
                  </h2>
                  <p className="text-[11px] text-slate-500 line-clamp-1 max-w-xs sm:max-w-sm">
                    {property.title}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setInquiryOpen(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-200/80 hover:text-slate-700 transition-colors"
                aria-label="Close inquiry"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
              {inquirySuccess ? (
                <div className="py-8 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#fff1dc]">
                    <CheckCircle2 className="h-7 w-7 text-[#FF9933]" />
                  </div>

                  <h3 className="mt-4 text-base font-black text-slate-900">
                    Inquiry Sent Successfully
                  </h3>

                  <p className="mt-2 text-xs leading-5 text-slate-600 max-w-sm mx-auto">
                    Your inquiry and contact details have been securely dispatched to the landowner. You can view updates anytime in your Buyer Dashboard.
                  </p>

                  <div className="mt-6 flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => setInquiryOpen(false)}
                      className="rounded-xl bg-slate-950 px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition-colors"
                    >
                      Done
                    </button>
                    <Link
                      href="/dashboard/buyer"
                      onClick={() => setInquiryOpen(false)}
                      className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      View Buyer Dashboard
                    </Link>
                  </div>
                </div>
              ) : (
                <>
                  {/* 1. Buyer Contact Details (First Section) */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-3">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-[#FF9933]" />
                        <span>Your Contact Information</span>
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        The landowner will use these details to contact you directly.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Email Address Input (Prefilled with signed-in email) */}
                      <div>
                        <label
                          htmlFor="inquiry-email"
                          className="block text-[11px] font-semibold text-slate-700 mb-1"
                        >
                          Email Address <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative flex items-center">
                          <Mail className="absolute left-3 h-3.5 w-3.5 text-slate-400" />
                          <input
                            id="inquiry-email"
                            type="email"
                            required
                            value={inquiryEmail}
                            onChange={(e) =>
                              setInquiryEmail(e.target.value)
                            }
                            placeholder="your.email@example.com"
                            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#FF9933] focus:outline-none focus:ring-2 focus:ring-[#FF9933]/20"
                          />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">
                          Written replies &amp; status updates
                        </p>
                      </div>

                      {/* Mobile Number Input (Empty by default for manual entry) */}
                      <div>
                        <label
                          htmlFor="inquiry-phone"
                          className="block text-[11px] font-semibold text-slate-700 mb-1"
                        >
                          Mobile Number <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative flex items-center">
                          <span className="absolute left-3 text-xs font-bold text-slate-500">
                            +91
                          </span>
                          <input
                            id="inquiry-phone"
                            type="tel"
                            required
                            maxLength={10}
                            value={inquiryPhone}
                            onChange={(e) =>
                              setInquiryPhone(e.target.value.replace(/\D/g, ''))
                            }
                            placeholder="Enter 10-digit mobile"
                            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-11 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#FF9933] focus:outline-none focus:ring-2 focus:ring-[#FF9933]/20"
                          />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">
                          Direct phone / WhatsApp callbacks
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 2. Quick Preset Message Chips */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 mb-1.5 block">
                      Quick Questions
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        '💰 Is the price negotiable?',
                        '📅 Schedule a site visit',
                        '📐 Share boundary & survey details',
                        '📄 Legal documents & clear title?',
                      ].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => {
                            setInquiryMessage((prev) =>
                              prev ? `${prev.trim()}\n${preset}` : preset,
                            );
                          }}
                          className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:border-[#FF9933]/50 hover:bg-[#fff9f0] hover:text-[#7a3705] transition-colors cursor-pointer"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 3. Message Textarea */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label
                        htmlFor="inquiry-message"
                        className="text-xs font-bold text-slate-800"
                      >
                        Your Message <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[10px] text-slate-400">
                        {inquiryMessage.length}/1000 (min 10 chars)
                      </span>
                    </div>

                    <textarea
                      id="inquiry-message"
                      value={inquiryMessage}
                      onChange={(event) =>
                        setInquiryMessage(event.target.value)
                      }
                      rows={4}
                      placeholder="Hi, I am interested in this parcel. Please share current availability, road access details, and when we can arrange a physical inspection."
                      className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#FF9933] focus:bg-white focus:ring-2 focus:ring-[#FF9933]/20 transition-all"
                    />
                  </div>

                  {inquiryError && (
                    <div className="rounded-lg bg-rose-50 border border-rose-200 p-2.5 text-xs font-medium text-rose-700">
                      {inquiryError}
                    </div>
                  )}

                  {/* Shield Notice */}
                  <div className="flex items-start gap-2 rounded-xl bg-[#fff9f0] border border-[#FF9933]/20 p-2.5">
                    <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#FF9933]" />
                    <p className="text-[10px] leading-4 text-[#7a3705]">
                      <strong>Direct Connect Policy:</strong> Your contact email and mobile number are dispatched directly to the verified landowner via email &amp; dashboard.
                    </p>
                  </div>

                  {/* Submit Button */}
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setInquiryOpen(false)}
                      className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={sendInquiry}
                      disabled={
                        inquirySending ||
                        inquiryMessage.trim().length < 10 ||
                        inquiryPhone.trim().length < 10 ||
                        !inquiryEmail.trim()
                      }
                      className="flex items-center justify-center gap-2 rounded-xl bg-[#FF9933] px-6 py-2.5 text-xs font-black text-white transition-colors hover:bg-[#f07d12] disabled:cursor-not-allowed disabled:opacity-50 shadow-xs"
                    >
                      {inquirySending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <MessageSquare className="h-4 w-4" />
                          Send Inquiry
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          CALL SELLER MODAL
      ============================================================ */}

      {callModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#fff1dc] text-[#c75e0a]">
                  <Phone className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Contact Landowner / Seller
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Direct phone line
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setCallModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {callError ? (
              <div className="rounded-xl bg-rose-50 border border-rose-100 p-4 text-xs text-rose-800 space-y-2">
                <p className="font-bold">Unable to initiate call</p>
                <p>{callError}</p>
                <button
                  type="button"
                  onClick={() => setCallModalOpen(false)}
                  className="mt-2 w-full rounded-lg bg-rose-600 px-3 py-2 text-white font-bold text-xs"
                >
                  Close
                </button>
              </div>
            ) : sellerCallData ? (
              <div className="space-y-4">
                <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Seller Name
                      </p>
                      <p className="text-sm font-black text-slate-900 mt-0.5">
                        {sellerCallData.sellerName}
                      </p>
                    </div>

                    <div className="inline-flex items-center gap-1 rounded-full bg-[#fff1dc] px-2.5 py-1 text-[10px] font-bold text-[#c75e0a] border border-[#FF9933]/30">
                      <Sparkles className="h-3.5 w-3.5 text-[#FF9933]" />
                      Direct Seller
                    </div>
                  </div>

                  <div className="border-t border-slate-200/60 pt-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Phone Number
                    </p>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <span className="text-lg font-mono font-black tracking-wide text-slate-900">
                        {sellerCallData.sellerPhone}
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          if (sellerCallData?.sellerPhone) {
                            navigator.clipboard.writeText(sellerCallData.sellerPhone);
                            setCallCopied(true);
                            setTimeout(() => setCallCopied(false), 2500);
                          }
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition-colors cursor-pointer"
                      >
                        {callCopied ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-[#FF9933]" />
                            <span className="text-[#c75e0a]">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <a
                    href={`tel:${sellerCallData.sellerPhone}`}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FF9933] hover:bg-[#f07d12] px-4 py-3.5 text-xs font-black text-white shadow-md transition-all cursor-pointer"
                  >
                    <Phone className="h-4 w-4" />
                    <span>Call Now ({sellerCallData.sellerPhone})</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      setCallModalOpen(false);
                      openInquiry();
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>Or Send Written Message</span>
                  </button>
                </div>

                <div className="rounded-xl bg-[#fff9f0] border border-[#FF9933]/25 p-3 text-[11px] text-[#7a3705] flex items-start gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-[#FF9933] shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong>Buyer Protection:</strong> This call connection was logged with your verified account (<code className="font-semibold text-[#c75e0a]">{user?.email}</code>) to ensure safe marketplace communications.
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ============================================================
          AUTH MODAL
      ============================================================ */}

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      {/* ============================================================
          REPORT MODAL
      ============================================================ */}

      {property && (
        <ReportModal
          property={property}
          isOpen={reportModalOpen}
          onClose={() => setReportModalOpen(false)}
        />
      )}

      {/* ================================================================
          FULLSCREEN LIGHTBOX / MAXIMIZE MEDIA MODAL
      ================================================================= */}
      {isLightboxOpen && property && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex flex-col justify-between bg-black/95 backdrop-blur-xl animate-in fade-in duration-200"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Top Bar */}
          <div
            className="flex items-center justify-between p-4 sm:p-5 z-20 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-white/10 text-white text-xs font-bold backdrop-blur">
                {activeMediaTab === 'VIDEO'
                  ? 'Video Tour'
                  : `Photo ${activeImageIndex + 1} of ${images.length}`}
              </span>
              <h3 className="text-sm font-semibold text-slate-200 hidden md:block truncate max-w-md">
                {property.title}
              </h3>
            </div>

            {/* Media tab switcher inside lightbox */}
            <div className="flex items-center gap-2">
              {property.video?.secureUrl && (
                <div className="flex items-center gap-1 rounded-xl bg-white/10 p-1 backdrop-blur text-white text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setActiveMediaTab('PHOTOS')}
                    className={`flex items-center gap-1 px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                      activeMediaTab === 'PHOTOS' ? 'bg-[#FF9933] text-white' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Photos</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveMediaTab('VIDEO')}
                    className={`flex items-center gap-1 px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                      activeMediaTab === 'VIDEO' ? 'bg-[#FF9933] text-white' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Video</span>
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                aria-label="Close fullscreen view"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Main Stage */}
          <div
            className="relative flex-1 flex items-center justify-center p-2 sm:p-6 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {activeMediaTab === 'VIDEO' && property.video?.secureUrl ? (
              <div className="relative w-full max-w-5xl h-full max-h-[80vh] flex items-center justify-center">
                <video
                  src={property.video.secureUrl}
                  controls
                  autoPlay
                  playsInline
                  className="w-full h-full max-h-[80vh] object-contain rounded-xl shadow-2xl"
                />
              </div>
            ) : activeImage?.secureUrl ? (
              <div className="relative w-full h-full max-h-[82vh] flex items-center justify-center">
                <Image
                  src={activeImage.secureUrl}
                  alt={activeImage.fileName || property.title}
                  fill
                  sizes="100vw"
                  className="object-contain"
                  priority
                />
              </div>
            ) : null}

            {/* Previous / Next Arrows in Lightbox */}
            {activeMediaTab === 'PHOTOS' && images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={previousImage}
                  aria-label="Previous image"
                  className="absolute left-4 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 backdrop-blur-md transition-transform hover:scale-110 cursor-pointer shadow-xl"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={nextImage}
                  aria-label="Next image"
                  className="absolute right-4 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 backdrop-blur-md transition-transform hover:scale-110 cursor-pointer shadow-xl"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          {/* Bottom Thumbnails Ribbon in Lightbox */}
          <div
            className="p-4 z-20 flex justify-center overflow-x-auto gap-2 max-w-full bg-black/40 backdrop-blur-md"
            onClick={(e) => e.stopPropagation()}
          >
            {images.map((image, idx) => (
              <button
                type="button"
                key={image._id || image.objectKey || idx}
                onClick={() => {
                  setActiveImageIndex(idx);
                  setActiveMediaTab('PHOTOS');
                }}
                className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-all cursor-pointer ${
                  activeMediaTab === 'PHOTOS' && activeImageIndex === idx
                    ? 'border-[#FF9933] scale-105 shadow-md'
                    : 'border-white/20 opacity-60 hover:opacity-100'
                }`}
              >
                <Image
                  src={image.secureUrl}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </button>
            ))}

            {property.video?.secureUrl && (
              <button
                type="button"
                onClick={() => setActiveMediaTab('VIDEO')}
                className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 bg-slate-900 flex flex-col items-center justify-center text-white transition-all cursor-pointer ${
                  activeMediaTab === 'VIDEO'
                    ? 'border-[#FF9933] scale-105 shadow-md'
                    : 'border-white/20 opacity-60 hover:opacity-100'
                }`}
                title="Watch Video"
              >
                <div className="w-6 h-6 rounded-full bg-[#FF9933] text-white flex items-center justify-center mb-0.5">
                  <Play className="w-3 h-3 fill-current ml-0.5" />
                </div>
                <span className="text-[8px] font-bold uppercase tracking-wider">Video</span>
              </button>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

/* ================================================================
   SECTION HEADING
================================================================ */

function SectionHeading({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#fff1dc] text-[#c75e0a]">
        {icon}
      </div>

      <h2 className="text-sm font-black text-slate-950">
        {title}
      </h2>
    </div>
  );
}

/* ================================================================
   FACT
================================================================ */

function Fact({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p className="mt-1 line-clamp-2 text-xs font-bold text-slate-800">
        {value}
      </p>
    </div>
  );
}

/* ================================================================
   INFO CARD
================================================================ */

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p className="mt-1.5 text-sm font-black text-slate-900">
        {value}
      </p>
    </div>
  );
}

/* ================================================================
   LOCATION ROW
================================================================ */

function LocationRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
      <span className="text-[10px] font-semibold text-slate-400">
        {label}
      </span>

      <span className="max-w-[65%] text-right text-xs font-bold text-slate-700">
        {value}
      </span>
    </div>
  );
}

/* ================================================================
   PAGE SKELETON
================================================================ */

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


/* ================================================================
   EXPORT
================================================================ */

export default function PropertyDetailsPage() {
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
      <PropertyDetailsContent />
    </Suspense>
  );
}