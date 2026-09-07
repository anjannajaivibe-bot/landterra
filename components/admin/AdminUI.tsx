'use client';

import React from 'react';
import { RefreshCw } from 'lucide-react';

/* ================================================================
   SECTION HEADER WITH DEDICATED REFRESH BUTTON
================================================================ */

interface AdminSectionHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  count?: string | number;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  lastRefreshedAt?: Date | null;
  actions?: React.ReactNode;
}

export function AdminSectionHeader({
  eyebrow,
  title,
  description,
  count,
  onRefresh,
  isRefreshing,
  lastRefreshedAt,
  actions,
}: AdminSectionHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-slate-800">
      <div>
        <p className="text-[9px] uppercase tracking-[0.2em] font-black text-emerald-400">
          {eyebrow}
        </p>

        <h1 className="mt-1 text-2xl font-black tracking-tight text-white flex items-center gap-3">
          <span>{title}</span>
          {count !== undefined && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-bold text-slate-400">
              {count}
            </span>
          )}
        </h1>

        <p className="mt-1 text-xs text-slate-500 max-w-2xl">
          {description}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5 shrink-0">
        {lastRefreshedAt && (
          <span className="text-[10px] text-slate-500 hidden sm:inline">
            Updated {lastRefreshedAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        )}

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer shadow-xs"
            title="Refresh this section"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        )}

        {actions}
      </div>
    </div>
  );
}

/* ================================================================
   METRIC CARDS
================================================================ */

interface AdminMetricCardProps {
  label: string;
  value: string | number;
  secondary: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: 'default' | 'amber' | 'emerald' | 'rose' | 'blue';
}

export function AdminMetricCard({
  label,
  value,
  secondary,
  icon: Icon,
  tone = 'default',
}: AdminMetricCardProps) {
  const toneClasses = {
    default: {
      icon: 'bg-slate-800 text-slate-300',
      value: 'text-white',
    },
    amber: {
      icon: 'bg-amber-500/10 text-amber-400',
      value: 'text-amber-400',
    },
    emerald: {
      icon: 'bg-emerald-500/10 text-emerald-400',
      value: 'text-emerald-400',
    },
    rose: {
      icon: 'bg-rose-500/10 text-rose-400',
      value: 'text-rose-400',
    },
    blue: {
      icon: 'bg-blue-500/10 text-blue-400',
      value: 'text-blue-400',
    },
  };

  const currentTone = toneClasses[tone];

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            {label}
          </p>

          <p className={`mt-2 text-2xl font-black tracking-tight ${currentTone.value}`}>
            {value}
          </p>
        </div>

        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${currentTone.icon}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <p className="mt-3 text-[9px] text-slate-500">
        {secondary}
      </p>
    </div>
  );
}

/* ================================================================
   MINI METRIC
================================================================ */

interface MiniMetricProps {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
}

export function MiniMetric({ label, value, icon: Icon }: MiniMetricProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
        <Icon className="w-3.5 h-3.5 text-slate-400" />
      </div>

      <div>
        <p className="text-[9px] uppercase tracking-wider text-slate-500">
          {label}
        </p>

        <p className="text-sm font-black text-white">
          {value}
        </p>
      </div>
    </div>
  );
}

/* ================================================================
   EMPTY STATE
================================================================ */

interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="py-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 p-6">
      <div className="mx-auto w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
        <Icon className="w-5 h-5" />
      </div>

      <p className="mt-3 text-sm font-bold text-slate-300">
        {title}
      </p>

      <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
        {description}
      </p>

      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* ================================================================
   TABLE HEADER
================================================================ */

export function AdminTableHeader({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <th className="px-5 py-3 text-[9px] uppercase tracking-wider font-black text-slate-500 whitespace-nowrap text-left">
      {children}
    </th>
  );
}

/* ================================================================
   STATUS PILL
================================================================ */

interface StatusPillProps {
  label: string;
  tone?: 'green' | 'red' | 'amber' | 'blue' | 'neutral';
}

export function StatusPill({
  label,
  tone = 'neutral',
}: StatusPillProps) {
  const classes = {
    green: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    red: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
    amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    blue: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    neutral: 'bg-slate-800 border-slate-700 text-slate-400',
  };

  return (
    <span className={`inline-flex px-2 py-0.5 rounded-md border text-[9px] font-black uppercase tracking-wider ${classes[tone]}`}>
      {label}
    </span>
  );
}

/* ================================================================
   INFO BOX
================================================================ */

export function InfoBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
      <p className="text-[8px] uppercase tracking-wider font-black text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-[10px] font-bold text-slate-300 truncate">
        {value}
      </p>
    </div>
  );
}

/* ================================================================
   ADMIN TOGGLE
================================================================ */

interface AdminToggleProps {
  title: string;
  description: string;
  enabled: boolean;
  onChange: () => void;
}

export function AdminToggle({
  title,
  description,
  enabled,
  onChange,
}: AdminToggleProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-sm font-black text-white">
            {title}
          </h3>

          <p className="mt-1 text-[10px] leading-relaxed text-slate-500">
            {description}
          </p>
        </div>

        <button
          type="button"
          onClick={onChange}
          aria-label={`${title}: ${enabled ? 'enabled' : 'disabled'}`}
          className={`shrink-0 transition-colors p-1 cursor-pointer`}
        >
          <div className={`w-11 h-6 rounded-full transition-colors relative ${enabled ? 'bg-emerald-600' : 'bg-slate-700'}`}>
            <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${enabled ? 'left-6' : 'left-1'}`} />
          </div>
        </button>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
        <span className="text-[9px] font-bold text-slate-500">
          Current state
        </span>

        <span
          className={`px-2 py-0.5 rounded-md text-[8px] font-black border ${
            enabled
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
          }`}
        >
          {enabled ? 'ENFORCED' : 'DISABLED'}
        </span>
      </div>
    </div>
  );
}
