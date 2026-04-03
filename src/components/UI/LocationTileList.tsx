import React from 'react';
import { Location } from '../../core/terrain';

interface LocationTileListProps {
  locations: Location[];
  newestIndex: number | null;
}

const LOCATION_ICONS: Record<Location, string> = {
  [Location.Castle]:  '🏰',
  [Location.Farm]:    '🌾',
  [Location.Oasis]:   '🌴',
  [Location.Tower]:   '🗼',
  [Location.Harbor]:  '⚓',
  [Location.Paddock]: '🐎',
  [Location.Barn]:    '🏚',
  [Location.Oracle]:  '🔮',
};

export const LocationTileList: React.FC<LocationTileListProps> = ({
  locations,
  newestIndex,
}) => {
  if (locations.length === 0) {
    return (
      <div className="text-sm text-gray-400 italic">No tiles acquired yet</div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {locations.map((loc, index) => {
        const isNew = index === newestIndex;
        return (
          <div
            key={`${loc}-${index}`}
            className={[
              'flex items-center gap-1 px-3 py-1 rounded-full border-2 text-sm font-semibold',
              isNew ? 'location-tile-slide-in location-tile-new border-yellow-400 bg-yellow-50' : 'border-gray-300 bg-gray-50',
            ].join(' ')}
            title={loc}
          >
            <span role="img" aria-label={loc}>
              {LOCATION_ICONS[loc] ?? '📍'}
            </span>
            <span>{loc}</span>
          </div>
        );
      })}
    </div>
  );
};
