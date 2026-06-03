import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const { t } = useTranslation();
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const { outcome } = await installEvent.userChoice;
    if (outcome === 'accepted') {
      setInstallEvent(null);
    }
  };

  if (!installEvent) return null;

  return (
    <div className="fixed top-0 left-0 right-0 flex justify-center z-50 p-2">
      <button
        onClick={handleInstall}
        className="font-semibold px-4 py-2 rounded-lg transition-colors"
        style={{
          background: 'var(--button-primary-bg)',
          color: 'var(--button-text)',
          boxShadow: 'var(--shadow-lifted)',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--button-primary-bg-hover)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'var(--button-primary-bg)')}
        aria-label={t('installPrompt.ariaLabel')}
      >
        {t('installPrompt.button')}
      </button>
    </div>
  );
}
