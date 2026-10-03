'use client';

import React, {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  CheckCircle2,
  Download,
  Share,
  X,
} from 'lucide-react';

interface BeforeInstallPromptEvent
  extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome:
      | 'accepted'
      | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const DISMISS_KEY =
  'bhoomimitra_pwa_dismissed_until';

const DISMISS_DURATION_MS =
  14 * 24 * 60 * 60 * 1000;

export function PwaInstallBanner() {
  const [
    deferredPrompt,
    setDeferredPrompt,
  ] =
    useState<BeforeInstallPromptEvent | null>(
      null,
    );

  const deferredPromptRef =
    useRef<BeforeInstallPromptEvent | null>(
      null,
    );

  const [isVisible, setIsVisible] =
    useState(false);

  const [isIOS, setIsIOS] =
    useState(false);

  const [
    showIOSHint,
    setShowIOSHint,
  ] = useState(false);

  const [
    alreadyInstalledHint,
    setAlreadyInstalledHint,
  ] = useState(false);

  const isEngagedRef =
    useRef(false);

  useEffect(() => {
    if (
      typeof window ===
      'undefined'
    ) {
      return;
    }

    const isStandalone =
      window
        .matchMedia(
          '(display-mode: standalone)',
        )
        .matches ||
      (
        window.navigator as unknown as {
          standalone?: boolean;
        }
      ).standalone === true;

    if (isStandalone) {
      return;
    }

    try {
      const dismissedUntil =
        localStorage.getItem(
          DISMISS_KEY,
        );

      if (
        dismissedUntil &&
        Date.now() <
          Number.parseInt(
            dismissedUntil,
            10,
          )
      ) {
        return;
      }
    } catch {
      // localStorage can be blocked by privacy settings.
    }

    const userAgent =
      window.navigator.userAgent.toLowerCase();

    const isIosDevice =
      /iphone|ipad|ipod/.test(
        userAgent,
      );

    const isSafari =
      /safari/.test(userAgent) &&
      !/chrome|crios|fxios/.test(
        userAgent,
      );

    if (
      isIosDevice &&
      isSafari
    ) {
      setIsIOS(true);
    }

    const handleBeforeInstallPrompt = (
      event: Event,
    ) => {
      event.preventDefault();

      const promptEvent =
        event as BeforeInstallPromptEvent;

      deferredPromptRef.current =
        promptEvent;

      setDeferredPrompt(
        promptEvent,
      );

      if (
        isEngagedRef.current
      ) {
        setIsVisible(true);
      }
    };

    const handleAppInstalled =
      () => {
        setIsVisible(false);

        deferredPromptRef.current =
          null;

        setDeferredPrompt(null);
      };

    window.addEventListener(
      'beforeinstallprompt',
      handleBeforeInstallPrompt,
    );

    window.addEventListener(
      'appinstalled',
      handleAppInstalled,
    );

    const triggerEngagement =
      () => {
        isEngagedRef.current =
          true;

        if (
          deferredPromptRef.current ||
          (isIosDevice &&
            isSafari)
        ) {
          setIsVisible(true);
        }
      };

    const handleScroll =
      () => {
        if (
          window.scrollY > 300
        ) {
          triggerEngagement();

          window.removeEventListener(
            'scroll',
            handleScroll,
          );
        }
      };

    window.addEventListener(
      'scroll',
      handleScroll,
      {
        passive: true,
      },
    );

    const timerId =
      window.setTimeout(
        triggerEngagement,
        15000,
      );

    return () => {
      window.removeEventListener(
        'scroll',
        handleScroll,
      );

      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt,
      );

      window.removeEventListener(
        'appinstalled',
        handleAppInstalled,
      );

      window.clearTimeout(
        timerId,
      );
    };
  }, []);

  const handleInstallClick =
    async () => {
      if (isIOS) {
        setShowIOSHint(true);
        return;
      }

      const prompt =
        deferredPrompt ||
        deferredPromptRef.current;

      if (prompt) {
        try {
          await prompt.prompt();

          const choiceResult =
            await prompt.userChoice;

          if (
            choiceResult.outcome ===
            'accepted'
          ) {
            setIsVisible(false);
          }

          deferredPromptRef.current =
            null;

          setDeferredPrompt(null);
        } catch {
          // Browser install prompts are best-effort only.
        }

        return;
      }

      setAlreadyInstalledHint(
        true,
      );
    };

  const handleDismiss = (
    event: React.MouseEvent,
  ) => {
    event.stopPropagation();

    setIsVisible(false);
    setShowIOSHint(false);
    setAlreadyInstalledHint(
      false,
    );

    try {
      localStorage.setItem(
        DISMISS_KEY,
        String(
          Date.now() +
            DISMISS_DURATION_MS,
        ),
      );
    } catch {
      // localStorage can be blocked by privacy settings.
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      aria-label="Install BhoomiMitra"
      className="fixed bottom-4 left-1/2 z-40 w-[min(92vw,34rem)] -translate-x-1/2"
    >
      <div className="flex items-center gap-2.5 rounded-full border border-slate-700/70 bg-slate-950/95 px-3 py-2 text-slate-100 shadow-xl backdrop-blur-md">
        {showIOSHint ? (
          <div className="flex min-w-0 flex-1 items-center gap-2 text-[11px] leading-4">
            <span className="min-w-0">
              Tap{' '}
              <Share
                className="mx-0.5 inline h-3.5 w-3.5 text-[#FFB15C]"
                aria-hidden="true"
              />{' '}
              then{' '}
              <strong className="text-white">
                Add to Home Screen
              </strong>
              .
            </span>

            <button
              type="button"
              onClick={
                handleDismiss
              }
              className="ml-auto shrink-0 rounded-full p-1 text-slate-300 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label="Close installation instructions"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : alreadyInstalledHint ? (
          <div className="flex min-w-0 flex-1 items-center gap-2 text-[11px] leading-4">
            <CheckCircle2
              className="h-3.5 w-3.5 shrink-0 text-emerald-400"
              aria-hidden="true"
            />

            <span className="min-w-0">
              BhoomiMitra may already be installed.
              Use your browser&apos;s app menu to open it.
            </span>

            <button
              type="button"
              onClick={
                handleDismiss
              }
              className="ml-auto shrink-0 rounded-full p-1 text-slate-300 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label="Close"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <>
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FF9933] text-[11px] font-black text-slate-950">
              B
            </span>

            <span className="min-w-0 flex-1 truncate text-[12px] text-slate-100">
              Install{' '}
              <strong className="font-bold text-white">
                BhoomiMitra
              </strong>
            </span>

            <button
              type="button"
              onClick={
                handleInstallClick
              }
              className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#FF9933] px-3 py-1.5 text-[11px] font-black text-slate-950 transition-colors hover:bg-[#ffad5c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <Download
                className="h-3 w-3"
                aria-hidden="true"
              />
              Install
            </button>

            <button
              type="button"
              onClick={
                handleDismiss
              }
              aria-label="Dismiss install prompt"
              className="shrink-0 rounded-full p-1 text-slate-300 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
