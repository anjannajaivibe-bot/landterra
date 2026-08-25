'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  FileCheck2,
  Filter,
  LandPlot,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  WalletCards,
} from 'lucide-react';

import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PropertyCard } from '@/components/properties/PropertyCard';
import { IProperty } from '@/types/property';
import { LAND_TYPES } from '@/config/constants';

export default function HomePage() {
  const [properties, setProperties] = useState<IProperty[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchLocation, setSearchLocation] = useState('');
  const [selectedLandType, setSelectedLandType] = useState('ALL');

  const [publicListingFee, setPublicListingFee] = useState(10);
  const [listingDurationDays, setListingDurationDays] = useState(30);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const [propsRes, settingsRes] = await Promise.all([
          fetch('/api/properties?limit=8', { cache: 'no-store' }),
          fetch('/api/settings/public', { cache: 'no-store' }).catch(() => null),
        ]);

        if (settingsRes?.ok) {
          const s = await settingsRes.json();
          if (!cancelled && typeof s.listingFeeAmount === 'number') {
            setPublicListingFee(s.listingFeeAmount);
          }
          if (!cancelled && typeof s.listingFeeDurationDays === 'number') {
            setListingDurationDays(s.listingFeeDurationDays);
          }
        }

        if (propsRes.ok) {
          const result = await propsRes.json();
          if (!cancelled && Array.isArray(result?.data)) {
            setProperties(result.data);
          }
        }
      } catch (error) {
        console.error('Failed to load homepage data:', error);
        if (!cancelled) {
          setProperties([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  const featuredProperties = properties.slice(0, 3);
  const recentProperties = properties.slice(3, 8);

  function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const params = new URLSearchParams();
    const location = searchLocation.trim();

    if (location) {
      params.set('city', location);
    }

    if (selectedLandType !== 'ALL') {
      params.set('landType', selectedLandType);
    }

    const query = params.toString();
    window.location.href = query ? `/buy?${query}` : '/buy';
  }

  return (
    <div className="min-h-screen bg-[#f8faf9] text-slate-900">
      <Navbar />

      {/* ═══════════════════════════════════════════════════════
          HERO — Trust-first dark green
      ═══════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-[#0c1f17] text-white">
        {/* Soft trust glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 left-1/2 h-[480px] w-[900px] -translate-x-1/2 rounded-full bg-emerald-500/15 blur-[100px]" />
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#0c1f17] to-transparent" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:56px_56px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-16 sm:px-6 sm:pb-28 sm:pt-20 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-4 py-2 text-xs font-semibold tracking-wide text-emerald-300">
              <ShieldCheck className="h-4 w-4" />
              Land marketplace with administrative verification
            </div>

            <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl lg:leading-[1.08]">
              Find the right land.
              <br />
              <span className="text-emerald-400">
                Deal directly with the seller.
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-emerald-50/70 sm:text-lg">
              Search by location and land type. Review verification status,
              save properties you like, and contact sellers directly.
            </p>

            {/* Search card */}
            <div className="mx-auto mt-12 max-w-3xl">
              <form
                onSubmit={handleSearch}
                className="rounded-2xl border border-white/10 bg-white p-4 shadow-2xl shadow-black/20 sm:p-5"
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
                  <div className="sm:col-span-5">
                    <label
                      htmlFor="home-location"
                      className="mb-2 block px-0.5 text-[11px] font-bold uppercase tracking-wider text-slate-500"
                    >
                      Where do you want land?
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-emerald-600" />
                      <input
                        id="home-location"
                        type="text"
                        value={searchLocation}
                        onChange={(e) => setSearchLocation(e.target.value)}
                        placeholder="City, locality or area"
                        className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-4">
                    <label
                      htmlFor="home-land-type"
                      className="mb-2 block px-0.5 text-[11px] font-bold uppercase tracking-wider text-slate-500"
                    >
                      Land type
                    </label>
                    <select
                      id="home-land-type"
                      value={selectedLandType}
                      onChange={(e) => setSelectedLandType(e.target.value)}
                      className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    >
                      <option value="ALL">All land types</option>
                      {LAND_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-end sm:col-span-3">
                    <button
                      type="submit"
                      className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white transition hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2"
                    >
                      <Search className="h-4 w-4" />
                      Search
                    </button>
                  </div>
                </div>
              </form>
            </div>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <Link
                href="/buy"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-slate-900 shadow-sm transition hover:bg-emerald-50"
              >
                Browse all land
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/sell"
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Sell your land
                <ArrowRight className="h-4 w-4 text-emerald-400" />
              </Link>
            </div>
          </div>

          {/* Trust points — larger cards */}
          <div className="mx-auto mt-16 grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-3">
            <TrustPoint
              icon={<Search className="h-5 w-5" />}
              title="Search freely"
              description="Browse available listings without creating an account."
            />
            <TrustPoint
              icon={<FileCheck2 className="h-5 w-5" />}
              title="Verification status"
              description="See the review status provided for each listing."
            />
            <TrustPoint
              icon={<ShieldCheck className="h-5 w-5" />}
              title="Direct seller contact"
              description="Send an inquiry directly through the platform."
            />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          FEATURED LAND
      ═══════════════════════════════════════════════════════ */}
      <section className="bg-[#f8faf9]">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700">
                <Sparkles className="h-4 w-4" />
                Featured listings
              </div>
              <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Land worth exploring
              </h2>
              <p className="mt-3 max-w-lg text-base leading-7 text-slate-600">
                Compare available listings and decide which properties you want
                to investigate further.
              </p>
            </div>
            <Link
              href="/buy"
              className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700 transition hover:text-emerald-800"
            >
              View all listings
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {loading ? (
            <PropertySkeletonGrid count={3} />
          ) : featuredProperties.length > 0 ? (
            <div className="grid grid-cols-1 gap-7 md:grid-cols-3">
              {featuredProperties.map((property) => (
                <PropertyCard key={property._id} property={property} />
              ))}
            </div>
          ) : (
            <EmptyPropertiesState />
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          WHY BHOOMIMITRA
      ═══════════════════════════════════════════════════════ */}
      <section className="border-y border-emerald-900/5 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Why use BhoomiMitra?
            </span>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Built around a simpler land search
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Discover land, understand the listing, and connect with the seller
              without unnecessary friction.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
            <FeatureCard
              icon={<Filter className="h-6 w-6" />}
              title="Search the way you need"
              description="Filter by location, land type, area, price and other available listing information."
            />
            <FeatureCard
              icon={<FileCheck2 className="h-6 w-6" />}
              title="Know the listing status"
              description="Verified listings go through an administrative document review before receiving the verified badge."
            />
            <FeatureCard
              icon={<WalletCards className="h-6 w-6" />}
              title="Direct seller connection"
              description="Send an inquiry through BhoomiMitra instead of going through a traditional brokerage process."
            />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          RECENT LISTINGS
      ═══════════════════════════════════════════════════════ */}
      {recentProperties.length > 0 && (
        <section className="bg-[#f8faf9]">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
            <div className="mb-10 flex items-end justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                  Recently listed
                </span>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                  New land listings
                </h2>
                <p className="mt-3 text-base text-slate-600">
                  Recently added properties on the marketplace.
                </p>
              </div>
              <Link
                href="/buy"
                className="hidden items-center gap-2 text-sm font-bold text-slate-800 transition hover:text-emerald-700 sm:inline-flex"
              >
                Explore marketplace
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {recentProperties.map((property) => (
                <PropertyCard key={property._id} property={property} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════
          HOW IT WORKS
      ═══════════════════════════════════════════════════════ */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              How it works
            </span>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              From search to seller
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              A simple process for both sides of the marketplace.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Buyer */}
            <div className="rounded-3xl border border-slate-200/80 bg-[#f8faf9] p-8 sm:p-10">
              <div className="mb-8 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
                  <Search className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-950">
                    Looking for land?
                  </h3>
                  <p className="mt-0.5 text-sm text-slate-500">
                    Find and evaluate listings
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <Step
                  number="01"
                  title="Search"
                  description="Choose your location, land type, budget and area."
                />
                <Step
                  number="02"
                  title="Compare listings"
                  description="Review price, area, location, photos and verification status."
                />
                <Step
                  number="03"
                  title="Open the property"
                  description="Sign in when required to access protected property details."
                />
                <Step
                  number="04"
                  title="Contact the seller"
                  description="Send an inquiry directly through BhoomiMitra."
                />
              </div>

              <Link
                href="/buy"
                className="mt-10 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                Start finding land
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Seller */}
            <div className="rounded-3xl border border-emerald-200/60 bg-emerald-50/50 p-8 sm:p-10">
              <div className="mb-8 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white">
                  <LandPlot className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-950">
                    Want to sell land?
                  </h3>
                  <p className="mt-0.5 text-sm text-slate-500">
                    Create a listing and reach buyers
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <Step
                  number="01"
                  title="Sign in"
                  description="Create or access your BhoomiMitra account with Google."
                />
                <Step
                  number="02"
                  title="Verify your phone"
                  description="Complete phone OTP verification when required."
                />
                <Step
                  number="03"
                  title="Create your listing"
                  description="Add land details, asking price, photos and a Google Maps share link."
                />
                <Step
                  number="04"
                  title="Pay and submit"
                  description="Pay the flat listing publishing fee and submit for the platform’s verification workflow."
                />
              </div>

              <Link
                href="/sell"
                className="mt-10 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-emerald-500"
              >
                List your land
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SELLER PRICING
      ═══════════════════════════════════════════════════════ */}
      <section className="bg-[#0c1f17] text-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
          <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-16">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-bold text-emerald-300">
                <WalletCards className="h-3.5 w-3.5" />
                Seller pricing
              </span>

              <h2 className="mt-6 text-3xl font-black tracking-tight sm:text-4xl">
                A simple listing fee.
                <br />
                <span className="text-emerald-400">
                  No percentage of your land price.
                </span>
              </h2>

              <p className="mt-6 max-w-lg text-base leading-7 text-emerald-50/70">
                BhoomiMitra charges a flat listing publishing fee for a{' '}
                {listingDurationDays}-day listing subscription. Your land’s
                asking price remains completely under your control.
              </p>

              <div className="mt-8 space-y-4">
                <Bullet text="You set your own asking price." />
                <Bullet text="You can mark the price as negotiable." />
                <Bullet
                  text={`Transparent flat listing fee: ₹${publicListingFee} for ${listingDurationDays} days.`}
                />
                <Bullet text="Renew your listing when the publishing period ends." />
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-8 shadow-2xl sm:p-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Universal pricing
                  </p>
                  <h3 className="mt-1 text-xl font-bold text-white">
                    Flat publishing fee
                  </h3>
                </div>
                <span className="rounded-lg bg-emerald-400/10 px-3.5 py-1.5 text-xs font-bold text-emerald-300">
                  ₹{publicListingFee} / {listingDurationDays} days
                </span>
              </div>

              <div className="mt-8 rounded-2xl border border-white/10 bg-black/25 p-7">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-semibold text-slate-300">
                    {listingDurationDays}-day listing pass
                  </span>
                  <span className="text-4xl font-black text-emerald-400">
                    ₹{publicListingFee.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="mt-5 space-y-3 border-t border-white/10 pt-5 text-sm text-slate-400">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                    Unlimited plot size & any price tier
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                    Direct inquiries from verified buyers
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                    Human-verified title & survey badge option
                  </div>
                </div>
              </div>

              <Link
                href="/sell"
                className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-4 text-sm font-bold text-white transition hover:bg-emerald-500"
              >
                Start listing
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          VERIFICATION / TRUST
      ═══════════════════════════════════════════════════════ */}
      <section className="bg-[#f8faf9]">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-8 shadow-sm sm:p-12">
            <div className="grid gap-12 lg:grid-cols-[1fr_1.5fr] lg:items-center">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700">
                  <ShieldCheck className="h-4 w-4" />
                  Verification
                </div>
                <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                  Know what has been reviewed
                </h2>
                <p className="mt-5 text-base leading-7 text-slate-600">
                  BhoomiMitra separates listing payment from property
                  verification. A paid listing does not automatically mean the
                  property is verified.
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-3">
                <TrustCard
                  title="Listing information"
                  description="Review the information supplied by the seller."
                />
                <TrustCard
                  title="Document review"
                  description="Verified listings undergo an administrative review process."
                />
                <TrustCard
                  title="Clear status"
                  description="See whether a listing is verified, pending or unavailable."
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          FINAL CTA
      ═══════════════════════════════════════════════════════ */}
      <section className="bg-emerald-600">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-4 py-16 sm:flex-row sm:items-center sm:px-6 sm:py-20 lg:px-8">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
              Looking for land?
            </h2>
            <p className="mt-3 max-w-xl text-base leading-7 text-emerald-50">
              Start with the marketplace. Search by location, compare listings
              and find properties that match what you need.
            </p>
          </div>
          <Link
            href="/buy"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-black text-emerald-700 shadow-sm transition hover:bg-emerald-50"
          >
            Find land
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SMALL UI COMPONENTS
═══════════════════════════════════════════════════════════ */

function TrustPoint({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur-sm">
      <div className="flex items-start gap-4">
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300">
          {icon}
        </div>
        <div>
          <h3 className="text-base font-bold text-white">{title}</h3>
          <p className="mt-1.5 text-sm leading-6 text-slate-400">{description}</p>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-[#f8faf9] p-8 transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
        {icon}
      </div>
      <h3 className="mt-6 text-lg font-bold text-slate-950">{title}</h3>
      <p className="mt-3 text-base leading-7 text-slate-600">{description}</p>
    </div>
  );
}

function Step({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-xs font-black text-slate-700 shadow-sm ring-1 ring-slate-200">
        {number}
      </div>
      <div>
        <h4 className="text-base font-bold text-slate-950">{title}</h4>
        <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
      </div>
    </div>
  );
}

function Bullet({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 text-base text-emerald-50/80">
      <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
      <span>{text}</span>
    </div>
  );
}

function TrustCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl bg-[#f8faf9] p-6">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
        <CheckCircle2 className="h-5 w-5" />
      </div>
      <h3 className="text-base font-bold text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}

function PropertySkeletonGrid({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-1 gap-7 md:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
        >
          <div className="h-56 animate-pulse bg-slate-200" />
          <div className="space-y-3 p-6">
            <div className="h-5 w-3/4 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
            <div className="h-11 w-full animate-pulse rounded-xl bg-slate-200" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyPropertiesState() {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-8 py-20 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f8faf9] text-slate-400 shadow-sm">
        <LandPlot className="h-7 w-7" />
      </div>
      <h3 className="mt-6 text-xl font-bold text-slate-950">
        No listings available yet
      </h3>
      <p className="mx-auto mt-3 max-w-md text-base leading-7 text-slate-500">
        New land listings will appear here once properties are published on the
        marketplace.
      </p>
      <Link
        href="/sell"
        className="mt-8 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-emerald-500"
      >
        List your land
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}