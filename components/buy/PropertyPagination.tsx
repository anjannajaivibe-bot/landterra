'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PropertyPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
}

export function PropertyPagination({
  page,
  totalPages,
  onPageChange,
}: PropertyPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-10 flex flex-col items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white px-5 py-4 shadow-2xs sm:flex-row">
      <p className="text-xs text-slate-500 font-medium">
        Showing Page <strong className="text-slate-900 font-black">{page}</strong> of{' '}
        <strong className="text-slate-900 font-black">{totalPages}</strong>
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(page - 1, 1))}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </button>

        <div className="flex items-center gap-1 px-1">
          {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
            const pageNum = i + 1;
            const isActive = page === pageNum;
            return (
              <button
                key={pageNum}
                type="button"
                onClick={() => onPageChange(pageNum)}
                className={`w-8 h-8 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#FF9933] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(Math.min(page + 1, totalPages))}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#FF9933] hover:bg-[#f07d12] px-3.5 text-xs font-black text-white transition-colors disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
