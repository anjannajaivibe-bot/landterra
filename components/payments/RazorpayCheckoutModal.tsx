'use client';

import React, { useState, useEffect } from 'react';
import { IProperty } from '@/types/property';
import { CreditCard, ShieldCheck, CheckCircle2, AlertCircle, X, Lock, IndianRupee } from 'lucide-react';

interface RazorpayCheckoutModalProps {
  property: IProperty;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  feeAmount?: number;
}

export function RazorpayCheckoutModal({
  property,
  isOpen,
  onClose,
  onSuccess,
  feeAmount: initialFeeAmount,
}: RazorpayCheckoutModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [listingFeeAmount, setListingFeeAmount] = useState<number>(initialFeeAmount || 10);
  const [listingDurationDays, setListingDurationDays] = useState<number>(30);

  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    async function fetchPlatformSettings() {
      try {
        const res = await fetch('/api/settings/public', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (mounted) {
            if (typeof data.listingFeeAmount === 'number') {
              setListingFeeAmount(data.listingFeeAmount);
            }
            if (typeof data.listingFeeDurationDays === 'number') {
              setListingDurationDays(data.listingFeeDurationDays);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load public settings:', err);
      }
    }

    fetchPlatformSettings();
    return () => {
      mounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const landAreaYards = Math.round(property.landAreaYards);
  const activeFee = listingFeeAmount || 10;

  const handleInitiatePayment = async () => {
    setIsProcessing(true);
    setError('');

    try {
      // 1. Create order on server (authoritative server-side calculation)
      const orderRes = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: property._id,
          landAreaYards,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        throw new Error(orderData.error || 'Payment service is not configured.');
      }

      const { order } = orderData;
      if (order?.amountInRupees) {
        setListingFeeAmount(order.amountInRupees);
      }

      // 2. Client verification step via real Razorpay gateway
      if (typeof window !== 'undefined' && (window as any).Razorpay && order?.keyId) {
        const options = {
          key: order.keyId,
          amount: order.amount,
          currency: order.currency || 'INR',
          name: 'LandTerra Marketplace',
          description: `Publishing fee for ${property.title.substring(0, 30)}...`,
          order_id: order.orderId,
          handler: async function (response: any) {
            try {
              const verifyRes = await fetch('/api/payments/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  propertyId: property._id,
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                }),
              });

              const verifyData = await verifyRes.json();
              if (!verifyRes.ok) throw new Error(verifyData.error || 'Signature verification failed');

              setSuccess(true);
              setTimeout(() => {
                onSuccess();
              }, 1500);
            } catch (err: any) {
              setError(err.message);
              setIsProcessing(false);
            }
          },
          prefill: {
            name: property.sellerName,
            email: property.sellerEmail,
            contact: property.sellerPhone,
          },
          theme: {
            color: '#047857',
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
        setIsProcessing(false);
      } else {
        throw new Error('Payment service is not configured. Real Razorpay gateway credentials are required.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Payment service is not configured.';
      setError(msg);
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-700" />
            <h3 className="text-base font-bold text-slate-900">Publishing Fee Checkout</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {success ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-1">Payment Successful!</h4>
              <p className="text-xs text-slate-600 mb-2 leading-relaxed">
                ₹{activeFee.toLocaleString('en-IN')} received. Listing moved to <strong>Pending Verification</strong>.
              </p>
              <p className="text-[11px] text-slate-400">Redirecting to your seller dashboard...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-rose-50 text-xs text-rose-700 font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Property Summary Pill */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <p className="font-semibold text-slate-900 truncate mb-1">{property.title}</p>
                <p className="text-slate-500">{property.location.city}, {property.location.state}</p>
              </div>

              {/* Transparent Universal Fee Table */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Total Land Area</span>
                  <span className="font-semibold text-slate-900">{landAreaYards.toLocaleString('en-IN')} sq. yards</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Subscription Validity</span>
                  <span className="font-semibold text-emerald-800">{listingDurationDays} Days</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Total Property Price</span>
                  <span className="font-medium text-slate-700">₹{property.totalPrice.toLocaleString('en-IN')}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline text-sm">
                  <span className="font-bold text-slate-900">{listingDurationDays}-Day Listing Fee</span>
                  <span className="text-lg font-extrabold text-emerald-800 flex items-center">
                    <IndianRupee className="w-4 h-4 inline" />
                    {activeFee.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Important Policy Notice */}
              <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200/80 text-[11px] text-emerald-950 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Verification Notice:</strong> Payment confirms listing processing and queue placement. Our human admin team will review your uploaded title documents and survey ID before final public marketplace release.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Razorpay 256-bit SSL</span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isProcessing}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleInitiatePayment}
                    disabled={isProcessing}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>{isProcessing ? 'Processing...' : `Pay ₹${activeFee.toLocaleString('en-IN')}`}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
