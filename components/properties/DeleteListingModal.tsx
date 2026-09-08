'use client';

import React, { useState } from 'react';
import {
  Trash2,
  AlertCircle,
  Loader2,
  X,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { FeedbackReason } from '@/types/feedback';

interface DeleteListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: { id: string; title: string } | null;
  onConfirmDelete: (data: { reason: FeedbackReason; comments?: string }) => Promise<void>;
  isDeleting: boolean;
}

const DELETION_REASONS: {
  id: FeedbackReason;
  label: string;
  description: string;
  badgeEmoji: string;
}[] = [
  {
    id: 'SOLD_ON_PLATFORM',
    label: 'Sold on BhoomiMitra',
    description: 'Found a genuine buyer directly through this platform.',
    badgeEmoji: '🎉',
  },
  {
    id: 'SOLD_EXTERNALLY',
    label: 'Sold Elsewhere / Offline',
    description: 'Closed deal via local broker, relatives, or offline buyer.',
    badgeEmoji: '🤝',
  },
  {
    id: 'NOT_USEFUL',
    label: 'Not Useful / Low Inquiries',
    description: 'Did not receive enough serious inquiries or calls.',
    badgeEmoji: '📉',
  },
  {
    id: 'PRICE_CHANGE_RELIST',
    label: 'Price Change / Relisting',
    description: 'Plan to update pricing, survey details, or relist later.',
    badgeEmoji: '✏️',
  },
  {
    id: 'DECIDED_NOT_TO_SELL',
    label: 'Decided Not to Sell',
    description: 'Holding on to the land or family decided to retain it.',
    badgeEmoji: '🛑',
  },
  {
    id: 'OTHER',
    label: 'Other Reason',
    description: 'Personal or miscellaneous reasons.',
    badgeEmoji: '💬',
  },
];

export function DeleteListingModal({
  isOpen,
  onClose,
  property,
  onConfirmDelete,
  isDeleting,
}: DeleteListingModalProps) {
  const [selectedReason, setSelectedReason] = useState<FeedbackReason>('SOLD_ON_PLATFORM');
  const [comments, setComments] = useState('');
  const [error, setError] = useState('');

  if (!isOpen || !property) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await onConfirmDelete({
        reason: selectedReason,
        comments: comments.trim() || undefined,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete listing.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-150 text-slate-900">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 shrink-0">
              <Trash2 className="w-6 h-6 text-rose-600" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Permanently Delete Listing
              </h3>
              <p className="text-xs text-slate-500">
                Remove property &amp; share quick feedback
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isDeleting}
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Property Preview */}
        <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100 space-y-1">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
            Target Listing
          </span>
          <p className="text-xs font-bold text-slate-900 line-clamp-1">
            {property.title}
          </p>
          <p className="text-[11px] text-slate-500">
            Once deleted, this land parcel will be immediately unlisted and removed from the public marketplace.
          </p>
        </div>

        {/* Error Alert if any */}
        {error && (
          <div className="rounded-xl bg-rose-50 p-3 border border-rose-200 text-xs text-rose-700 font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Feedback Reason Selection Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-[#FF9933]" />
              <label className="text-xs font-bold text-slate-800">
                Why are you removing this property? <span className="text-rose-500">*</span>
              </label>
            </div>
            <p className="text-[11px] text-slate-500">
              Your feedback helps us continuously improve buyer quality and platform features.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {DELETION_REASONS.map((r) => {
                const isSelected = selectedReason === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedReason(r.id)}
                    className={`p-3 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                      isSelected
                        ? 'border-[#FF9933] bg-[#fffbf5] shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <span>{r.badgeEmoji}</span>
                        <span>{r.label}</span>
                      </span>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-[#FF9933] shrink-0" />
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight">
                      {r.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional Comments */}
          <div className="space-y-1.5 pt-1">
            <label htmlFor="delete-feedback-comments" className="text-xs font-bold text-slate-800 block">
              Additional Feedback / Suggestions (Optional)
            </label>
            <textarea
              id="delete-feedback-comments"
              rows={3}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Tell us more about your experience or how we can improve BhoomiMitra..."
              className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-[#FF9933] text-slate-800 placeholder:text-slate-400 resize-none"
              disabled={isDeleting}
            />
          </div>

          {/* Permanent Warning */}
          <div className="rounded-xl bg-amber-50 p-3 border border-amber-200/60 flex items-start gap-2.5 text-amber-900 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
            <span className="leading-relaxed">
              This action cannot be undone. All photos, videos, Pahani documents, and inquiries for this property will be permanently purged.
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              disabled={isDeleting}
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isDeleting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Deleting &amp; Saving Feedback...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete &amp; Submit Feedback</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
