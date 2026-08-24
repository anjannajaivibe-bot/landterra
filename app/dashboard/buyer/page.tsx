'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PropertyCard } from '@/components/properties/PropertyCard';
import { IProperty } from '@/types/property';
import { IInquiry } from '@/types/inquiry';
import { Heart, Mail, UserCheck, Search, ShieldCheck, ArrowRight } from 'lucide-react';

export default function BuyerDashboardPage() {
  const [activeTab, setActiveTab] = useState<'SAVED' | 'INQUIRIES'>('SAVED');
  const [favorites, setFavorites] = useState<IProperty[]>([]);
  const [inquiries, setInquiries] = useState<IInquiry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBuyerData() {
      try {
        // Load favorites
        const favRes = await fetch('/api/favorites');
        const favData = await favRes.json();
        if (favData?.favorites) {
          // If populated with property objects or IDs
          setFavorites(favData.favorites.map((f: any) => f.propertyId).filter(Boolean));
        }

        // Load inquiries
        const inqRes = await fetch('/api/inquiries');
        const inqData = await inqRes.json();
        if (inqData?.inquiries) {
          setInquiries(inqData.inquiries);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadBuyerData();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />

      {/* Header */}
      <div className="bg-slate-900 text-white py-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-semibold mb-1">
              <UserCheck className="w-4 h-4" />
              <span>Buyer Dashboard</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              My Saved Lands & Messages
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Access your bookmarked land parcels and tracked seller inquiries.
            </p>
          </div>

          <Link
            href="/buy"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-xs"
          >
            <Search className="w-4 h-4" />
            <span>Search Verified Lands</span>
          </Link>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 space-y-8">
        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="border-b border-slate-200 px-6 flex items-center justify-between">
            <div className="flex gap-6 text-xs font-bold text-slate-600">
              <button
                onClick={() => setActiveTab('SAVED')}
                className={`py-4 border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === 'SAVED'
                    ? 'border-emerald-600 text-emerald-800'
                    : 'border-transparent hover:text-slate-900'
                }`}
              >
                <Heart className="w-3.5 h-3.5" />
                <span>Saved Favorites ({favorites.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('INQUIRIES')}
                className={`py-4 border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === 'INQUIRIES'
                    ? 'border-emerald-600 text-emerald-800'
                    : 'border-transparent hover:text-slate-900'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Sent Inquiries ({inquiries.length})</span>
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* SAVED TAB */}
            {activeTab === 'SAVED' && (
              <div>
                {loading ? (
                  <div className="py-12 text-center text-xs text-slate-500">Loading saved parcels...</div>
                ) : favorites.length === 0 ? (
                  <div className="py-12 text-center max-w-sm mx-auto space-y-3">
                    <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                      <Heart className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm">No Saved Lands Yet</h3>
                    <p className="text-xs text-slate-500">
                      Click the heart icon on any land listing in the marketplace to save it here for quick review.
                    </p>
                    <Link
                      href="/buy"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
                    >
                      <span>Browse Lands</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {favorites.map((prop) => (
                      <PropertyCard key={prop._id} property={prop} initialFavorite={true} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* INQUIRIES TAB */}
            {activeTab === 'INQUIRIES' && (
              <div className="space-y-3">
                {inquiries.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-500">
                    No inquiries sent yet. When you contact a seller from a property page, your communication history will appear here.
                  </div>
                ) : (
                  inquiries.map((inq) => (
                    <div
                      key={inq._id}
                      className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 text-xs shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">Inquiry Sent</span>
                        <span className="text-slate-400">
                          {new Date(inq.createdAt).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                      <p className="p-3 bg-slate-50 rounded-lg text-slate-700 leading-relaxed border border-slate-100">
                        {inq.message}
                      </p>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                        <span>Property Reference: {inq.propertyId}</span>
                        <span className="text-emerald-700 font-semibold">Active Request</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
