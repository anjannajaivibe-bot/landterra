'use client';

import React, { useState, useEffect } from 'react';
import { IProperty } from '@/types/property';
import { PaymentPurpose } from '@/types/payment';
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  Lock,
  IndianRupee,
  RotateCcw,
} from 'lucide-react';

interface RazorpayCheckoutModalProps {
  property: IProperty;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  feeAmount?: number;
  purpose?: PaymentPurpose;
}

export function RazorpayCheckoutModal({
  property,
  isOpen,
  onClose,
  onSuccess,
  feeAmount: initialFeeAmount,
  purpose = 'LISTING_SUBSCRIPTION',
}: RazorpayCheckoutModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [listingFeeAmount, setListingFeeAmount] = useState<number>(
    initialFeeAmount || 10,
  );
  const [listingDurationDays, setListingDurationDays] = useState<number>(30);

  const isRenewal = purpose === 'SUBSCRIPTION_RENEWAL';

  useEffect(() => {
    if (!isOpen) return;
    let mounted = true;

    async function fetchPlatformSettings() {
      try {
        const res = await fetch('/api/settings/public', {
          cache: 'no-store',
        });
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
    if (isProcessing) return;
    setIsProcessing(true);
    setError('');
    setSuccess(false);

    try {
      /*
       * ============================================================
       * 1. CREATE RAZORPAY ORDER (Authoritative Server Snapshot)
       * ============================================================
       */
      const orderRes = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          propertyId: property._id,
          landAreaYards,
          purpose,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        throw new Error(
          orderData.error || 'Payment service error occurred.',
        );
      }

      const { order } = orderData;
      if (!order) {
        throw new Error('Payment order was not created.');
      }
      if (!order.keyId) {
        throw new Error(
          'Razorpay Key ID was not returned by the server.',
        );
      }

      if (order.amountInRupees) {
        setListingFeeAmount(Number(order.amountInRupees));
      }
      if (order.durationDays) {
        setListingDurationDays(Number(order.durationDays));
      }

      const activeOrderDuration =
        order?.durationDays || listingDurationDays || 30;

      /*
       * ============================================================
       * 2. CHECK RAZORPAY CLIENT
       * ============================================================
       */
      if (
        typeof window === 'undefined' ||
        !(window as any).Razorpay
      ) {
        throw new Error(
          'Payment gateway client is not ready. Please refresh the page and try again.',
        );
      }

      /*
       * ============================================================
       * 3. RAZORPAY CHECKOUT CONFIGURATION
       * ============================================================
       * Explicitly allow ONLY:
       * 1. UPI
       * 2. Netbanking
       * 3. Wallet
       *
       * show_default_blocks: false prevents Razorpay from appending
       * its default payment methods (Cards, EMI, Pay Later).
       */
      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'BhoomiMitra Marketplace',
        description: isRenewal
          ? `Listing renewal (${activeOrderDuration} days) for ${property.title.substring(
              0,
              25,
            )}...`
          : `Publishing fee (${activeOrderDuration} days) for ${property.title.substring(
              0,
              25,
            )}...`,
        order_id: order.orderId,

        config: {
          display: {
            blocks: {
              bhoomimitra_payment_methods: {
                name: 'Payment Options',
                instruments: [
                  { method: 'upi' },
                  { method: 'netbanking' },
                  { method: 'wallet' },
                ],
              },
            },
            sequence: ['block.bhoomimitra_payment_methods'],
            preferences: {
              show_default_blocks: false,
            },
          },
        },

        prefill: {
          name: property.sellerName || '',
          email: property.sellerEmail || '',
          contact: property.sellerPhone
            ? property.sellerPhone.startsWith('+')
              ? property.sellerPhone
              : `+91${property.sellerPhone}`
            : '',
        },

        theme: {
          color: '#047857',
        },

        modal: {
          ondismiss: function () {
            setIsProcessing(false);
            setError(
              'Payment was cancelled or closed. Your listing draft is safely saved! You can complete payment anytime from your Seller Dashboard.',
            );
          },
        },

        handler: async function (response: any) {
          try {
            setIsProcessing(true);
            setError('');

            const verifyRes = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                propertyId: property._id,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) {
              throw new Error(
                verifyData.error || 'Signature verification failed.',
              );
            }

            setSuccess(true);
            setIsProcessing(false);
            window.setTimeout(() => {
              onSuccess();
            }, 1500);
          } catch (err: unknown) {
            const message =
              err instanceof Error
                ? err.message
                : 'Payment verification failed.';
            setError(message);
            setIsProcessing(false);
          }
        },
      };

      /*
       * ============================================================
       * 4. OPEN RAZORPAY
       * ============================================================
       */
      const razorpay = new (window as any).Razorpay(options);

      razorpay.on('payment.failed', function (response: any) {
        console.error('Razorpay payment failed:', response);
        const gatewayError =
          response?.error?.description ||
          response?.error?.reason ||
          'Payment could not be completed. Please try another available payment option.';
        setError(gatewayError);
        setIsProcessing(false);
      });

      razorpay.open();
      setIsProcessing(false);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Payment service error occurred.';
      console.error('Payment initiation error:', err);
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
            <h3 className="text-base font-bold text-slate-900">
              {isRenewal
                ? 'Listing Subscription Renewal'
                : 'Publishing Fee Checkout'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Close payment window"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Success State */}
          {success ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-1">
                Payment Successful!
              </h4>
              <p className="text-xs text-slate-600 mb-2 leading-relaxed">
                ₹ {activeFee.toLocaleString('en-IN')} received.{' '}
                {isRenewal
                  ? `Subscription extended for ${listingDurationDays} days.`
                  : 'Listing moved to Pending Verification.'}
              </p>
              <p className="text-[11px] text-slate-400">
                Redirecting to your seller dashboard...
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Error */}
              {error && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1.5">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span className="font-semibold">{error}</span>
                  </div>
                  <p className="text-[11px] text-rose-700/90 pl-6 leading-relaxed">
                    <strong>Draft Preserved:</strong> You will not lose any entered property information.
                  </p>
                </div>
              )}

              {/* Property Summary */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <p className="font-semibold text-slate-900 truncate mb-1">
                  {property.title}
                </p>
                <p className="text-slate-500">
                  {property.location.city}, {property.location.state} •{' '}
                  {landAreaYards.toLocaleString('en-IN')} sq.yds
                </p>
              </div>

              {/* Payment Summary */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2.5 text-xs">
                <div className="flex justify-between text-slate-600 gap-4">
                  <span>Listing Type</span>
                  <span className="font-semibold text-slate-900 text-right">
                    {isRenewal
                      ? '30-Day Subscription Renewal'
                      : 'Initial 30-Day Publishing Pass'}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Validity Duration</span>
                  <span className="font-semibold text-emerald-800">
                    {listingDurationDays} Days
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Asking Price</span>
                  <span className="font-medium text-slate-700">
                    ₹{' '}
                    {Number(property.totalPrice || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline text-sm">
                  <span className="font-bold text-slate-900">Amount Due</span>
                  <span className="text-lg font-extrabold text-emerald-800 flex items-center">
                    <IndianRupee className="w-4 h-4 inline" />
                    {activeFee.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Allowed Payment Methods Notice */}
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5">
                <p className="text-[10px] uppercase tracking-wide font-bold text-slate-400 mb-2">
                  Available Payment Methods
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-lg bg-white border border-slate-200 px-2 py-2 text-center">
                    <p className="text-[11px] font-bold text-slate-800">UPI</p>
                  </div>
                  <div className="rounded-lg bg-white border border-slate-200 px-2 py-2 text-center">
                    <p className="text-[11px] font-bold text-slate-800">
                      Netbanking
                    </p>
                  </div>
                  <div className="rounded-lg bg-white border border-slate-200 px-2 py-2 text-center">
                    <p className="text-[11px] font-bold text-slate-800">
                      Wallet
                    </p>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                  Payment methods shown inside Razorpay Checkout depend on the methods activated for your Razorpay account.
                </p>
              </div>

              {/* Policy Notice */}
              <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200/80 text-[11px] text-emerald-950 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  {isRenewal ? (
                    <span>
                      <strong>Renewal Protection:</strong> Your active time is preserved. Renewing early seamlessly appends {listingDurationDays} days onto your current expiry date.
                    </span>
                  ) : (
                    <span>
                      <strong>Verification Notice:</strong> Payment confirms listing processing and queue placement. Our human admin team will review your uploaded title documents and survey ID before final public marketplace release.
                    </span>
                  )}
                </p>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Secured by Razorpay</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isProcessing}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer disabled:opacity-50"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={handleInitiatePayment}
                    disabled={isProcessing}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {error ? (
                      <RotateCcw className="w-3.5 h-3.5" />
                    ) : (
                      <CreditCard className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {isProcessing
                        ? 'Processing...'
                        : error
                        ? `Try Again (₹${activeFee.toLocaleString('en-IN')})`
                        : `Pay ₹${activeFee.toLocaleString('en-IN')}`}
                    </span>
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
