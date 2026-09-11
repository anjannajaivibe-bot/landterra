'use client';

import { useEffect, useRef } from 'react';

interface UseModalAccessibilityOptions {
  isOpen: boolean;
  onClose: () => void;
  preventScroll?: boolean;
}

/**
 * W3C WAI-ARIA compliant accessibility hook for modal dialogs.
 * - Traps keyboard focus (Tab / Shift+Tab) strictly within the dialog.
 * - Listens for the Escape key to close the dialog.
 * - Focuses the first interactive element or close button upon open.
 * - Restores focus to the triggering element when the modal is closed.
 * - Prevents background page scrolling while the modal is open.
 */
export function useModalAccessibility({
  isOpen,
  onClose,
  preventScroll = true,
}: UseModalAccessibilityOptions) {
  const modalRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // 1. Remember the element that opened the modal so focus can be restored
    triggerRef.current = document.activeElement as HTMLElement | null;

    // 2. Prevent background page scrolling
    const originalOverflow = document.body.style.overflow;
    if (preventScroll) {
      document.body.style.overflow = 'hidden';
    }

    // 3. Auto-focus the first focusable element inside the modal
    const timer = setTimeout(() => {
      if (modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length > 0) {
          focusable[0].focus();
        } else {
          modalRef.current.focus();
        }
      }
    }, 50);

    // 4. Keyboard listener for Escape key and Tab focus trap
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }

        const firstElement = focusable[0];
        const lastElement = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
      if (preventScroll) {
        document.body.style.overflow = originalOverflow;
      }
      // Restore focus to trigger element
      if (triggerRef.current && typeof triggerRef.current.focus === 'function') {
        triggerRef.current.focus();
      }
    };
  }, [isOpen, onClose, preventScroll]);

  return modalRef;
}
