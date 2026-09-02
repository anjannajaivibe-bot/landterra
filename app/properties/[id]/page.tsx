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
  ExternalLink,
  Flag,
  Heart,
  Info,
  LandPlot,
  Loader2,
  MapPin,
  MessageSquare,
  Phone,
  Search,
  ShieldCheck,
  Share2,
  Tag,
  UserRound,
  X,
} from 'lucide-react';

import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { AuthModal } from '@/components/auth/AuthModal';
import { ReportModal } from '@/components/properties/ReportModal';

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

  const [favorite, setFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  const [shareMessage, setShareMessage] = useState('');

  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [inquirySending, setInquirySending] = useState(false);
  const [inquirySuccess, setInquirySuccess] = useState(false);
  const [inquiryError, setInquiryError] = useState('');
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reloadCount, setReloadCount] = useState(0);

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
          if (!cancelled) {
            setProperty(null);
            setError('This land listing could not be found.');
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
      .catch(() => {});

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
      ? 'Verified listing'
      : property?.verificationStatus === 'PENDING'
        ? 'Verification in progress'
        : property?.verificationStatus === 'VERIFICATION_REQUIRED'
          ? 'Verification information required'
          : property?.verificationStatus === 'REJECTED'
            ? 'Verification not approved'
            : 'Verification status available';

  const publishedDate = formatDate(property?.publishedAt);

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

  /* ================================================================
     INQUIRY
  ================================================================= */

  const openInquiry = () => {
    if (!property) return;

    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    setInquiryError('');
    setInquirySuccess(false);
    setInquiryOpen(true);
  };

  const sendInquiry = async () => {
    if (!property || !inquiryMessage.trim()) {
      setInquiryError('Please enter a message.');
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
          message: inquiryMessage.trim(),
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

      const phone = data.sellerPhone || property.sellerPhone || '+919876543210';

      setSellerCallData({
        sellerName: data.sellerName || property.sellerName || 'Verified Landowner',
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
              className="shrink-0 hover:text-emerald-700"
            >
              Home
            </Link>

            <span>/</span>

            <Link
              href="/buy"
              className="shrink-0 hover:text-emerald-700"
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
          className="mb-5 inline-flex items-center gap-2 text-xs font-bold text-slate-500 transition-colors hover:text-emerald-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to listings
        </button>

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

                {property.verificationStatus === 'VERIFIED' && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    Verified
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
                  <MapPin className="h-3.5 w-3.5 text-emerald-600" />
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
                className="relative inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50"
              >
                <Share2 className="h-4 w-4" />

                <span className="hidden sm:inline">
                  {shareMessage || 'Share'}
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
              <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 sm:aspect-[16/10]">
                {activeImage?.secureUrl ? (
                  <Image
                    src={activeImage.secureUrl}
                    alt={
                      activeImage.fileName ||
                      property.title
                    }
                    fill
                    sizes="(max-width: 1024px) 100vw, 58vw"
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                      <LandPlot className="mx-auto h-12 w-12 text-slate-300" />

                      <p className="mt-3 text-xs font-semibold text-slate-400">
                        No property images available
                      </p>
                    </div>
                  </div>
                )}

                {/* Image count */}

                {images.length > 0 && (
                  <div className="absolute bottom-3 left-3 rounded-lg bg-black/60 px-2.5 py-1.5 text-[10px] font-bold text-white backdrop-blur">
                    {activeImageIndex + 1} / {images.length}
                  </div>
                )}

                {/* Navigation */}

                {images.length > 1 && (
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

                {property.verificationStatus === 'VERIFIED' && (
                  <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-[10px] font-black text-white shadow-lg">
                    <ShieldCheck className="h-4 w-4" />
                    Verified listing
                  </div>
                )}
              </div>

              {/* Thumbnails */}

              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto p-3">
                  {images.map((image, index) => (
                    <button
                      type="button"
                      key={
                        image._id ||
                        image.objectKey ||
                        index
                      }
                      onClick={() =>
                        setActiveImageIndex(index)
                      }
                      className={`relative h-16 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${activeImageIndex === index
                        ? 'border-emerald-600'
                        : 'border-transparent'
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
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
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
                          <Phone className="h-4 w-4 text-emerald-400" />
                          Call Seller
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={openInquiry}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3.5 text-xs font-black text-white shadow-sm transition-colors hover:bg-emerald-700 cursor-pointer"
                    >
                      <MessageSquare className="h-4 w-4" />
                      Send Message
                    </button>
                  </div>

                  <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 pt-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
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
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-700 transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
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
            VERIFICATION
        ======================================================== */}

        <section className="mt-6">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 sm:p-6">
            <div className="flex flex-col gap-5 sm:flex-row">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                {property.verificationStatus ===
                  'VERIFIED' ? (
                  <BadgeCheck className="h-6 w-6 text-emerald-600" />
                ) : (
                  <ShieldCheck className="h-6 w-6 text-emerald-600" />
                )}
              </div>

              <div className="min-w-0">
                <h2 className="text-sm font-black text-emerald-950">
                  {verificationLabel}
                </h2>

                <p className="mt-2 max-w-3xl text-xs leading-6 text-emerald-900/75">
                  {property.verificationStatus ===
                    'VERIFIED'
                    ? 'This listing has passed BhoomiMitra’s internal verification workflow based on the information and documents submitted by the seller.'
                    : property.verificationStatus ===
                      'PENDING'
                      ? 'The seller has submitted this listing and it is currently undergoing BhoomiMitra’s internal review process.'
                      : property.verificationStatus ===
                        'VERIFICATION_REQUIRED'
                        ? 'Additional information or documentation may be required before this listing can be marked verified.'
                        : 'Review the listing information carefully and perform your own legal and property due diligence before making a purchase decision.'}
                </p>

                <div className="mt-4 flex items-start gap-2 text-[10px] leading-5 text-emerald-900/70">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />

                  <span>
                    BhoomiMitra verification does not replace independent
                    legal due diligence, title search, physical
                    inspection, or professional advice.
                  </span>
                </div>
              </div>
            </div>
          </div>
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
                      Interested in this property?
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Send the seller an inquiry through BhoomiMitra.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={openInquiry}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-xs font-black text-white hover:bg-emerald-700"
                >
                  <MessageSquare className="h-4 w-4" />
                  Contact Seller
                </button>
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
                  BhoomiMitra facilitates property discovery, listing
                  management, document review workflows and direct
                  communication between sellers and prospective buyers.
                  A listing or verification status does not constitute
                  a guarantee of title, ownership, legality, valuation,
                  or suitability. Conduct independent legal, title,
                  registration and physical due diligence before
                  entering into any transaction.
                </p>

                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">Notice fraudulent or misleading information?</span>
                  <button
                    type="button"
                    onClick={openReportModal}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 hover:underline cursor-pointer"
                  >
                    <Flag className="h-3.5 w-3.5" />
                    <span>Report Listing</span>
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

          <button
            type="button"
            onClick={openInquiry}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-xs font-black text-white hover:bg-emerald-700"
          >
            <MessageSquare className="h-4 w-4" />
            {user ? 'Contact Seller' : 'Sign in to Contact'}
          </button>
        </div>
      </div>

      {/* ============================================================
          INQUIRY MODAL
      ============================================================ */}

      {inquiryOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-sm font-black text-slate-900">
                  Contact Seller
                </h2>

                <p className="mt-1 text-[10px] text-slate-500">
                  {property.title}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setInquiryOpen(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                aria-label="Close inquiry"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5">
              {inquirySuccess ? (
                <div className="py-8 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
                    <Check className="h-7 w-7 text-emerald-600" />
                  </div>

                  <h3 className="mt-4 text-base font-black text-slate-900">
                    Inquiry sent
                  </h3>

                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    Your inquiry has been submitted. The seller can
                    respond through the BhoomiMitra platform.
                  </p>

                  <button
                    type="button"
                    onClick={() => setInquiryOpen(false)}
                    className="mt-6 rounded-xl bg-slate-950 px-5 py-3 text-xs font-bold text-white"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <>
                  <label
                    htmlFor="inquiry-message"
                    className="text-xs font-bold text-slate-800"
                  >
                    Your message
                  </label>

                  <textarea
                    id="inquiry-message"
                    value={inquiryMessage}
                    onChange={(event) =>
                      setInquiryMessage(event.target.value)
                    }
                    rows={6}
                    placeholder="I'm interested in this property. Please share more details about the land, availability and next steps."
                    className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
                  />

                  {inquiryError && (
                    <p className="mt-2 text-[11px] font-medium text-rose-600">
                      {inquiryError}
                    </p>
                  )}

                  <div className="mt-4 flex items-start gap-2 rounded-xl bg-slate-50 p-3">
                    <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />

                    <p className="text-[10px] leading-4 text-slate-500">
                      Keep your first message focused on the property.
                      Do not share passwords, OTPs or sensitive account
                      information.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={sendInquiry}
                    disabled={
                      inquirySending ||
                      !inquiryMessage.trim()
                    }
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-xs font-black text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
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
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
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

                    <div className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                      Verified
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
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                            <span className="text-emerald-700">Copied</span>
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
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 px-4 py-3.5 text-xs font-black text-white shadow-md transition-all cursor-pointer"
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

                <div className="rounded-xl bg-emerald-50/70 border border-emerald-100 p-3 text-[11px] text-emerald-950 flex items-start gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong>Buyer Protection:</strong> This call connection was logged with your verified account (<code className="font-semibold text-emerald-900">{user?.email}</code>) to ensure safe marketplace communications.
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
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
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
    <div className="animate-pulse">
      <div className="mb-6 h-4 w-32 rounded bg-slate-200" />

      <div className="mb-6">
        <div className="h-8 w-3/4 rounded bg-slate-200" />

        <div className="mt-3 h-4 w-1/3 rounded bg-slate-200" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="aspect-[4/3] rounded-2xl bg-slate-200 lg:col-span-7" />

        <div className="rounded-2xl bg-white p-6 lg:col-span-5">
          <div className="h-4 w-24 rounded bg-slate-200" />

          <div className="mt-3 h-9 w-40 rounded bg-slate-200" />

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="h-16 rounded bg-slate-100" />
            <div className="h-16 rounded bg-slate-100" />
            <div className="h-16 rounded bg-slate-100" />
            <div className="h-16 rounded bg-slate-100" />
          </div>

          <div className="mt-6 h-12 rounded-xl bg-slate-200" />
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