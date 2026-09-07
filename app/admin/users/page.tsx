'use client';
 
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Users,
  Search,
  CheckCircle2,
  Shield,
  ShieldCheck,
  User,
  Phone,
  Mail,
  Calendar,
  AlertCircle,
  Loader2,
} from 'lucide-react';

import {
  AdminSectionHeader,
  AdminTableHeader,
  StatusPill,
  EmptyState,
} from '@/components/admin/AdminUI';

interface AdminUserRecord {
  _id: string;
  id?: string;
  name: string;
  email: string;
  phone?: string;
  isPhoneVerified?: boolean;
  role: 'ADMIN' | 'SELLER' | 'BUYER';
  sellerType?: string;
  createdAt: string;
  propertiesCount?: number;
}

/**
 * Authoritative role determination:
 * - ADMIN: platform administrator
 * - SELLER: listed at least 1 property
 * - BUYER: registered & explored, 0 properties listed
 */
function getUserRoleInfo(user: AdminUserRecord) {
  if (user.role === 'ADMIN') {
    return {
      roleKey: 'ADMIN' as const,
      label: 'Admin',
      sublabel: 'Platform Administrator',
      tone: 'green' as const,
    };
  }

  const count = user.propertiesCount || 0;
  if (count > 0) {
    return {
      roleKey: 'SELLER' as const,
      label: 'Seller',
      sublabel: `${count} ${count === 1 ? 'property listed' : 'properties listed'}`,
      tone: 'blue' as const,
    };
  }

  return {
    roleKey: 'BUYER' as const,
    label: 'Buyer / Explorer',
    sublabel: 'Registered & exploring (0 listed)',
    tone: 'amber' as const,
  };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  const loadUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/users', {
        cache: 'no-store',
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('Failed to load platform users.');
      }

      const data = await res.json();
      if (Array.isArray(data?.users)) {
        setUsers(data.users);
      }
      setLastRefreshedAt(new Date());
      setError('');
    } catch (err: unknown) {
      console.error('Users load error:', err);
      setError(err instanceof Error ? err.message : 'Error fetching users list');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleRefresh = () => {
    setLoading(true);
    setError('');
    loadUsers();
  };

  const stats = useMemo(() => {
    const total = users.length;
    let admins = 0;
    let sellers = 0;
    let buyers = 0;

    users.forEach((u) => {
      const info = getUserRoleInfo(u);
      if (info.roleKey === 'ADMIN') admins++;
      else if (info.roleKey === 'SELLER') sellers++;
      else buyers++;
    });

    return { total, admins, sellers, buyers };
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const info = getUserRoleInfo(user);
      const matchesRole = roleFilter === 'ALL' || info.roleKey === roleFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        user.name?.toLowerCase().includes(q) ||
        user.email?.toLowerCase().includes(q) ||
        user.phone?.includes(q);
      return matchesRole && matchesQuery;
    });
  }, [users, roleFilter, searchQuery]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Section Header with Dedicated Refresh */}
      <AdminSectionHeader
        eyebrow="Identity & Governance"
        title="User Management"
        description="Monitor registered accounts, identify landowners/sellers with active listings, and inspect verification states."
        count={`${filteredUsers.length} of ${users.length} Users`}
        onRefresh={handleRefresh}
        isRefreshing={loading}
        lastRefreshedAt={lastRefreshedAt}
      />

      {error && (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs font-semibold text-rose-300 flex items-center justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={handleRefresh}
            className="px-3 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-bold"
          >
            Retry
          </button>
        </div>
      )}

      {/* Role Summary Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3.5">
          <p className="text-[10px] uppercase font-bold text-slate-500">Total Registered</p>
          <p className="text-xl font-black text-white mt-1">{stats.total}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3.5">
          <p className="text-[10px] uppercase font-bold text-emerald-500">Admins</p>
          <p className="text-xl font-black text-emerald-400 mt-1">{stats.admins}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3.5">
          <p className="text-[10px] uppercase font-bold text-blue-500">Sellers (≥1 Listed)</p>
          <p className="text-xl font-black text-blue-400 mt-1">{stats.sellers}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3.5">
          <p className="text-[10px] uppercase font-bold text-amber-500">Buyers / Explorers</p>
          <p className="text-xl font-black text-amber-400 mt-1">{stats.buyers}</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto w-full sm:w-auto pb-1">
          {[
            { id: 'ALL', label: 'All Users' },
            { id: 'ADMIN', label: 'Admins' },
            { id: 'SELLER', label: 'Sellers (≥1 Property)' },
            { id: 'BUYER', label: 'Buyers / Explorers' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setRoleFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors shrink-0 ${
                roleFilter === tab.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800">
              <tr>
                <AdminTableHeader>User</AdminTableHeader>
                <AdminTableHeader>Contact &amp; Verification</AdminTableHeader>
                <AdminTableHeader>Role &amp; Status</AdminTableHeader>
                <AdminTableHeader>Joined</AdminTableHeader>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-400 mb-2" />
                    <span>Loading user accounts...</span>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center">
                    <EmptyState
                      icon={Users}
                      title="No matching users found"
                      description="Try adjusting your search criteria or role filters."
                    />
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const uid = user._id || user.id || '';
                  const roleInfo = getUserRoleInfo(user);

                  return (
                    <tr key={uid} className="hover:bg-slate-800/40 transition-colors">
                      {/* Name & Avatar */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white shrink-0">
                            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-white truncate max-w-[180px]">
                              {user.name || 'Unnamed User'}
                            </p>
                            <p className="text-[10px] text-slate-500 font-mono truncate max-w-[180px]">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Contact & Phone */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          {user.phone ? (
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
                              <Phone className="w-3 h-3 text-slate-500" />
                              <span>{user.phone}</span>
                              {user.isPhoneVerified ? (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[8px] font-bold">
                                  Verified
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[8px] font-bold">
                                  Unverified
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-600 italic">No phone linked</span>
                          )}
                        </div>
                      </td>

                      {/* Dynamic Role & Listing Status */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1 items-start">
                          <StatusPill label={roleInfo.label} tone={roleInfo.tone} />
                          <span className="text-[10px] text-slate-400 font-medium">
                            {roleInfo.sublabel}
                          </span>
                        </div>
                      </td>

                      {/* Created date */}
                      <td className="px-5 py-4 whitespace-nowrap text-slate-400 text-[11px]">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN') : '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
