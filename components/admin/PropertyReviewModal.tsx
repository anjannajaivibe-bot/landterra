'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { IProperty } from '@/types/property';
import { VerificationBadge } from '@/components/properties/VerificationBadge';
import { ShieldCheck, XCircle, AlertCircle, FileText, CheckCircle2, MapPin, X, ExternalLink, User } from 'lucide-react';

interface PropertyReviewModalProps {
  property: IProperty;
  isOpen: boolean;
  onClose: () => void;
  onActionComplete: () => void;
}

export function PropertyReviewModal({
  property,
  isOpen,
  onClose,
  onActionComplete,
}: PropertyReviewModalProps) {
  const [activeTab, setActiveTab] = useState<'DETAILS' | 'DOCUMENTS' | 'IMAGES'>('DETAILS');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleAction = async (action: 'APPROVE' | 'REJECT' | 'REQUEST_INFO' | 'SUSPEND') => {
    if (action === 'REJECT' && !rejectionReason.trim()) {
      setShowRejectInput(true);
      setError('Please provide a specific rejection reason explaining why the title or documents did not pass verification.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch(`/api/admin/properties/${property._id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          rejectionReason: action === 'REJECT' ? rejectionReason : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification action failed');

      onActionComplete();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error executing verification';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white font-mono text-[10px]">
                ID: {property._id}
              </span>
              <VerificationBadge status={property.verificationStatus} />
            </div>
            <h3 className="text-base font-bold text-slate-900 line-clamp-1">{property.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-slate-200 bg-white flex gap-6 text-xs font-semibold text-slate-600">
          <button
            onClick={() => setActiveTab('DETAILS')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'DETAILS'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Property & Seller Information
          </button>
          <button
            onClick={() => setActiveTab('DOCUMENTS')}
            className={`py-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'DOCUMENTS'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Private Documents ({property.documents?.length || 1})</span>
          </button>
          <button
            onClick={() => setActiveTab('IMAGES')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'IMAGES'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Images & Maps ({property.images?.length || 0})
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs text-slate-700">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-medium">
              {error}
            </div>
          )}

          {activeTab === 'DETAILS' && (
            <div className="space-y-6">
              {/* Government Land Record Registration ID Card */}
              <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50/60 flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider block mb-1">
                    Government Land Record / Survey Registration ID
                  </span>
                  <span className="text-base font-mono font-bold text-emerald-950">
                    {property.governmentRegistrationId}
                  </span>
                  <p className="text-[11px] text-emerald-800 mt-1">
                    Check this ID against state registration portal (Dharani / Kaveri / Bhulekh / IGR).
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-md bg-emerald-700 text-white font-bold text-[11px]">
                  Requires Audit Match
                </span>
              </div>

              {/* Grid info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Land Specs */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2">
                    Land Specifications
                  </h4>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Land Area:</span>
                    <span className="font-semibold text-slate-900">{property.landAreaYards} sq. yards</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Price / Yard:</span>
                    <span className="font-semibold text-slate-900">₹{property.pricePerYard.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Valuation:</span>
                    <span className="font-bold text-emerald-800">₹{property.totalPrice.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Publishing Fee Paid:</span>
                    <span className="font-semibold text-slate-900">₹{property.publishingFee.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Land Type:</span>
                    <span className="font-medium text-slate-800">{property.landType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Road Access:</span>
                    <span className="font-medium text-slate-800">{property.roadAccess}</span>
                  </div>
                </div>

                {/* Seller Details */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span>Seller Profile</span>
                  </h4>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Name:</span>
                    <span className="font-semibold text-slate-900">{property.sellerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Seller Type:</span>
                    <span className="font-medium text-slate-800">{property.sellerType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Phone:</span>
                    <span className="font-mono text-slate-800">{property.sellerPhone || 'Not shared'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Email:</span>
                    <span className="text-slate-800">{property.sellerEmail || 'Not shared'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Seller User ID:</span>
                    <span className="font-mono text-[11px] text-slate-600">{property.sellerId}</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-1.5">
                  Property Description
                </h4>
                <p className="p-3.5 rounded-xl border border-slate-200 bg-white text-slate-700 leading-relaxed">
                  {property.description}
                </p>
              </div>

              {/* Location */}
              <div>
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Physical Address & Coordinates</span>
                </h4>
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1">
                  <p className="font-medium text-slate-900">{property.location.address}</p>
                  <p className="text-slate-600">{property.location.city}, {property.location.state} - {property.location.pincode}</p>
                  <p className="text-slate-400 font-mono text-[11px] pt-1">
                    Latitude: {property.latitude}, Longitude: {property.longitude} (Approx: {property.approximateLocation ? 'Yes' : 'No'})
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'DOCUMENTS' && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900">
                <strong>Confidential Documents:</strong> Sale deeds and revenue records are private and only accessible by authorized admins. Verify encumbrance, seller title continuity, and seal stamps.
              </div>

              <div className="space-y-3">
                {property.documents && property.documents.length > 0 ? (
                  property.documents.map((doc, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-slate-200 bg-white flex items-center justify-between shadow-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs">
                          PDF
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 text-xs block">
                            {doc.documentType.replace(/_/g, ' ')}
                          </span>
                          <span className="text-[11px] text-slate-500 block">{doc.fileName}</span>
                          <span className="text-[10px] text-slate-400">
                            Uploaded: {new Date(doc.uploadedAt).toLocaleDateString('en-IN')}
                          </span>
                        </div>
                      </div>

                      <a
                        href={`/api/documents/download?key=${encodeURIComponent(doc.objectKey)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Inspect Document</span>
                      </a>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
                    No documents uploaded for this property listing.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'IMAGES' && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {property.images?.map((img, idx) => (
                <div key={idx} className="relative aspect-4/3 rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                  <Image
                    src={img.secureUrl}
                    alt="Property image"
                    fill
                    className="object-cover"
                    referrerPolicy="no-referrer"
                  />
                  {img.isPrimary && (
                    <span className="absolute top-2 left-2 bg-emerald-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                      Primary
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Rejection input box */}
          {showRejectInput && (
            <div className="p-4 rounded-xl border border-rose-300 bg-rose-50 space-y-2">
              <label className="block font-bold text-rose-900 text-xs">
                Mandatory Reason for Rejection / Requesting Clarification:
              </label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Uploaded sale deed is illegible, survey number does not match Dharani records..."
                className="w-full p-2.5 text-xs border border-rose-300 rounded-lg focus:ring-2 focus:ring-rose-500 bg-white"
                required
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                if (!showRejectInput) {
                  setShowRejectInput(true);
                } else {
                  handleAction('REJECT');
                }
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>{showRejectInput ? 'Confirm Rejection' : 'Reject Listing'}</span>
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleAction('REQUEST_INFO')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 transition-colors"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Request Info</span>
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleAction('APPROVE')}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 transition-colors shadow-xs"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Verify & Publish Live</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
