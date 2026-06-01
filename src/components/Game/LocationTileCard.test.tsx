import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Location } from '../../core/terrain';
import { LocationTileCard } from './LocationTileCard';
import { en } from '../../i18n/locales/en';
import { zhTW } from '../../i18n/locales/zh-TW';

const tile = { location: Location.Farm, usedThisTurn: false };

const playableLocations: Array<keyof typeof en.locationDescription> = [
  Location.Farm,
  Location.Harbor,
  Location.Oasis,
  Location.Tower,
  Location.Paddock,
  Location.Barn,
  Location.Oracle,
  Location.Tavern,
];

describe('LocationTileCard', () => {
  it('renders the tile name, ability description, and use action', () => {
    render(
      <LocationTileCard
        tile={tile}
        isActive={false}
        canUse
        onUse={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByTestId('location-tile-name')).toHaveTextContent('Farm');
    expect(screen.getByTestId('location-tile-description')).toHaveTextContent('Grass cell');
    expect(screen.getByRole('button', { name: 'Use' })).toBeEnabled();
  });

  it('shows the used state without an action button', () => {
    render(
      <LocationTileCard
        tile={{ location: Location.Paddock, usedThisTurn: true }}
        isActive={false}
        canUse={false}
        onUse={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByText('Used')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Use' })).toBeNull();
  });

  it('has descriptions for every playable location tile in both supported languages', () => {
    for (const location of playableLocations) {
      expect(en.locationDescription[location]).toBeTruthy();
      expect(zhTW.locationDescription[location]).toBeTruthy();
    }
  });
});
