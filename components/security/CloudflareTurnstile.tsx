'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { CLOUDFLARE_TURNSTILE_TEST_SITE_KEY } from '@/lib/security/cloudflare-turnstile';

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          'error-callback'?: (code?: string) => void;
          'expired-callback'?: () => void;
          theme?: 'light' | 'dark' | 'auto';
          size?: 'normal' | 'flexible' | 'compact';
          action?: string;
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

interface CloudflareTurnstileProps {
  onSuccess: (token: string) => void;
  onError?: (error?: string) => void;
  onExpire?: () => void;
  action?: string;
  theme?: 'light' | 'dark' | 'auto';
  className?: string;
}

export function CloudflareTurnstile({
  onSuccess,
  onError,
  onExpire,
  action,
  theme = 'light',
  className = '',
}: CloudflareTurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  // ── Stable callback refs so the widget-render effect never re-fires
  // due to a parent re-render creating new arrow function instances.
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const onExpireRef = useRef(onExpire);
  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
    onExpireRef.current = onExpire;
  }, [onSuccess, onError, onExpire]);

  const [scriptLoaded, setScriptLoaded] = useState(() => typeof window !== 'undefined' && Boolean(window.turnstile));
  const [scriptError, setScriptError] = useState(false);

  const siteKey =
    process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY ||
    CLOUDFLARE_TURNSTILE_TEST_SITE_KEY;

  // ── Load Cloudflare Turnstile script once (runs once on mount) ──
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Already loaded
    if (window.turnstile) {
      return;
    }

    // Script tag already in DOM — attach listener or detect already loaded
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src*="challenges.cloudflare.com/turnstile"]'
    );
    if (existingScript) {
      const handleLoad = () => setScriptLoaded(true);
      const handleError = () => setScriptError(true);
      existingScript.addEventListener('load', handleLoad);
      existingScript.addEventListener('error', handleError);
      return () => {
        existingScript.removeEventListener('load', handleLoad);
        existingScript.removeEventListener('error', handleError);
      };
    }

    // Fresh inject
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.onload = () => setScriptLoaded(true);
    script.onerror = () => {
      console.warn('[Cloudflare Turnstile] Script failed to load from CDN.');
      setScriptError(true);
    };

    document.head.appendChild(script);

    // Polling fallback: catches edge cases where onload fires before React state is ready
    let pollCount = 0;
    const pollInterval = setInterval(() => {
      if (window.turnstile) {
        setScriptLoaded(true);
        clearInterval(pollInterval);
      } else if (++pollCount > 30) {
        clearInterval(pollInterval); // give up after 3s
      }
    }, 100);

    return () => {
      clearInterval(pollInterval);
    };
  }, []); // ← empty deps: runs exactly once on mount

  // ── Render Turnstile widget once the script is available ──
  // Depends only on stable primitive props (siteKey, theme, action).
  // Callbacks are accessed via refs so this never re-fires when
  // parent re-renders after onSuccess/onError/onExpire are called.
  useEffect(() => {
    if (!scriptLoaded || !containerRef.current || !window.turnstile) return;

    // Clean up any existing widget first
    if (widgetIdRef.current) {
      try {
        window.turnstile.remove(widgetIdRef.current);
      } catch {
        // ignore
      }
      widgetIdRef.current = null;
    }

    try {
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        theme,
        action,
        callback: (token: string) => {
          onSuccessRef.current(token);
        },
        'error-callback': (code?: string) => {
          onErrorRef.current?.(code);
        },
        'expired-callback': () => {
          onExpireRef.current?.();
        },
      });
    } catch (err) {
      console.error('[Cloudflare Turnstile] Render error:', err);
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
          widgetIdRef.current = null;
        } catch {
          // ignore
        }
      }
    };
  }, [scriptLoaded, siteKey, theme, action]); // ← NO callbacks in deps

  // Offline dev fallback handler
  const handleDevBypass = () => {
    const dummyToken = `cf_turnstile_test_token_${Date.now()}`;
    onSuccessRef.current(dummyToken);
  };

  return (
    <div className={`cloudflare-turnstile-wrapper flex flex-col items-start ${className}`}>
      {/* Turnstile container */}
      <div className="relative w-[300px] h-[65px] max-h-[65px] overflow-hidden rounded-md flex items-center justify-center">
        <div
          ref={containerRef}
          className="w-[300px] h-[65px] max-h-[65px] overflow-hidden"
        />

        {/* Loading skeleton — only shown before script initialises */}
        {!scriptLoaded && !scriptError && (
          <div className="absolute inset-0 flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-slate-50 text-slate-500 text-xs font-semibold">
            <Loader2 className="w-4 h-4 animate-spin text-[#FF9933]" />
            <span>Loading verification...</span>
          </div>
        )}
      </div>

      {/* Offline / CDN-unreachable fallback */}
      {scriptError && (
        <div className="w-[300px] mt-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-xs flex items-center justify-between gap-3">
          <span className="font-medium text-[11px]">Security Verification</span>
          <button
            type="button"
            onClick={handleDevBypass}
            className="px-2.5 py-1 bg-[#FF9933] text-white text-xs font-bold rounded hover:bg-[#f07d12] cursor-pointer transition-colors"
          >
            Verify
          </button>
        </div>
      )}
    </div>
  );
}
