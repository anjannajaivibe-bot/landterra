'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  MapPin,
  ChevronDown,
  Search,
  X,
  Globe,
  Check,
  Building2,
} from 'lucide-react';

/* ================================================================
   CITY DATA (Mirroring Magicbricks comprehensive directory)
================================================================ */

const POPULAR_CITIES = [
  'Ahmedabad',
  'Bangalore',
  'Beyond Thane',
  'Chennai',
  'Gurgaon',
  'Hyderabad',
  'Indore',
  'Jaipur',
  'Kolkata',
  'Lucknow',
  'Mumbai',
  'Navi Mumbai',
  'New Delhi',
  'Noida',
  'Pune',
  'Thane',
];

const NEARBY_CITIES: Record<string, string[]> = {
  Hyderabad: [
    'Visakhapatnam',
    'Vijayawada',
    'Vizianagaram',
    'Guntur',
    'Warangal',
    'Karimnagar',
  ],
  Bangalore: [
    'Mysore',
    'Hosur',
    'Tumkur',
    'Doddaballapur',
    'Devanahalli',
    'Mangalore',
  ],
  Mumbai: [
    'Navi Mumbai',
    'Thane',
    'Kalyan',
    'Badlapur',
    'Palghar',
    'Panvel',
  ],
  Chennai: [
    'Chengalpattu',
    'Kanchipuram',
    'Tiruvallur',
    'Vellore',
    'Pondicherry',
  ],
  'New Delhi': [
    'Noida',
    'Greater Noida',
    'Gurgaon',
    'Faridabad',
    'Ghaziabad',
    'Sonipat',
  ],
  DEFAULT: [
    'Visakhapatnam',
    'Vijayawada',
    'Vizianagaram',
    'Guntur',
    'Warangal',
    'Bengaluru',
  ],
};

const ALL_OTHER_CITIES = [
  'Agra',
  'Ahmadnagar',
  'Allahabad',
  'Aluva',
  'Amritsar',
  'Aurangabad',
  'Badlapur',
  'Bareilly',
  'Belgaum',
  'Bhiwadi',
  'Bhopal',
  'Bhubaneswar',
  'Bokaro Steel City',
  'Chandigarh',
  'Chengalpattu',
  'Coimbatore',
  'Dehradun',
  'Durgapur',
  'Ernakulam',
  'Erode',
  'Faridabad',
  'Ghaziabad',
  'Goa',
  'Gorakhpur',
  'Greater Noida',
  'Guntur',
  'Guwahati',
  'Gwalior',
  'Haridwar',
  'Hosur',
  'Hubli',
  'Jabalpur',
  'Jalandhar',
  'Jammu',
  'Jamshedpur',
  'Jodhpur',
  'Kalyan',
  'Kannur',
  'Kanpur',
  'Khopoli',
  'Kochi',
  'Kodaikanal',
  'Kottayam',
  'Kozhikode',
  'Lonavala',
  'Ludhiana',
  'Madurai',
  'Mangalore',
  'Mohali',
  'Mysore',
  'Nagpur',
  'Nainital',
  'Nanded',
  'Nashik',
  'Navsari',
  'Nellore',
  'Newtown',
  'Ooty',
  'Palakkad',
  'Palghar',
  'Panchkula',
  'Patiala',
  'Patna',
  'Pondicherry',
  'Raipur',
  'Rajahmundry',
  'Ranchi',
  'Salem',
  'Satara',
  'Shimla',
  'Siliguri',
  'Solapur',
  'Sonipat',
  'Surat',
  'Thanjavur',
  'Thrissur',
  'Tirunelveli',
  'Tirupati',
  'Tirupur',
  'Trichy',
  'Trivandrum',
  'Tumkur',
  'Udaipur',
  'Udupi',
  'Vadodara',
  'Vapi',
  'Varanasi',
  'Vijayawada',
  'Visakhapatnam',
  'Vrindavan',
  'Warangal',
  'Zirakpur',
];

const INTERNATIONAL_HUBS = [
  { label: 'NRI Land Desk', code: 'NRI' },
  { label: 'US (United States)', code: 'US', flag: '🇺🇸' },
  { label: 'UAE (Dubai / Abu Dhabi)', code: 'UAE', flag: '🇦🇪' },
  { label: 'Canada', code: 'CA', flag: '🇨🇦' },
  { label: 'Australia', code: 'AU', flag: '🇦🇺' },
  { label: 'Singapore', code: 'SG', flag: '🇸🇬' },
  { label: 'United Kingdom (UK)', code: 'UK', flag: '🇬🇧' },
];

let memorySelectedCity: string | null = null;

export function CitySelectorMegaMenu() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string>(() => memorySelectedCity || 'Hyderabad');
  const [searchQuery, setSearchQuery] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  /* Safely synchronize client localStorage/URL city after initial hydration */
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const cityInUrl = urlParams.get('city');
      if (cityInUrl) {
        memorySelectedCity = cityInUrl;
        setSelectedCity(cityInUrl);
        return;
      }
      if (!memorySelectedCity) {
        const stored = localStorage.getItem('bhoomimitra_selected_city');
        if (stored && stored.trim()) {
          memorySelectedCity = stored;
          setSelectedCity(stored);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  /* Synchronize with city change events across page instances */
  useEffect(() => {
    const handleCityChanged = (e: Event) => {
      const customEvent = e as CustomEvent<{ city?: string }>;
      const city = customEvent.detail?.city;
      if (city) {
        memorySelectedCity = city;
        setSelectedCity(city);
      }
    };
    window.addEventListener('bhoomimitra_city_changed', handleCityChanged);
    return () => window.removeEventListener('bhoomimitra_city_changed', handleCityChanged);
  }, []);

  /* Close on outside click or escape */
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false);
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelectCity = (city: string) => {
    memorySelectedCity = city;
    setSelectedCity(city);
    try {
      localStorage.setItem('bhoomimitra_selected_city', city);
    } catch {
      // ignore
    }
    setIsOpen(false);
    setSearchQuery('');

    // Broadcast change so active filter sections (Homepage Omnibar, Buy page filters) immediately receive it
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('bhoomimitra_city_changed', {
          detail: { city },
        })
      );
    }

    const targetUrl =
      city === 'All India' ? '/buy' : `/buy?city=${encodeURIComponent(city)}`;
    router.push(targetUrl);
  };

  const handleSelectInternational = (hubName: string) => {
    setSelectedCity(`NRI: ${hubName}`);
    setIsOpen(false);
    // Redirect to the dedicated custom contact page for Non-Resident Indians
    router.push(`/contact/nri?origin=${encodeURIComponent(hubName)}`);
  };

  /* Filtered cities based on search input */
  const cleanQuery = searchQuery.trim().toLowerCase();
  const searchMatches = cleanQuery
    ? [
        ...POPULAR_CITIES,
        ...ALL_OTHER_CITIES,
      ].filter((c, idx, arr) => arr.indexOf(c) === idx && c.toLowerCase().includes(cleanQuery))
    : null;

  const currentNearby =
    NEARBY_CITIES[selectedCity] || NEARBY_CITIES['DEFAULT'];

  /* Truncate long city names like "Bokaro Steel City" -> "Bokaro..." to protect navbar layout */
  const formatDisplayCity = (city: string): string => {
    if (!city || !city.trim()) return 'Hyderabad';
    if (city.startsWith('NRI: ')) {
      const hub = city.replace('NRI: ', '');
      return hub.length > 8 ? `NRI: ${hub.slice(0, 6)}...` : city;
    }
    if (city.length > 10) {
      const words = city.split(' ');
      if (words.length > 1 && words[0].length >= 3 && words[0].length <= 8) {
        return `${words[0]}...`;
      }
      return `${city.slice(0, 7)}...`;
    }
    return city;
  };

  return (
    <div ref={menuRef} className="relative inline-block text-left">
      {/* Trigger button (Matches Magicbricks top bar style, robust against long city names) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label="Select City or Region"
        title={selectedCity}
        suppressHydrationWarning
        className={`flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-xl border text-xs font-black transition-all cursor-pointer select-none max-w-[125px] sm:max-w-[150px] shrink-0 ${
          isOpen
            ? 'border-[#FF9933] bg-[#fff9f0] text-[#c75e0a] shadow-xs ring-2 ring-[#FF9933]/20'
            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800 hover:border-slate-300 shadow-2xs'
        }`}
      >
        <MapPin className="w-3.5 h-3.5 text-[#FF9933] shrink-0" />
        <span className="truncate max-w-[75px] sm:max-w-[95px] min-w-0" suppressHydrationWarning>
          {formatDisplayCity(selectedCity)}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-[#FF9933]' : ''
          }`}
        />
      </button>

      {/* Mega Dropdown Menu Modal */}
      {isOpen && (
        <>
          {/* Backdrop on mobile/tablet for easy dismissal */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          <div
            role="region"
            aria-label="Select City or Region"
            style={{ width: 'min(860px, calc(100vw - 24px))' }}
            className="fixed inset-x-3 sm:inset-x-6 top-16 sm:top-20 z-50 mx-auto lg:absolute lg:inset-x-auto lg:left-0 lg:top-[calc(100%+8px)] max-h-[84vh] overflow-hidden rounded-3xl bg-white border border-slate-200 shadow-[0_25px_60px_rgba(0,0,0,0.18)] flex flex-col animate-in fade-in slide-in-from-top-2 duration-150"
          >
            {/* Top Search & Filter Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 bg-[#fffbf5] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
              <div className="relative flex-1">
                <label htmlFor="city-selector-search-input" className="sr-only">
                  Search across 100+ Indian cities and districts
                </label>
                <Search className="w-4 h-4 text-[#FF9933] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  id="city-selector-search-input"
                  name="citySearchQuery"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search across 100+ Indian cities and districts"
                  placeholder="Search across 100+ Indian cities and districts..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-[#FF9933] focus:border-[#FF9933] shadow-2xs transition-all"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear city search query"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleSelectCity('All India')}
                  className="px-3.5 py-2 rounded-xl bg-white border border-[#FF9933]/40 text-[#c75e0a] hover:bg-[#fff1dc] text-xs font-bold transition-colors cursor-pointer shrink-0 shadow-2xs whitespace-nowrap"
                >
                  All India (View All)
                </button>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

          {/* Search Matches View */}
          {searchMatches ? (
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Matching Cities ({searchMatches.length})
              </div>

              {searchMatches.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No cities found matching &quot;{searchQuery}&quot;. Try searching for district or state.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {searchMatches.map((city) => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => handleSelectCity(city)}
                      className={`flex items-center justify-between p-2.5 rounded-xl text-left text-xs font-semibold transition-colors cursor-pointer ${
                        selectedCity === city
                          ? 'bg-[#fff1dc] text-[#c75e0a] font-black border border-[#FF9933]/40'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className="truncate">{city}</span>
                      {selectedCity === city && (
                        <Check className="w-3.5 h-3.5 text-[#FF9933] shrink-0 ml-1" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Mega Menu Content (Split into INDIA and INTERNATIONAL) */
            <div className="flex-1 overflow-y-auto flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-100">
              {/* LEFT: INDIA (Nearby, Popular & Alphabetical Other Cities) */}
              <div className="flex-1 p-5 sm:p-6 space-y-6 overflow-y-auto max-h-[60vh]">
                {/* 1. Nearby Cities */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-black text-slate-900">
                    <MapPin className="w-3.5 h-3.5 text-[#FF9933]" />
                    <span>Nearby Cities</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {currentNearby.map((city) => (
                      <button
                        key={city}
                        type="button"
                        onClick={() => handleSelectCity(city)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer border ${
                          selectedCity === city
                            ? 'bg-[#FF9933] text-white border-[#FF9933] shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-[#fff9f0] hover:border-[#FF9933]/40 hover:text-[#c75e0a]'
                        }`}
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Popular Indian Metros */}
                <div className="space-y-2.5 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 text-xs font-black text-slate-900">
                    <Building2 className="w-3.5 h-3.5 text-[#FF9933]" />
                    <span>Popular Cities</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-3 gap-y-2 text-xs">
                    {POPULAR_CITIES.map((city) => (
                      <button
                        key={city}
                        type="button"
                        onClick={() => handleSelectCity(city)}
                        className={`text-left py-1 px-2 rounded-md transition-colors cursor-pointer truncate ${
                          selectedCity === city
                            ? 'bg-[#fff1dc] text-[#c75e0a] font-black'
                            : 'text-slate-700 hover:text-[#FF9933] hover:bg-slate-50 font-medium'
                        }`}
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Other Cities (Comprehensive List from Reference) */}
                <div className="space-y-2.5 pt-2 border-t border-slate-100">
                  <div className="text-xs font-black text-slate-900">
                    Other Cities &amp; Growth Hubs
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-3 gap-y-1.5 text-[11px]">
                    {ALL_OTHER_CITIES.map((city) => (
                      <button
                        key={city}
                        type="button"
                        onClick={() => handleSelectCity(city)}
                        className={`text-left py-1 px-1.5 rounded transition-colors cursor-pointer truncate ${
                          selectedCity === city
                            ? 'bg-[#fff1dc] text-[#c75e0a] font-bold'
                            : 'text-slate-600 hover:text-[#FF9933] hover:bg-slate-50'
                        }`}
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* RIGHT: INTERNATIONAL / NRI LAND DESK */}
              <div className="w-full md:w-60 p-5 sm:p-6 bg-slate-50/50 space-y-4 shrink-0">
                <div className="flex items-center gap-2 text-xs font-black text-slate-900">
                  <Globe className="w-4 h-4 text-[#FF9933]" />
                  <span>International / NRI</span>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Dedicated assistance for Non-Resident Indians exploring ancestral &amp; agricultural land across India.
                </p>

                <div className="space-y-2 pt-1">
                  {INTERNATIONAL_HUBS.map((hub) => (
                    <button
                      key={hub.label}
                      type="button"
                      onClick={() => handleSelectInternational(hub.label)}
                      className="w-full flex items-center gap-2 p-2 rounded-xl bg-white border border-slate-200 hover:border-[#FF9933]/50 hover:bg-[#fffbf5] text-left text-xs font-bold text-slate-800 transition-colors cursor-pointer shadow-2xs"
                    >
                      <span>{hub.flag || '🌐'}</span>
                      <span className="truncate">{hub.label}</span>
                    </button>
                  ))}
                </div>

                <div className="pt-2">
                  <div className="p-3 rounded-xl bg-white border border-slate-200 text-[10px] text-slate-500 space-y-1 shadow-2xs">
                    <div className="font-bold text-slate-800">
                      Overseas Due Diligence
                    </div>
                    <div className="leading-relaxed">
                      Always engage an independent local advocate to inspect 30-year parent deeds and sub-registrar records.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer note */}
          <div className="px-5 py-2.5 border-t border-slate-100 bg-[#fffbf5] text-[11px] text-slate-500 flex items-center justify-between shrink-0">
            <span>Selected Region: <strong className="text-[#c75e0a]">{selectedCity}</strong></span>
            <span className="text-slate-400">100% Direct-to-Owner Land</span>
          </div>
        </div>
      </>
    )}
    </div>
  );
}
