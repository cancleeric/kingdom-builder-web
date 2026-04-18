import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useSeasonStore,
  getTopSeasonEntries,
  getPlayerRank,
  getRankTier,
} from '../../store/seasonStore';
import type { Season, SeasonEntry } from '../../types/season';
import { RANK_BADGES, RANK_THRESHOLDS } from '../../types/season';

interface SeasonPanelProps {
  onClose: () => void;
  /** The human player's name to highlight in the leaderboard. */
  playerName?: string;
}

function daysRemaining(endDate: string): number {
  const ms = new Date(endDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

function RankBadge({ tier }: { tier: ReturnType<typeof getRankTier> }) {
  const { t } = useTranslation();
  const labels: Record<string, string> = {
    Gold: t('season.tierGold'),
    Silver: t('season.tierSilver'),
    Bronze: t('season.tierBronze'),
    Iron: t('season.tierIron'),
  };
  const colours: Record<string, string> = {
    Gold: 'text-yellow-600 bg-yellow-50 border-yellow-400',
    Silver: 'text-gray-500 bg-gray-50 border-gray-400',
    Bronze: 'text-orange-700 bg-orange-50 border-orange-400',
    Iron: 'text-slate-600 bg-slate-50 border-slate-400',
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-semibold ${colours[tier]}`}
    >
      {RANK_BADGES[tier]} {labels[tier]}
    </span>
  );
}

function LeaderboardTable({
  entries,
  playerName,
}: {
  entries: SeasonEntry[];
  playerName?: string;
}) {
  const { t } = useTranslation();
  const top = getTopSeasonEntries(entries);

  if (top.length === 0) {
    return (
      <p className="text-sm text-gray-500 italic py-4 text-center">
        {t('season.emptyLeaderboard')}
      </p>
    );
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-gray-500 border-b">
          <th className="pb-1 pr-2 font-medium">#</th>
          <th className="pb-1 pr-2 font-medium">{t('leaderboard.heading')}</th>
          <th className="pb-1 pr-2 font-medium text-right">{t('common.pointsShort')}</th>
          <th className="pb-1 font-medium text-right">{t('season.rewardTitle')}</th>
        </tr>
      </thead>
      <tbody>
        {top.map((entry, idx) => {
          const isMe = playerName && entry.playerName === playerName;
          const tier = getRankTier(entry.score);
          return (
            <tr
              key={entry.playerName}
              className={`border-b last:border-0 ${isMe ? 'bg-blue-50 font-semibold' : ''}`}
            >
              <td className="py-1.5 pr-2 text-gray-500">{idx + 1}</td>
              <td className="py-1.5 pr-2 truncate max-w-[120px]">
                <div className="flex items-center gap-1">
                  <span>{entry.playerName}</span>
                  {isMe && <span className="text-xs text-blue-500">({t('app.current')})</span>}
                </div>
              </td>
              <td className="py-1.5 pr-2 text-right tabular-nums">{entry.score}</td>
              <td className="py-1.5 text-right">
                <RankBadge tier={tier} />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function ArchivedSeasonCard({ season }: { season: Season }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const top = getTopSeasonEntries(season.entries);

  return (
    <div className="border rounded-xl p-3 bg-gray-50">
      <button
        className="w-full flex items-center justify-between text-left"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <div>
          <span className="font-semibold text-sm">{season.name}</span>
          <span className="ml-2 text-xs text-gray-400">
            {new Date(season.startDate).toLocaleDateString()} –{' '}
            {new Date(season.endDate).toLocaleDateString()}
          </span>
        </div>
        <span className="text-gray-400">{expanded ? '▲' : '▼'}</span>
      </button>
      {expanded && (
        <div className="mt-2">
          {top.length === 0 ? (
            <p className="text-xs text-gray-400 italic">{t('season.emptyLeaderboard')}</p>
          ) : (
            <ol className="space-y-1 text-xs">
              {top.slice(0, 5).map((entry, idx) => (
                <li key={entry.playerName} className="flex items-center justify-between">
                  <span className="text-gray-500 mr-1">{idx + 1}.</span>
                  <span className="flex-1 truncate">{entry.playerName}</span>
                  <RankBadge tier={getRankTier(entry.score)} />
                  <span className="ml-2 tabular-nums text-gray-600">{entry.score}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}

export function SeasonPanel({ onClose, playerName }: SeasonPanelProps) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<'current' | 'history'>('current');
  const currentSeason = useSeasonStore((s) => s.currentSeason);
  const history = useSeasonStore((s) => s.history);

  const days = daysRemaining(currentSeason.endDate);
  const playerRank = playerName ? getPlayerRank(currentSeason.entries, playerName) : -1;
  const playerEntry = playerName
    ? currentSeason.entries.find((e) => e.playerName === playerName)
    : undefined;
  const playerTier = playerEntry ? getRankTier(playerEntry.score) : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('season.heading')}
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-2xl font-bold">{t('season.heading')}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{currentSeason.name}</p>
          </div>
          <button
            onClick={onClose}
            aria-label={t('season.close')}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b px-6">
          {(['current', 'history'] as const).map((tabId) => (
            <button
              key={tabId}
              onClick={() => setTab(tabId)}
              className={`py-2 mr-4 text-sm font-medium border-b-2 transition-colors ${
                tab === tabId
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tabId === 'current' ? t('season.current') : t('season.history')}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {tab === 'current' && (
            <>
              {/* Season timing */}
              <div className="flex items-center justify-between bg-blue-50 rounded-xl px-4 py-3">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    {days > 0 ? t('season.daysRemaining', { count: days }) : t('season.seasonEnded')}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(currentSeason.startDate).toLocaleDateString()} –{' '}
                    {new Date(currentSeason.endDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-3xl font-bold text-blue-700 tabular-nums">{days}</div>
              </div>

              {/* Player status */}
              {playerName && (
                <div className="border rounded-xl px-4 py-3">
                  <p className="text-xs text-gray-500 mb-1">{t('season.yourRank')}</p>
                  {playerEntry ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-2xl font-bold text-blue-700">
                          {t('season.rank', { rank: playerRank })}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-gray-600">
                            {t('season.scoreLabel', { score: playerEntry.score })}
                          </span>
                          <span className="text-xs text-gray-400">
                            {t('season.gamesPlayed', { count: playerEntry.gamesPlayed })}
                          </span>
                        </div>
                      </div>
                      {playerTier && <RankBadge tier={playerTier} />}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">{t('season.notRanked')}</p>
                  )}
                </div>
              )}

              {/* Rank tier guide */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  {t('season.rewardTitle')}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['Gold', 'Silver', 'Bronze', 'Iron'] as const).map((tier) => (
                    <div
                      key={tier}
                      className="border rounded-lg p-2 text-center text-xs flex flex-col items-center gap-1"
                    >
                      <span className="text-2xl">{RANK_BADGES[tier]}</span>
                      <span className="font-semibold">{t(`season.tier${tier}`)}</span>
                      <span className="text-gray-400">
                        {tier === 'Iron'
                          ? t('season.thresholdIron', { score: RANK_THRESHOLDS.Bronze })
                          : t(`season.threshold${tier}`, { score: RANK_THRESHOLDS[tier] })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Season leaderboard */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  {t('season.leaderboard')}
                </p>
                <LeaderboardTable entries={currentSeason.entries} playerName={playerName} />
              </div>
            </>
          )}

          {tab === 'history' && (
            <>
              {history.length === 0 ? (
                <p className="text-sm text-gray-400 italic text-center py-8">
                  {t('season.noHistory')}
                </p>
              ) : (
                <div className="space-y-3">
                  {history.map((season) => (
                    <ArchivedSeasonCard key={season.name} season={season} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
