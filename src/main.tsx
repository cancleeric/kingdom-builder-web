import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { I18nextProvider } from 'react-i18next'
import './index.css'
import App from './App.tsx'
import { IconGallery } from './components/icons/IconGallery.tsx'
import { DesignSystemPage } from './design-system/DesignSystemPage'
import { registerSW } from './utils/registerSW'
import { setGlobalSeed } from './utils/seededRandom'
import i18n from './i18n'

// Support ?seed=NUMBER URL parameter for deterministic board / deck (useful for E2E tests)
const seedParam = new URLSearchParams(window.location.search).get('seed')
if (seedParam !== null) {
  const seed = parseInt(seedParam, 10)
  if (!isNaN(seed)) {
    setGlobalSeed(seed)
  }
}

const currentPath = window.location.pathname.replace(/\/$/, '') || '/'
const RootPage =
  currentPath === '/design-system/icons'
    ? IconGallery
    : currentPath === '/design-system'
      ? DesignSystemPage
      : App

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nextProvider i18n={i18n}>
      <RootPage />
    </I18nextProvider>
  </StrictMode>,
)

registerSW()
