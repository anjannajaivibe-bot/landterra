'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
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

  const [calcArea, setCalcArea] = useState(300);

  const listingFee = calcArea * 10;

  useEffect(() => {
    let cancelled = false;

    async function loadProperties() {
      try {
        const response = await fetch('/api/properties?limit=8', {
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error('Failed to load properties');
        }

        const result = await response.json();

        if (!cancelled && Array.isArray(result?.data)) {
          setProperties(result.data);
        }
      } catch (error) {
        console.error('Failed to load homepage properties:', error);

        if (!cancelled) {
          setProperties([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProperties();

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
    <div className="min-h-screen bg-white text-slate-900">
      <Navbar />

      {/* =========================================================
          HERO — FIND LAND FIRST
      ========================================================= */}
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0">
          <div className="absolute -top-40 left-1/2 h-[520px] w-[800px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:48px_48px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-14 sm:px-6 sm:pb-24 sm:pt-20 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            {/* Trust label */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-semibold text-emerald-300">
              <ShieldCheck className="h-4 w-4" />
              <span>Land marketplace with administrative verification</span>
            </div>

            {/* Main headline */}
            <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
              Find the right land.
              <br />
              <span className="text-emerald-400">
                Deal directly with the seller.
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              Search land listings by location, land type, area and price.
              Review listing information, save properties you like, and
              contact sellers directly.
            </p>

            {/* Search box */}
            <div className="mx-auto mt-10 max-w-5xl">
              <form
                onSubmit={handleSearch}
                className="rounded-2xl border border-white/10 bg-white p-3 text-left shadow-2xl"
              >
                <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                  {/* Location */}
                  <div className="md:col-span-6">
                    <label
                      htmlFor="home-location"
                      className="mb-1.5 block px-1 text-[11px] font-bold uppercase tracking-wider text-slate-500"
                    >
                      Where do you want land?
                    </label>

                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-emerald-600" />

                      <input
                        id="home-location"
                        type="text"
                        value={searchLocation}
                        onChange={(event) =>
                          setSearchLocation(event.target.value)
                        }
                        placeholder="City, locality or area"
                        className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      />
                    </div>
                  </div>

                  {/* Land type */}
                  <div className="md:col-span-4">
                    <label
                      htmlFor="home-land-type"
                      className="mb-1.5 block px-1 text-[11px] font-bold uppercase tracking-wider text-slate-500"
                    >
                      Land type
                    </label>

                    <select
                      id="home-land-type"
                      value={selectedLandType}
                      onChange={(event) =>
                        setSelectedLandType(event.target.value)
                      }
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

                  {/* Search */}
                  <div className="flex items-end md:col-span-2">
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

            {/* Secondary CTA */}
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/buy"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-900 transition hover:bg-slate-100"
              >
                Browse all land
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="/sell"
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Sell your land
                <ArrowRight className="h-4 w-4 text-emerald-400" />
              </Link>
            </div>
          </div>

          {/* Trust points */}
          <div className="mx-auto mt-14 grid max-w-4xl grid-cols-1 gap-3 sm:grid-cols-3">
            <TrustPoint
              icon={<Search className="h-4 w-4" />}
              title="Search freely"
              description="Browse available listings without creating an account."
            />

            <TrustPoint
              icon={<FileCheck2 className="h-4 w-4" />}
              title="Verification information"
              description="See the verification status provided for each listing."
            />

            <TrustPoint
              icon={<ShieldCheck className="h-4 w-4" />}
              title="Direct seller contact"
              description="Send an inquiry directly through the platform."
            />
          </div>
        </div>
      </section>

      {/* =========================================================
          FEATURED LAND
      ========================================================= */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700">
              <Sparkles className="h-4 w-4" />
              Featured listings
            </div>

            <h2 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              Land worth exploring
            </h2>

            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
              Explore available land listings and compare the details before
              deciding which properties you want to investigate further.
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
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {featuredProperties.map((property) => (
              <PropertyCard key={property._id} property={property} />
            ))}
          </div>
        ) : (
          <EmptyPropertiesState />
        )}
      </section>

      {/* =========================================================
          WHY LANDTERRA
      ========================================================= */}
      <section className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Why use LandTerra?
            </span>

            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
              Built around a simpler land search
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              The goal is straightforward: make it easier to discover land,
              understand the listing, and connect with the seller without
              unnecessary friction.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
            <FeatureCard
              icon={<Filter className="h-5 w-5" />}
              title="Search the way you need"
              description="Filter listings by location, land type, area, price and other available listing information."
            />

            <FeatureCard
              icon={<FileCheck2 className="h-5 w-5" />}
              title="Know the listing status"
              description="Verified listings go through an administrative document review before receiving the verified status."
            />

            <FeatureCard
              icon={<WalletCards className="h-5 w-5" />}
              title="Direct seller connection"
              description="Send an inquiry through LandTerra instead of going through a traditional brokerage process."
            />
          </div>
        </div>
      </section>

      {/* =========================================================
          RECENT LISTINGS
      ========================================================= */}
      {recentProperties.length > 0 && (
        <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                Recently listed
              </span>

              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                New land listings
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Recently added properties on the marketplace.
              </p>
            </div>

            <Link
              href="/buy"
              className="hidden items-center gap-2 text-sm font-bold text-slate-900 transition hover:text-emerald-700 sm:inline-flex"
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
        </section>
      )}

      {/* =========================================================
          HOW IT WORKS
      ========================================================= */}
      <section className="bg-white px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              How it works
            </span>

            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
              From search to seller
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              A simple process for both sides of the marketplace.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-2">
            {/* Buyer */}
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-7 sm:p-8">
              <div className="mb-7 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white">
                  <Search className="h-5 w-5" />
                </div>

                <div>
                  <h3 className="text-lg font-black text-slate-950">
                    Looking for land?
                  </h3>
                  <p className="text-xs text-slate-500">
                    Find and evaluate listings.
                  </p>
                </div>
              </div>

              <div className="space-y-5">
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
                  description="Send an inquiry directly through LandTerra."
                />
              </div>

              <Link
                href="/buy"
                className="mt-8 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                Start finding land
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Seller */}
            <div className="rounded-3xl border border-emerald-100 bg-emerald-50/60 p-7 sm:p-8">
              <div className="mb-7 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white">
                  <LandPlot className="h-5 w-5" />
                </div>

                <div>
                  <h3 className="text-lg font-black text-slate-950">
                    Want to sell land?
                  </h3>
                  <p className="text-xs text-slate-500">
                    Create a listing and reach buyers.
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                <Step
                  number="01"
                  title="Sign in"
                  description="Create or access your LandTerra account with Google."
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
                  description="Pay the ₹10 per sq. yard monthly listing fee and submit for the platform's verification workflow."
                />
              </div>

              <Link
                href="/sell"
                className="mt-8 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-500"
              >
                List your land
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          SELLER PRICING / FEE
      ========================================================= */}
      <section className="bg-slate-950 px-4 py-16 text-white sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-300">
              <WalletCards className="h-3.5 w-3.5" />
              Seller pricing
            </span>

            <h2 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">
              A simple listing fee.
              <br />
              <span className="text-emerald-400">
                No percentage of your land price.
              </span>
            </h2>

            <p className="mt-5 max-w-xl text-sm leading-7 text-slate-300">
              LandTerra charges ₹10 per square yard for a 30-day listing
              subscription. Your land&apos;s asking price is completely
              separate and remains under your control.
            </p>

            <div className="mt-7 space-y-3">
              <Bullet text="You set your own asking price." />
              <Bullet text="You can mark the price as negotiable." />
              <Bullet text="The listing fee is calculated from land area." />
              <Bullet text="Renew your listing when the 30-day period ends." />
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl sm:p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Listing fee estimator
                </p>

                <h3 className="mt-1 text-lg font-bold text-white">
                  How much will you pay?
                </h3>
              </div>

              <span className="rounded-lg bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-300">
                ₹10 / sq.yd
              </span>
            </div>

            <div className="mt-8">
              <div className="mb-3 flex items-center justify-between">
                <label
                  htmlFor="fee-area"
                  className="text-sm font-medium text-slate-300"
                >
                  Land area
                </label>

                <span className="text-lg font-black text-emerald-400">
                  {calcArea.toLocaleString('en-IN')} sq.yd
                </span>
              </div>

              <input
                id="fee-area"
                type="range"
                min={50}
                max={5000}
                step={10}
                value={calcArea}
                onChange={(event) =>
                  setCalcArea(Number(event.target.value))
                }
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-700 accent-emerald-500"
              />

              <div className="mt-2 flex justify-between text-[11px] text-slate-500">
                <span>50</span>
                <span>2,500</span>
                <span>5,000 sq.yd</span>
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-white/10 bg-black/20 p-5">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs text-slate-400">
                    30-day listing subscription
                  </p>

                  <p className="mt-1 text-3xl font-black text-white">
                    ₹{listingFee.toLocaleString('en-IN')}
                  </p>
                </div>

                <p className="text-right text-xs text-slate-500">
                  {calcArea.toLocaleString('en-IN')} × ₹10
                </p>
              </div>
            </div>

            <Link
              href="/sell"
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-emerald-500"
            >
              Start listing
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================================
          VERIFICATION / TRUST
      ========================================================= */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-10">
            <div className="grid gap-10 lg:grid-cols-[1fr_1.5fr] lg:items-center">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700">
                  <ShieldCheck className="h-4 w-4" />
                  Verification
                </div>

                <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                  Know what has been reviewed.
                </h2>

                <p className="mt-4 text-sm leading-7 text-slate-600">
                  LandTerra separates listing payment from property
                  verification. A paid listing does not automatically mean
                  the property is verified.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
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
                  description="See whether a listing is verified, pending or otherwise unavailable."
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          FINAL CTA
      ========================================================= */}
      <section className="bg-emerald-600 px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
              Looking for land?
            </h2>

            <p className="mt-2 max-w-xl text-sm leading-6 text-emerald-50">
              Start with the marketplace. Search by location, compare
              listings and find properties that match what you need.
            </p>
          </div>

          <Link
            href="/buy"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-black text-emerald-700 transition hover:bg-emerald-50"
          >
            Find Land
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}

/* ===============================================================
   SMALL UI COMPONENTS
=============================================================== */

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
    <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 backdrop-blur-sm">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-300">
          {icon}
        </div>

        <div>
          <h3 className="text-sm font-bold text-white">{title}</h3>

          <p className="mt-1 text-xs leading-5 text-slate-400">
            {description}
          </p>
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
    <div className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
        {icon}
      </div>

      <h3 className="mt-5 text-base font-bold text-slate-950">{title}</h3>

      <p className="mt-2 text-sm leading-6 text-slate-600">
        {description}
      </p>
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
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[11px] font-black text-slate-700 shadow-sm ring-1 ring-slate-200">
        {number}
      </div>

      <div>
        <h4 className="text-sm font-bold text-slate-950">{title}</h4>

        <p className="mt-1 text-xs leading-5 text-slate-600">
          {description}
        </p>
      </div>
    </div>
  );
}

function Bullet({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2.5 text-sm text-slate-300">
      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
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
    <div className="rounded-2xl bg-slate-50 p-5">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
        <CheckCircle2 className="h-4 w-4" />
      </div>

      <h3 className="text-sm font-bold text-slate-950">{title}</h3>

      <p className="mt-1.5 text-xs leading-5 text-slate-600">
        {description}
      </p>
    </div>
  );
}

function PropertySkeletonGrid({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
        >
          <div className="h-56 animate-pulse bg-slate-200" />

          <div className="space-y-3 p-5">
            <div className="h-5 w-3/4 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
            <div className="h-10 w-full animate-pulse rounded-xl bg-slate-200" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyPropertiesState() {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
        <LandPlot className="h-6 w-6" />
      </div>

      <h3 className="mt-5 text-lg font-bold text-slate-950">
        No listings available yet
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        New land listings will appear here once properties are published on
        the marketplace.
      </p>

      <Link
        href="/sell"
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-500"
      >
        List your land
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}