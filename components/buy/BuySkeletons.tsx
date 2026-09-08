'use client';

import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export function PropertyCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-2xs flex flex-col md:flex-row">
      <div className="w-full md:w-[320px] lg:w-[360px] xl:w-[380px] aspect-[16/10] md:aspect-auto min-h-[220px] md:min-h-[260px] shrink-0 shimmer" />
      <div className="flex flex-1 flex-col justify-between p-5 sm:p-6 space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-5 w-36 rounded-full shimmer" />
            <div className="h-7 w-32 rounded-xl shimmer" />
          </div>
          <div className="h-6 w-3/4 rounded-lg shimmer" />
          <div className="h-4 w-1/2 rounded-md shimmer" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 rounded-2xl bg-slate-50 p-3">
          <div className="h-10 rounded-xl shimmer-light" />
          <div className="h-10 rounded-xl shimmer-light" />
          <div className="h-10 rounded-xl shimmer-light col-span-2 sm:col-span-1" />
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div className="h-4 w-36 rounded-md shimmer" />
          <div className="h-9 w-28 rounded-xl shimmer" />
        </div>
      </div>
    </div>
  );
}

export function BuyPageSkeleton() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />

      {/* Hero / Search Section Skeleton */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-[#fffbf5] to-slate-50 py-10 sm:py-14 border-b border-slate-200/80">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl space-y-4 text-center flex flex-col items-center">
            <div className="h-7 w-52 rounded-full shimmer bg-[#fff1dc] border border-[#FF9933]/30" />
            <div className="h-9 sm:h-11 w-4/5 max-w-xl rounded-2xl shimmer bg-slate-200" />
            <div className="h-4 w-3/5 max-w-md rounded-lg shimmer bg-slate-200/80" />

            <div className="mt-4 w-full rounded-2xl bg-white p-2.5 border border-slate-200 shadow-md">
              <div className="h-12 w-full rounded-xl shimmer bg-slate-100" />
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Layout Skeleton */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 w-full flex-1">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left: Filter Sidebar Skeleton */}
          <aside className="w-full lg:w-72 shrink-0 hidden lg:block">
            <div className="sticky top-24 rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="h-5 w-28 rounded-md shimmer" />
                <div className="h-4 w-16 rounded-md shimmer" />
              </div>

              <div className="space-y-3 pb-5 border-b border-slate-100">
                <div className="h-4 w-36 rounded-md shimmer" />
                <div className="space-y-2">
                  <div className="h-8 rounded-xl shimmer" />
                  <div className="h-8 rounded-xl shimmer" />
                  <div className="h-8 rounded-xl shimmer" />
                  <div className="h-8 rounded-xl shimmer" />
                  <div className="h-8 rounded-xl shimmer" />
                </div>
              </div>

              <div className="space-y-3 pb-5 border-b border-slate-100">
                <div className="h-4 w-28 rounded-md shimmer" />
                <div className="grid grid-cols-3 gap-1.5">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-8 rounded-lg shimmer" />
                  ))}
                </div>
              </div>

              <div className="space-y-3 pb-5 border-b border-slate-100">
                <div className="flex justify-between">
                  <div className="h-4 w-24 rounded-md shimmer" />
                  <div className="h-4 w-16 rounded-md shimmer" />
                </div>
                <div className="h-2 rounded-full shimmer" />
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="h-7 rounded-lg shimmer" />
                  <div className="h-7 rounded-lg shimmer" />
                  <div className="h-7 rounded-lg shimmer" />
                  <div className="h-7 rounded-lg shimmer" />
                </div>
              </div>

              <div className="space-y-3">
                <div className="h-4 w-32 rounded-md shimmer" />
                <div className="h-10 rounded-xl shimmer" />
              </div>
            </div>
          </aside>

          {/* Right: Results Column Skeleton */}
          <div className="flex-1 space-y-5">
            <div className="rounded-2xl border border-slate-200/90 bg-white px-5 py-3.5 shadow-2xs flex items-center justify-between">
              <div className="h-5 w-44 rounded-md shimmer" />
              <div className="h-8 w-36 rounded-xl shimmer" />
            </div>

            <div className="flex flex-col gap-5 sm:gap-6">
              {Array.from({ length: 4 }).map((_, index) => (
                <PropertyCardSkeleton key={index} />
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
