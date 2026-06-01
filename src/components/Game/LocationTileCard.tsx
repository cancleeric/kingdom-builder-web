import type { LocationTile } from '../../types';
import { Location } from '../../core/terrain';
import { tLocation, tLocationDescription } from '../../i18n/formatters';
import { useTranslation } from 'react-i18next';
import {
  BarnIcon,
  FarmIcon,
  HarborIcon,
  OasisIcon,
  OracleIcon,
  PaddockIcon,
  TavernIcon,
  TowerIcon,
} from '../icons';
import type { ComponentType, SVGProps } from 'react';

const LOCATION_TILE_ICON: Record<Location, ComponentType<{ size?: number } & SVGProps<SVGSVGElement>>> = {
  [Location.Castle]: TowerIcon,
  [Location.Farm]: FarmIcon,
  [Location.Harbor]: HarborIcon,
  [Location.Oasis]: OasisIcon,
  [Location.Tower]: TowerIcon,
  [Location.Paddock]: PaddockIcon,
  [Location.Barn]: BarnIcon,
  [Location.Oracle]: OracleIcon,
  [Location.Tavern]: TavernIcon,
};

interface LocationTileIconProps extends SVGProps<SVGSVGElement> {
  location: Location;
  size?: number;
}

export function LocationTileIcon({ location, size = 16, ...props }: LocationTileIconProps) {
  const Icon = LOCATION_TILE_ICON[location];
  return <Icon size={size} {...props} />;
}

interface LocationTileCardProps {
  tile: LocationTile;
  isActive: boolean;
  canUse: boolean;
  canControlActions?: boolean;
  onUse: () => void;
  onCancel: () => void;
  compact?: boolean;
}

export function LocationTileCard({
  tile,
  isActive,
  canUse,
  canControlActions = true,
  onUse,
  onCancel,
  compact = false,
}: LocationTileCardProps) {
  const { t } = useTranslation();
  const title = tLocation(t, tile.location);
  const description = tLocationDescription(t, tile.location);

  return (
    <article
      data-testid="location-tile-card"
      aria-label={`${title}. ${description}`}
      className="rounded-lg px-3 py-2 text-sm transition"
      style={{
        border: `2px solid ${isActive ? 'var(--color-warning)' : tile.usedThisTurn ? 'var(--card-border)' : 'var(--color-ink-green-300)'}`,
        backgroundColor: tile.usedThisTurn
          ? 'var(--color-warm-cream-100)'
          : isActive
            ? 'oklch(0.97 0.03 70)'
            : 'var(--color-ink-green-50)',
        opacity: tile.usedThisTurn ? 0.62 : 1,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <LocationTileIcon location={tile.location} size={16} />
          <h3 data-testid="location-tile-name" className="font-semibold leading-tight" style={{ color: 'var(--color-text)' }}>
            {title}
          </h3>
        </div>
        {canUse && (
          <button
            className="shrink-0 text-xs font-bold px-1.5 py-0.5 rounded transition"
            disabled={!canControlActions}
            style={{
              backgroundColor: isActive ? 'var(--color-warning)' : 'var(--color-success)',
              color: 'var(--button-text)',
            }}
            onClick={isActive ? onCancel : onUse}
          >
            {isActive ? t('app.cancel') : t('app.use')}
          </button>
        )}
        {tile.usedThisTurn && (
          <span className="shrink-0 text-xs italic" style={{ color: 'var(--color-stone-400)' }}>
            {t('app.used')}
          </span>
        )}
      </div>
      <p
        data-testid="location-tile-description"
        className={compact ? 'mt-1 text-xs leading-snug' : 'mt-1.5 text-xs leading-snug'}
        style={{ color: 'var(--color-stone-600)' }}
      >
        {description}
      </p>
    </article>
  );
}
