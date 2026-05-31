import '@testing-library/jest-dom'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { en } from '../i18n/locales/en'
import { zhTW } from '../i18n/locales/zh-TW'

// Mock localStorage and sessionStorage BEFORE any other imports
const storageMock = {
    _data: {} as Record<string, string>,
    getItem(key: string) {
        return this._data[key] || null
    },
    setItem(key: string, value: string) {
        this._data[key] = value
    },
    removeItem(key: string) {
        delete this._data[key]
    },
    clear() {
        this._data = {}
    },
    get length() {
        return Object.keys(this._data).length
    },
    key(index: number) {
        const keys = Object.keys(this._data)
        return keys[index] || null
    },
}

Object.defineProperty(window, 'localStorage', { value: storageMock, writable: true })
Object.defineProperty(window, 'sessionStorage', { value: storageMock, writable: true })

// Pre-populate localStorage with default language for i18n
storageMock._data['i18nextLng'] = 'en'

// Initialize i18n synchronously for tests
i18n.use(initReactI18next).init({
    resources: {
        en: { translation: en },
        'zh-TW': { translation: zhTW },
    },
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
        escapeValue: false,
    },
})
