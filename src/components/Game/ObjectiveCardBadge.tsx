import { ObjectiveCard } from '../../core/scoring';
import { tObjective, tObjectiveDescription } from '../../i18n/formatters';
import { useTranslation } from 'react-i18next';
import {
  CitizensIcon,
  DiscoverersIcon,
  FarmersIcon,
  FishermanIcon,
  HermitsIcon,
  KnightsIcon,
  LordsIcon,
  MerchantsIcon,
  MinersIcon,
  WorkersIcon,
} from '../icons';
import type { ComponentType, SVGProps } from 'react';

const OBJECTIVE_CARD_ICON: Record<ObjectiveCard, ComponentType<{ size?: number } & SVGProps<SVGSVGElement>>> = {
  [ObjectiveCard.Fisherman]: FishermanIcon,
  [ObjectiveCard.Miners]: MinersIcon,
  [ObjectiveCard.Knights]: KnightsIcon,
  [ObjectiveCard.Farmers]: FarmersIcon,
  [ObjectiveCard.Merchants]: MerchantsIcon,
  [ObjectiveCard.Discoverers]: DiscoverersIcon,
  [ObjectiveCard.Hermits]: HermitsIcon,
  [ObjectiveCard.Citizens]: CitizensIcon,
  [ObjectiveCard.Lords]: LordsIcon,
  [ObjectiveCard.Workers]: WorkersIcon,
};

interface ObjectiveCardBadgeProps {
  card: ObjectiveCard;
  score?: number;
  className?: string;
}

export function ObjectiveCardBadge({ card, score, className = '' }: ObjectiveCardBadgeProps) {
  const { t } = useTranslation();
  const title = tObjective(t, card);
  const description = tObjectiveDescription(t, card);
  const Icon = OBJECTIVE_CARD_ICON[card];

  return (
    <article
      data-testid="objective-card"
      aria-label={`${title}. ${description}`}
      className={`rounded-lg px-3 py-2 text-left ${className}`}
      style={{
        backgroundColor: 'var(--color-quest-bg)',
        border: '2px solid var(--color-quest-border)',
        color: 'var(--color-stone-800)',
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <Icon data-testid="objective-icon" size={16} />
          <h3 data-testid="objective-name" className="text-sm font-bold leading-tight">
            {title}
          </h3>
        </div>
        {score !== undefined && (
          <span
            data-testid="objective-score-preview"
            className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold leading-none"
            style={{
              backgroundColor: 'var(--color-quest-score-bg)',
              color: 'var(--color-quest-score-fg)',
            }}
          >
            {t('objectiveCard.currentScore', { score })}
          </span>
        )}
      </div>
      <p
        data-testid="objective-description"
        className="mt-1 text-xs leading-snug"
        style={{ color: 'var(--color-stone-600)' }}
      >
        {description}
      </p>
    </article>
  );
}
