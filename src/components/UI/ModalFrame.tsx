/**
 * ModalFrame — shared modal chrome for Kingdom Builder Web
 *
 * Visual spec:
 *  - 4px wine-600 primary accent rail on panel left edge
 *  - Header: optional icon + optional kicker + title + CloseIcon button
 *  - Scrollable body (overflow-y-auto)
 *  - Optional footer slot (primary + ghost button pattern)
 *  - Backdrop: bg-black/70 backdrop-blur-sm
 *  - Enter animation: animate-modal-enter (160ms ease-out, defined in animations.css)
 *  - Mobile (<= 640px): bottom-sheet (fixed inset-x-0 bottom-0, rounded-t-[--radius-20], max-h-[90vh])
 *
 * z-index layers:
 *  - backdrop: z-[50]
 *  - modal panel: z-[51]
 *  - coachmark variant: z-[70]  (TutorialOverlay)
 *  - toast: z-[80]              (AchievementToast — unchanged)
 *
 * Variant "coachmark":
 *  - No backdrop rendered (TutorialOverlay renders its own)
 *  - No 4px rail
 *  - Higher z-index (z-[70])
 *  - Arrow pointer rendered via CSS triangle based on spotlightRect position
 */

import React from 'react';
import { CloseIcon } from '../icons/CloseIcon';
import { useModal } from '../../hooks/useModal';

export type ModalVariant = 'default' | 'coachmark';

export interface ArrowDirection {
  side: 'top' | 'bottom' | 'left' | 'right';
  offsetPct?: number; // 0-100, percentage offset along the chosen axis
}

export interface ModalFrameProps {
  isOpen: boolean;
  onClose: () => void;
  /** Accessible label for the dialog (aria-label) */
  ariaLabel: string;

  // Header
  title: React.ReactNode;
  /** Small text above title (--type-label size) */
  kicker?: React.ReactNode;
  /** Icon element displayed left of title */
  headerIcon?: React.ReactNode;

  // Slots
  children: React.ReactNode;
  footer?: React.ReactNode;

  // Behaviour
  variant?: ModalVariant;
  /** When variant="coachmark", direction of the arrow pointer */
  arrowDirection?: ArrowDirection;
  /** When true, ESC key will not call onClose (TutorialOverlay manages its own ESC) */
  disableEscClose?: boolean;

  /** Additional className for the panel */
  className?: string;
}

function ArrowPointer({ direction }: { direction: ArrowDirection }) {
  const { side, offsetPct = 50 } = direction;

  const isHorizontal = side === 'top' || side === 'bottom';
  const arrowSize = 10;

  const style: React.CSSProperties = {
    position: 'absolute',
    width: 0,
    height: 0,
    zIndex: 1,
  };

  if (side === 'top') {
    style.top = -arrowSize;
    style.left = `${offsetPct}%`;
    style.transform = 'translateX(-50%)';
    style.borderLeft = `${arrowSize}px solid transparent`;
    style.borderRight = `${arrowSize}px solid transparent`;
    style.borderBottom = `${arrowSize}px solid var(--color-surface)`;
  } else if (side === 'bottom') {
    style.bottom = -arrowSize;
    style.left = `${offsetPct}%`;
    style.transform = 'translateX(-50%)';
    style.borderLeft = `${arrowSize}px solid transparent`;
    style.borderRight = `${arrowSize}px solid transparent`;
    style.borderTop = `${arrowSize}px solid var(--color-surface)`;
  } else if (side === 'left') {
    style.left = -arrowSize;
    style.top = `${offsetPct}%`;
    style.transform = 'translateY(-50%)';
    style.borderTop = `${arrowSize}px solid transparent`;
    style.borderBottom = `${arrowSize}px solid transparent`;
    style.borderRight = `${arrowSize}px solid var(--color-surface)`;
  } else {
    // right
    style.right = -arrowSize;
    style.top = `${offsetPct}%`;
    style.transform = 'translateY(-50%)';
    style.borderTop = `${arrowSize}px solid transparent`;
    style.borderBottom = `${arrowSize}px solid transparent`;
    style.borderLeft = `${arrowSize}px solid var(--color-surface)`;
  }

  // Keep linter happy — isHorizontal might be used for future logic
  void isHorizontal;

  return <div aria-hidden="true" style={style} />;
}

export const ModalFrame = React.memo(function ModalFrame({
  isOpen,
  onClose,
  ariaLabel,
  title,
  kicker,
  headerIcon,
  children,
  footer,
  variant = 'default',
  arrowDirection,
  disableEscClose = false,
  className = '',
}: ModalFrameProps) {
  const { panelRef, handleBackdropClick } = useModal({ isOpen, onClose, disableEscClose });

  if (!isOpen) return null;

  const isCoachmark = variant === 'coachmark';

  // Backdrop is NOT rendered for coachmark (TutorialOverlay provides its own dimming layer)
  const backdropClasses = isCoachmark
    ? null
    : 'fixed inset-0 bg-black/70 backdrop-blur-sm z-[50] flex items-center justify-center px-4';

  // Panel positioning
  // Default: centred dialog
  // Mobile (sm breakpoint ≤ 640px): bottom-sheet
  const panelBaseDesktop = 'relative bg-[var(--color-surface)] rounded-[var(--radius-14)] shadow-[var(--shadow-lifted)] overflow-hidden flex flex-col w-full max-w-2xl max-h-[85vh]';
  const panelBaseMobile = 'max-sm:fixed max-sm:inset-x-0 max-sm:bottom-0 max-sm:rounded-t-[var(--radius-20)] max-sm:rounded-bl-none max-sm:rounded-br-none max-sm:max-h-[90vh] max-sm:max-w-none';

  const panelCoachmark = 'relative bg-[var(--color-surface)] rounded-[var(--radius-14)] shadow-[var(--shadow-lifted)] overflow-hidden flex flex-col w-full max-w-md';

  const panelClasses = isCoachmark
    ? panelCoachmark
    : `${panelBaseDesktop} ${panelBaseMobile}`;

  const zPanel = isCoachmark ? 'z-[70]' : 'z-[51]';

  const panel = (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      className={`${panelClasses} ${zPanel} animate-modal-enter ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* 4px primary accent rail — default variant only */}
      {!isCoachmark && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            width: 4,
            backgroundColor: 'var(--color-wine-600)',
            borderTopLeftRadius: 'var(--radius-14)',
            borderBottomLeftRadius: 'var(--radius-14)',
          }}
        />
      )}

      {/* Arrow pointer — coachmark variant */}
      {isCoachmark && arrowDirection && (
        <ArrowPointer direction={arrowDirection} />
      )}

      {/* Header */}
      <div
        className="flex items-start justify-between gap-3 px-6 py-4 shrink-0"
        style={{
          paddingLeft: isCoachmark ? undefined : '1.75rem', // 4px rail + normal padding
          borderBottom: '1px solid var(--card-border)',
        }}
      >
        <div className="flex items-center gap-3 min-w-0">
          {headerIcon && (
            <span className="text-2xl shrink-0" aria-hidden="true">
              {headerIcon}
            </span>
          )}
          <div className="min-w-0">
            {kicker && (
              <p
                className="font-semibold uppercase tracking-wider"
                style={{
                  fontSize: 'var(--type-label)',
                  color: 'var(--color-stone-500)',
                  lineHeight: 'var(--line-height-label)',
                }}
              >
                {kicker}
              </p>
            )}
            <h2
              className="font-bold truncate"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--type-display-sm)',
                lineHeight: 'var(--line-height-display)',
                color: 'var(--color-text)',
              }}
            >
              {title}
            </h2>
          </div>
        </div>

        <button
          onClick={onClose}
          aria-label="Close"
          className="shrink-0 flex items-center justify-center w-11 h-11 rounded-full transition"
          style={{ color: 'var(--color-stone-500)' }}
        >
          <CloseIcon size={18} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-4" style={{ paddingLeft: isCoachmark ? undefined : '1.75rem' }}>
        {children}
      </div>

      {/* Footer (optional) */}
      {footer && (
        <div
          className="shrink-0 flex items-center justify-end gap-3 px-6 py-4"
          style={{
            paddingLeft: isCoachmark ? undefined : '1.75rem',
            borderTop: '1px solid var(--card-border)',
          }}
        >
          {footer}
        </div>
      )}
    </div>
  );

  if (isCoachmark) {
    // No backdrop wrapper — render panel directly
    return panel;
  }

  return (
    <div className={backdropClasses!} onClick={handleBackdropClick}>
      {panel}
    </div>
  );
});
