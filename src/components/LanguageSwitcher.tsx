import { useTranslation } from 'react-i18next'

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation()

  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <span className="font-medium">{t('language.label')}</span>
      <select
        className="border rounded px-2 py-1 bg-white text-gray-700"
        value={i18n.resolvedLanguage === 'zh-TW' ? 'zh-TW' : 'en'}
        onChange={(e) => void i18n.changeLanguage(e.target.value)}
        aria-label={t('language.label')}
      >
        <option value="en">{t('language.en')}</option>
        <option value="zh-TW">{t('language.zh-TW')}</option>
      </select>
    </label>
  )
}
