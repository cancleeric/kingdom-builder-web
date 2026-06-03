import React from 'react';
import { useTranslation } from 'react-i18next';
import { CloseIcon, MutedIcon, UnmutedIcon } from '../icons';

interface SettingsModalProps {
  isOpen: boolean;
  muted: boolean;
  volume: number;
  language: string;
  onClose: () => void;
  onToggleMute: () => void;
  onVolumeChange: (volume: number) => void;
  onLanguageChange: (language: string) => void;
}

export const SettingsModal = React.memo(function SettingsModal({
  isOpen,
  muted,
  volume,
  language,
  onClose,
  onToggleMute,
  onVolumeChange,
  onLanguageChange,
}: SettingsModalProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const volumePercent = Math.round(volume * 100);

  return (
    <div className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center px-4">
      <div
        className="rounded-xl shadow-2xl p-6 max-w-md w-full"
        style={{ background: 'var(--color-surface)' }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-heading"
      >
        <div className="flex items-center justify-between gap-3 mb-5">
          <h3
            id="settings-heading"
            className="text-2xl font-bold"
            style={{ color: 'var(--color-text)' }}
          >
            {t('settings.heading')}
          </h3>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center transition"
            style={{ color: 'var(--color-stone-500)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--button-ghost-bg-hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            aria-label={t('settings.close')}
            title={t('settings.close')}
          >
            <CloseIcon size={18} />
          </button>
        </div>

        <div className="space-y-5">
          <section aria-labelledby="settings-audio-heading" className="space-y-3">
            <h4
              id="settings-audio-heading"
              className="text-sm font-semibold uppercase tracking-wide"
              style={{ color: 'var(--color-stone-600)' }}
            >
              {t('settings.audio')}
            </h4>

            <button
              type="button"
              onClick={onToggleMute}
              aria-pressed={muted}
              className="w-full flex items-center justify-between gap-3 rounded-lg px-4 py-3 text-left transition"
              style={{ border: '1px solid var(--card-border)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-warm-cream-100)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <span
                className="flex items-center gap-2 font-semibold"
                style={{ color: 'var(--color-text)' }}
              >
                {muted ? <MutedIcon size={18} /> : <UnmutedIcon size={18} />}
                {t('settings.mute')}
              </span>
              <span className="text-sm" style={{ color: 'var(--color-stone-500)' }}>
                {muted ? t('settings.muted') : t('settings.unmuted')}
              </span>
            </button>

            <label className="block" htmlFor="settings-volume">
              <span
                className="flex items-center justify-between text-sm font-semibold mb-2"
                style={{ color: 'var(--color-stone-600)' }}
              >
                <span>{t('settings.volume')}</span>
                <span>{t('settings.volumeValue', { value: volumePercent })}</span>
              </span>
              <input
                id="settings-volume"
                aria-label={t('settings.volume')}
                type="range"
                min="0"
                max="100"
                step="5"
                value={volumePercent}
                onChange={(event) => onVolumeChange(Number(event.target.value) / 100)}
                className="w-full accent-[var(--color-wine-600)]"
              />
            </label>
          </section>

          <section aria-labelledby="settings-language-heading" className="space-y-2">
            <h4
              id="settings-language-heading"
              className="text-sm font-semibold uppercase tracking-wide"
              style={{ color: 'var(--color-stone-600)' }}
            >
              {t('settings.language')}
            </h4>
            <select
              value={language}
              onChange={(event) => onLanguageChange(event.target.value)}
              aria-label={t('common.language')}
              className="w-full rounded-lg px-3 py-2 text-sm"
              style={{ border: '1px solid var(--card-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }}
            >
              <option value="en">{t('common.english')}</option>
              <option value="zh-TW">{t('common.traditionalChinese')}</option>
            </select>
          </section>
        </div>
      </div>
    </div>
  );
});
