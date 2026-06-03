import React from 'react';
import { Location } from '../../core/terrain';

interface LocationMarkerProps {
  cx: number;
  cy: number;
  location: Location;
  hasSettlement?: boolean;
}

const ICON_SIZE = 16;
const HALF = ICON_SIZE / 2;

/**
 * Renders the 2.5D colour piece for a location hex cell inside the board SVG.
 *
 * R24-B: Now uses <use href="#piece-{location}"> referencing PieceDefs symbols.
 * Removed white background circle — the 2.5D pieces carry their own
 * ground-shadow ellipse and drop-shadow filter for depth.
 *
 * pointerEvents="none" prevents the marker from intercepting cell clicks.
 * hasSettlement offsetY logic preserved: when a settlement exists the location
 * marker shifts upward so the two pieces don't overlap.
 */

const PIECE_SYMBOL_ID: Record<Location, string> = {
  [Location.Castle]:  'piece-castle',
  [Location.Farm]:    'piece-farm',
  [Location.Oasis]:   'piece-oasis',
  [Location.Tower]:   'piece-tower',
  [Location.Harbor]:  'piece-harbor',
  [Location.Paddock]: 'piece-paddock',
  [Location.Barn]:    'piece-barn',
  [Location.Oracle]:  'piece-oracle',
  [Location.Tavern]:  'piece-tavern',
};

export const LocationMarker: React.FC<LocationMarkerProps> = ({
  cx,
  cy,
  location,
  hasSettlement = false,
}) => {
  const offsetY = hasSettlement ? 8 : 0;

  return (
    <g pointerEvents="none">
      <use
        href={`#${PIECE_SYMBOL_ID[location]}`}
        x={cx - HALF}
        y={cy + offsetY - HALF}
        width={ICON_SIZE}
        height={ICON_SIZE}
      />
    </g>
  );
};

LocationMarker.displayName = 'LocationMarker';
