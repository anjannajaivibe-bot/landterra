'use client';

import React, { useState } from 'react';
import { IProperty } from '@/types/property';
import { ReportReason } from '@/types/inquiry';
import { Flag, X, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

interface ReportModalProps {
  property: IProperty;
  isOpen: boolean;
  onClose: () => void;
}

const REPORT_REASONS: Array<{ value: ReportReason; label: string }> = [
  { value: 'SUSPICIOUS_LISTING', label: 'Suspicious / Inconsistent Ownership Details' },
  { value: 'INCORRECT_INFORMATION', label: 'Incorrect Price, Land Area, or Road Dimensions' },
  { value: 'POSSIBLE_FRAUD', label: 'Possible Title Dispute / Encroachment / Fraud' },
  { value: 'WRONG_LOCATION', label: 'Inaccurate Google Map Coordinates or Address' },
  { value: 'DUPLICATE_LISTING', label: 'Duplicate / Spam Listing' },
  { value: 'INAPPROPRIATE_CONTENT', label: 'Inappropriate Imagery or Misleading Claims' },
  { value: 'OTHER', label: 'Other Serious Issue' },
];

export function ReportModal({ property, isOpen, onClose }: ReportModalProps) {
  const [reason, setReason] = useState<ReportReason>('SUSPICIOUS_LISTING');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleClose = () => {
    setSuccess(false);
    setError('');
    setDescription('');
    setReason('SUSPICIOUS_LISTING');
    onClose();
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: property._id,
          reason,
          description: description.trim(),
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || data?.message || 'Failed to submit report. Please log in.');
      }

      setSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error reporting listing';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2 text-rose-700">
            <Flag className="w-4 h-4" />
            <h3 className="text-base font-bold text-slate-900">Report Listing</h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close report modal"
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {success ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-1">Report Received</h4>
              <p className="text-xs text-slate-600 mb-6 leading-relaxed">
                Thank you for safeguarding marketplace integrity. Our compliance and fraud review team has logged this report and will inspect the listing.
              </p>
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 cursor-pointer"
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-rose-50 text-xs text-rose-700 font-medium">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="report-reason-select" className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for reporting <span className="text-rose-500">*</span>
                </label>
                <select
                  id="report-reason-select"
                  name="reason"
                  value={reason}
                  disabled={isSubmitting}
                  onChange={(e) => setReason(e.target.value as ReportReason)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 bg-white disabled:bg-slate-100"
                >
                  {REPORT_REASONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="report-description-input" className="block text-xs font-semibold text-slate-700 mb-1">
                  Specific Details & Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="report-description-input"
                  name="description"
                  rows={4}
                  value={description}
                  disabled={isSubmitting}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide context regarding why this listing or title record is inaccurate or suspicious..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 disabled:bg-slate-100"
                  required
                />
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  False or malicious reports against legitimate sellers are subject to account penalties under platform rules.
                </span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !description.trim()}
                  className="px-5 py-2 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Submit Report</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
