'use client';

import React from 'react';
import {
  Printer,
  X,
  CheckCircle2,
  Building2,
  Receipt,
  Download,
  Calendar,
  CreditCard,
  Hash,
  ShieldCheck,
} from 'lucide-react';
import { IPayment } from '@/types/payment';

interface PaymentReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: IPayment | null;
  sellerName?: string;
  sellerEmail?: string;
  sellerPhone?: string;
}

export function PaymentReceiptModal({
  isOpen,
  onClose,
  payment,
  sellerName,
  sellerEmail,
  sellerPhone,
}: PaymentReceiptModalProps) {
  if (!isOpen || !payment) return null;

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const paymentDate = payment.paidAt
    ? new Date(payment.paidAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : new Date(payment.createdAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

  const totalAmount = Number(payment.amount) || 0;
  // Standard 18% GST calculation (SAC 998365 - Internet Advertising space)
  const taxableBase = totalAmount / 1.18;
  const cgst = taxableBase * 0.09;
  const sgst = taxableBase * 0.09;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 print:p-0 print:bg-white print:static"
    >
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white shadow-2xl border border-slate-200 print:border-none print:shadow-none print:max-h-none print:w-full print:rounded-none">
        {/* Top Control Bar (Hidden in Print) */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-6 py-4 backdrop-blur-xs print:hidden">
          <div className="flex items-center gap-2 text-slate-800">
            <Receipt className="h-5 w-5 text-[#FF9933]" />
            <span className="text-sm font-black">Official Payment Receipt</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#FF9933] hover:bg-[#f07d12] px-3.5 py-2 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE RECEIPT CONTENT AREA */}
        <div id="receipt-print-area" className="p-6 sm:p-8 space-y-6 text-slate-900 bg-white">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-200 pb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FF9933] text-white font-black text-lg">
                  भू
                </div>
                <span className="text-xl font-black tracking-tight text-slate-900">
                  BhoomiMitra <span className="text-[#c75e0a] font-normal text-sm">(भू-मित्र)</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Direct Peer-to-Peer Land & Plot Marketplace
              </p>
              <p className="text-[11px] text-slate-400">
                https://bhoomimitra.com • support@bhoomimitra.com
              </p>
            </div>

            <div className="sm:text-right space-y-1">
              <span className="inline-block px-2.5 py-1 rounded-md bg-[#fff1dc] text-[#c75e0a] text-[10px] font-black tracking-wider uppercase border border-[#FF9933]/30">
                Tax Invoice / Receipt
              </span>
              <p className="text-xs font-mono font-bold text-slate-800">
                Receipt #{payment.receiptNumber}
              </p>
              <p className="text-[11px] text-slate-500">
                Date: <strong className="text-slate-700">{paymentDate}</strong>
              </p>
            </div>
          </div>

          {/* Billed To & Service Provider Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Billed To (Landowner / Seller)
              </span>
              <p className="font-bold text-slate-900 text-sm">{sellerName || 'Registered Seller'}</p>
              {sellerEmail && <p className="text-slate-600 truncate">{sellerEmail}</p>}
              {sellerPhone && <p className="text-slate-600 font-mono">{sellerPhone}</p>}
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Service Provider Details
              </span>
              <p className="font-bold text-slate-900 text-sm">BhoomiMitra Digital Platform</p>
              <p className="text-slate-600">Category: Digital Advertising Services</p>
              <p className="text-slate-600 font-mono">SAC / HSN Code: 998365</p>
            </div>
          </div>

          {/* Line Item Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="p-3 sm:p-3.5">Item Description</th>
                  <th className="p-3 sm:p-3.5 text-center">SAC Code</th>
                  <th className="p-3 sm:p-3.5 text-center">Duration</th>
                  <th className="p-3 sm:p-3.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                <tr>
                  <td className="p-3 sm:p-3.5">
                    <p className="font-bold text-slate-900">
                      {payment.propertyTitle || 'Direct Land Listing Advertisement'}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {payment.paymentPurpose === 'SUBSCRIPTION_RENEWAL'
                        ? '30-Day Listing Advertising Renewal'
                        : 'Initial 30-Day Listing Publication Pass'}
                    </p>
                  </td>
                  <td className="p-3 sm:p-3.5 text-center font-mono text-slate-600">998365</td>
                  <td className="p-3 sm:p-3.5 text-center font-semibold">
                    {payment.listingFeeDurationDays || 30} Days
                  </td>
                  <td className="p-3 sm:p-3.5 text-right font-mono font-bold text-slate-900">
                    ₹{taxableBase.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Tax Breakdown & Total Calculation */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-1">
            <div className="p-4 rounded-2xl bg-[#fffbf5] border border-[#FF9933]/30 text-[11px] text-slate-700 space-y-2 max-w-sm">
              <div className="flex items-center gap-1.5 text-[#c75e0a] font-bold">
                <ShieldCheck className="h-4 w-4 text-[#FF9933]" />
                <span>Verified Online Payment</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Paid securely via Razorpay payment gateway. This payment covers continuous digital hosting and marketplace exposure for 30 calendar days.
              </p>
            </div>

            <div className="w-full sm:w-64 space-y-2 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Taxable Value:</span>
                <span className="font-mono">₹{taxableBase.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>CGST (9%):</span>
                <span className="font-mono">₹{cgst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>SGST (9%):</span>
                <span className="font-mono">₹{sgst.toFixed(2)}</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between font-extrabold text-sm text-slate-900">
                <span>Total Amount Paid:</span>
                <span className="font-mono text-[#c75e0a] font-black">
                  ₹{totalAmount.toFixed(2)}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 text-right italic">
                (Inclusive of all applicable taxes)
              </p>
            </div>
          </div>

          {/* Transaction Metadata Proof */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono text-slate-600">
            <div>
              <span className="text-slate-400 font-sans block text-[10px] font-bold">
                Razorpay Payment ID:
              </span>
              <span className="text-slate-800 font-bold">
                {payment.razorpayPaymentId || 'Completed via Webhook'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-sans block text-[10px] font-bold">
                Razorpay Order ID:
              </span>
              <span className="text-slate-800 font-bold">{payment.razorpayOrderId}</span>
            </div>
          </div>

          {/* Footer Notice */}
          <div className="border-t border-slate-100 pt-4 text-center text-[10px] text-slate-400 space-y-1">
            <p className="font-medium">
              This is a computer-generated tax invoice/receipt for online classified ad services on BhoomiMitra. No physical signature is required.
            </p>
            <p>
              BhoomiMitra — India&apos;s Zero Brokerage Direct Land & Plot Marketplace.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
