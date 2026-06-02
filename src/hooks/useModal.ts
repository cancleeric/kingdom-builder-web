import { useEffect, useRef, useCallback } from 'react';

const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

interface UseModalOptions {
  isOpen: boolean;
  onClose: () => void;
  /** If true, ESC key will NOT call onClose (e.g. TutorialOverlay manages its own ESC) */
  disableEscClose?: boolean;
}

/**
 * Provides ESC-to-close, backdrop-click-to-close, focus trap, and body scroll lock for modal dialogs.
 *
 * Returns:
 *  - `panelRef` – attach to the modal panel element for focus trap
 *  - `handleBackdropClick` – pass to the backdrop onClick
 */
export function useModal({ isOpen, onClose, disableEscClose = false }: UseModalOptions) {
  const panelRef = useRef<HTMLDivElement>(null);
  // Stable reference so event listener can always call the latest onClose
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // ESC key handler
  useEffect(() => {
    if (!isOpen || disableEscClose) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, disableEscClose]);

  // Focus trap
  useEffect(() => {
    if (!isOpen || !panelRef.current) return;

    const panel = panelRef.current;

    // Move focus into the panel on open
    const firstFocusable = panel.querySelector<HTMLElement>(FOCUSABLE_SELECTORS);
    firstFocusable?.focus();

    const handleTabTrap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)).filter(
        (el) => !el.closest('[hidden]') && el.offsetParent !== null
      );

      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    panel.addEventListener('keydown', handleTabTrap);
    return () => panel.removeEventListener('keydown', handleTabTrap);
  }, [isOpen]);

  // Body scroll lock
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onCloseRef.current();
      }
    },
    []
  );

  return { panelRef, handleBackdropClick };
}
