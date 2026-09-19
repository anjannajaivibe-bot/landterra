'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShieldCheck,
  Plus,
  LayoutDashboard,
  Heart,
  User,
  Menu,
  X,
  Compass,
  ChevronDown,
  CheckCircle2,
  LogOut,
  LogIn,
  Search,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

import dynamic from 'next/dynamic';
import { IUser } from '@/types/user';
import { CitySelectorMegaMenu } from './CitySelectorMegaMenu';

const AuthModal = dynamic(
  () => import('@/components/auth/AuthModal').then((mod) => mod.AuthModal),
  { ssr: false }
);

let cachedUser: Partial<IUser> | null | undefined = undefined;

export function Navbar() {
  const pathname = usePathname();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const [user, setUser] = useState<Partial<IUser> | null>(() => cachedUser ?? null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const accountDropdownRef = useRef<HTMLDivElement>(null);

  /* ============================================================
     LOAD CURRENT SESSION (Single-fetch with in-memory caching)
  ============================================================ */

  useEffect(() => {
    // If session has already been resolved in memory, avoid refetching on route changes
    if (cachedUser !== undefined) {
      return;
    }

    let cancelled = false;

    async function loadSession() {
      try {
        const response = await fetch('/api/auth/session', {
          cache: 'no-store',
        });

        if (!response.ok) {
          cachedUser = null;
          if (!cancelled) {
            setUser(null);
          }
          return;
        }

        const data = await response.json();
        const nextUser = data?.session?.user || null;
        cachedUser = nextUser;

        if (!cancelled) {
          setUser(nextUser);
        }
      } catch {
        cachedUser = null;
        if (!cancelled) {
          setUser(null);
        }
      }
    }

    loadSession();

    return () => {
      cancelled = true;
    };
  }, []);

  /* Listen for global auth state changes (e.g. login/logout) */
  useEffect(() => {
    const handleAuthChanged = (e: Event) => {
      const customEvent = e as CustomEvent<{ user?: Partial<IUser> | null }>;
      const nextUser = customEvent.detail?.user ?? null;
      cachedUser = nextUser;
      setUser(nextUser);
    };

    window.addEventListener('bhoomimitra_auth_changed', handleAuthChanged);
    return () => {
      window.removeEventListener('bhoomimitra_auth_changed', handleAuthChanged);
    };
  }, []);

  /* ============================================================
     CLOSE ACCOUNT DROPDOWN WHEN CLICKING OUTSIDE
  ============================================================ */

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        accountDropdownRef.current &&
        !accountDropdownRef.current.contains(event.target as Node)
      ) {
        setAccountDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  /* ============================================================
     SIGN OUT
  ============================================================ */

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      cachedUser = null;
      setUser(null);
      setAccountDropdownOpen(false);
      setMobileMenuOpen(false);
      window.location.href = '/';
    }
  };

  /* ============================================================
     NAVIGATION HELPERS
  ============================================================ */

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }

    return pathname === path || pathname.startsWith(`${path}/`);
  };

  const openAuthModal = () => {
    setMobileMenuOpen(false);
    setAccountDropdownOpen(false);
    setAuthModalOpen(true);
  };

  const closeAllMenus = () => {
    setMobileMenuOpen(false);
    setAccountDropdownOpen(false);
  };

  /* ============================================================
     USER DISPLAY
  ============================================================ */

  const userInitial =
    user?.name?.trim()?.charAt(0)?.toUpperCase() ||
    user?.email?.trim()?.charAt(0)?.toUpperCase() ||
    'U';

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-xs">
        {/* ======================================================
            TOP TRUST & ANNOUNCEMENT BAR (Clean White / Slate-50)
        ====================================================== */}

        <div className="border-b border-slate-100 bg-slate-50/90 text-slate-800">
          <div className="mx-auto flex h-8 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-2 text-xs font-semibold text-slate-800">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-[#FF9933]" />
              <span className="truncate">
                Property marketplace • Direct seller contact • 0% platform brokerage
              </span>
            </div>

            <div className="hidden shrink-0 items-center gap-3 text-xs text-slate-600 sm:flex">
              <span className="font-bold text-[#c75e0a]">Sale • Rent • Lease</span>
            </div>
          </div>
        </div>

        {/* ======================================================
            MAIN NAVIGATION BAR (Crisp White Background)
        ====================================================== */}

        <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* LOGO & CITY SELECTOR */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link
              href="/"
              onClick={closeAllMenus}
              className="group flex shrink-0 items-center gap-2 sm:gap-2.5"
              aria-label="BhoomiMitra home"
            >
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-[#FF9933] text-white shadow-sm transition-all group-hover:bg-[#f07d12] group-hover:shadow-md">
                <Compass className="h-5 w-5" />
              </div>

              <div className="leading-none">
                <span className="flex items-center text-lg sm:text-xl font-black tracking-tight text-slate-950">
                  Bhoomi
                  <span className="text-[#FF9933]">Mitra</span>
                </span>
                <span className="mt-0.5 hidden sm:block text-[11px] font-bold text-slate-500">
                  Property Marketplace
                </span>
              </div>
            </Link>

            {/* City Mega-Menu Selector */}
            <div className="flex items-center ml-0.5 sm:ml-1 pl-1.5 sm:pl-2.5 border-l border-slate-200 shrink-0">
              <CitySelectorMegaMenu />
            </div>
          </div>

          {/* ====================================================
              DESKTOP NAVIGATION LINKS (Solid Black / Bold)
          ==================================================== */}

          <nav
            className="hidden items-center gap-1.5 md:flex"
            aria-label="Primary navigation"
          >
            <NavLink
              href="/buy"
              active={isActive('/buy')}
              icon={<Search className="h-4 w-4" />}
            >
              Find Property
            </NavLink>

            <NavLink
              href="/listing-rules"
              active={isActive('/listing-rules')}
            >
              Listing Rules
            </NavLink>

            <NavLink
              href="/about"
              active={isActive('/about')}
            >
              About
            </NavLink>

            <NavLink
              href="/contact"
              active={isActive('/contact')}
              icon={<MessageSquare className="h-4 w-4" />}
            >
              Contact
            </NavLink>
          </nav>

          {/* ====================================================
              DESKTOP ACCOUNT / ACTIONS
          ==================================================== */}

          <div className="hidden items-center gap-3 lg:flex">
            {user ? (
              <div
                ref={accountDropdownRef}
                className="relative"
              >
                <button
                  type="button"
                  onClick={() =>
                    setAccountDropdownOpen((current) => !current)
                  }
                  aria-expanded={accountDropdownOpen}
                  aria-haspopup="menu"
                  aria-label="User account menu"
                  className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2 transition-all hover:border-slate-300 hover:bg-slate-50 shadow-2xs"
                >
                  {/* Avatar */}
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#fff1dc] text-xs font-black text-[#c75e0a] border border-[#FF9933]/30">
                    {userInitial}
                  </div>

                  {/* User name */}
                  <div className="max-w-[130px] text-left">
                    <span className="block truncate text-xs font-bold text-slate-950">
                      {user.name || 'My Account'}
                    </span>

                    <span className="block text-[10px] font-semibold text-slate-500">
                      Customer Account
                    </span>
                  </div>

                  <ChevronDown
                    className={`h-4 w-4 text-slate-500 transition-transform ${accountDropdownOpen ? 'rotate-180' : ''
                      }`}
                  />
                </button>

                {/* ACCOUNT DROPDOWN */}
                {accountDropdownOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-[calc(100%+8px)] w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-xl animate-in fade-in slide-in-from-top-2 duration-150"
                  >
                    {/* Account header */}
                    <div className="border-b border-slate-100 px-3 pb-3 pt-2">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fff1dc] text-sm font-black text-[#c75e0a] border border-[#FF9933]/30">
                          {userInitial}
                        </div>

                        <div className="min-w-0">
                          <div className="truncate text-sm font-bold text-slate-950">
                            {user.name || 'Customer Account'}
                          </div>

                          <div className="truncate text-[11px] font-medium text-slate-500">
                            {user.email || 'Signed in'}
                          </div>

                          {user.phone && (
                            <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-[#c75e0a]">
                              <CheckCircle2 className="h-3 w-3 text-[#FF9933]" />
                              <span>Phone Verified</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Account links */}
                    <div className="space-y-1 pt-2">
                      <AccountMenuLink
                        href="/dashboard/buyer"
                        icon={
                          <Heart className="h-4 w-4 text-rose-500" />
                        }
                        title="Saved Properties & Inquiries"
                        description="Your watchlist and seller inquiries"
                        onClick={closeAllMenus}
                      />

                      <AccountMenuLink
                        href="/dashboard/seller"
                        icon={
                          <LayoutDashboard className="h-4 w-4 text-[#FF9933]" />
                        }
                        title="My Property Listings"
                        description="Manage listings and enquiries"
                        onClick={closeAllMenus}
                      />

                      <AccountMenuLink
                        href="/profile"
                        icon={
                          <User className="h-4 w-4 text-slate-700" />
                        }
                        title="My Profile"
                        description="Account and mobile verification"
                        onClick={closeAllMenus}
                      />

                      <div className="mt-1 border-t border-slate-100 pt-1">
                        <button
                          type="button"
                          role="menuitem"
                          onClick={handleSignOut}
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-rose-50"
                        >
                          <LogOut className="h-4 w-4 text-rose-600" />

                          <div>
                            <div className="text-xs font-bold text-rose-700">
                              Sign Out
                            </div>

                            <div className="text-[10px] text-slate-500">
                              End your session securely
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={openAuthModal}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-900 shadow-2xs transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-[#c75e0a]"
              >
                <LogIn className="h-4 w-4 text-slate-700" />
                <span>Sign In</span>
              </button>
            )}

            {/* PRIMARY SELL CTA WITH BADGE */}
            <Link
              href="/sell"
              prefetch={false}
              className="inline-flex items-center gap-2 rounded-xl bg-[#FF9933] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#f07d12] hover:shadow-md cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Post Property</span>
            </Link>
          </div>

          {/* ====================================================
              MOBILE ACTIONS
          ==================================================== */}

          <div className="flex items-center gap-1.5 sm:gap-2 md:hidden shrink-0">
            {!user && (
              <button
                type="button"
                onClick={openAuthModal}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-900"
              >
                <LogIn className="h-3.5 w-3.5 text-[#c75e0a]" />
                <span>Sign In</span>
              </button>
            )}

            <Link
              href="/sell"
              prefetch={false}
              onClick={closeAllMenus}
              className="inline-flex items-center gap-1 rounded-lg bg-[#FF9933] px-2.5 sm:px-3 py-2 text-xs font-bold text-white shadow-2xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Post Property</span>
            </Link>

            <button
              type="button"
              onClick={() =>
                setMobileMenuOpen((current) => !current)
              }
              aria-label={
                mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'
              }
              aria-expanded={mobileMenuOpen}
              className="rounded-xl border border-slate-200 bg-white p-2 text-slate-900 transition-colors hover:bg-slate-50"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* ======================================================
            MOBILE DRAWER (White Background & Black Headers)
        ====================================================== */}

        {mobileMenuOpen && (
          <div className="border-t border-slate-200 bg-white md:hidden animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 space-y-4">
              {/* Mobile primary discovery card */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-2xs">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FF9933] text-white">
                    <Search className="h-4 w-4" />
                  </div>

                  <div>
                    <p className="text-sm font-bold text-slate-950">
                      Explore Land Listings
                    </p>

                    <p className="mt-0.5 text-xs text-slate-600">
                      Browse plots, homes, commercial spaces and hospitality properties from listed sellers.
                    </p>
                  </div>
                </div>

                <Link
                  href="/buy"
                  onClick={closeAllMenus}
                  className="mt-3.5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#FF9933] px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-[#f07d12] shadow-xs"
                >
                  <Search className="h-4 w-4" />
                  <span>Browse All Properties</span>
                </Link>
              </div>

              {/* Mobile navigation */}
              <nav
                className="space-y-1"
                aria-label="Mobile navigation"
              >
                <MobileNavLink
                  href="/buy"
                  active={isActive('/buy')}
                  icon={<Search className="h-4 w-4" />}
                  onClick={closeAllMenus}
                >
                  Find Property
                </MobileNavLink>

                <MobileNavLink
                  href="/listing-rules"
                  active={isActive('/listing-rules')}
                  onClick={closeAllMenus}
                >
                  Listing Rules
                </MobileNavLink>

                <MobileNavLink
                  href="/about"
                  active={isActive('/about')}
                  onClick={closeAllMenus}
                >
                  About Us
                </MobileNavLink>

                <MobileNavLink
                  href="/contact"
                  active={isActive('/contact')}
                  icon={<MessageSquare className="h-4 w-4" />}
                  onClick={closeAllMenus}
                >
                  Contact Support
                </MobileNavLink>
              </nav>

              {/* Logged-in customer section */}
              {user ? (
                <div className="border-t border-slate-200 pt-4">
                  <div className="mb-2 px-2 text-[11px] font-extrabold uppercase tracking-wider text-slate-900">
                    My Account
                  </div>

                  <div className="space-y-1">
                    <MobileAccountLink
                      href="/dashboard/buyer"
                      icon={
                        <Heart className="h-4 w-4 text-rose-500" />
                      }
                      onClick={closeAllMenus}
                    >
                      Saved Properties & Inquiries
                    </MobileAccountLink>

                    <MobileAccountLink
                      href="/dashboard/seller"
                      icon={
                        <LayoutDashboard className="h-4 w-4 text-[#FF9933]" />
                      }
                      onClick={closeAllMenus}
                    >
                      My Property Listings
                    </MobileAccountLink>

                    <MobileAccountLink
                      href="/profile"
                      icon={
                        <User className="h-4 w-4 text-slate-700" />
                      }
                      onClick={closeAllMenus}
                    >
                      My Profile & Mobile Verification
                    </MobileAccountLink>

                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-xs font-bold text-rose-700 transition-colors hover:bg-rose-50"
                    >
                      <LogOut className="h-4 w-4 text-rose-600" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border-t border-slate-200 pt-4">
                  <button
                    type="button"
                    onClick={openAuthModal}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-900 shadow-2xs transition-colors hover:bg-slate-50"
                  >
                    <LogIn className="h-4 w-4 text-[#c75e0a]" />
                    <span>Sign In to Your Account</span>
                  </button>
                </div>
              )}

              {/* Mobile bottom pricing note */}
              <div className="pt-2 text-center text-[11px] font-semibold text-slate-500">
                Property Marketplace • Direct Seller Contact
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ========================================================
          AUTH MODAL
      ======================================================== */}

      {authModalOpen && (
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
        />
      )}
    </>
  );
}

/* ==============================================================
   DESKTOP NAV LINK
================================================================ */

function NavLink({
  href,
  active,
  children,
  icon,
  prefetch,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
  icon?: React.ReactNode;
  prefetch?: boolean;
}) {
  return (
    <Link
      href={href}
      prefetch={prefetch}
      className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${active
        ? 'bg-[#fff1dc] text-[#c75e0a] border border-[#FF9933]/30 shadow-2xs'
        : 'text-slate-900 hover:bg-slate-100/80 hover:text-[#c75e0a]'
        }`}
    >
      {icon}
      <span>{children}</span>
    </Link>
  );
}

/* ==============================================================
   ACCOUNT DROPDOWN LINK
================================================================ */

function AccountMenuLink({
  href,
  icon,
  title,
  description,
  onClick,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-slate-50"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 border border-slate-200">
        {icon}
      </div>

      <div className="min-w-0">
        <div className="text-xs font-bold text-slate-950">
          {title}
        </div>

        <div className="mt-0.5 truncate text-[11px] text-slate-500 font-medium">
          {description}
        </div>
      </div>
    </Link>
  );
}

/* ==============================================================
   MOBILE NAV LINK
================================================================ */

function MobileNavLink({
  href,
  active,
  children,
  icon,
  onClick,
  prefetch,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
  icon?: React.ReactNode;
  onClick: () => void;
  prefetch?: boolean;
}) {
  return (
    <Link
      href={href}
      prefetch={prefetch}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs transition-colors ${active
        ? 'bg-[#fff1dc] font-bold text-[#c75e0a] border border-[#FF9933]/30'
        : 'font-bold text-slate-900 hover:bg-slate-100'
        }`}
    >
      {icon && (
        <span className={active ? 'text-[#FF9933]' : 'text-slate-500'}>
          {icon}
        </span>
      )}

      <span>{children}</span>
    </Link>
  );
}

/* ==============================================================
   MOBILE ACCOUNT LINK
================================================================ */

function MobileAccountLink({
  href,
  icon,
  children,
  onClick,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 transition-colors hover:bg-slate-100"
    >
      {icon}
      <span>{children}</span>
    </Link>
  );
}