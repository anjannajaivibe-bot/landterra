'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  Heart,
  Loader2,
  MapPin,
  Maximize2,
  Route,
  Tag,
  Calendar,
  Sparkles,
  Camera,
  UserCheck,
} from 'lucide-react';

import { IProperty } from '@/types/property';
import { SHIMMER_BLUR_DATA_URL } from '@/lib/utils';

interface PropertyCardProps {
  property: IProperty;
  initialFavorite?: boolean;
  onFavoriteToggle?: (
    propertyId: string,
    isFavorite: boolean,
  ) => void;
  onRequireLogin?: () => void;
  priority?: boolean;
}

/* ================================================================
   CURRENCY FORMATTER
================================================================ */

export function formatIndianCurrency(
  amount: number,
): string {
  if (!Number.isFinite(amount)) {
    return 'Price on request';
  }

  if (amount >= 10000000) {
    const crores = amount / 10000000;
    return `₹${crores.toFixed(
      Number.isInteger(crores) ? 0 : 2,
    )} Cr`;
  }

  if (amount >= 100000) {
    const lakhs = amount / 100000;
    return `₹${lakhs.toFixed(
      Number.isInteger(lakhs) ? 0 : 1,
    )} L`;
  }

  return `₹${amount.toLocaleString('en-IN')}`;
}

/* ================================================================
   AREA FORMATTER
================================================================ */

function formatArea(amount: number): string {
  if (!Number.isFinite(amount)) {
    return '—';
  }
  return amount.toLocaleString('en-IN');
}

/* ================================================================
   LAND TYPE LABEL
================================================================ */

function formatLandType(
  landType: IProperty['landType'],
): string {
  const labels: Record<string, string> = {
    // Land & Plots
    OPEN_PLOT: 'Open Plot',
    FARMLAND_PLOT: 'Farmland Plot',
    GATED_COMMUNITY_PLOT: 'Gated Community Plot',
    AGRICULTURAL_LAND: 'Agricultural Land',
    RESIDENTIAL_PLOT: 'Residential Plot',
    COMMERCIAL_LAND: 'Commercial Land',
    INDUSTRIAL_PLOT: 'Industrial Land',

    // Residential Units
    FLAT: 'Flat / Apartment',
    INDEPENDENT_HOUSE: 'Independent House',
    VILLA: 'Villa',
    HOUSE_VILLA: 'House / Villa',
    TOWNHOUSE: 'Townhouse',
    DUPLEX: 'Duplex',
    PENTHOUSE: 'Penthouse',

    // Commercial & Retail
    RETAIL_SHOP: 'Retail Shop',
    SHOWROOM: 'Showroom',
    OFFICE_SPACE: 'Office Space',
    COWORKING_SPACE: 'Co-working Space',
    SHOPPING_MALL: 'Shopping Mall',
    WAREHOUSE_LAND: 'Warehouse / Godown',
    SHOP_SHOWROOM: 'Shop / Showroom',
    INDUSTRIAL_BUILDING: 'Industrial Building',
    INDUSTRIAL_SHED: 'Industrial Shed',
    INSTITUTIONAL: 'Institutional Land',

    // Hospitality & Leisure
    RESORT: 'Resort',
    HOTEL: 'Hotel',
    SERVICE_APARTMENT: 'Service Apartment',
    GUEST_HOUSE: 'Guest House',
    FARM_HOUSE_LAND: 'Farmhouse',

    // Income-Generating & Rentals
    RESIDENTIAL_RENTAL: 'Residential Rental',
    COMMERCIAL_LEASE: 'Commercial Lease',
    COLIVING_PG: 'Co-living / PG',
    VACATION_RENTAL_AIRBNB: 'Vacation Rental / Airbnb',
  };

  return labels[landType] || 'Property';
}

/* ================================================================
   DATE FORMATTER
================================================================ */

function formatListedDate(
  value: string | Date,
): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/* ================================================================
   PROPERTY CARD (Horizontal Rectangle Layout)
================================================================ */

export function PropertyCard({
  property,
  initialFavorite = false,
  onFavoriteToggle,
  onRequireLogin,
  priority = false,
}: PropertyCardProps) {
  const [isFavorite, setIsFavorite] = useState(initialFavorite);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const [imageError, setImageError] = useState(false);

  /* --------------------------------------------------------------
     PRIMARY IMAGE
  -------------------------------------------------------------- */

  const primaryImage =
    property.images?.find((image) => image.isPrimary)?.secureUrl ||
    property.images?.[0]?.secureUrl;

  /* --------------------------------------------------------------
     FAVORITE
  -------------------------------------------------------------- */

  const handleFavoriteClick = async (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    if (isTogglingFavorite) {
      return;
    }

    const previousFavorite = isFavorite;
    const nextFavorite = !previousFavorite;

    // Optimistically update visual heart state immediately (0ms perceived latency)
    setIsFavorite(nextFavorite);
    onFavoriteToggle?.(property._id, nextFavorite);
    setIsTogglingFavorite(true);

    try {
      const response = await fetch('/api/favorites', {
        method: previousFavorite ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          propertyId: property._id,
        }),
      });

      if (response.status === 401) {
        // Roll back optimistic toggle if not logged in
        setIsFavorite(previousFavorite);
        onFavoriteToggle?.(property._id, previousFavorite);
        onRequireLogin?.();
        return;
      }

      if (!response.ok) {
        throw new Error('Unable to update saved property.');
      }

      const data = await response.json().catch(() => null);

      if (typeof data?.isFavorite === 'boolean' && data.isFavorite !== nextFavorite) {
        setIsFavorite(data.isFavorite);
        onFavoriteToggle?.(property._id, data.isFavorite);
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      // Rollback on network or server error
      setIsFavorite(previousFavorite);
      onFavoriteToggle?.(property._id, previousFavorite);
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  /* --------------------------------------------------------------
     DATA
  -------------------------------------------------------------- */

  const location = [
    property.location?.city,
    property.location?.state,
  ]
    .filter(Boolean)
    .join(', ');

  const listedDate = formatListedDate(property.createdAt);

  return (
    <article
      style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 500px' }}
      className="group relative flex flex-col md:flex-row overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:border-[#FF9933]/50 hover:shadow-[0_16px_40px_rgba(255,153,51,0.08)]"
    >
      {/* ==========================================================
          LEFT: PANORAMIC IMAGE AREA (Horizontal Rectangle)
      ========================================================== */}

      <div className="relative w-full md:w-[320px] lg:w-[360px] xl:w-[380px] shrink-0 aspect-[16/10] md:aspect-auto min-h-[220px] md:min-h-[270px] bg-slate-100 overflow-hidden">
        <Link
          href={`/properties/${property._id}`}
          prefetch={false}
          aria-label={`View ${property.title}`}
          className="absolute inset-0 block"
        >
          {primaryImage && !imageError ? (
            <Image
              src={primaryImage}
              alt={property.title}
              fill
              priority={priority}
              quality={65}
              placeholder={priority ? 'empty' : 'blur'}
              blurDataURL={priority ? undefined : SHIMMER_BLUR_DATA_URL}
              className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 320px, (max-width: 1280px) 360px, 380px"
              referrerPolicy="no-referrer"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-slate-100">
              <div className="text-center">
                <Maximize2 className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-2 text-[10px] font-semibold text-slate-400">
                  No image available
                </p>
              </div>
            </div>
          )}

          {/* Contrast gradient overlay */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/25" />
        </Link>


        {/* Favorite Button (Top-Right) */}
        <button
          type="button"
          onClick={handleFavoriteClick}
          disabled={isTogglingFavorite}
          aria-label={
            isFavorite
              ? 'Remove property from saved'
              : 'Save property'
          }
          className={`absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border shadow-sm backdrop-blur transition-all cursor-pointer ${isFavorite
            ? 'border-rose-200 bg-white text-rose-500'
            : 'border-white/60 bg-white/90 text-slate-700 hover:bg-white hover:text-rose-500'
            }`}
        >
          {isTogglingFavorite ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Heart
              className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''
                }`}
            />
          )}
        </button>

        {/* Bottom Badges on Image (Category & Photos Count) */}
        <div className="absolute bottom-3 left-3 right-3 z-10 flex items-end justify-between gap-2 pointer-events-none">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-black/60 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur">
            <Tag className="h-3 w-3 text-[#FF9933]" />
            {formatLandType(property.landType)}
          </span>

          <div className="flex items-center gap-1.5">
            {property.images && property.images.length > 1 && (
              <span className="inline-flex items-center gap-1 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur">
                <Camera className="h-3 w-3" />
                <span>{property.images.length}</span>
              </span>
            )}
            {property.priceNegotiable && (
              <span className="rounded-md bg-[#fff1dc] px-2 py-0.5 text-[10px] font-black text-[#c75e0a] border border-[#FF9933]/30 shadow-2xs">
                Negotiable
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ==========================================================
          RIGHT: CONTENT & SPECS DETAILS (Spacious Horizontal)
      ========================================================== */}

      <div className="flex flex-1 flex-col justify-between p-5 sm:p-6 min-w-0">
        <div>
          {/* Top Row: Direct Owner Pill, Listed Date & Prominent Price */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 border-b border-slate-100 pb-3.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-[#fff9f0] border border-[#FF9933]/30 px-2.5 py-0.5 text-[10px] font-extrabold text-[#c75e0a]">
                <Sparkles className="h-3 w-3 text-[#FF9933]" />
                Direct Owner • 0% Brokerage
              </span>
              {listedDate && (
                <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                  <Calendar className="h-3 w-3" />
                  {listedDate}
                </span>
              )}
            </div>

            {/* Price Display */}
            <div className="text-left sm:text-right shrink-0">
              <div className="text-2xl lg:text-3xl font-black text-slate-950 tracking-tight">
                {formatIndianCurrency(property.totalPrice)}
              </div>
              <p className="text-[11px] font-bold text-[#c75e0a]">
                ₹{property.pricePerYard.toLocaleString('en-IN')} / sq. yd
              </p>
            </div>
          </div>

          {/* Title */}
          <h3 className="mt-3 text-base sm:text-lg lg:text-xl font-black text-slate-900 leading-snug transition-colors group-hover:text-[#c75e0a] line-clamp-2">
            <Link href={`/properties/${property._id}`}>
              {property.title}
            </Link>
          </h3>

          {/* Location */}
          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-600 font-medium">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-[#FF9933]" />
            <span className="truncate">
              {property.location?.address
                ? `${property.location.address}, ${location}`
                : location || 'Location available'}
            </span>
          </div>

          {/* Key Specs Micro-Grid */}
          <div className="my-3.5 grid grid-cols-2 sm:grid-cols-3 gap-2.5 rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                Plot / Land Area
              </p>
              <div className="mt-1 flex items-center gap-1.5">
                <Maximize2 className="h-3.5 w-3.5 text-[#FF9933]" />
                <p className="text-xs font-black text-slate-900">
                  {formatArea(property.landAreaYards)}{' '}
                  <span className="font-semibold text-slate-500">sq.yd</span>
                </p>
              </div>
            </div>

            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                Road Access
              </p>
              <div className="mt-1 flex items-center gap-1.5">
                <Route className="h-3.5 w-3.5 text-[#FF9933]" />
                <p className="truncate text-xs font-black text-slate-900">
                  {property.roadAccess || 'Access Available'}
                </p>
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                Ownership
              </p>
              <div className="mt-1 flex items-center gap-1.5">
                <UserCheck className="h-3.5 w-3.5 text-[#FF9933]" />
                <p className="truncate text-xs font-black text-slate-900">
                  {property.sellerType === 'COMPANY'
                    ? 'Company Direct'
                    : property.sellerType === 'AGENT'
                      ? 'Authorized Agent'
                      : 'Individual Landowner'}
                </p>
              </div>
            </div>
          </div>

          {/* Description Excerpt & Nearby Landmarks */}
          {property.description && (
            <p className="line-clamp-2 text-xs leading-relaxed text-slate-500">
              {property.description}
            </p>
          )}

          {property.nearbyLandmarks && property.nearbyLandmarks.length > 0 && (
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Landmarks:
              </span>
              {property.nearbyLandmarks.slice(0, 3).map((landmark, idx) => (
                <span
                  key={idx}
                  className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600"
                >
                  {landmark}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Action Bar */}
        <div className="mt-4 flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 pt-3.5">
          <div className="flex items-center gap-2">
            <Link
              href={`/properties/${property._id}`}
              prefetch={false}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#FF9933] px-5 py-2.5 text-xs font-black text-white shadow-2xs hover:bg-[#f07d12] hover:shadow-md transition-all cursor-pointer"
            >
              <span>View Details</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}