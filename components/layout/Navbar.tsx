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
} from 'lucide-react';

import { IUser } from '@/types/user';
import { AuthModal } from '@/components/auth/AuthModal';

export function Navbar() {
  const pathname = usePathname();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const [user, setUser] = useState<Partial<IUser> | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const accountDropdownRef = useRef<HTMLDivElement>(null);

  /* ============================================================
     LOAD CURRENT SESSION
  ============================================================ */

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      try {
        const response = await fetch('/api/auth/session', {
          cache: 'no-store',
        });

        if (!response.ok) {
          if (!cancelled) {
            setUser(null);
          }
          return;
        }

        const data = await response.json();

        if (!cancelled) {
          if (data?.session?.user) {
            setUser(data.session.user);
          } else {
            setUser(null);
          }
        }
      } catch {
        if (!cancelled) {
          setUser(null);
        }
      }
    }

    loadSession();

    return () => {
      cancelled = true;
    };
  }, [pathname]);

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
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md">
        {/* ======================================================
            TRUST / INFORMATION BAR
        ====================================================== */}

        <div className="bg-slate-950">
          <div className="mx-auto flex h-8 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-2 text-[10px] font-medium text-slate-300 sm:text-[11px]">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-400" />

              <span className="truncate">
                Land marketplace for direct property discovery and seller
                connections
              </span>
            </div>

            <div className="hidden shrink-0 items-center gap-2 text-[10px] text-slate-400 sm:flex">
              <span>Listing fee</span>
              <span className="font-bold text-emerald-400">
                ₹10 / sq.yd / month
              </span>
            </div>
          </div>
        </div>

        {/* ======================================================
            MAIN NAVIGATION
        ====================================================== */}

        <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* LOGO */}

          <Link
            href="/"
            onClick={closeAllMenus}
            className="group flex shrink-0 items-center gap-2.5"
            aria-label="LandTerra home"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm transition-colors group-hover:bg-emerald-700">
              <Compass className="h-5 w-5" />
            </div>

            <div className="leading-none">
              <span className="flex items-center text-xl font-black tracking-tight text-slate-950">
                Land
                <span className="text-emerald-700">Terra</span>
              </span>

              <span className="mt-1 block text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">
                Land Marketplace
              </span>
            </div>
          </Link>

          {/* ====================================================
              DESKTOP NAVIGATION
          ==================================================== */}

          <nav
            className="hidden items-center gap-1 md:flex"
            aria-label="Primary navigation"
          >
            <NavLink
              href="/buy"
              active={isActive('/buy')}
              icon={<Search className="h-3.5 w-3.5" />}
            >
              Find Land
            </NavLink>

            <NavLink
              href="/sell"
              active={isActive('/sell')}
              icon={<Plus className="h-3.5 w-3.5" />}
            >
              Sell Your Land
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
              icon={<MessageSquare className="h-3.5 w-3.5" />}
            >
              Contact
            </NavLink>
          </nav>

          {/* ====================================================
              DESKTOP ACCOUNT / ACTIONS
          ==================================================== */}

          <div className="hidden items-center gap-2 lg:flex">
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
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-2 transition-colors hover:border-slate-300 hover:bg-slate-50"
                >
                  {/* Avatar */}

                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-black text-emerald-800">
                    {userInitial}
                  </div>

                  {/* User name */}

                  <div className="max-w-[130px] text-left">
                    <span className="block truncate text-xs font-bold text-slate-900">
                      {user.name || 'My Account'}
                    </span>

                    <span className="block text-[10px] font-medium text-slate-500">
                      Customer account
                    </span>
                  </div>

                  <ChevronDown
                    className={`h-3.5 w-3.5 text-slate-400 transition-transform ${accountDropdownOpen ? 'rotate-180' : ''
                      }`}
                  />
                </button>

                {/* ACCOUNT DROPDOWN */}

                {accountDropdownOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-[calc(100%+8px)] w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl"
                  >
                    {/* Account header */}

                    <div className="border-b border-slate-100 px-3 pb-3 pt-2">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-black text-emerald-800">
                          {userInitial}
                        </div>

                        <div className="min-w-0">
                          <div className="truncate text-sm font-bold text-slate-900">
                            {user.name || 'Customer Account'}
                          </div>

                          <div className="truncate text-[11px] text-slate-500">
                            {user.email || 'Signed in'}
                          </div>

                          {user.phone && (
                            <div className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Phone verified</span>
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
                        title="Saved Lands & Inquiries"
                        description="Your saved properties and seller conversations"
                        onClick={closeAllMenus}
                      />

                      <AccountMenuLink
                        href="/dashboard/seller"
                        icon={
                          <LayoutDashboard className="h-4 w-4 text-emerald-600" />
                        }
                        title="My Land Listings"
                        description="Manage your properties and subscriptions"
                        onClick={closeAllMenus}
                      />

                      <AccountMenuLink
                        href="/profile"
                        icon={
                          <User className="h-4 w-4 text-slate-500" />
                        }
                        title="My Profile"
                        description="Account and phone verification"
                        onClick={closeAllMenus}
                      />

                      <div className="mt-1 border-t border-slate-100 pt-1">
                        <button
                          type="button"
                          role="menuitem"
                          onClick={handleSignOut}
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-rose-50"
                        >
                          <LogOut className="h-4 w-4 text-rose-500" />

                          <div>
                            <div className="text-xs font-bold text-rose-600">
                              Sign Out
                            </div>

                            <div className="text-[10px] text-slate-500">
                              Sign out of this account
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
                className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-100 hover:text-emerald-700"
              >
                <LogIn className="h-4 w-4" />
                <span>Sign In</span>
              </button>
            )}

            {/* PRIMARY SELL CTA */}

            <Link
              href="/sell"
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow-md"
            >
              <Plus className="h-4 w-4" />
              <span>List Your Land</span>
            </Link>
          </div>

          {/* ====================================================
              MOBILE ACTIONS
          ==================================================== */}

          <div className="flex items-center gap-2 md:hidden">
            {!user && (
              <button
                type="button"
                onClick={openAuthModal}
                className="inline-flex items-center gap-1 px-2 py-2 text-xs font-bold text-emerald-700"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Sign In</span>
              </button>
            )}

            <Link
              href="/buy"
              onClick={closeAllMenus}
              className="hidden rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white sm:inline-flex"
            >
              Find Land
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
              className="rounded-xl p-2 text-slate-700 transition-colors hover:bg-slate-100"
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
            MOBILE MENU
        ====================================================== */}

        {mobileMenuOpen && (
          <div className="border-t border-slate-200 bg-white md:hidden">
            <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
              {/* Mobile primary CTA */}

              <div className="mb-4 rounded-2xl bg-slate-950 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white">
                    <Search className="h-4 w-4" />
                  </div>

                  <div>
                    <p className="text-sm font-bold text-white">
                      Looking for land?
                    </p>

                    <p className="mt-1 text-[11px] leading-5 text-slate-400">
                      Search available properties by location, land type and
                      budget.
                    </p>
                  </div>
                </div>

                <Link
                  href="/buy"
                  onClick={closeAllMenus}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white transition-colors hover:bg-emerald-500"
                >
                  <Search className="h-4 w-4" />
                  Find Land
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
                  Find Land
                </MobileNavLink>

                <MobileNavLink
                  href="/sell"
                  active={isActive('/sell')}
                  icon={<Plus className="h-4 w-4" />}
                  onClick={closeAllMenus}
                >
                  Sell Your Land
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
                  Contact
                </MobileNavLink>
              </nav>

              {/* Logged-in customer section */}

              {user ? (
                <div className="mt-4 border-t border-slate-200 pt-4">
                  <div className="mb-2 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
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
                      Saved Lands & Inquiries
                    </MobileAccountLink>

                    <MobileAccountLink
                      href="/dashboard/seller"
                      icon={
                        <LayoutDashboard className="h-4 w-4 text-emerald-600" />
                      }
                      onClick={closeAllMenus}
                    >
                      My Land Listings
                    </MobileAccountLink>

                    <MobileAccountLink
                      href="/profile"
                      icon={
                        <User className="h-4 w-4 text-slate-500" />
                      }
                      onClick={closeAllMenus}
                    >
                      My Profile
                    </MobileAccountLink>

                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-xs font-bold text-rose-600 transition-colors hover:bg-rose-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 border-t border-slate-200 pt-4">
                  <button
                    type="button"
                    onClick={openAuthModal}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800 transition-colors hover:bg-emerald-100"
                  >
                    <LogIn className="h-4 w-4" />
                    Sign In with Google
                  </button>
                </div>
              )}

              {/* Mobile sell CTA */}

              <Link
                href="/sell"
                onClick={closeAllMenus}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3.5 text-xs font-bold text-white transition-colors hover:bg-emerald-700"
              >
                <Plus className="h-4 w-4" />
                List Your Land
              </Link>

              <p className="mt-3 text-center text-[10px] leading-5 text-slate-400">
                Listing fee: ₹10 per sq. yard for 30 days
              </p>
            </div>
          </div>
        )}
      </header>

      {/* ========================================================
          AUTH MODAL
      ======================================================== */}

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
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
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-sm transition-colors ${active
        ? 'bg-emerald-50 font-bold text-emerald-700'
        : 'font-semibold text-slate-600 hover:bg-slate-50 hover:text-emerald-700'
        }`}
    >
      {icon}
      {children}
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
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50">
        {icon}
      </div>

      <div className="min-w-0">
        <div className="text-xs font-bold text-slate-800">
          {title}
        </div>

        <div className="mt-0.5 truncate text-[10px] text-slate-500">
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
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
  icon?: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-colors ${active
        ? 'bg-emerald-50 font-bold text-emerald-700'
        : 'font-semibold text-slate-700 hover:bg-slate-50'
        }`}
    >
      {icon && (
        <span className={active ? 'text-emerald-600' : 'text-slate-400'}>
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
      className="flex items-center gap-3 rounded-xl px-3 py-3 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
    >
      {icon}
      {children}
    </Link>
  );
}