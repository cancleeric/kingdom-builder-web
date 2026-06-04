/**
 * LocationTooltip — R38a Phase A
 * position:fixed HTML tooltip shown when hovering/long-pressing a location cell.
 * pointer-events:none (non-pinned) so it never swallows board clicks.
 */
import { useTranslation } from 'react-i18next';
import { tLocation, tLocationDescription } from '../../i18n/formatters';
import { LocationTileIcon } from '../Game/LocationTileCard';
import type { Location } from '../../core/terrain';

interface LocationTooltipProps {
  location: Location;
  anchorX: number;
  anchorY: number;
  pinned?: boolean;
  onDismiss?: () => void;
}

export function LocationTooltip({
  location,
  anchorX,
  anchorY,
  pinned = false,
  onDismiss,
}: LocationTooltipProps) {
  const { t } = useTranslation();
  const name = tLocation(t, location);
  const description = tLocationDescription(t, location);

  // Clamp to the right if near right edge
  const tooltipWidth = 224;
  const left = anchorX + 14 > window.innerWidth - tooltipWidth
    ? anchorX - tooltipWidth - 4
    : anchorX + 14;
  const top = Math.max(8, anchorY - 8);

  return (
    <div
      role={pinned ? 'dialog' : 'tooltip'}
      aria-label={`${name}: ${description}`}
      style={{
        position: 'fixed',
        left,
        top,
        width: tooltipWidth,
        zIndex: 9999,
        pointerEvents: pinned ? 'auto' : 'none',
      }}
      onClick={pinned ? onDismiss : undefined}
    >
      <div
        className="rounded-xl px-3 py-2.5 text-sm shadow-lg"
        style={{
          backgroundColor: 'var(--color-warm-cream-50)',
          border: '1px solid var(--card-border)',
          boxShadow: 'var(--shadow-medium)',
        }}
      >
        {/* Header: icon + name */}
        <div className="flex items-center gap-2 mb-1">
          <LocationTileIcon
            location={location}
            size={16}
            style={{ color: 'var(--color-ink-green-600)', flexShrink: 0 }}
          />
          <span
            className="font-semibold leading-tight"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text)' }}
          >
            {name}
          </span>
        </div>
        {/* Description */}
        <p className="text-xs leading-snug" style={{ color: 'var(--color-stone-600)' }}>
          {description}
        </p>
        {/* Pinned dismiss hint */}
        {pinned && (
          <p
            className="text-xs mt-1.5 text-center"
            style={{ color: 'var(--color-stone-400)' }}
          >
            {t('tooltip.tapToDismiss', 'Tap to dismiss')}
          </p>
        )}
      </div>
    </div>
  );
}
