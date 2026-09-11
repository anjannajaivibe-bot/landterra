'use client';

import React from 'react';

import {
  AlertCircle,
  Clock3,
  ShieldCheck,
  XCircle,
} from 'lucide-react';

import {
  VerificationStatus,
} from '@/types/property';

import {
  VERIFICATION_BADGES,
} from '@/config/constants';

interface VerificationBadgeProps {
  status: VerificationStatus;

  showIcon?: boolean;

  className?: string;

  /**
   * Optional compact mode for small cards.
   */
  compact?: boolean;
}

export function VerificationBadge({
  status,
  showIcon = true,
  className = '',
  compact = false,
}: VerificationBadgeProps) {
  const badge =
    VERIFICATION_BADGES[status] ||
    VERIFICATION_BADGES.PENDING;

  const renderIcon = () => {
    if (!showIcon) {
      return null;
    }

    const iconClass = compact
      ? 'h-3 w-3'
      : 'h-3.5 w-3.5';

    switch (status) {
      case 'VERIFIED':
        return (
          <ShieldCheck
            className={`${iconClass} shrink-0 text-[#FF9933]`}
          />
        );

      case 'PENDING':
        return (
          <Clock3
            className={`${iconClass} shrink-0 text-amber-600`}
          />
        );

      case 'VERIFICATION_REQUIRED':
        return (
          <AlertCircle
            className={`${iconClass} shrink-0 text-blue-600`}
          />
        );

      case 'REJECTED':
        return (
          <XCircle
            className={`${iconClass} shrink-0 text-rose-600`}
          />
        );

      default:
        return null;
    }
  };

  const label =
    compact && status === 'VERIFIED'
      ? 'Verified'
      : badge.label;

  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 border font-bold',
        compact
          ? 'rounded-lg px-2 py-1 text-[9px]'
          : 'rounded-full px-2.5 py-1 text-[10px]',
        badge.badgeClass,
        className,
      ].join(' ')}
      title={badge.description}
      aria-label={badge.description}
    >
      {renderIcon()}

      <span>{label}</span>
    </span>
  );
}