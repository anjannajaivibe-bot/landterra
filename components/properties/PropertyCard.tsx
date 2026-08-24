'use client';

import React, { useState } from 'react';

import Link from 'next/link';

import Image from 'next/image';

import {
  ArrowRight,
  BadgeCheck,
  Heart,
  Loader2,
  MapPin,
  Maximize2,
  Route,
  Tag,
} from 'lucide-react';

import { IProperty } from '@/types/property';

import { VerificationBadge } from './VerificationBadge';

interface PropertyCardProps {
  property: IProperty;

  initialFavorite?: boolean;

  /**
   * Optional callback when favorite state changes.
   */
  onFavoriteToggle?: (
    propertyId: string,
    isFavorite: boolean,
  ) => void;

  /**
   * Optional callback when an unauthenticated user tries
   * to save a property.
   *
   * The parent can open its Google authentication modal.
   */
  onRequireLogin?: () => void;
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
  const labels: Record<
    IProperty['landType'],
    string
  > = {
    RESIDENTIAL_PLOT: 'Residential Plot',

    COMMERCIAL_LAND: 'Commercial Land',

    AGRICULTURAL_LAND: 'Agricultural Land',

    INDUSTRIAL_PLOT: 'Industrial Land',

    FARM_HOUSE_LAND: 'Farm House Land',

    INSTITUTIONAL: 'Institutional Land',
  };

  return labels[landType] || 'Land';
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
   PROPERTY CARD
================================================================ */

export function PropertyCard({
  property,
  initialFavorite = false,
  onFavoriteToggle,
  onRequireLogin,
}: PropertyCardProps) {
  const [isFavorite, setIsFavorite] =
    useState(initialFavorite);

  const [isTogglingFavorite, setIsTogglingFavorite] =
    useState(false);

  /* --------------------------------------------------------------
     PRIMARY IMAGE
  -------------------------------------------------------------- */

  const primaryImage =
    property.images?.find(
      (image) => image.isPrimary,
    )?.secureUrl ||
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

    setIsTogglingFavorite(true);

    try {
      const response = await fetch(
        '/api/favorites',
        {
          method: isFavorite ? 'DELETE' : 'POST',

          headers: {
            'Content-Type': 'application/json',
          },

          body: JSON.stringify({
            propertyId: property._id,
          }),
        },
      );

      if (response.status === 401) {
        onRequireLogin?.();
        return;
      }

      if (!response.ok) {
        throw new Error(
          'Unable to update saved property.',
        );
      }

      const data = await response
        .json()
        .catch(() => null);

      const nextFavorite =
        typeof data?.isFavorite === 'boolean'
          ? data.isFavorite
          : !isFavorite;

      setIsFavorite(nextFavorite);

      onFavoriteToggle?.(
        property._id,
        nextFavorite,
      );
    } catch (error) {
      console.error(
        'Failed to toggle favorite:',
        error,
      );
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

  const listedDate = formatListedDate(
    property.createdAt,
  );

  const isVerified =
    property.verificationStatus === 'VERIFIED';

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg">
      {/* ==========================================================
          IMAGE
      ========================================================== */}

      <Link
        href={`/properties/${property._id}`}
        aria-label={`View ${property.title}`}
        className="relative block aspect-[16/10] overflow-hidden bg-slate-100"
      >
        {primaryImage ? (
          <Image
            src={primaryImage}
            alt={property.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            referrerPolicy="no-referrer"
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

        {/* Image readability gradient */}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-black/15" />

        {/* --------------------------------------------------------
            VERIFICATION BADGE
        --------------------------------------------------------- */}

        <div className="absolute left-3 top-3 z-10">
          <VerificationBadge
            status={property.verificationStatus}
          />
        </div>

        {/* --------------------------------------------------------
            FAVORITE
        --------------------------------------------------------- */}

        <button
          type="button"
          onClick={handleFavoriteClick}
          disabled={isTogglingFavorite}
          aria-label={
            isFavorite
              ? 'Remove property from saved'
              : 'Save property'
          }
          className={`absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full border shadow-sm backdrop-blur transition-all ${isFavorite
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

        {/* --------------------------------------------------------
            LAND TYPE
        --------------------------------------------------------- */}

        <div className="absolute bottom-3 left-3 right-3 z-10 flex items-end justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-black/60 px-2.5 py-1.5 text-[10px] font-bold text-white backdrop-blur">
            <Tag className="h-3 w-3" />

            {formatLandType(property.landType)}
          </span>

          {property.priceNegotiable && (
            <span className="rounded-lg bg-white/95 px-2.5 py-1.5 text-[10px] font-black text-blue-700 shadow-sm backdrop-blur">
              Negotiable
            </span>
          )}
        </div>
      </Link>

      {/* ==========================================================
          CONTENT
      ========================================================== */}

      <div className="flex flex-1 flex-col p-4">
        {/* --------------------------------------------------------
            PRICE
        --------------------------------------------------------- */}

        <div>
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="text-2xl font-black tracking-tight text-slate-950">
              {formatIndianCurrency(
                property.totalPrice,
              )}
            </span>
          </div>

          <p className="mt-0.5 text-[11px] font-medium text-slate-500">
            ₹
            {property.pricePerYard.toLocaleString(
              'en-IN',
            )}
            / sq. yd
          </p>
        </div>

        {/* --------------------------------------------------------
            TITLE
        --------------------------------------------------------- */}

        <h3 className="mt-3 line-clamp-2 min-h-[2.75rem] text-base font-black leading-5 text-slate-900 transition-colors group-hover:text-emerald-700">
          <Link
            href={`/properties/${property._id}`}
          >
            {property.title}
          </Link>
        </h3>

        {/* --------------------------------------------------------
            LOCATION
        --------------------------------------------------------- */}

        <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-600" />

          <span className="truncate">
            {location || 'Location available'}
          </span>
        </div>

        {/* ========================================================
            PROPERTY FACTS
        ========================================================= */}

        <div className="mt-4 grid grid-cols-2 overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
          <div className="border-r border-slate-100 px-3 py-2.5">
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
              Area
            </p>

            <div className="mt-1 flex items-center gap-1.5">
              <Maximize2 className="h-3.5 w-3.5 text-slate-500" />

              <p className="text-xs font-black text-slate-800">
                {formatArea(
                  property.landAreaYards,
                )}{' '}
                <span className="font-medium text-slate-500">
                  sq.yd
                </span>
              </p>
            </div>
          </div>

          <div className="px-3 py-2.5">
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
              Road access
            </p>

            <div className="mt-1 flex items-center gap-1.5">
              <Route className="h-3.5 w-3.5 text-slate-500" />

              <p className="truncate text-xs font-black text-slate-800">
                {property.roadAccess ||
                  'Not specified'}
              </p>
            </div>
          </div>
        </div>

        {/* ========================================================
            TRUST SIGNAL
        ========================================================= */}

        {isVerified && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2">
            <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-600" />

            <p className="text-[10px] font-bold leading-4 text-emerald-800">
              BhoomiMitra verified listing
            </p>
          </div>
        )}

        {/* ========================================================
            FOOTER
        ========================================================= */}

        <div className="mt-auto pt-4">
          <div className="flex items-center justify-between border-t border-slate-100 pt-3">
            <div className="min-w-0">
              {listedDate && (
                <p className="text-[10px] text-slate-400">
                  Listed {listedDate}
                </p>
              )}
            </div>

            <Link
              href={`/properties/${property._id}`}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-black text-emerald-700 transition-colors hover:bg-emerald-50 hover:text-emerald-800"
            >
              View details

              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}