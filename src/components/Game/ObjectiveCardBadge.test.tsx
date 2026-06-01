import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ObjectiveCard } from '../../core/scoring';
import { ALL_OBJECTIVE_CARDS } from '../../core/scoring';
import { ObjectiveCardBadge } from './ObjectiveCardBadge';
import { en } from '../../i18n/locales/en';
import { zhTW } from '../../i18n/locales/zh-TW';

describe('ObjectiveCardBadge', () => {
  it('renders the objective name, rule description, and score preview', () => {
    render(<ObjectiveCardBadge card={ObjectiveCard.Hermits} score={6} />);

    expect(screen.getByTestId('objective-name')).toHaveTextContent('Hermits');
    expect(screen.getByTestId('objective-description')).toHaveTextContent('isolated settlement');
    expect(screen.getByTestId('objective-score-preview')).toHaveTextContent('6 pts');
  });

  it('has rule descriptions for every objective in both supported languages', () => {
    for (const card of ALL_OBJECTIVE_CARDS) {
      expect(en.objectiveDescription[card]).toBeTruthy();
      expect(zhTW.objectiveDescription[card]).toBeTruthy();
    }
  });
});
