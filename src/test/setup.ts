import '@testing-library/jest-dom'
import i18n from '../i18n'

localStorage.setItem('i18nextLng', 'en')
void i18n.changeLanguage('en')
