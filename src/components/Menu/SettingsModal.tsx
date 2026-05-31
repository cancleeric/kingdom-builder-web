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
        className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-heading"
      >
        <div className="flex items-center justify-between gap-3 mb-5">
          <h3 id="settings-heading" className="text-2xl font-bold text-gray-900">
            {t('settings.heading')}
          </h3>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition"
            aria-label={t('settings.close')}
            title={t('settings.close')}
          >
            <CloseIcon size={18} />
          </button>
        </div>

        <div className="space-y-5">
          <section aria-labelledby="settings-audio-heading" className="space-y-3">
            <h4 id="settings-audio-heading" className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              {t('settings.audio')}
            </h4>

            <button
              type="button"
              onClick={onToggleMute}
              aria-pressed={muted}
              className="w-full flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-4 py-3 text-left hover:bg-gray-50 transition"
            >
              <span className="flex items-center gap-2 font-semibold text-gray-900">
                {muted ? <MutedIcon size={18} /> : <UnmutedIcon size={18} />}
                {t('settings.mute')}
              </span>
              <span className="text-sm text-gray-600">
                {muted ? t('settings.muted') : t('settings.unmuted')}
              </span>
            </button>

            <label className="block" htmlFor="settings-volume">
              <span className="flex items-center justify-between text-sm font-semibold text-gray-700 mb-2">
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
                className="w-full accent-blue-600"
              />
            </label>
          </section>

          <section aria-labelledby="settings-language-heading" className="space-y-2">
            <h4 id="settings-language-heading" className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              {t('settings.language')}
            </h4>
            <select
              value={language}
              onChange={(event) => onLanguageChange(event.target.value)}
              aria-label={t('common.language')}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white"
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
