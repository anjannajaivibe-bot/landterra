/**
 * app/properties/[id]/page.tsx
 *
 * SERVER COMPONENT — no 'use client' directive.
 *
 * Responsibilities:
 *  1. Export `generateMetadata` so Next.js can build property-specific
 *     <title>, <meta description>, and Open Graph tags at request time.
 *     This fixes the P0 audit finding F-1 where social previews and
 *     initial crawler requests received only generic BhoomiMitra branding.
 *
 *  2. Render <PropertyDetailsClient /> which contains the full interactive
 *     property page (the existing 'use client' component, unchanged).
 *
 * Data fetching strategy:
 *  - `generateMetadata` does a lightweight server-side fetch of only
 *    title, description, images, location, and price — enough for metadata.
 *  - The client component does its own fetch inside useEffect, as before.
 *  - Both calls hit the same MongoDB collection; the overhead is minimal
 *    and the separation keeps the interactive component fully self-contained.
 */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import PropertyDetailsClient from './PropertyDetailsClient';
import { getPropertyById } from '@/services/property.service';
import { connectToDatabase } from '@/lib/db/mongodb';

/* ================================================================
   HELPERS (server-side only, no browser APIs)
================================================================ */

function formatCompactCurrencyServer(value: number): string {
  if (!Number.isFinite(value)) return 'Price on request';
  if (value >= 10000000) {
    const crores = value / 10000000;
    return `₹${crores.toFixed(Number.isInteger(crores) ? 0 : 1)} Cr`;
  }
  if (value >= 100000) {
    const lakhs = value / 100000;
    return `₹${lakhs.toFixed(Number.isInteger(lakhs) ? 0 : 1)} L`;
  }
  return `₹${value.toLocaleString('en-IN')}`;
}

function formatLandTypeServer(value?: string): string {
  if (!value) return 'Land';
  return value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

/**
 * Fetches only the fields needed for metadata.
 * Returns null if the property is not publicly visible (draft, deleted, etc.)
 * or if MongoDB is unavailable.
 */
async function fetchPropertyForMetadata(id: string) {
  try {
    // Validate ObjectId format before hitting the DB (avoids CastError logs)
    if (!/^[0-9a-fA-F]{24}$/.test(id)) return null;

    await connectToDatabase();
    const property = await getPropertyById(id);
    if (!property) return null;

    // Only expose metadata for publicly visible listings
    const isPubliclyVisible =
      property.listingStatus === 'PUBLISHED' ||
      property.listingStatus === 'EXPIRING_SOON';

    if (!isPubliclyVisible) return null;

    return property;
  } catch {
    // If DB is down during a crawler request, fall back to generic metadata
    // rather than crashing the page. The client component handles its own errors.
    return null;
  }
}

/* ================================================================
   GENERATE METADATA
================================================================ */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || 'https://bhoomimitra.com';

  const property = await fetchPropertyForMetadata(id);

  if (!property) {
    // Graceful fallback — page will render a 404-style message client-side
    return {
      title: 'Property Not Found | BhoomiMitra',
      description:
        'This listing may have been removed, sold, paused, or is no longer available on BhoomiMitra.',
      robots: { index: false, follow: false },
    };
  }

  /* ---- Build metadata strings ---- */

  const landType   = formatLandTypeServer(property.landType);
  const price      = formatCompactCurrencyServer(property.totalPrice);
  const city       = property.location?.city || '';
  const state      = property.location?.state || '';
  const locationStr = [city, state].filter(Boolean).join(', ');

  const title = property.title
    ? `${property.title} | BhoomiMitra`
    : `${landType} for Sale in ${locationStr} | BhoomiMitra`;

  // Build a concise, keyword-rich description (max 160 chars)
  const descriptionBody = property.description
    ? property.description.replace(/\s+/g, ' ').trim().slice(0, 110)
    : `${landType} for sale in ${locationStr}.`;
  const description = `${price} · ${descriptionBody} — Direct listing on BhoomiMitra, India's property marketplace.`;

  /* ---- Open Graph image ---- */

  const ogImage = property.images?.[0]?.secureUrl;
  const ogImages = ogImage
    ? [{ url: ogImage, width: 1200, height: 630, alt: property.title }]
    : [{ url: `${baseUrl}/og-image.png`, width: 1200, height: 630, alt: 'BhoomiMitra' }];

  /* ---- Canonical URL ---- */

  const canonicalUrl = `${baseUrl}/properties/${id}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: 'website',
      url: canonicalUrl,
      siteName: 'BhoomiMitra',
      title,
      description,
      locale: 'en_IN',
      images: ogImages,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImages.map((img) => img.url),
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

/* ================================================================
   PAGE COMPONENT
================================================================ */

export default async function PropertyDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Validate ObjectId format at the server level so Next.js can emit a proper
  // 404 immediately (before the client component mounts) when an obviously
  // invalid ID is provided.
  const { id } = await params;
  if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
    notFound();
  }

  const property = await fetchPropertyForMetadata(id);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://bhoomimitra.com';

  const propertyCategory = formatLandTypeServer(property?.landType);
  const isResidential =
    property?.propertyType?.toUpperCase() === 'RESIDENTIAL' ||
    property?.landType?.toUpperCase() === 'RESIDENTIAL' ||
    property?.landType?.toUpperCase() === 'VILLA' ||
    property?.landType?.toUpperCase() === 'APARTMENT';

  const schemaPropertyType = isResidential ? 'SingleFamilyResidence' : 'Place';

  const jsonLd = property
    ? {
        '@context': 'https://schema.org',
        '@type': 'RealEstateListing',
        name: property.title,
        description: property.description,
        url: `${baseUrl}/properties/${id}`,
        datePosted: property.publishedAt || property.createdAt,
        mainEntity: {
          '@type': schemaPropertyType,
          name: property.title,
          description: property.description,
          image: property.images?.map((img) => img.secureUrl).filter(Boolean) || [],
          address: {
            '@type': 'PostalAddress',
            streetAddress: property.location?.address || '',
            addressLocality: property.location?.city || '',
            addressRegion: property.location?.state || '',
            postalCode: property.location?.pincode || '',
            addressCountry: 'IN',
          },
          ...(property.latitude && property.longitude
            ? {
                geo: {
                  '@type': 'GeoCoordinates',
                  latitude: property.latitude,
                  longitude: property.longitude,
                },
              }
            : {}),
          floorSize: {
            '@type': 'QuantitativeValue',
            value: property.landAreaYards,
            unitText: 'sq yd',
          },
        },
        offers: {
          '@type': 'Offer',
          price: property.totalPrice,
          priceCurrency: 'INR',
          availability: 'https://schema.org/InStock',
          validFrom: property.publishedAt || property.createdAt,
          priceSpecification: {
            '@type': 'UnitPriceSpecification',
            price: property.pricePerYard,
            priceCurrency: 'INR',
            unitText: 'sq yd',
          },
          url: `${baseUrl}/properties/${id}`,
        },
        category: propertyCategory,
        image: property.images?.map((img) => img.secureUrl).filter(Boolean) || [],
        additionalProperty: [
          {
            '@type': 'PropertyValue',
            name: 'Land Area',
            value: `${property.landAreaYards} sq. yd`,
          },
          {
            '@type': 'PropertyValue',
            name: 'Price Per Yard',
            value: `₹${property.pricePerYard}`,
          },
          ...(property.cornerPlot
            ? [
                {
                  '@type': 'PropertyValue',
                  name: 'Corner Plot',
                  value: 'Yes',
                },
              ]
            : []),
          ...(property.gatedCommunity
            ? [
                {
                  '@type': 'PropertyValue',
                  name: 'Gated Community',
                  value: 'Yes',
                },
              ]
            : []),
        ],
      }
    : null;

  /*
   * The interactive property page is a client component.
   * It performs its own data fetch on mount (existing behaviour).
   * We inject the schema.org JSON-LD for search crawlers alongside the client component.
   */
  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <PropertyDetailsClient />
    </>
  );
}