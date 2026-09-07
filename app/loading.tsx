export default function RootLoading() {
  return (
    <div className="min-h-screen bg-slate-900 text-white animate-pulse">
      {/* Top Navigation Bar Skeleton */}
      <header className="h-20 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800" />
          <div className="w-32 h-6 rounded-md bg-slate-800" />
        </div>
        <div className="hidden md:flex items-center gap-6">
          <div className="w-20 h-4 rounded bg-slate-800" />
          <div className="w-24 h-4 rounded bg-slate-800" />
          <div className="w-20 h-4 rounded bg-slate-800" />
        </div>
        <div className="flex items-center gap-3">
          <div className="w-24 h-10 rounded-xl bg-slate-800" />
          <div className="w-10 h-10 rounded-full bg-slate-800" />
        </div>
      </header>

      {/* Hero Section Skeleton */}
      <section className="relative px-6 py-20 max-w-7xl mx-auto flex flex-col items-center text-center">
        <div className="w-48 h-7 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6" />
        <div className="w-3/4 max-w-2xl h-12 rounded-xl bg-slate-800 mb-4" />
        <div className="w-1/2 max-w-xl h-5 rounded-lg bg-slate-800/70 mb-10" />

        {/* Search Omnibar Skeleton */}
        <div className="w-full max-w-4xl h-16 rounded-2xl bg-slate-800/80 border border-slate-700/60 p-3 flex items-center justify-between shadow-2xl">
          <div className="flex items-center gap-4 px-3 w-2/3">
            <div className="w-6 h-6 rounded-full bg-slate-700" />
            <div className="w-1/2 h-4 rounded bg-slate-700" />
          </div>
          <div className="w-32 h-10 rounded-xl bg-emerald-600/40" />
        </div>
      </section>

      {/* Featured Properties Grid Skeleton */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="w-48 h-8 rounded-lg bg-slate-800 mb-2" />
            <div className="w-64 h-4 rounded bg-slate-800/60" />
          </div>
          <div className="w-28 h-8 rounded-lg bg-slate-800" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden flex flex-col"
            >
              <div className="aspect-[16/10] bg-slate-800 relative">
                <div className="absolute top-3 left-3 w-20 h-6 rounded-md bg-slate-700" />
                <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-700" />
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="w-3/4 h-6 rounded bg-slate-800 mb-2" />
                  <div className="w-1/2 h-4 rounded bg-slate-800/60 mb-4" />
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-16 h-5 rounded bg-slate-800/80" />
                    <div className="w-20 h-5 rounded bg-slate-800/80" />
                    <div className="w-16 h-5 rounded bg-slate-800/80" />
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="w-28 h-6 rounded bg-slate-800" />
                  <div className="w-24 h-8 rounded-lg bg-slate-800" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
