import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import './i18n'
import { registerSW } from './utils/registerSW'
import { setGlobalSeed } from './utils/seededRandom'

// Support ?seed=NUMBER URL parameter for deterministic board / deck (useful for E2E tests)
const seedParam = new URLSearchParams(window.location.search).get('seed')
if (seedParam !== null) {
  const seed = parseInt(seedParam, 10)
  if (!isNaN(seed)) {
    setGlobalSeed(seed)
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

registerSW()
