import '@testing-library/jest-dom'
import i18n from '../i18n'

beforeEach(async () => {
  localStorage.setItem('i18nextLng', 'en')
  await i18n.changeLanguage('en')
})
