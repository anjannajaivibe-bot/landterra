"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, ChevronRight, LandPlot, ArrowRight } from "lucide-react";
import { IProperty } from "@/types/property";
import { PropertyCard } from "@/components/properties/PropertyCard";

export interface FeaturedPropertiesSectionProps {
  properties: IProperty[];
  loading: boolean;
  onRequireLogin: () => void;
}

export function FeaturedPropertiesSection({
  properties,
  loading,
  onRequireLogin,
}: FeaturedPropertiesSectionProps) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
              Featured Property Classifieds
            </h2>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#fff1dc] text-[#c75e0a] text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-[#FF9933]" />
              <span>Direct Seller Contact • 0% Platform Brokerage</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Published listings from individual, company, and agent sellers
          </p>
        </div>

        <Link
          href="/buy"
          className="inline-flex items-center gap-1 text-xs font-bold text-[#c75e0a] hover:text-[#FF9933] hover:underline"
        >
          <span>View All Properties</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="rounded-3xl border border-slate-200 bg-white p-4 space-y-3 animate-pulse"
            >
              <div className="h-44 bg-slate-100 rounded-2xl" />
              <div className="h-4 bg-slate-100 rounded w-3/4" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
              <div className="h-9 bg-slate-100 rounded-xl" />
            </div>
          ))}
        </div>
      ) : properties.length === 0 ? (
        /* Clean, elegant real empty state without any fake/demo cards */
        <div className="p-10 sm:p-14 text-center bg-gradient-to-b from-[#fffbf5] to-white rounded-3xl border border-dashed border-[#FF9933]/40 space-y-4 max-w-2xl mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-white text-[#FF9933] border border-[#FF9933]/30 shadow-xs flex items-center justify-center mx-auto">
            <LandPlot className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-extrabold text-slate-900">
              No Active Property Listings Published Yet
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Be the first seller to list your plot, home, commercial space, or other eligible property. Reach buyers and tenants across India through direct seller contact.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/sell"
              prefetch={false}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#FF9933] text-white text-xs font-extrabold shadow-md hover:bg-[#f07d12] transition-colors"
            >
              <span>Post Your Property Listing Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-5 sm:gap-6">
          {properties.map((property) => (
            <PropertyCard
              key={property._id}
              property={property}
              priority={false}
              onRequireLogin={onRequireLogin}
            />
          ))}
        </div>
      )}
    </section>
  );
}
