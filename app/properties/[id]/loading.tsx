import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function PropertyDetailsLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full animate-pulse">
        {/* Breadcrumb Skeleton */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-16 h-4 rounded bg-slate-200" />
          <div className="w-4 h-4 rounded bg-slate-200" />
          <div className="w-24 h-4 rounded bg-slate-200" />
          <div className="w-4 h-4 rounded bg-slate-200" />
          <div className="w-40 h-4 rounded bg-slate-200" />
        </div>

        {/* Title & Price Header Skeleton */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-24 h-6 rounded-full bg-emerald-100" />
              <div className="w-20 h-6 rounded-full bg-slate-200" />
            </div>
            <div className="w-80 sm:w-96 h-8 rounded-xl bg-slate-200" />
            <div className="w-56 h-4 rounded-md bg-slate-200" />
          </div>
          <div className="flex flex-col items-start md:items-end gap-1">
            <div className="w-36 h-9 rounded-xl bg-emerald-200" />
            <div className="w-28 h-4 rounded bg-slate-200" />
          </div>
        </div>

        {/* Gallery Aspect Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10 h-[360px] md:h-[460px]">
          <div className="md:col-span-2 rounded-3xl bg-slate-200 overflow-hidden relative" />
          <div className="hidden md:grid grid-rows-2 gap-4">
            <div className="rounded-3xl bg-slate-200 overflow-hidden" />
            <div className="rounded-3xl bg-slate-200 overflow-hidden" />
          </div>
        </div>

        {/* Two Column Layout: Details & Sticky Booking Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main Info Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 rounded-3xl bg-white border border-slate-200/80">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="w-12 h-4 rounded bg-slate-200" />
                  <div className="w-20 h-6 rounded bg-slate-200" />
                </div>
              ))}
            </div>

            {/* Description Skeleton */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200/80 space-y-4">
              <div className="w-36 h-6 rounded-md bg-slate-200 mb-2" />
              <div className="w-full h-4 rounded bg-slate-200" />
              <div className="w-full h-4 rounded bg-slate-200" />
              <div className="w-4/5 h-4 rounded bg-slate-200" />
              <div className="w-3/5 h-4 rounded bg-slate-200" />
            </div>

            {/* Legal / Due Diligence Checklist Skeleton */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200/80 space-y-4">
              <div className="w-48 h-6 rounded-md bg-slate-200 mb-2" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="w-5 h-5 rounded-full bg-emerald-200" />
                    <div className="w-36 h-4 rounded bg-slate-200" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sticky Sidebar Column */}
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-5">
              <div className="w-32 h-6 rounded-md bg-slate-200" />
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-slate-200 shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="w-28 h-5 rounded bg-slate-200" />
                  <div className="w-20 h-4 rounded bg-slate-200" />
                </div>
              </div>
              <div className="w-full h-12 rounded-2xl bg-emerald-500/30" />
              <div className="w-full h-12 rounded-2xl bg-slate-100" />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
