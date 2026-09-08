import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function RootLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {/* Real Persistent Header */}
      <Navbar />

      {/* Hero Section Blueprint Skeleton */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-[#fffbf5] to-slate-50 border-b border-slate-200/60 pt-10 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="relative mx-auto max-w-5xl flex flex-col items-center text-center space-y-5">
          {/* Trust Pill */}
          <div className="h-7 w-72 rounded-full bg-[#fff1dc] border border-[#FF9933]/30 shimmer" />

          {/* Headline */}
          <div className="space-y-3 w-full flex flex-col items-center">
            <div className="h-10 sm:h-14 w-4/5 max-w-2xl rounded-2xl bg-slate-200 shimmer" />
            <div className="h-4 sm:h-5 w-3/5 max-w-xl rounded-lg bg-slate-200/80 shimmer" />
          </div>

          {/* Omnibar Search Box */}
          <div className="w-full max-w-4xl rounded-2xl bg-white border border-slate-200 shadow-md p-3.5 mt-4 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 w-full md:w-2/3 px-2">
              <div className="w-5 h-5 rounded-full bg-slate-200 shimmer shrink-0" />
              <div className="h-5 w-3/4 rounded-lg bg-slate-200/70 shimmer" />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="h-11 w-32 rounded-xl bg-slate-200/80 shimmer hidden sm:block" />
              <div className="h-11 w-full md:w-36 rounded-xl bg-[#FF9933]/40 shimmer" />
            </div>
          </div>
        </div>
      </section>

      {/* 4 Feature Benefit Cards Blueprint */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-10 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3"
            >
              <div className="w-10 h-10 rounded-xl bg-[#fff1dc] shimmer" />
              <div className="h-5 w-3/4 rounded-lg bg-slate-200 shimmer" />
              <div className="space-y-1.5 pt-1">
                <div className="h-3 w-full rounded bg-slate-100 shimmer" />
                <div className="h-3 w-4/5 rounded bg-slate-100 shimmer" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Properties Grid Blueprint */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 w-full flex-1 space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-7 w-60 rounded-xl bg-slate-200 shimmer" />
            <div className="h-4 w-72 rounded-md bg-slate-200/70 shimmer" />
          </div>
          <div className="h-8 w-32 rounded-xl bg-slate-200 shimmer hidden sm:block" />
        </div>

        {/* 3 Property Cards with exact image & details shape */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div
              key={idx}
              className="rounded-3xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden flex flex-col"
            >
              {/* Image Aspect Box */}
              <div className="aspect-[16/10] bg-slate-200 shimmer relative">
                <div className="absolute top-3 left-3 w-24 h-6 rounded-md bg-slate-300/80" />
                <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-300/80" />
              </div>

              {/* Card Details Box */}
              <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-32 rounded-full bg-slate-200 shimmer" />
                    <div className="h-6 w-24 rounded-lg bg-slate-200 shimmer" />
                  </div>
                  <div className="h-6 w-4/5 rounded-lg bg-slate-200 shimmer" />
                  <div className="h-4 w-1/2 rounded-md bg-slate-100 shimmer" />

                  {/* Specs Pill Grid */}
                  <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="h-8 rounded-lg bg-slate-200/70 shimmer" />
                    <div className="h-8 rounded-lg bg-slate-200/70 shimmer" />
                    <div className="h-8 rounded-lg bg-slate-200/70 shimmer" />
                  </div>
                </div>

                {/* Footer Action Row */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                  <div className="h-9 w-28 rounded-xl bg-[#fff1dc] shimmer" />
                  <div className="h-9 w-28 rounded-xl bg-slate-100 shimmer" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
